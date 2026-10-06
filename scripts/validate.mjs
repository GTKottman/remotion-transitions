#!/usr/bin/env node
// Checks every rule of the submission protocol (CONTRIBUTING.md). CI runs it on every pull request.
//
//   node scripts/validate.mjs                 check the working tree
//   node scripts/validate.mjs --base origin/main
//                                             also check version bumps against a base commit
//
// Exit code 1 if any rule is broken. Each message names the file and the rule.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : null;
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, 'taxonomy.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const V = taxonomy.facets;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PARAM_TYPES = ['number', 'integer', 'boolean', 'string', 'color', 'colors', 'enum'];
const REQUIRES = ['webgl2', 'svg-filters', 'css-3d'];
const families = new Map(taxonomy.families.map((f) => [f.slug, new Set(f.subfamilies.map((s) => s.slug))]));

// ---- 1. The folder tree under transitions/ is exactly the taxonomy.
const tdir = path.join(ROOT, 'transitions');
for (const fam of fs.readdirSync(tdir, { withFileTypes: true })) {
  if (!fam.isDirectory()) continue;
  if (!families.has(fam.name)) {
    fail(`transitions/${fam.name}`, 'not a family in taxonomy.json (rule: the tree mirrors the taxonomy)');
    continue;
  }
  for (const sub of fs.readdirSync(path.join(tdir, fam.name), { withFileTypes: true })) {
    if (sub.isDirectory() && !families.get(fam.name).has(sub.name)) fail(`transitions/${fam.name}/${sub.name}`, `not a subfamily of ${fam.name} in taxonomy.json`);
  }
}
for (const [fam, subs] of families) for (const sub of subs) if (!fs.existsSync(path.join(tdir, fam, sub))) fail(`transitions/${fam}/${sub}`, 'missing folder for a taxonomy subfamily (run npm run build)');

// ---- 2. Each transition folder.
const ids = new Map();
const transitionDirs = [];
for (const [fam, subs] of families) {
  for (const sub of subs) {
    const sdir = path.join(tdir, fam, sub);
    if (!fs.existsSync(sdir)) continue;
    for (const e of fs.readdirSync(sdir, { withFileTypes: true })) if (e.isDirectory()) transitionDirs.push({ dir: path.join(sdir, e.name), fam, sub, folder: e.name });
  }
}

const ALLOWED_FILE = /\.(tsx?|json|md|glsl)$/;
for (const { dir, fam, sub, folder } of transitionDirs) {
  const where = rel(dir);
  const jp = path.join(dir, 'transition.json');
  if (!fs.existsSync(jp)) { fail(where, 'missing transition.json'); continue; }
  if (!fs.existsSync(path.join(dir, 'index.tsx'))) fail(where, 'missing index.tsx (default export = the transition)');
  let m;
  try { m = JSON.parse(fs.readFileSync(jp, 'utf8')); } catch (e) { fail(`${where}/transition.json`, `invalid JSON: ${e.message}`); continue; }
  const w = `${where}/transition.json`;

  const str = (k) => typeof m[k] === 'string' && m[k].trim().length > 0;
  for (const k of ['id', 'name', 'version', 'summary', 'family', 'subfamily']) if (!str(k)) fail(w, `"${k}" must be a non-empty string`);
  if (m.id !== folder) fail(w, `"id" (${m.id}) must equal the folder name (${folder})`);
  if (m.id && !SLUG.test(m.id)) fail(w, `"id" must be lowercase words joined by hyphens`);
  if (ids.has(m.id)) fail(w, `id "${m.id}" is already used by ${ids.get(m.id)}`);
  ids.set(m.id, where);
  if (m.family !== fam || m.subfamily !== sub) fail(w, `family/subfamily (${m.family}/${m.subfamily}) must match the folder (${fam}/${sub})`);
  if (m.version && !SEMVER.test(m.version)) fail(w, `"version" must be semver (x.y.z)`);
  if (m.summary && m.summary.length > 220) fail(w, `"summary" is ${m.summary.length} characters; keep it under 220`);
  if (!Array.isArray(m.uses) || !m.uses.length || m.uses.some((u) => typeof u !== 'string' || !u.trim())) fail(w, `"uses" must list at least one editing situation`);

  const f = m.facets ?? {};
  for (const k of ['structure', 'origin', 'edge', 'layers', 'space', 'timing']) if (!V[k].includes(f[k])) fail(w, `facets.${k} "${f[k]}" is not one of: ${V[k].join(', ')}`);
  for (const k of ['tone', 'function']) {
    if (!Array.isArray(f[k]) || !f[k].length) fail(w, `facets.${k} must be a non-empty list`);
    else for (const v of f[k]) if (!V[k].includes(v)) fail(w, `facets.${k} value "${v}" is not one of: ${V[k].join(', ')}`);
  }
  if (!Array.isArray(f.also)) fail(w, 'facets.also must be a list (may be empty)');
  else for (const a of f.also) {
    const [af, as] = String(a).split('/');
    if (!families.has(af) || !families.get(af).has(as)) fail(w, `facets.also "${a}" must be "<family>/<subfamily>" from taxonomy.json`);
    if (af === m.family && as === m.subfamily) fail(w, `facets.also must not repeat the transition's own subfamily`);
  }

  const d = m.duration ?? {};
  if (![d.default, d.min, d.max].every(Number.isInteger) || !(d.min <= d.default && d.default <= d.max) || d.min < 1) fail(w, '"duration" needs integer min ≤ default ≤ max (frames at 30 fps)');
  if (typeof m.overlay !== 'boolean') fail(w, '"overlay" must be true or false');
  if (!Array.isArray(m.requires) || m.requires.some((r) => !REQUIRES.includes(r))) fail(w, `"requires" may only contain: ${REQUIRES.join(', ')}`);

  const names = new Set();
  for (const p of m.params ?? []) {
    const pw = `${w} param "${p.name}"`;
    if (!p.name || !/^[a-z][a-zA-Z0-9]*$/.test(p.name)) fail(pw, 'name must be camelCase');
    if (names.has(p.name)) fail(pw, 'duplicate name');
    names.add(p.name);
    if (!PARAM_TYPES.includes(p.type)) fail(pw, `type must be one of: ${PARAM_TYPES.join(', ')}`);
    if (!p.description) fail(pw, 'needs a description');
    const v = p.default;
    const ok =
      p.type === 'number' ? typeof v === 'number' :
      p.type === 'integer' ? Number.isInteger(v) :
      p.type === 'boolean' ? typeof v === 'boolean' :
      p.type === 'string' ? typeof v === 'string' :
      p.type === 'color' ? typeof v === 'string' && HEX.test(v) :
      p.type === 'colors' ? Array.isArray(v) && v.length > 0 && v.every((c) => HEX.test(c)) :
      p.type === 'enum' ? Array.isArray(p.options) && p.options.includes(v) : false;
    if (!ok) fail(pw, `default ${JSON.stringify(v)} does not match type ${p.type}${p.type === 'enum' ? ' (must be one of options)' : ''}`);
    if ((p.type === 'number' || p.type === 'integer') && (p.min === undefined || p.max === undefined || v < p.min || v > p.max)) fail(pw, 'numbers need min and max, with the default inside them');
  }
  const presetIds = new Set();
  for (const pr of m.presets ?? []) {
    if (!pr.id || !SLUG.test(pr.id) || presetIds.has(pr.id)) fail(`${w} preset "${pr.id}"`, 'needs a unique lowercase-hyphen id');
    presetIds.add(pr.id);
    if (!pr.name) fail(`${w} preset "${pr.id}"`, 'needs a name');
    for (const k of Object.keys(pr.params ?? {})) if (!names.has(k)) fail(`${w} preset "${pr.id}"`, `sets unknown param "${k}"`);
  }
  if (!Array.isArray(m.authors) || !m.authors.length) fail(w, '"authors" must list at least one GitHub username');
  if (!Array.isArray(m.changelog) || !m.changelog.length) fail(w, '"changelog" needs at least one entry');
  else {
    const top = m.changelog[0];
    if (top.version !== m.version) fail(w, `the first changelog entry (${top.version}) must be the current version (${m.version})`);
    for (const c of m.changelog) if (!SEMVER.test(c.version ?? '') || !DATE.test(c.date ?? '') || !c.notes) fail(w, 'each changelog entry needs version, date (YYYY-MM-DD) and notes');
  }
  if (m.basedOn !== undefined && typeof m.basedOn !== 'string') fail(w, '"basedOn" must be the id of another transition');

  // Files allowed in a transition folder, and what the code may import.
  for (const file of fs.readdirSync(dir, { recursive: true })) {
    const p = path.join(dir, String(file));
    if (fs.statSync(p).isDirectory()) continue;
    if (!ALLOWED_FILE.test(p)) fail(rel(p), 'only .ts/.tsx/.json/.md/.glsl files belong in a transition folder (no media; see CONTRIBUTING.md, "Media")');
    if (!/\.tsx?$/.test(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    for (const [, spec] of src.matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]/g)) {
      const okImport =
        spec === 'react' || spec === 'remotion' ||
        (spec.startsWith('@remotion/') && Object.keys(pkg.dependencies).includes(spec.split('/').slice(0, 2).join('/'))) ||
        spec === '../../../../src/core' ||
        (spec.startsWith('./') && path.resolve(path.dirname(p), spec).startsWith(dir));
      if (!okImport) fail(rel(p), `imports "${spec}": a transition may import only react, remotion, @remotion/* packages already in package.json, ../../../../src/core, and its own files`);
    }
    if (/\bMath\.random\s*\(|\bDate\.now\s*\(|\bnew Date\s*\(|performance\.now\s*\(/.test(src)) fail(rel(p), 'not deterministic: use rand() from src/core and frame-based timing, never Math.random, Date or performance.now');
  }
  if (m.basedOn && !transitionDirs.some((t) => t.folder === m.basedOn)) fail(w, `"basedOn" names an unknown transition "${m.basedOn}"`);
}

// ---- 3. Determinism in the core too.
for (const file of fs.readdirSync(path.join(ROOT, 'src/core'))) {
  const src = fs.readFileSync(path.join(ROOT, 'src/core', file), 'utf8');
  if (/\bMath\.random\s*\(|\bDate\.now\s*\(|\bnew Date\s*\(/.test(src)) fail(`src/core/${file}`, 'not deterministic');
}

// ---- 4. No media or large files committed (git-tracked files only, when in a git repo).
let tracked = [];
try {
  tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean);
} catch {}
const MEDIA = /\.(mp4|mov|webm|mkv|avi|gif|png|jpe?g|webp|wav|mp3|aac|psd|aep|blend|zip)$/i;
for (const f of tracked) {
  if (f.startsWith('public/fonts/')) continue;
  if (MEDIA.test(f)) fail(f, 'media files are never committed; they are rendered from the code and published as release assets (CONTRIBUTING.md, "Media")');
  else if (fs.existsSync(path.join(ROOT, f)) && fs.statSync(path.join(ROOT, f)).size > 512 * 1024) fail(f, 'files over 512 KB are not allowed');
}

// ---- 5. Changed transitions bump their version (with --base).
if (base) {
  const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const coreChanged = changed.some((f) => f.startsWith('src/core/'));
  for (const { dir } of transitionDirs) {
    const r = rel(dir);
    const touched = changed.filter((f) => f.startsWith(`${r}/`) && !f.endsWith('/README.md'));
    if (!touched.length) continue;
    let old;
    try { old = JSON.parse(execFileSync('git', ['show', `${base}:${r}/transition.json`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch { continue; } // new transition
    const cur = JSON.parse(fs.readFileSync(path.join(dir, 'transition.json'), 'utf8'));
    const cmp = (a, b) => { const x = a.split('.').map(Number); const y = b.split('.').map(Number); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
    if (cmp(cur.version, old.version) <= 0) fail(`${r}/transition.json`, `changed but version not bumped (${old.version} → ${cur.version}); see CONTRIBUTING.md, "Versions"`);
  }
  if (coreChanged) console.log('note: src/core changed; every transition will be re-rendered. Bump versions only where the picture changes.');
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  console.error(`\n${errors.length} problem(s). See CONTRIBUTING.md.`);
  process.exit(1);
}
console.log(`✓ ${transitionDirs.length} transitions follow the protocol`);

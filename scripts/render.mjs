#!/usr/bin/env node
// Renders the media for transitions into media/<id>/ (git-ignored):
//   <id>@<version>.mp4          preview, 1920×1080 h264
//   <id>@<version>-720.mp4      the same at 1280×720, for web grids
//   <id>@<version>.jpg          poster frame
//   <id>@<version>-overlay.mov  ProRes 4444 with alpha (only when "overlay": true)
//
//   node scripts/render.mjs liquid-fill ink-bleed   render these ids
//   node scripts/render.mjs --all                   render every transition
//   node scripts/render.mjs --changed [base]        render transitions changed since base (default origin/main)
//   options: --no-overlay  --concurrency=N  --skip-existing
//
// On this machine, wrap it in the render queue:  render-queue -l "transitions" -- node scripts/render.mjs --all
// Without a GPU set REMOTION_GL=swangle.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const gl = process.env.REMOTION_GL ?? 'angle';
const concurrency = Number(opt('concurrency', 6));

const all = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'transition.json') all.push({ dir: path.dirname(p), meta: JSON.parse(fs.readFileSync(p, 'utf8')) });
  }
};
walk(path.join(ROOT, 'transitions'));

let selected;
if (flag('all')) selected = all;
else if (flag('changed')) {
  const base = args[args.indexOf('--changed') + 1]?.startsWith('--') ? 'origin/main' : (args[args.indexOf('--changed') + 1] ?? 'origin/main');
  const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' }).split('\n');
  const coreChanged = changed.some((f) => f.startsWith('src/core/'));
  selected = coreChanged ? all : all.filter(({ dir }) => changed.some((f) => f.startsWith(path.relative(ROOT, dir) + '/')));
} else {
  const ids = args.filter((a) => !a.startsWith('--'));
  selected = all.filter(({ meta }) => ids.includes(meta.id));
  const missing = ids.filter((id) => !all.some(({ meta }) => meta.id === id));
  if (missing.length) throw new Error(`unknown transition id(s): ${missing.join(', ')}`);
}
if (!selected.length) {
  console.log('nothing to render');
  process.exit(0);
}

console.log(`bundling… (${selected.length} transition(s), gl=${gl})`);
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') });
const chromiumOptions = { gl };
// Remotion ships an ffmpeg build in its platform compositor package; fall back to `npx remotion ffmpeg`.
const compositor = fs.readdirSync(path.join(ROOT, 'node_modules/@remotion')).find((d) => d.startsWith('compositor-'));
const ffmpegBin = compositor && path.join(ROOT, 'node_modules/@remotion', compositor, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const ffmpeg = (a) =>
  ffmpegBin && fs.existsSync(ffmpegBin)
    ? execFileSync(ffmpegBin, ['-loglevel', 'error', '-y', ...a], { cwd: path.dirname(ffmpegBin), stdio: 'inherit' })
    : execFileSync('npx', ['remotion', 'ffmpeg', '-loglevel', 'error', '-y', ...a], { cwd: ROOT, stdio: 'inherit' });

const t0 = Date.now();
for (const { meta } of selected) {
  const out = path.join(ROOT, 'media', meta.id);
  fs.mkdirSync(out, { recursive: true });
  const base = path.join(out, `${meta.id}@${meta.version}`);
  if (flag('skip-existing') && fs.existsSync(`${base}.mp4`)) continue;
  const t = Date.now();

  const comp = await selectComposition({ serveUrl, id: meta.id, chromiumOptions });
  await renderMedia({ serveUrl, composition: comp, codec: 'h264', crf: 20, outputLocation: `${base}.mp4`, concurrency, chromiumOptions, imageFormat: 'jpeg', overwrite: true });
  ffmpeg(['-i', `${base}.mp4`, '-vf', 'scale=1280:720', '-c:v', 'libx264', '-crf', '24', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${base}-720.mp4`]);
  // Poster: 35% into the transition, where both the mechanism and scene A are visible.
  const posterFrame = 24 + Math.round(meta.duration.default * 0.35);
  await renderStill({ serveUrl, composition: comp, frame: posterFrame, output: `${base}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, chromiumOptions, overwrite: true });

  if (meta.overlay && !flag('no-overlay')) {
    const ov = await selectComposition({ serveUrl, id: `${meta.id}-overlay`, chromiumOptions });
    await renderMedia({
      serveUrl, composition: ov, codec: 'prores', proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png',
      outputLocation: `${base}-overlay.mov`, concurrency, chromiumOptions, overwrite: true,
    });
  }
  console.log(`✓ ${meta.id}@${meta.version}  ${((Date.now() - t) / 1000).toFixed(1)}s`);
}
// Every expected file must exist, or the run fails (a crashed tab can otherwise go unnoticed).
const missing = selected.flatMap(({ meta }) => {
  const base = path.join(ROOT, 'media', meta.id, `${meta.id}@${meta.version}`);
  const want = [`${base}.mp4`, `${base}-720.mp4`, `${base}.jpg`, ...(meta.overlay && !flag('no-overlay') ? [`${base}-overlay.mov`] : [])];
  return want.filter((f) => !fs.existsSync(f)).map((f) => path.relative(ROOT, f));
});
if (missing.length) {
  console.error(`missing after render:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`done: ${selected.length} transition(s) in ${((Date.now() - t0) / 1000).toFixed(0)}s → media/`);

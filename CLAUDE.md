# Remotion Transitions: instructions for AI assistants

This repository is a transition library whose folder structure **is** a taxonomy. Where a file
lives tells you what it is. Keep it that way.

## Orient yourself

1. Read `TAXONOMY.md`. Section 2 (decision procedure), section 9 (filing rules) and section 10
   (design rules) are mandatory before adding or changing a transition.
2. Read `CONTRIBUTING.md`: the kinds of change, version bumps, and the media rule.
3. `taxonomy.json` is the machine-readable taxonomy. `catalog.json` lists every transition with its
   facets and media URLs. Use it to find transitions by facet, for example with
   `jq '.transitions[] | select(.facets.structure=="bridged") | .id' catalog.json`.
4. Each family and subfamily folder has a README that defines what belongs there and what doesn't.

## Sources of truth and generated files

| Edit this | Generates (never edit by hand) |
|---|---|
| `transitions/**/transition.json` (+ optional `NOTES.md`) | that folder's `README.md`, `src/registry.ts`, `catalog.json`, the catalog in `README.md` |
| `taxonomy.json` (with `TAXONOMY.md`) | every family and subfamily `README.md` |

After any change: `npm run build && npm run check`.

## Rules that are easy to break

- Never commit media (mp4, mov, images). Renders go to `media/` (git-ignored) and are published as
  release assets by `scripts/publish-media.mjs` or the Media workflow.
- Transitions import only react, remotion, `@remotion/*` already in package.json, `../../../../src/core`,
  and their own files. No `Math.random` or clocks: use `rand()` from `src/core`.
- Changing an existing transition needs a version bump and a changelog entry.
- Design rules: the incoming colour must arrive through something on screen (a `color` param = the
  incoming background colour); no dated gimmicks (whole-frame 3D flips or cubes, blinds,
  checkerboards, clock wipes, star or heart irises, shatter).

## On the maintainer's machine

Render only through the render queue:
`render-queue -l "remotion-transitions <what>" -- node scripts/render.mjs <ids|--all>`.
The preview harness is `src/preview/` (scene A on paper, scene B on orange, 24-frame holds).

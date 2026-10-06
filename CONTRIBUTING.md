# Contributing: the submission protocol

This repository is a catalog that other software reads (see [docs/CATALOG.md](docs/CATALOG.md)), so
every change follows the same protocol. `npm run check` enforces most of it, and CI runs the same check
on every pull request.

## The one rule about media

**Never commit video, images or audio.** Previews, posters and alpha overlays are *rendered from the
code* and published as assets on the `media` GitHub release, named `<id>@<version>.<ext>`. Each
transition's code is the source; its media are build output. That keeps the repository small, and it
means every preview always matches the code that made it.

`npm run validate` fails if a tracked file is media or larger than 512 KB. The only binary files
allowed are the fonts in `public/fonts/`.

## Kinds of pull request

Every pull request is exactly one of these. Pick the kind in the PR template.

| Kind | What changes | Version bump | One per PR? |
|---|---|---|---|
| **New transition** | a new folder `transitions/<family>/<subfamily>/<id>/` | starts at `1.0.0` | yes, one transition |
| **Fix** | a bug in one transition; the intended look doesn't change | patch: `1.0.0 → 1.0.1` | yes |
| **Look change** | the default look of one transition changes | minor: `1.0.1 → 1.1.0` | yes |
| **Variant** | a new preset, or a new optional parameter | minor | yes |
| **Breaking change** | a parameter is renamed or removed, or its meaning changes | major: `1.1.0 → 2.0.0` | yes |
| **Core** | `src/core`, the preview harness or the scripts | none for transitions whose picture doesn't change | yes, and it needs an issue first |
| **Taxonomy** | `TAXONOMY.md` and `taxonomy.json` | — | yes, and it needs an issue first |
| **Docs** | documentation only | — | — |

### Variant, or new transition?

- It's the same mechanism with different values (colour, density, direction, timing): add a **preset**
  to `presets` in `transition.json`.
- It needs a new knob on the same mechanism: add an optional **parameter** whose default keeps
  today's look.
- It works differently, so the decision procedure in TAXONOMY.md section 2 answers differently, or
  the code is mostly new: it's a **new transition**. Set `"basedOn": "<original id>"` to credit
  the one it grew from.

## Adding a transition

1. **Read** [TAXONOMY.md](TAXONOMY.md): section 2 (classify it), section 4 (facets) and section 10
   (the design rules: motivate the colour change, no dated gimmicks).
2. **Classify** it. Ask the questions in TAXONOMY.md section 2 in order; the first "yes" is its
   family. Pick the subfamily inside it.
3. **Create the folder** `transitions/<family>/<subfamily>/<id>/`. The id is lowercase words joined
   by hyphens, unique across the library, and describes the look (`ink-bleed`, not `transition-7`).
4. **Write `transition.json`.** Copy one from a similar transition and change every field. The schema
   is [schema/transition.schema.json](schema/transition.schema.json); your editor will check it.
   - `summary`: one sentence a person can picture, under 220 characters.
   - `uses`: the editing situations it suits.
   - `facets`: values only from TAXONOMY.md section 4.
   - `duration`: frames at 30 fps (default, min, max).
   - `overlay`: `true` only if the transition still makes sense over transparency (Cover, Light).
   - `params`: every parameter with type, default, range or options, and a description.
   - `changelog`: newest first; the first entry's version must equal `version`.
5. **Write `index.tsx`.** Its default export is the transition: either `defineTransition({...})`
   (an `Exiting` and an `Entering` side), or `bridged(defaults, Layer)` for cover / hold / reveal.
   Read defaults from `transition.json` with `paramDefaults(meta)`.
   - Import only `react`, `remotion`, `@remotion/*` packages already in `package.json`,
     `../../../../src/core`, and files inside your own folder.
   - Be deterministic: use `rand(seed, ...)` from `src/core`, never `Math.random()` or clocks.
   - Do your own easing. Users time transitions with `linearTiming`.
   - If the incoming background colour matters, take it as a `color` parameter and bring it in through
     an element on screen (TAXONOMY.md section 10).
6. **Generate** with `npm run build`. It writes your README, the registry, the catalog and the family
   lists. Don't edit generated files; edit `transition.json` (and an optional `NOTES.md`, which is
   added to the README) instead.
7. **Check** with `npm run check` (build check, protocol validation, typecheck).
8. **Look at it.** Run `npm run studio` to watch it, or `npm run render -- <id>` to render it into
   `media/<id>/` (git-ignored). Check the frames around the swap point closely.
9. **Open a pull request** with the template filled in. CI renders your transition and attaches
   the preview to the run, so reviewers can watch it without checking out the branch.

## Changing an existing transition

1. Make the change in its folder.
2. **Bump `version`** by the rule in the table above, and add a changelog entry at the top
   (`version`, `date` as YYYY-MM-DD, `notes`). CI fails if a transition changes without a bump.
3. `npm run build && npm run check`.

Bumping the version gives the change new media file names (`<id>@<new version>.mp4`), so sites
that read the catalog never show a stale preview. Old versions' media stay on the release.

## Versions

Semantic versioning, per transition:

- **patch**: fixes; the intended picture is the same.
- **minor**: the default look changes, or something is added (preset, optional parameter).
- **major**: an existing parameter changes name, type or meaning, or is removed. Code that used it
  would break or look different.

## Review checklist

Reviewers check, and authors should check first:

- [ ] Classified by TAXONOMY.md section 2, with the first "yes" deciding the family; facets accurate.
- [ ] Follows the design rules (TAXONOMY.md section 10): the incoming colour is motivated by something
      on screen; nothing dated; eased; swap hidden.
- [ ] The swap frame is fully hidden: no flash of the wrong scene, no uncovered edge or corner.
- [ ] Works at 16:9 and 9:16 (try `width`/`height` swapped in `src/Root.tsx`), and at the min and
      max durations.
- [ ] Every parameter does what its description says over its whole range.
- [ ] `overlay: true` only if the render over transparency is usable in an editing app.
- [ ] `npm run check` passes; no media committed.

## How media get published

- **Pull requests**: CI renders the changed transitions (software GL) and uploads them as a
  workflow artifact for review. Nothing is published.
- **Merges to `main`**: the media workflow finds every transition whose current version has no
  media on the `media` release, renders them, and uploads `<id>@<version>.mp4`, `-720.mp4`, `.jpg`,
  and `-overlay.mov` where `overlay` is true.
- Maintainers can publish from their own machine with `npm run render -- --all` and then
  `npm run publish-media`, which uploads only what is missing.

## Taxonomy changes

Open an issue first. A change to the taxonomy changes `TAXONOMY.md` **and** `taxonomy.json` in the
same pull request, then `npm run build` to regenerate the family folders. Moving a transition to
another family is a **major** version bump for that transition, because its catalog path changes.

## License

By contributing you agree that your contribution is licensed under the MIT License (see LICENSE).

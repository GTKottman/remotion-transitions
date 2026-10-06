# Remotion Transitions

An open library of motion-design transitions for [Remotion](https://www.remotion.dev), organised by a
taxonomy of how transitions work. Each one is a few hundred lines of deterministic code that you can
drop into a `<TransitionSeries>`. Covers and light effects also ship as transparent overlays for
editing apps.

- **[TAXONOMY.md](TAXONOMY.md)**: the nine families of transitions, how to classify any transition,
  timing and craft, and the design rules this library follows.
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: the submission protocol for new transitions, fixes and variants.
- **[docs/CATALOG.md](docs/CATALOG.md)**: `catalog.json`, the machine-readable catalog for websites and tools.

## Use a transition

```tsx
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { toPresentation } from './src/core';
import liquidFill from './transitions/04-cover/organic/liquid-fill';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}><SceneA /></TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={toPresentation(liquidFill, { color: '#FF4F1A' })}
    timing={linearTiming({ durationInFrames: 96 })}
  />
  <TransitionSeries.Sequence durationInFrames={90}><SceneB /></TransitionSeries.Sequence>
</TransitionSeries>
```

To use one in your own project, copy `src/core/` and the transition's folder. Each transition
imports only `react`, `remotion`, `@remotion/*` and `src/core`. Always use `linearTiming`, because
each transition does its own easing. Transitions that list `webgl2` in `requires` need
`--gl=angle` (GPU) or `--gl=swangle` (no GPU) when rendering.

Most transitions take a `color` parameter: the **incoming scene's background colour**. The transition
brings that colour in through a shape, a cover or an edge, so the change of scene is motivated rather
than a bare swap.

## Browse

```
transitions/
├── 01-cut/          no in-between frames
├── 02-blend/        opacity mixes
├── 03-wipe/         a designed edge moves from A to B
├── 04-cover/        a layer in the new colour hides the change
├── 05-motion/       the frame moves
├── 06-distortion/   the image deforms or breaks
├── 07-morph/        one element becomes another
├── 08-carry/        one element leads you into the next scene
└── 09-light/        light washes over the cut
```

Every folder has a README saying what belongs there. Every transition has a README generated from its
`transition.json`, with links to its preview video.

## Work on the library

```bash
npm install
npm run studio                 # watch every transition in Remotion Studio
npm run build                  # regenerate READMEs, registry and catalog.json
npm run check                  # build check + protocol validation + typecheck
npm run render -- <id> ...     # render previews into media/ (git-ignored); --all for everything
```

## Catalog

<!-- catalog:start -->
50 transitions.

| Transition | Family › Subfamily | Structure | Function | Overlay |
|---|---|---|---|---|
| [Anchored Match Cut](transitions/01-cut/match-cut/match-cut-anchor/) | Cut › Match Cut | instant | continuity |  |
| [Smash Cut with Shake](transitions/01-cut/smash-cut/smash-cut-shake/) | Cut › Smash Cut | instant | contrast, energy |  |
| [Strobe Cut](transitions/01-cut/smash-cut/strobe-cut/) | Cut › Smash Cut | instant | energy, contrast |  |
| [Punch-in Jump Cut](transitions/01-cut/jump-cut/jump-cut-punch/) | Cut › Jump Cut | instant | energy, continuity |  |
| [Crossfade](transitions/02-blend/crossfade/crossfade/) | Blend › Crossfade | direct | progression, continuity |  |
| [Dip to Colour](transitions/02-blend/dip-to-colour/dip-to-colour/) | Blend › Dip to Colour | bridged | section-break, progression | yes |
| [Luma Dissolve](transitions/02-blend/luma-dissolve/luma-dissolve/) | Blend › Luma Dissolve | direct | progression |  |
| [Film Dissolve](transitions/02-blend/blend-mode/film-dissolve/) | Blend › Blend Mode | direct | progression |  |
| [Linear Wipe](transitions/03-wipe/linear/linear-wipe/) | Wipe › Linear | direct | progression, reveal |  |
| [Iris](transitions/03-wipe/iris/iris/) | Wipe › Iris | direct | reveal |  |
| [Rounded Reveal](transitions/03-wipe/shape-mask/rounded-reveal/) | Wipe › Shape Mask | direct | reveal |  |
| [Text Mask Zoom](transitions/03-wipe/shape-mask/text-mask/) | Wipe › Shape Mask | direct | reveal, brand, section-break |  |
| [Halftone Wipe](transitions/03-wipe/pattern/halftone-wipe/) | Wipe › Pattern | direct | progression, reveal |  |
| [Stripe Wipe](transitions/03-wipe/pattern/stripe-wipe/) | Wipe › Pattern | direct | energy, progression |  |
| [Noise Wipe](transitions/03-wipe/organic/noise-wipe/) | Wipe › Organic | direct | progression |  |
| [Ink Bleed](transitions/04-cover/organic/ink-bleed/) | Cover › Organic | bridged | section-break, brand | yes |
| [Liquid Fill](transitions/04-cover/organic/liquid-fill/) | Cover › Organic | bridged | section-break, reveal, brand | yes |
| [Paint Drip](transitions/04-cover/organic/paint-drip/) | Cover › Organic | bridged | section-break, energy | yes |
| [Shape Burst](transitions/04-cover/geometric/shape-burst/) | Cover › Geometric | bridged | energy, section-break | yes |
| [Shape Grid](transitions/04-cover/geometric/shape-grid/) | Cover › Geometric | bridged | section-break | yes |
| [Brush Stroke](transitions/04-cover/stroke/brush-stroke/) | Cover › Stroke | bridged | section-break, brand | yes |
| [Swoosh Lines](transitions/04-cover/stroke/swoosh-lines/) | Cover › Stroke | bridged | energy, section-break, brand | yes |
| [Panel Slide](transitions/04-cover/panel/panel-slide/) | Cover › Panel | bridged | section-break, brand | yes |
| [Logo Stinger](transitions/04-cover/stinger/stinger/) | Cover › Stinger | bridged | brand, section-break | yes |
| [Push](transitions/05-motion/push-slide/push/) | Motion › Push Slide | direct | continuity, progression |  |
| [Slide Over](transitions/05-motion/push-slide/slide-over/) | Motion › Push Slide | direct | progression, continuity |  |
| [Whip Pan](transitions/05-motion/whip/whip-pan/) | Motion › Whip | direct | energy, continuity |  |
| [Grid Zoom](transitions/05-motion/zoom/grid-zoom/) | Motion › Zoom | continuous | continuity, progression |  |
| [Zoom Through](transitions/05-motion/zoom/zoom-through/) | Motion › Zoom | direct | energy, continuity |  |
| [Spin](transitions/05-motion/spin/spin/) | Motion › Spin | direct | energy |  |
| [Shutter](transitions/05-motion/split/shutter/) | Motion › Split | direct | reveal |  |
| [Slice In](transitions/05-motion/split/slice-in/) | Motion › Split | direct | energy, reveal |  |
| [Split Slices](transitions/05-motion/split/split-slices/) | Motion › Split | direct | energy, progression |  |
| [RGB Glitch](transitions/06-distortion/glitch/rgb-glitch/) | Distortion › Glitch | direct | energy, contrast |  |
| [Liquid Warp](transitions/06-distortion/warp/liquid-warp/) | Distortion › Warp | direct | progression |  |
| [Pixel Stretch](transitions/06-distortion/warp/pixel-stretch/) | Distortion › Warp | direct | energy |  |
| [Defocus](transitions/06-distortion/blur/defocus/) | Distortion › Blur | direct | progression |  |
| [Pixelate](transitions/06-distortion/pixel/pixelate/) | Distortion › Pixel | direct | energy |  |
| [Paper Tear](transitions/06-distortion/break/paper-tear/) | Distortion › Break | direct | reveal, contrast |  |
| [Frame Morph](transitions/07-morph/shape/frame-morph/) | Morph › Shape | continuous | continuity |  |
| [Type Morph](transitions/07-morph/type/type-morph/) | Morph › Type | continuous | continuity |  |
| [Blob Morph](transitions/07-morph/object/blob-morph/) | Morph › Object | continuous | continuity |  |
| [Dot Led](transitions/08-carry/object-led/dot-led/) | Carry › Object-Led | continuous | continuity, reveal |  |
| [Line Led](transitions/08-carry/line-led/line-led/) | Carry › Line-Led | continuous | continuity, reveal |  |
| [Type Led](transitions/08-carry/type-led/type-led/) | Carry › Type-Led | continuous | continuity, section-break |  |
| [Portal Zoom](transitions/08-carry/portal/portal-zoom/) | Carry › Portal | continuous | continuity, reveal |  |
| [Flash](transitions/09-light/flash/flash/) | Light › Flash | bridged | energy, contrast | yes |
| [Light Leak](transitions/09-light/leak/light-leak/) | Light › Leak | bridged | progression | yes |
| [Film Burn](transitions/09-light/burn/film-burn/) | Light › Burn | bridged | section-break, energy | yes |
| [Flare Sweep](transitions/09-light/flare/flare-sweep/) | Light › Flare | bridged | energy, brand | yes |
<!-- catalog:end -->

## License

MIT. Space Grotesk (used by the preview scenes) is under the SIL Open Font License.

import React from 'react';
import { Composition, Folder, staticFile } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { registry } from './registry';
import { HOLD, makeOverlay, makePreview } from './preview/Preview';

for (const [file, weight] of [['Regular', '400'], ['Medium', '500'], ['Bold', '700']] as const) {
  loadFont({ family: 'Space Grotesk', url: staticFile(`fonts/SpaceGrotesk-${file}.otf`), weight });
}

const W = 1920;
const H = 1080;
const FPS = 30;

const entries = registry.map((e) => ({ e, Preview: makePreview(e), Overlay: makeOverlay(e) }));

// One folder per family. Composition ids: <id> (preview) and <id>-overlay (alpha, if supported).
export const RemotionRoot: React.FC = () => {
  const families = [...new Set(registry.map((e) => e.meta.family))].sort();
  return (
    <>
      {families.map((fam) => (
        <Folder key={fam} name={fam}>
          {entries
            .filter(({ e }) => e.meta.family === fam)
            .map(({ e, Preview, Overlay }) => {
              const defaults = e.impl.defaults;
              const d = e.meta.duration.default;
              return (
                <React.Fragment key={e.meta.id}>
                  <Composition id={e.meta.id} component={Preview} width={W} height={H} fps={FPS} durationInFrames={HOLD * 2 + d} defaultProps={{ id: e.meta.id, params: defaults }} />
                  {e.meta.overlay ? (
                    <Composition id={`${e.meta.id}-overlay`} component={Overlay} width={W} height={H} fps={FPS} durationInFrames={d} defaultProps={{ id: e.meta.id, params: defaults }} />
                  ) : null}
                </React.Fragment>
              );
            })}
        </Folder>
      ))}
    </>
  );
};

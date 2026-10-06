import React from 'react';
import { AbsoluteFill } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { toPresentation, type Params, type TransitionImpl } from '../core';
import { SceneA, SceneB } from './DemoScenes';
import type { RegistryEntry } from '../registry';

export const HOLD = 24;

export type PreviewProps = { id: string; params: Params };

const familyLabel = (m: RegistryEntry['meta']) => `${m.family.slice(3)} › ${m.subfamily}`.replace(/-/g, ' ');

/** The standard catalog preview: scene A, the transition, scene B. */
export const makePreview = ({ meta, impl }: RegistryEntry) => {
  const C: React.FC<PreviewProps> = ({ params }) => {
    const d = meta.duration.default;
    return (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOLD + d}>
          <SceneA title={meta.name} meta={familyLabel(meta)} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={toPresentation(impl as TransitionImpl<Params>, params)} timing={linearTiming({ durationInFrames: d })} />
        <TransitionSeries.Sequence durationInFrames={HOLD + d}>
          <SceneB title={familyLabel(meta)} meta={meta.name} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    );
  };
  return C;
};

/** The transition over transparency, for editing apps: place it centred on a cut. */
export const makeOverlay = ({ meta, impl }: RegistryEntry) => {
  const C: React.FC<PreviewProps> = ({ params }) => {
    const d = meta.duration.default;
    return (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={d}>
          <AbsoluteFill />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={toPresentation(impl as TransitionImpl<Params>, params)} timing={linearTiming({ durationInFrames: d })} />
        <TransitionSeries.Sequence durationInFrames={d}>
          <AbsoluteFill />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    );
  };
  return C;
};

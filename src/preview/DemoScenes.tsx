import React from 'react';
import { AbsoluteFill } from 'remotion';

export const PAPER = '#F1EFEA';
export const INK = '#111111';
export const ACCENT = '#FF4F1A';
const font = "'Space Grotesk', sans-serif";

/** Thin grid lines, so warps and moves read clearly even on a flat ground. */
const Grid: React.FC<{ color: string }> = ({ color }) => (
  <AbsoluteFill>
    {Array.from({ length: 11 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: `${(i + 1) * (100 / 12)}%`, top: 0, bottom: 0, width: 2, background: color, opacity: 0.12 }} />
    ))}
    {Array.from({ length: 5 }, (_, i) => (
      <div key={`h${i}`} style={{ position: 'absolute', top: `${(i + 1) * (100 / 6)}%`, left: 0, right: 0, height: 2, background: color, opacity: 0.12 }} />
    ))}
  </AbsoluteFill>
);

const Label: React.FC<{ color: string; left: string; right: string }> = ({ color, left, right }) => (
  <div style={{ position: 'absolute', left: 96, right: 96, top: 80, display: 'flex', justifyContent: 'space-between', color, fontFamily: font, fontSize: 30, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase' }}>
    <span>{left}</span>
    <span>{right}</span>
  </div>
);

/** Scene A: paper ground, the transition's name. */
export const SceneA: React.FC<{ title: string; meta: string }> = ({ title, meta }) => (
  <AbsoluteFill style={{ background: PAPER }}>
    <Grid color={INK} />
    <div style={{ position: 'absolute', right: -140, top: 170, width: 760, height: 760, borderRadius: '50%', border: `28px solid ${INK}` }} />
    <Label color={INK} left="Scene A" right={meta} />
    <div style={{ position: 'absolute', left: 90, bottom: 110, right: 600, color: INK, fontFamily: font, fontWeight: 700, fontSize: 168, lineHeight: 0.92, letterSpacing: -6 }}>
      {title}
    </div>
  </AbsoluteFill>
);

/** Scene B: accent ground, a different layout. Black and white layers both read on it. */
export const SceneB: React.FC<{ title: string; meta: string }> = ({ title, meta }) => (
  <AbsoluteFill style={{ background: ACCENT }}>
    <Grid color={INK} />
    <div style={{ position: 'absolute', left: 96, top: 230, width: 520, height: 520, background: INK }} />
    <div style={{ position: 'absolute', left: 160, top: 294, width: 392, height: 392, borderRadius: '50%', background: ACCENT }} />
    <Label color={INK} left="Scene B" right={meta} />
    <div style={{ position: 'absolute', left: 720, bottom: 110, right: 90, color: INK, fontFamily: font, fontWeight: 700, fontSize: 132, lineHeight: 0.95, letterSpacing: -4 }}>
      {title}
    </div>
  </AbsoluteFill>
);

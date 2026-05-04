import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT } from '../constants';

interface Props {
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}

export const SceneBase: React.FC<Props> = ({ children, bg = COLORS.darker, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });

  return (
    <div style={{
      width: '100%', height: '100%', background: bg,
      fontFamily: FONT, overflow: 'hidden', position: 'relative',
      opacity: fadeIn,
      ...style,
    }}>
      {/* Ambient gradient orb */}
      <div style={{
        position: 'absolute', top: -200, left: -200,
        width: 800, height: 800, borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.purple}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -200, right: -200,
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.blue}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  );
};

export const Tag: React.FC<{ label: string; color?: string }> = ({ label, color = COLORS.purple }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    background: `${color}22`, border: `1px solid ${color}55`,
    color: color, borderRadius: 100, padding: '4px 14px', fontSize: 13, fontWeight: 700,
    letterSpacing: 1, textTransform: 'uppercase',
  }}>
    {label}
  </div>
);

export const Pill: React.FC<{ value: string | number; label: string; color?: string }> = ({ value, label, color = COLORS.purple }) => (
  <div style={{
    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
    borderRadius: 14, padding: '18px 24px', textAlign: 'center', minWidth: 140,
  }}>
    <div style={{ fontSize: 38, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
  </div>
);

export const useFadeUp = (delayFrames = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delayFrames);
  const progress = spring({ frame: f, fps, config: { damping: 14, stiffness: 100 } });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
  };
};

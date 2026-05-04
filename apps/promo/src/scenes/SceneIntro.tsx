import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT } from '../constants';
import { SceneBase, Tag, useFadeUp } from '../components/SceneBase';

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const tagDelay  = useFadeUp(15);
  const headDelay = useFadeUp(25);
  const subDelay  = useFadeUp(40);

  const ringRotate = interpolate(frame, [0, 90], [0, 30]);

  return (
    <SceneBase>
      {/* Spinning ring decoration */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 700, height: 700, borderRadius: '50%',
        border: `1px solid ${COLORS.purple}30`,
        transform: `translate(-50%, -50%) rotate(${ringRotate}deg)`,
        borderDash: '10 20',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 520, height: 520, borderRadius: '50%',
        border: `1px solid ${COLORS.blue}25`,
        transform: `translate(-50%, -50%) rotate(${-ringRotate * 1.4}deg)`,
      }} />

      {/* Centre content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        {/* Logo mark */}
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 60px ${COLORS.purple}55`,
          transform: `scale(${logoScale})`,
          fontSize: 42, fontWeight: 900, color: '#fff', fontFamily: FONT,
        }}>
          AC
        </div>

        <div style={tagDelay}><Tag label="Mental Health Platform" /></div>

        <div style={{ ...headDelay, textAlign: 'center' }}>
          <h1 style={{
            margin: 0, fontSize: 72, fontWeight: 900,
            background: `linear-gradient(135deg, ${COLORS.white}, ${COLORS.muted})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1.1, letterSpacing: -2,
          }}>
            AcuteConnect
          </h1>
          <h2 style={{
            margin: '8px 0 0', fontSize: 28, fontWeight: 400,
            color: COLORS.muted, letterSpacing: -0.5,
          }}>
            Acute Care Management Platform
          </h2>
        </div>

        <div style={{ ...subDelay, textAlign: 'center', maxWidth: 560 }}>
          <p style={{ margin: 0, fontSize: 18, color: COLORS.muted, lineHeight: 1.6 }}>
            Real-time triage · Crisis dispatch · AI-powered insights
          </p>
        </div>
      </div>
    </SceneBase>
  );
};

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';
import { SceneBase, useFadeUp } from '../components/SceneBase';

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAnim  = useFadeUp(0);
  const btnAnim    = useFadeUp(20);
  const statsAnim  = useFadeUp(35);

  const glowPulse = 0.5 + 0.5 * Math.abs(Math.sin(frame / 20));

  return (
    <SceneBase>
      {/* Central glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.purple}${Math.round(glowPulse * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', ...titleAnim }}>
          <h1 style={{
            margin: 0, fontSize: 72, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2,
            background: `linear-gradient(135deg, ${COLORS.white}, ${COLORS.purple} 60%, ${COLORS.blue})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Better care.<br />Faster response.
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: 22, color: COLORS.muted }}>
            AcuteConnect — built for frontline mental health teams.
          </p>
        </div>

        {/* CTA button */}
        <div style={btnAnim}>
          <div style={{
            padding: '18px 48px', borderRadius: 100, fontSize: 20, fontWeight: 800, color: '#fff',
            background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
            boxShadow: `0 8px 40px ${COLORS.purple}66, 0 0 0 1px ${COLORS.purple}44`,
            letterSpacing: -0.3,
          }}>
            Book a demo at acuteconnect.health →
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 48, ...statsAnim }}>
          {[['50+', 'Care Centres'], ['10k+', 'Client Check-ins'], ['99.9%', 'Uptime SLA'], ['<2min', 'Crisis Response']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.white }}>{v}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </SceneBase>
  );
};

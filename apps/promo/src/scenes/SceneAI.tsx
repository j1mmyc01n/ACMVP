import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';
import { SceneBase, Tag, useFadeUp } from '../components/SceneBase';

const MESSAGES = [
  { role: 'user', text: 'Show me high-priority clients from today.' },
  { role: 'ai',   text: '7 clients flagged with mood ≤ 3 in the last 24 hours. Alex M. (CRN-4821) is critical — mood 2/10, no response to last follow-up call.' },
  { role: 'user', text: 'Draft a welfare check note for Alex.' },
  { role: 'ai',   text: 'Draft: "Alex attended our centre on 4 May. Client reported mood 2/10 and expressed difficulty sleeping. Welfare check scheduled for tomorrow at 10 AM. Referral to crisis team recommended if no contact."' },
];

export const SceneAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hdrAnim  = useFadeUp(0);
  const panelAnim = useFadeUp(8);
  const pulseR   = 0.85 + 0.15 * Math.abs(Math.sin(frame / 18));

  return (
    <SceneBase bg={`linear-gradient(160deg, ${COLORS.darker} 55%, #150a2e 100%)`}>
      <div style={{ position: 'absolute', inset: 0, padding: 60, display: 'flex', gap: 40 }}>
        {/* Left */}
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, ...hdrAnim }}>
          <Tag label="AI Engine" color={COLORS.purple} />
          <h2 style={{ margin: 0, fontSize: 44, fontWeight: 900, color: COLORS.white, lineHeight: 1.1 }}>
            Meet Jax<br />your AI<br />co-pilot
          </h2>
          <p style={{ margin: 0, color: COLORS.muted, fontSize: 16, lineHeight: 1.6 }}>
            Ask Jax anything — navigate the platform, surface at-risk clients, draft clinical notes, and get real-time risk scores.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['🧠', 'Risk scoring & triage prioritisation'], ['📝', 'Session note drafting'], ['📊', 'Predictive capacity alerts'], ['🔍', 'Natural language platform search']].map(([ic, lbl]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: COLORS.muted }}>
                <span style={{ fontSize: 18 }}>{ic}</span> {lbl}
              </div>
            ))}
          </div>
        </div>

        {/* Right: chat panel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', ...panelAnim }}>
          <div style={{
            width: '100%', background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 20, overflow: 'hidden',
            boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px ${COLORS.purple}22`,
          }}>
            {/* Panel header */}
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
              background: `linear-gradient(90deg, ${COLORS.purple}22, transparent)`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: `0 0 20px ${COLORS.purple}66`,
                transform: `scale(${pulseR})`,
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, color: COLORS.white }}>Jax AI</div>
                <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>● Online</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 340 }}>
              {MESSAGES.map((msg, i) => {
                const p = spring({ frame: Math.max(0, frame - 12 - i * 14), fps, config: { damping: 14 } });
                const isAI = msg.role === 'ai';
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end',
                    opacity: p, transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
                  }}>
                    <div style={{
                      maxWidth: '82%',
                      background: isAI ? `${COLORS.purple}22` : COLORS.border,
                      border: `1px solid ${isAI ? COLORS.purple + '44' : COLORS.border}`,
                      borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      padding: '10px 14px',
                      fontSize: 13, color: COLORS.white, lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 20px', borderTop: `1px solid ${COLORS.border}`,
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <div style={{
                flex: 1, background: COLORS.darker, border: `1px solid ${COLORS.border}`,
                borderRadius: 10, padding: '10px 14px', fontSize: 13, color: COLORS.muted,
              }}>Ask Jax anything…</div>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>↑</div>
            </div>
          </div>
        </div>
      </div>
    </SceneBase>
  );
};

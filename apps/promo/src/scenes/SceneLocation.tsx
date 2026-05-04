import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';
import { SceneBase, Tag, useFadeUp } from '../components/SceneBase';

const STEPS = [
  { label: 'Location Details', done: true,  active: false },
  { label: 'Modules',          done: true,  active: false },
  { label: 'Branding',         done: true,  active: false },
  { label: 'Technical',        done: false, active: true  },
  { label: 'Review & Deploy',  done: false, active: false },
];

const MODULES = [
  { name: 'AI Engine',          price: '$150/mo', color: COLORS.purple, icon: '🧠', on: true  },
  { name: 'Field Agents',       price: '$100/mo', color: COLORS.blue,   icon: '🚶', on: true  },
  { name: 'Push Notifications', price: '$75/mo',  color: COLORS.amber,  icon: '🔔', on: false },
  { name: 'CRM Integration',    price: '$50/mo',  color: COLORS.green,  icon: '🔗', on: true  },
];

export const SceneLocation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hdrAnim    = useFadeUp(0);
  const wizardAnim = useFadeUp(10);

  return (
    <SceneBase bg={`linear-gradient(160deg, ${COLORS.darker} 55%, #0c1a2e 100%)`}>
      <div style={{ position: 'absolute', inset: 0, padding: 60, display: 'flex', gap: 40 }}>
        {/* Left: header + description */}
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, ...hdrAnim }}>
          <Tag label="Location Rollout" color={COLORS.blue} />
          <h2 style={{ margin: 0, fontSize: 44, fontWeight: 900, color: COLORS.white, lineHeight: 1.1 }}>
            Deploy a<br />new care<br />centre
          </h2>
          <p style={{ margin: 0, color: COLORS.muted, fontSize: 16, lineHeight: 1.6 }}>
            5-step wizard provisions your care centre, assigns modules, branding, and generates secure credentials — all in under a minute.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['✓  Auto-generated secure credentials', '✓  Module activation on deploy', '✓  Instant audit log entry'].map(s => (
              <div key={s} style={{ fontSize: 14, color: COLORS.green, fontWeight: 600 }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Right: wizard mock */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', ...wizardAnim }}>
          <div style={{
            width: '100%', background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 20, overflow: 'hidden',
            boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px ${COLORS.purple}22`,
          }}>
            {/* Wizard header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.white }}>Deploy New Location</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Step 2 of 5 — Modules</div>
                </div>
                <div style={{ color: COLORS.muted, fontSize: 18 }}>✕</div>
              </div>
              {/* Progress */}
              <div style={{ display: 'flex', gap: 6 }}>
                {STEPS.map((s, i) => (
                  <div key={s.label} style={{
                    flex: 1, height: 4, borderRadius: 4,
                    background: s.done || s.active ? COLORS.purple : COLORS.border,
                    opacity: s.active ? 1 : s.done ? 0.7 : 0.3,
                  }} />
                ))}
              </div>
            </div>

            {/* Wizard body: modules */}
            <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MODULES.map((m, i) => {
                const p = spring({ frame: Math.max(0, frame - 15 - i * 8), fps, config: { damping: 12 } });
                return (
                  <div key={m.name} style={{
                    border: `2px solid ${m.on ? m.color : COLORS.border}`,
                    borderRadius: 12, padding: '12px 16px',
                    background: m.on ? `${m.color}10` : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 12,
                    opacity: p, transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: m.on ? m.color : COLORS.border,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>{m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: m.on ? m.color : COLORS.muted, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{m.price}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: m.on ? m.color : COLORS.border,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: '#fff', fontWeight: 800,
                    }}>{m.on ? '✓' : ''}</div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${COLORS.border}`, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: COLORS.muted }}>Estimated monthly</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: COLORS.purple }}>$500/mo</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${COLORS.border}`, textAlign: 'center', fontSize: 14, color: COLORS.muted }}>Back</div>
              <div style={{ flex: 1, padding: '10px', borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`, textAlign: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>Next →</div>
            </div>
          </div>
        </div>
      </div>
    </SceneBase>
  );
};

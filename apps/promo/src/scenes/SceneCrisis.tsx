import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';
import { SceneBase, Tag, useFadeUp } from '../components/SceneBase';

const EVENTS = [
  { id: 1, type: 'Mental Health', location: 'Newtown',     severity: 'critical', police: true,  ambul: true,  time: '2m ago' },
  { id: 2, type: 'Welfare Check', location: 'Camperdown',  severity: 'high',     police: false, ambul: true,  time: '7m ago' },
  { id: 3, type: 'Safeguarding',  location: 'Surry Hills', severity: 'medium',   police: false, ambul: false, time: '14m ago' },
];

const SEV_COLOR: Record<string, string> = { critical: COLORS.red, high: COLORS.amber, medium: COLORS.blue };
const SEV_BG:    Record<string, string> = { critical: '#7f1d1d', high: '#78350f', medium: '#1e3a5f' };

export const SceneCrisis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hdrAnim    = useFadeUp(0);
  const alertAnim  = useFadeUp(8);

  const pulseOpacity = 0.4 + 0.6 * Math.abs(Math.sin(frame / 12));

  return (
    <SceneBase bg={`linear-gradient(160deg, ${COLORS.darker} 60%, #3b0909 100%)`}>
      <div style={{ position: 'absolute', inset: 0, padding: 60, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...hdrAnim }}>
          <div>
            <Tag label="Crisis Management" color={COLORS.red} />
            <h2 style={{ margin: '8px 0 0', fontSize: 40, fontWeight: 900, color: COLORS.white }}>Active Incidents</h2>
            <p style={{ margin: 0, color: COLORS.muted, fontSize: 16 }}>One-click dispatch · Real-time heatmap · AI severity scoring</p>
          </div>
          <div style={{ opacity: pulseOpacity, background: `${COLORS.red}22`, border: `1px solid ${COLORS.red}`, borderRadius: 100, padding: '6px 18px', color: COLORS.red, fontWeight: 800, fontSize: 15 }}>
            🚨 3 ACTIVE
          </div>
        </div>

        {/* Crisis event cards */}
        {EVENTS.map((ev, i) => {
          const cardProgress = spring({ frame: Math.max(0, frame - 10 - i * 12), fps, config: { damping: 14 } });
          const sev = ev.severity;
          return (
            <div key={ev.id} style={{
              background: SEV_BG[sev], border: `1px solid ${SEV_COLOR[sev]}66`,
              borderRadius: 16, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 20,
              opacity: cardProgress,
              transform: `translateX(${interpolate(cardProgress, [0, 1], [40, 0])}px)`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: `${SEV_COLOR[sev]}33`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22,
              }}>
                {sev === 'critical' ? '🚨' : sev === 'high' ? '⚠️' : '🔵'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: COLORS.white, fontSize: 17 }}>{ev.type}</span>
                  <span style={{
                    background: `${SEV_COLOR[sev]}33`, border: `1px solid ${SEV_COLOR[sev]}77`,
                    color: SEV_COLOR[sev], borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{sev}</span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.muted }}>📍 {ev.location} · {ev.time}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ev.police && (
                  <div style={{ background: '#1e3a5f', border: `1px solid ${COLORS.blue}66`, color: COLORS.blue, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
                    🚔 Police
                  </div>
                )}
                {ev.ambul && (
                  <div style={{ background: '#14532d', border: `1px solid ${COLORS.green}66`, color: COLORS.green, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
                    🚑 Ambulance
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom bar */}
        <div style={{
          marginTop: 'auto', display: 'flex', gap: 24, alignItems: 'center',
          ...useFadeUp(50),
        }}>
          {[['12', 'Resolved today'], ['4.2min', 'Avg response'], ['99.8%', 'Uptime']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.red }}>{v}</div>
              <div style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </SceneBase>
  );
};

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';
import { SceneBase, Tag, Pill, useFadeUp } from '../components/SceneBase';

const STAT_CARDS = [
  { label: 'Active Check-ins',  value: '42',   color: COLORS.purple, icon: '📋' },
  { label: 'High Priority',     value: '7',    color: COLORS.red,    icon: '🚨' },
  { label: 'New Clients Today', value: '12',   color: COLORS.blue,   icon: '👤' },
  { label: 'Avg Mood Score',    value: '6.4',  color: COLORS.green,  icon: '💚' },
];

const CLIENTS = [
  { name: 'Alex M.', crn: 'CRN-4821', mood: 3, status: 'urgent',  centre: 'Newtown' },
  { name: 'Jordan P.', crn: 'CRN-3194', mood: 6, status: 'active',  centre: 'Surry Hills' },
  { name: 'Sam R.', crn: 'CRN-7782', mood: 8, status: 'stable',  centre: 'Redfern' },
  { name: 'Casey L.', crn: 'CRN-2201', mood: 2, status: 'urgent',  centre: 'Camperdown' },
];

const moodColor = (m: number) => m <= 3 ? COLORS.red : m <= 5 ? COLORS.amber : COLORS.green;
const statusColor = (s: string) => ({ urgent: COLORS.red, active: COLORS.blue, stable: COLORS.green }[s] || COLORS.muted);

export const SceneTriage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerAnim = useFadeUp(0);
  const statsAnim  = useFadeUp(10);
  const tableAnim  = useFadeUp(25);

  return (
    <SceneBase>
      <div style={{ position: 'absolute', inset: 0, padding: 60, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...headerAnim }}>
          <div>
            <Tag label="Live Dashboard" color={COLORS.purple} />
            <h2 style={{ margin: '8px 0 0', fontSize: 40, fontWeight: 900, color: COLORS.white }}>Triage Centre</h2>
            <p style={{ margin: 0, color: COLORS.muted, fontSize: 16 }}>Real-time patient tracking across all care centres</p>
          </div>
          <div style={{
            background: `${COLORS.green}22`, border: `1px solid ${COLORS.green}55`,
            color: COLORS.green, borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.green, animation: 'pulse 1s infinite' }} />
            LIVE
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16, ...statsAnim }}>
          {STAT_CARDS.map((s, i) => {
            const cardAnim = spring({ frame: Math.max(0, frame - 10 - i * 8), fps, config: { damping: 14 } });
            return (
              <div key={s.label} style={{
                flex: 1, background: COLORS.surface, border: `1px solid ${s.color}44`,
                borderRadius: 16, padding: '20px 24px',
                transform: `scale(${cardAnim}) translateY(${interpolate(cardAnim, [0, 1], [20, 0])}px)`,
                opacity: cardAnim,
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Client list */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: 'hidden', ...tableAnim }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Active Queue
          </div>
          {CLIENTS.map((c, i) => {
            const rowAnim = spring({ frame: Math.max(0, frame - 28 - i * 6), fps, config: { damping: 12 } });
            return (
              <div key={c.crn} style={{
                display: 'flex', alignItems: 'center', padding: '14px 20px',
                borderBottom: i < CLIENTS.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                gap: 16, opacity: rowAnim,
                transform: `translateX(${interpolate(rowAnim, [0, 1], [-20, 0])}px)`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff',
                }}>
                  {c.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: COLORS.white, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{c.crn} · {c.centre}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: moodColor(c.mood) }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: moodColor(c.mood) }}>{c.mood}/10</span>
                </div>
                <div style={{
                  background: `${statusColor(c.status)}22`, border: `1px solid ${statusColor(c.status)}55`,
                  color: statusColor(c.status), borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {c.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneBase>
  );
};

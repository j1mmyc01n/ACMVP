import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiVideo, FiMessageSquare, FiActivity, FiFileText, FiMoreVertical,
  FiTrendingUp, FiCheckCircle, FiBarChart2, FiUser,
} = FiIcons;

const AVATAR_COLORS = [
  '#507C7B', '#4F46E5', '#7C3AED', '#DB2777', '#D97706',
  '#059669', '#0284C7', '#0891B2', '#BE185D', '#4338CA',
];

const getAvatarColor = (name = '') =>
  AVATAR_COLORS[Math.abs(((name || '').charCodeAt(0) || 0) + (name || '').length) % AVATAR_COLORS.length];

const getInitials = (name = '') =>
  (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const PHQ_LABELS = { 0: 'None', 1: 'Minimal', 2: 'Mild', 3: 'Moderate', 4: 'Mod-Severe', 5: 'Severe' };
const phqLabel = (score) => {
  if (score <= 4) return { label: 'None', color: '#10B981', bg: '#D1FAE5' };
  if (score <= 9) return { label: 'Mild', color: '#F59E0B', bg: '#FEF3C7' };
  if (score <= 14) return { label: 'Moderate', color: '#F97316', bg: '#FFEDD5' };
  if (score <= 19) return { label: 'Mod-Severe', color: '#EF4444', bg: '#FEE2E2' };
  return { label: 'Severe', color: '#991B1B', bg: '#FEE2E2' };
};

const ActionBtn = ({ icon, label, primary, onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
      border: primary ? 'none' : '1px solid #CBD5E1',
      background: primary ? '#507C7B' : 'white',
      color: primary ? 'white' : '#334155',
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}
  >
    <SafeIcon icon={icon} size={12} />
    {label}
  </button>
);

const StatBox = ({ label, value, sub, highlight }) => (
  <div style={{
    flex: 1, minWidth: 0,
    background: highlight ? '#507C7B' : '#F8FAFC',
    borderRadius: 10, padding: '10px 12px',
    color: highlight ? 'white' : '#1C1C1E',
  }}>
    <div style={{ fontSize: 10, fontWeight: 600, opacity: highlight ? 0.85 : 1, color: highlight ? 'rgba(255,255,255,0.85)' : '#64748B', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, marginTop: 3, opacity: 0.8, color: highlight ? 'rgba(255,255,255,0.75)' : '#94A3B8' }}>{sub}</div>}
  </div>
);

const TABS = ['Overview', 'Journey Timeline', 'Insights'];

const SimplePatientCard = ({ patient, onClick, index }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const name = patient.name || 'Unknown Patient';
  const age = patient.age || Math.floor(Math.random() * 40) + 30;
  const condition = patient.condition || patient.support_category || 'General Support';
  const currentMood = patient.current_mood || patient.mood || (Math.floor(Math.random() * 4) + 6);
  const moodDecimal = (currentMood + Math.random() * 0.9).toFixed(1);
  const sessionsAttended = patient.sessions_attended || Math.floor(Math.random() * 20) + 5;
  const programWeek = patient.program_week || Math.floor(Math.random() * 12) + 1;
  const insightsPct = patient.insights_pct || Math.floor(Math.random() * 20) + 78;
  const journeyCount = patient.journey_count || Math.floor(Math.random() * 8) + 3;
  const phqScore = patient.phq9_score || Math.floor(Math.random() * 15) + 1;
  const phqInfo = phqLabel(phqScore);
  const isPriority = patient.priority === 'High Priority' || currentMood <= 3;

  const journeyEvents = [
    { icon: FiUser, label: 'Initial Assessment', time: `${programWeek + 2} weeks ago` },
    { icon: FiActivity, label: 'First Therapy Session', time: `${programWeek} weeks ago` },
    { icon: FiCheckCircle, label: `Mood Milestone: 7+ for 7 days`, time: '5 days ago', highlight: true },
    { icon: FiFileText, label: 'Medication Adjustment', time: '3 days ago' },
  ];

  return (
    <motion.div
      onClick={onClick}
      style={{
        background: 'white',
        border: `1px solid ${isPriority ? '#FECACA' : '#E2E8F0'}`,
        borderRadius: 18,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -3, boxShadow: '0 10px 24px rgba(0,0,0,0.10)' }}
    >
      {/* Card header */}
      <div style={{ padding: '16px 16px 12px', background: isPriority ? '#FFF5F5' : 'white' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: getAvatarColor(name), color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            {getInitials(name)}
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>
              {name}, {age}
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>
              {condition}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>↗ Improving</span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>· Week {programWeek} of program</span>
            </div>
          </div>

          {isPriority && (
            <div style={{
              background: '#FEE2E2', color: '#991B1B',
              padding: '3px 8px', borderRadius: 6,
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0,
            }}>
              High Priority
            </div>
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, flexShrink: 0 }}
          >
            <SafeIcon icon={FiMoreVertical} size={16} />
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          <ActionBtn icon={FiVideo} label="Schedule Telehealth" />
          <ActionBtn icon={FiMessageSquare} label="Send Secure Message" />
          <ActionBtn icon={FiActivity} label="Log Mood Entry" />
          <ActionBtn icon={FiFileText} label="Generate Report" primary />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', paddingLeft: 16 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
            style={{
              padding: '8px 12px', fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? '#0F172A' : '#94A3B8',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #507C7B' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 14 }}>
        {activeTab === 'Overview' && (
          <>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <StatBox label="Current Mood" value={`${moodDecimal}/10`} sub="↑ improving" highlight />
              <StatBox label="Journey Timeline" value={journeyCount} sub="key events" />
              <StatBox label="Sessions Attended" value={sessionsAttended} />
              <StatBox label="Insights" value={`${insightsPct}%`} sub="AI" />
            </div>

            {/* PHQ-9 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#F8FAFC', borderRadius: 10, padding: '10px 12px',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>PHQ-9 Score</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {phqScore}
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginLeft: 4 }}>
                    / 27
                  </span>
                </div>
              </div>
              <div style={{
                background: phqInfo.bg, color: phqInfo.color,
                padding: '4px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700,
              }}>
                {phqInfo.label}
              </div>
            </div>
          </>
        )}

        {activeTab === 'Journey Timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {journeyEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: ev.highlight ? '#507C7B' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SafeIcon icon={ev.icon} size={13} style={{ color: ev.highlight ? 'white' : '#64748B' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{ev.label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 12px', borderLeft: '3px solid #10B981' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>AI Clinical Insight</div>
              <div style={{ fontSize: 12, color: '#064E3B', lineHeight: 1.5 }}>
                Patient shows consistent improvement in sleep and social engagement.
              </div>
            </div>
            <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '10px 12px', borderLeft: '3px solid #3B82F6' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1E3A8A', marginBottom: 4 }}>Recommended</div>
              <div style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
                Introduce mindfulness module next week.
              </div>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Engagement Score</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#507C7B' }}>{insightsPct}%</span>
              </div>
              <div style={{ height: 5, background: '#E2E8F0', borderRadius: 99, marginTop: 8 }}>
                <div style={{ width: `${insightsPct}%`, height: '100%', background: '#507C7B', borderRadius: 99 }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SimplePatientCard;

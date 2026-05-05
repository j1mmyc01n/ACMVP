import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiPhone, FiAlertTriangle, FiClock, FiMapPin, FiHeart } = FiIcons;

export function escalationBand(score) {
  if (score <= 25) return { label: 'Stable',     color: '#10B981', bg: '#ECFDF5', text: '#059669' };
  if (score <= 50) return { label: 'Monitoring', color: '#F59E0B', bg: '#FFFBEB', text: '#B45309' };
  if (score <= 75) return { label: 'Elevated',   color: '#F97316', bg: '#FFF7ED', text: '#C2410C' };
  return              { label: 'Critical',    color: '#EF4444', bg: '#FEF2F2', text: '#DC2626' };
}

const STRIPE_COLORS = {
  Stable:     '#10B981',
  Monitoring: '#F59E0B',
  Elevated:   '#F97316',
  Critical:   '#EF4444',
};

function ScoreRing({ score, color }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * circ;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" style={{ flexShrink: 0 }}>
      <circle cx="23" cy="23" r={r} stroke="#F3F4F6" strokeWidth="4" fill="none" />
      <circle cx="23" cy="23" r={r} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 23 23)" />
      <text x="23" y="27" textAnchor="middle" fontFamily="system-ui, -apple-system"
        fontSize="11" fontWeight="800" fill="#111">{score}</text>
    </svg>
  );
}

function MetaChip({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748B', fontWeight: 500 }}>
      <SafeIcon icon={Icon} size={10} />
      <span>{label}</span>
    </div>
  );
}

export default function PatientCard({ patient, index = 0, onView, onCall }) {
  const p = patient;
  const band = escalationBand(p.escalation_score ?? 0);
  const stripeColor = STRIPE_COLORS[band.label];
  const aiPct = Math.round((p.ai_probability ?? 0) * 100);

  const handleCall = (e) => {
    e.stopPropagation();
    if (onCall) onCall(p);
  };

  return (
    <motion.div
      onClick={() => onView && onView(p)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: (index % 12) * 0.035 }}
      whileHover={{ y: -3, boxShadow: '0 10px 28px rgba(0,0,0,0.10)' }}
      style={{
        background: '#fff',
        border: '1px solid #E8EAED',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* colored stripe */}
      <div style={{ height: 5, background: stripeColor, flexShrink: 0 }} />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScoreRing score={p.escalation_score ?? 0} color={band.color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'}
            </div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{p.concern || 'General Support'}</div>
          </div>
          <div style={{ padding: '3px 8px', borderRadius: 8, background: band.bg, color: band.text, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            {band.label}
          </div>
        </div>

        {/* meta chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {p.phone && <MetaChip icon={FiPhone} label={p.phone} />}
          {p.location && <MetaChip icon={FiMapPin} label={p.location} />}
          {p.next_appt && (
            <MetaChip icon={FiClock} label={new Date(p.next_appt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} />
          )}
          <MetaChip icon={FiHeart} label={`AI: ${aiPct}%`} />
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <button
            onClick={handleCall}
            style={{
              flex: 1, height: 32, border: 'none', borderRadius: 9,
              background: band.color, color: '#fff', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <SafeIcon icon={FiPhone} size={11} />Call
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView && onView(p); }}
            style={{
              flex: 1, height: 32, border: '1.5px solid #E2E8F0', borderRadius: 9,
              background: '#F8FAFC', color: '#475569', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
}

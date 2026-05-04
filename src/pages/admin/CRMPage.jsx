import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { generateCRN } from '../../lib/utils';
import { logActivity } from '../../lib/audit';
import { Field, Input, StatusBadge, Textarea, Select } from '../../components/UI';
import ClientProfileCard from './ClientProfileCard';

const {
  FiUserX, FiX, FiCheckCircle, FiCalendar, FiSearch,
  FiUserPlus, FiEye, FiCheck, FiTrash2, FiAlertTriangle,
  FiRefreshCw, FiChevronDown, FiMail, FiPhone, FiClock,
  FiMoreHorizontal, FiArrowDown, FiMessageSquare, FiActivity,
  FiZap, FiEdit2, FiHeart, FiTrendingUp, FiUsers, FiMapPin,
  FiPhoneCall, FiAlertCircle, FiLink,
} = FiIcons;

const PRIMARY   = 'var(--ac-primary)';
const INDIGO    = '#4F46E5';
const INDIGO_H  = '#4338CA';

const AVATAR_PALETTE = [
  '#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706',
  '#059669','#0284C7','#0891B2','#BE185D','#4338CA',
];

const primaryBtn = {
  height: 40, border: 'none', background: 'var(--ac-primary)', borderRadius: 10,
  cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff',
  display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px',
};
const ghostBtn = {
  height: 40, border: '1.5px solid var(--ac-border)', background: 'transparent',
  borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  color: 'var(--ac-text)', display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px',
};

const initials = (name = '') =>
  (name || '').trim().split(/\s+/).filter(w => w).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const avatarColor = (name = '') =>
  AVATAR_PALETTE[Math.abs(((name || '').charCodeAt(0) || 0) + (name || '').length) % AVATAR_PALETTE.length];

const SUPPORT_CATS = {
  crisis:          { label: 'Crisis Support',        color: '#DC2626', dot: '#EF4444' },
  mental_health:   { label: 'Mental Health',          color: '#D97706', dot: '#F59E0B' },
  substance_abuse: { label: 'Substance Abuse',        color: '#7C3AED', dot: '#8B5CF6' },
  housing:         { label: 'Housing Support',        color: '#059669', dot: '#10B981' },
  ndis:            { label: 'NDIS',                   color: '#0284C7', dot: '#38BDF8' },
  aged_care:       { label: 'Aged Care',              color: '#BE185D', dot: '#EC4899' },
  general:         { label: 'General Support',        color: '#64748B', dot: '#94A3B8' },
};

const catLabel = cat => (SUPPORT_CATS[cat] || SUPPORT_CATS.general).label;

// ─── Urgency scoring for call list ───────────────────────────────────────────
const urgencyScore = (c) => {
  let score = 0;
  const mood = c.current_mood || c.mood || 8;
  if (mood <= 3) score += 100;
  else if (mood <= 5) score += 50;
  else if (mood <= 7) score += 20;
  if (c.support_category === 'crisis') score += 80;
  if (c.support_category === 'mental_health') score += 30;
  if (c.priority === 'High Priority') score += 40;
  // Days since last check-in
  if (c.last_check_in_date) {
    const days = Math.floor((Date.now() - new Date(c.last_check_in_date)) / 86400000);
    if (days >= 7) score += 60;
    else if (days >= 3) score += 25;
    else if (days >= 1) score += 10;
  } else {
    score += 30; // no check-in recorded
  }
  return score;
};

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, onClose }) => (
  <div className="ac-toast">
    <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

// ─── Modal ───────────────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, icon: Icon, iconColor = INDIGO, onClose, children, maxWidth = 520 }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 400, padding: 16, backdropFilter: 'blur(6px)',
  }}>
    <div style={{
      background: '#fff', borderRadius: 20, width: '100%', maxWidth,
      boxShadow: '0 24px 64px rgba(0,0,0,0.22)', maxHeight: '90vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {Icon && (
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SafeIcon icon={Icon} size={18} style={{ color: iconColor }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: '#F1F5F9', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
          <SafeIcon icon={FiX} size={15} />
        </button>
      </div>
      <div style={{ padding: '16px 24px 24px' }}>{children}</div>
    </div>
  </div>
);

// ─── CRN Request Row ─────────────────────────────────────────────────────────
const RequestRow = ({ r, onApprove, onReject, onRaiseCrisis, onEdit }) => {
  const isPending = r.status !== 'approved' && r.status !== 'rejected';
  const joinDate = r.created_at
    ? new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const dotColor = r.status === 'approved' ? '#10B981' : r.status === 'rejected' ? '#EF4444' : '#F59E0B';
  const textColor = r.status === 'approved' ? '#059669' : r.status === 'rejected' ? '#DC2626' : '#D97706';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 20px', borderBottom: '1px solid var(--ac-border)', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--ac-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: isPending ? '#F59E0B' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
        {((r.first_name || '?').trim() || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.first_name}</div>
        {r.email && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><SafeIcon icon={FiMail} size={9} />{r.email}</div>}
        {r.mobile && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}><SafeIcon icon={FiPhone} size={9} />{r.mobile}</div>}
        {r.source_network && <div style={{ fontSize: 10, color: '#7C3AED', marginTop: 1, fontWeight: 600 }}>Referred from: {r.source_network}</div>}
      </div>
      {r.crn_issued && (
        <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: 8, fontWeight: 700, flexShrink: 0 }}>{r.crn_issued}</div>
      )}
      <div style={{ flex: '0 0 160px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: textColor, textTransform: 'capitalize' }}>{r.status || 'pending'}</span>
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
          <SafeIcon icon={FiClock} size={9} />Submitted {joinDate}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {isPending ? (
          <>
            <button onClick={() => onApprove(r)}
              style={{ height: 34, padding: '0 14px', border: 'none', background: '#ECFDF5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#059669'; }}>
              <SafeIcon icon={FiCheck} size={13} />Approve
            </button>
            <button onClick={() => onReject(r)}
              style={{ height: 34, padding: '0 14px', border: 'none', background: '#FEF2F2', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}>
              <SafeIcon icon={FiX} size={13} />Reject
            </button>
            <button onClick={() => onEdit(r)}
              style={{ height: 34, padding: '0 12px', border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac-primary)'; e.currentTarget.style.color = 'var(--ac-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ac-border)'; e.currentTarget.style.color = 'var(--ac-text-secondary)'; }}>
              <SafeIcon icon={FiEdit2} size={12} />Edit
            </button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '0 8px' }}>{r.status}</span>
        )}
        <button onClick={() => onRaiseCrisis(r)}
          title="Raise a crisis event for this inbound request"
          style={{ height: 34, padding: '0 12px', border: 'none', background: '#FEF2F2', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}>
          <SafeIcon icon={FiZap} size={12} />Crisis
        </button>
      </div>
    </div>
  );
};

// ─── Patient Card ─────────────────────────────────────────────────────────────
const PatientCard = ({ c, onView, onOffboard, index, onToast }) => {
  const bg = avatarColor(c.name);
  const isOff = c.status === 'offboarded' || c.status === 'inactive';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isNew = new Date(c.created_at) >= today;
  const mood = c.current_mood || c.mood || 8;
  const moodColor = mood >= 7 ? '#507C7B' : mood >= 4 ? '#F59E0B' : '#EF4444';
  const isHighPriority = mood <= 4 || c.priority === 'High Priority';
  const age = c.age || null;
  const lastCheckIn = c.last_check_in || `Today - Mood ${mood}/10`;
  const cat = SUPPORT_CATS[c.support_category] || SUPPORT_CATS.general;

  return (
    <motion.div
      onClick={() => onView(c)}
      style={{
        background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
        borderRadius: 16, padding: 16, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 0,
        opacity: isOff ? 0.55 : 1, position: 'relative',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isOff ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.25, delay: (index % 9) * 0.04 }}
      whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.1)', borderColor: 'var(--ac-primary)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', background: bg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 800,
        }}>
          {initials(c.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {c.name}{age ? `, ${age}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat.dot, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cat.label}
            </span>
          </div>
        </div>
        {isHighPriority && (
          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0, border: '1px solid #FDE68A' }}>
            Priority
          </div>
        )}
        {isNew && !isHighPriority && (
          <div style={{ background: '#EEF2FF', color: '#4338CA', padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 800, letterSpacing: 0.3, flexShrink: 0 }}>
            New
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--ac-border)', borderBottom: '1px solid var(--ac-border)', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Last Check-In</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ac-text)', marginTop: 2 }}>
            {(lastCheckIn.split(' - ')[0] || 'Today')}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Wellbeing</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: moodColor, marginTop: 2 }}>
            {lastCheckIn.includes(' - ') ? lastCheckIn.split(' - ')[1] : `${mood}/10`}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ width: '100%', height: 5, background: 'var(--ac-bg)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min((mood / 10) * 100, 100)}%`, height: '100%', background: moodColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: moodColor }}>{mood}/10</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onView(c)}
          style={{ flex: 1, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--ac-text)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ac-bg)'; e.currentTarget.style.borderColor = 'var(--ac-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--ac-surface)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
        >
          View Profile
        </button>
        <button
          onClick={() => onToast('Schedule Session — appointment booking coming soon')}
          style={{ flex: 1, height: 32, border: 'none', background: 'var(--ac-primary)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Schedule
        </button>
        <button
          onClick={() => onToast('Message — messaging feature coming soon')}
          style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ac-bg)'; e.currentTarget.style.borderColor = 'var(--ac-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--ac-surface)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
        >
          <SafeIcon icon={FiMessageSquare} size={13} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Call List Card ───────────────────────────────────────────────────────────
const CallCard = ({ c, rank, onView, calendarLinked }) => {
  const mood = c.current_mood || c.mood || 8;
  const moodColor = mood <= 3 ? '#EF4444' : mood <= 5 ? '#F59E0B' : '#10B981';
  const cat = SUPPORT_CATS[c.support_category] || SUPPORT_CATS.general;
  const urgency = urgencyScore(c);
  const urgencyLabel = urgency >= 120 ? 'Urgent' : urgency >= 60 ? 'Soon' : 'Routine';
  const urgencyColor = urgency >= 120 ? '#EF4444' : urgency >= 60 ? '#F59E0B' : '#94A3B8';

  return (
    <div
      onClick={() => onView(c)}
      style={{
        background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
        borderLeft: `3px solid ${urgencyColor}`,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--ac-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--ac-border)'; e.currentTarget.style.borderLeftColor = urgencyColor; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: avatarColor(c.name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>
          {initials(c.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          <div style={{ fontSize: 10, color: cat.color, fontWeight: 600 }}>{cat.label}</div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3, color: urgencyColor, background: `${urgencyColor}18`, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
          {urgencyLabel}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SafeIcon icon={FiHeart} size={10} style={{ color: moodColor }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: moodColor }}>{mood}/10</span>
        </div>
        {c.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <SafeIcon icon={FiPhone} size={10} style={{ color: '#94A3B8' }} />
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>{c.phone}</span>
          </div>
        )}
        {calendarLinked && (
          <div title="Synced to location calendar" style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#059669' }}>
            <SafeIcon icon={FiCalendar} size={10} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>Cal</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Metrics Bar ─────────────────────────────────────────────────────────────
const MetricTile = ({ label, value, sub, color, icon: Icon }) => (
  <div style={{
    background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
    borderRadius: 12, padding: '14px 16px', minWidth: 0,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ac-text-secondary)' }}>{label}</span>
      {Icon && <SafeIcon icon={Icon} size={14} style={{ color: color || 'var(--ac-muted)', opacity: 0.7 }} />}
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, color: color || 'var(--ac-text)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)' }}>{sub}</div>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CRMPage({ currentUserRole = 'admin', currentUserCareTeam = null }) {
  const [clients, setClients]               = useState([]);
  const [centres, setCentres]               = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [locationName, setLocationName]     = useState('');
  const [calendarLinked, setCalendarLinked] = useState(false);
  const [loading, setLoading]               = useState(true);
  const [toast, setToast]                   = useState('');
  const [modalMode, setModalMode]           = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm]                     = useState({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
  const [offboardReason, setOffboardReason] = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeFilter, setActiveFilter]     = useState('All');
  const [activeTab, setActiveTab]           = useState('patients');
  const [profileOpen, setProfileOpen]       = useState(false);
  const [purging, setPurging]               = useState(false);
  const [page, setPage]                     = useState(0);
  const [showReqHistory, setShowReqHistory] = useState(false);
  const [crisisReqModal, setCrisisReqModal] = useState(null);
  const [crisisForm, setCrisisForm]         = useState({ client_name: '', client_crn: '', location: '', severity: 'high', crisis_type: 'mental_health', notes: '' });
  const [editingRequest, setEditingRequest] = useState(null);
  const [editReqForm, setEditReqForm]       = useState({ first_name: '', email: '', mobile: '', care_centre: '', suburb: '', postcode: '' });
  const [approveModal, setApproveModal]     = useState(null);
  const [approveCentre, setApproveCentre]   = useState('');
  const [approving, setApproving]           = useState(false);
  const [clearAllConfirm, setClearAllConfirm] = useState('');
  const [clearingAll, setClearingAll]         = useState(false);
  const PAGE_SIZE = 9;

  useEffect(() => { fetchClients(); fetchCentres(); fetchPendingRequests(); }, []);

  // Derive location name from assigned care team or first centre
  useEffect(() => {
    if (currentUserCareTeam) {
      setLocationName(currentUserCareTeam);
    } else if (centres.length > 0) {
      setLocationName(centres[0].name);
    }
  }, [currentUserCareTeam, centres]);

  // Check if calendar is linked (stored in localStorage by location)
  useEffect(() => {
    try {
      const ws = JSON.parse(localStorage.getItem('ac_int_ws_google_workspace') || localStorage.getItem('ac_int_ws_outlook365') || '{}');
      setCalendarLinked(ws.status === 'connected');
    } catch { setCalendarLinked(false); }
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    let query = supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
    if (currentUserRole === 'admin' && currentUserCareTeam) {
      query = query.eq('care_centre', currentUserCareTeam);
    }
    const { data } = await query;
    setClients(data || []);
    setLoading(false);
  };

  const fetchCentres = async () => {
    const { data, error } = await supabase.from('care_centres_1777090000').select('*').order('name');
    if (!error && data) setCentres(data);
  };

  const fetchPendingRequests = async () => {
    let query = supabase
      .from('crn_requests_1777090006')
      .select('*')
      .order('created_at', { ascending: false });
    // Filter to location's requests if admin
    if (currentUserRole === 'admin' && currentUserCareTeam) {
      query = query.eq('care_centre', currentUserCareTeam);
    }
    const { data } = await query;
    setPendingRequests(data || []);
  };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleCreate = async () => {
    if (!form.name) return alert('Name is required.');
    const centre = centres.find(c => c.name === form.care_centre);
    const crnPrefix = centre?.suffix?.toUpperCase() || 'CRN';
    const crn = generateCRN(crnPrefix);
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    const { error } = await supabase.from('clients_1777020684735').insert([{
      ...form, crn, status: 'active', care_centre: form.care_centre || currentUserCareTeam || null,
    }]);
    if (!error) {
      await logActivity({
        action: 'create', resource: 'client',
        detail: `Registered new client ${form.name} (${crn})`,
        actor: currentUserRole || 'admin', actor_role: currentUserRole,
        source_type: 'client', location: form.care_centre || currentUserCareTeam || null,
      });
      showToast(`Client registered! CRN: ${crn}`);
      setModalMode(null);
      setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
      fetchClients();
    } else alert(error.message);
  };

  const handleOffboard = async () => {
    if (!offboardReason) return alert('Please provide a reason.');
    const { error } = await supabase.from('clients_1777020684735').update({ status: 'offboarded', offboard_reason: offboardReason }).eq('id', selectedClient.id);
    if (!error) {
      await logActivity({
        action: 'update', resource: 'client',
        detail: `Offboarded ${selectedClient?.name || selectedClient?.crn}: ${offboardReason}`,
        actor: currentUserRole || 'admin', actor_role: currentUserRole,
        source_type: 'client', location: selectedClient?.care_centre || null, level: 'warning',
      });
      showToast('Client offboarded.'); setModalMode(null); fetchClients();
    } else alert(error.message);
  };

  const handlePurgeInactive = async () => {
    setPurging(true);
    try {
      const inactive = clients.filter(c => c.status === 'offboarded' || c.status === 'inactive');
      if (!inactive.length) { showToast('No inactive clients to purge.'); setPurging(false); setModalMode(null); return; }
      const crns = inactive.map(c => c.crn).filter(Boolean);
      if (crns.length) await supabase.from('crns_1740395000').update({ is_active: false }).in('code', crns);
      await supabase.from('clients_1777020684735').delete().in('id', inactive.map(c => c.id));
      await logActivity({
        action: 'delete', resource: 'client',
        detail: `Purged ${inactive.length} inactive client(s)`,
        actor: currentUserRole || 'admin', actor_role: currentUserRole,
        source_type: 'client', location: currentUserCareTeam || null, level: 'warning',
      });
      showToast(`Purged ${inactive.length} inactive client(s).`);
      setModalMode(null); fetchClients();
    } catch (e) { alert('Purge failed: ' + e.message); }
    finally { setPurging(false); }
  };

  const handleClearAllPatients = async () => {
    setClearingAll(true);
    try {
      const { data: allClients } = await supabase.from('clients_1777020684735').select('id, crn');
      const totalClients = allClients?.length || 0;
      const crns = (allClients || []).map(c => c.crn).filter(Boolean);
      if (crns.length) await supabase.from('crns_1740395000').update({ is_active: false }).in('code', crns);
      await supabase.from('clients_1777020684735').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { data: allRequests } = await supabase.from('crn_requests_1777090006').select('id');
      const totalRequests = allRequests?.length || 0;
      if (totalRequests) {
        await supabase.from('crn_requests_1777090006').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      await logActivity({
        action: 'delete', resource: 'client',
        detail: `Cleared all CRM data (${totalClients} client${totalClients !== 1 ? 's' : ''}, ${totalRequests} CRN request${totalRequests !== 1 ? 's' : ''})`,
        actor: currentUserRole || 'sysadmin', actor_role: currentUserRole,
        source_type: 'client', location: currentUserCareTeam || null, level: 'critical',
      });
      showToast(`CRM cleared — ${totalClients} client${totalClients !== 1 ? 's' : ''} and ${totalRequests} intake request${totalRequests !== 1 ? 's' : ''} removed.`);
      setModalMode(null); setClearAllConfirm('');
      fetchClients(); fetchPendingRequests();
    } catch (e) { alert('Clear failed: ' + e.message); }
    finally { setClearingAll(false); }
  };

  const handleApproveCRN = async req => {
    if (!req.care_centre) { setApproveModal(req); setApproveCentre(currentUserCareTeam || ''); return; }
    await doApprove(req, req.care_centre);
  };

  const doApprove = async (req, careCentre) => {
    setApproving(true);
    const centre = careCentre ? centres.find(c => c.name === careCentre) : null;
    const crnPrefix = centre?.suffix?.toUpperCase() || 'CRN';
    const crn = generateCRN(crnPrefix);
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    await supabase.from('clients_1777020684735').insert([{
      name: req.first_name, email: req.email, phone: req.mobile,
      crn, status: 'active', support_category: 'general',
      care_centre: careCentre || null,
    }]);
    await supabase.from('crn_requests_1777090006').update({
      status: 'approved', crn_issued: crn,
      care_centre: careCentre || req.care_centre || null,
    }).eq('id', req.id);
    await logActivity({
      action: 'create', resource: 'crn_request',
      detail: `Approved CRN ${crn} for ${req.first_name}${careCentre ? ` at ${careCentre}` : ''}`,
      actor: currentUserRole || 'admin', actor_role: currentUserRole,
      source_type: 'client', location: careCentre || req.care_centre || null,
    });
    showToast(`Approved — CRN ${crn} issued to ${req.first_name}${careCentre ? ` at ${careCentre}` : ''}`);
    setApproving(false); setApproveModal(null);
    fetchPendingRequests(); fetchClients();
  };

  const handleRejectCRN = async req => {
    await supabase.from('crn_requests_1777090006').update({ status: 'rejected' }).eq('id', req.id);
    await logActivity({
      action: 'update', resource: 'crn_request',
      detail: `Rejected CRN request from ${req.first_name}`,
      actor: currentUserRole || 'admin', actor_role: currentUserRole,
      source_type: 'client', location: req.care_centre || null, level: 'warning',
    });
    showToast(`Request from ${req.first_name} rejected.`);
    fetchPendingRequests();
  };

  const openEditRequest = (req) => {
    setEditingRequest(req);
    setEditReqForm({
      first_name: req.first_name || '', email: req.email || '',
      mobile: req.mobile || '', care_centre: req.care_centre || '',
      suburb: req.suburb || '', postcode: req.postcode || '',
    });
  };

  const handleSaveEditRequest = async () => {
    if (!editReqForm.first_name.trim()) return showToast('Name is required.');
    const { error } = await supabase.from('crn_requests_1777090006').update({ ...editReqForm }).eq('id', editingRequest.id);
    if (!error) { showToast('Request updated.'); setEditingRequest(null); fetchPendingRequests(); }
    else showToast('Update failed: ' + error.message);
  };

  const openCrisisFromRequest = (req) => {
    setCrisisForm({
      client_name: req.first_name || '', client_crn: '',
      location: req.suburb || req.postcode || '',
      severity: 'high', crisis_type: 'mental_health',
      notes: `Inbound CRN request from ${req.first_name} (${req.email || req.mobile || ''})`,
    });
    setCrisisReqModal(req);
  };

  const handleRaiseCrisisFromRequest = async () => {
    if (!crisisForm.client_name) return showToast('Client name is required');
    const { error } = await supabase.from('crisis_events_1777090000').insert([{
      ...crisisForm, status: 'active', created_at: new Date().toISOString(),
    }]);
    if (!error) { showToast('Crisis event raised from inbound request'); setCrisisReqModal(null); }
    else showToast('Failed to raise crisis event');
  };

  // ─── Derived metrics ───────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const activeClients    = clients.filter(c => c.status === 'active');
  const activeCount      = activeClients.length;
  const inactiveCount    = clients.filter(c => c.status === 'offboarded' || c.status === 'inactive').length;
  const newTodayCount    = clients.filter(c => new Date(c.created_at) >= today).length;
  const ndisCount        = clients.filter(c => c.support_category === 'ndis').length;
  const mentalHealthCount = clients.filter(c => c.support_category === 'mental_health').length;
  const crisisCount      = clients.filter(c => c.support_category === 'crisis' && c.status === 'active').length;
  const avgWellbeing     = activeClients.length > 0
    ? (activeClients.reduce((s, c) => s + (c.current_mood || c.mood || 8), 0) / activeClients.length).toFixed(1)
    : '—';
  const highRiskCount    = activeClients.filter(c => (c.current_mood || c.mood || 8) <= 4).length;

  const TERMINAL_STATUSES = new Set(['approved', 'rejected', 'processed']);
  const pendingCount     = pendingRequests.filter(r => !TERMINAL_STATUSES.has(r.status)).length;
  const visibleRequests  = showReqHistory
    ? pendingRequests
    : pendingRequests.filter(r => !TERMINAL_STATUSES.has(r.status));

  // ─── Call list (sorted by urgency, highest first) ─────────────────────────
  const callList = useMemo(() => {
    return clients
      .filter(c => c.status === 'active')
      .sort((a, b) => urgencyScore(b) - urgencyScore(a))
      .slice(0, 20);
  }, [clients]);

  const filteredClients = useMemo(() => {
    let list = [...clients];
    const q = searchQuery.toLowerCase();
    if (q) list = list.filter(c => c.name?.toLowerCase().includes(q) || c.crn?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || catLabel(c.support_category).toLowerCase().includes(q));
    if (activeFilter === 'Active')       list = list.filter(c => c.status === 'active');
    if (activeFilter === 'New')          list = list.filter(c => new Date(c.created_at) >= today);
    if (activeFilter === 'High Risk')    list = list.filter(c => (c.current_mood || c.mood || 8) <= 4 || c.priority === 'High Priority');
    if (activeFilter === 'Mental Health') list = list.filter(c => c.support_category === 'mental_health');
    if (activeFilter === 'NDIS')         list = list.filter(c => c.support_category === 'ndis');
    if (activeFilter === 'Crisis')       list = list.filter(c => c.support_category === 'crisis');
    return list;
  }, [clients, searchQuery, activeFilter, today]);

  const totalPages  = Math.ceil(filteredClients.length / PAGE_SIZE);
  const pageClients = filteredClients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const categories   = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing', 'ndis', 'aged_care'];
  const catOptions   = categories.map(c => ({ value: c, label: catLabel(c) }));
  const centreOptions = centres.length > 0
    ? [{ value: '', label: '— Select Care Centre —' }, ...centres.map(c => ({ value: c.name, label: c.name }))]
    : [{ value: '', label: '— No Care Centres in DB —' }];

  const openRegister = () => { setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: currentUserCareTeam || '' }); setModalMode('create'); };

  const FILTERS = [
    { id: 'All',          label: 'All',          count: clients.length },
    { id: 'Active',       label: 'Active',       count: activeCount    },
    { id: 'New',          label: 'New',          count: newTodayCount  },
    { id: 'High Risk',    label: 'High Risk',    count: highRiskCount  },
    { id: 'Mental Health', label: 'Mental Health', count: mentalHealthCount },
    { id: 'NDIS',         label: 'NDIS',         count: ndisCount      },
    { id: 'Crisis',       label: 'Crisis',       count: crisisCount    },
  ];

  const displayName = locationName || 'Location';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* ── Header ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ac-text)', letterSpacing: -0.5, margin: 0 }}>
              {displayName} — Care CRM
            </h1>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              {activeCount} active · {newTodayCount} new today · {pendingCount} pending intake{pendingCount !== 1 ? 's' : ''}
              {calendarLinked && <span style={{ marginLeft: 8, color: '#059669', fontWeight: 600 }}>· Calendar synced</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {inactiveCount > 0 && (
              <button onClick={() => setModalMode('purge')} style={{ ...ghostBtn, color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}>
                <SafeIcon icon={FiTrash2} size={14} />Purge ({inactiveCount})
              </button>
            )}
            {currentUserRole === 'sysadmin' && (clients.length > 0 || pendingRequests.length > 0) && (
              <button onClick={() => { setClearAllConfirm(''); setModalMode('clearAll'); }} style={{ ...ghostBtn, color: '#7C3AED', borderColor: '#DDD6FE', background: '#F5F3FF' }}>
                <SafeIcon icon={FiRefreshCw} size={14} />Clear All Data
              </button>
            )}
            <button onClick={openRegister} style={{ ...primaryBtn, background: 'var(--ac-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <SafeIcon icon={FiUserPlus} size={14} />Add Client
            </button>
          </div>
        </div>

        {/* ── Metrics row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          <MetricTile label="Active Clients"   value={loading ? '—' : activeCount}       sub={`${inactiveCount} offboarded`}      color="var(--ac-text)"  icon={FiUsers} />
          <MetricTile label="Avg Wellbeing"    value={loading ? '—' : avgWellbeing}       sub="out of 10"                          color="#507C7B"         icon={FiHeart} />
          <MetricTile label="High Risk"        value={loading ? '—' : highRiskCount}      sub="mood ≤ 4/10"                        color={highRiskCount > 0 ? '#EF4444' : '#94A3B8'} icon={FiAlertCircle} />
          <MetricTile label="Mental Health"    value={loading ? '—' : mentalHealthCount}  sub="active clients"                     color="#D97706"        icon={FiActivity} />
          <MetricTile label="NDIS"             value={loading ? '—' : ndisCount}          sub="registered clients"                 color="#0284C7"        icon={FiMapPin} />
          <MetricTile label="Crisis Active"    value={loading ? '—' : crisisCount}        sub="crisis support"                     color={crisisCount > 0 ? '#DC2626' : '#94A3B8'} icon={FiZap} />
        </div>

        {/* ── Search + Filter ── */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <SafeIcon icon={FiSearch} size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', pointerEvents: 'none' }} />
          <input
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search clients by name, CRN or support type…"
            style={{ width: '100%', height: 42, paddingLeft: 42, paddingRight: searchQuery ? 38 : 14, border: '1px solid var(--ac-border)', borderRadius: 12, background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--ac-font)', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'var(--ac-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--ac-border)'}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setPage(0); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 2 }}>
              <SafeIcon icon={FiX} size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFilter(f.id); setPage(0); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  height: 32, padding: '0 12px', borderRadius: 8,
                  border: active ? 'none' : '1px solid var(--ac-border)',
                  background: active ? 'var(--ac-primary)' : 'var(--ac-surface)',
                  color: active ? '#fff' : '#64748B',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f.id === 'High Risk' && <SafeIcon icon={FiAlertTriangle} size={10} />}
                {f.id === 'Crisis' && <SafeIcon icon={FiZap} size={10} />}
                {f.label}
                {f.count != null && f.count > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: active ? 'rgba(255,255,255,0.25)' : 'var(--ac-bg)', color: active ? '#fff' : '#64748B' }}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setActiveTab(activeTab === 'patients' ? 'requests' : 'patients')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px', borderRadius: 8,
              border: activeTab === 'requests' ? 'none' : '1px solid var(--ac-border)',
              background: activeTab === 'requests' ? INDIGO : 'var(--ac-surface)',
              color: activeTab === 'requests' ? '#fff' : '#64748B',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <SafeIcon icon={FiCalendar} size={10} />
            Intake Requests
            {pendingCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: '#EF4444', color: '#fff' }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button onClick={() => { fetchClients(); fetchPendingRequests(); fetchCentres(); }} title="Refresh" style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            <SafeIcon icon={FiRefreshCw} size={13} />
          </button>
        </div>
      </div>

      {/* ── Two-column layout: patient grid + call list ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Left: main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Clients Grid */}
          {activeTab === 'patients' && (
            <>
              {loading ? (
                <EmptyState icon="⏳" title="Loading clients…" sub="" />
              ) : filteredClients.length === 0 ? (
                <EmptyState
                  icon="🔍" title="No clients found"
                  sub={searchQuery ? `No results for "${searchQuery}"` : 'Adjust filters or add a new client'}
                  action={searchQuery ? (
                    <button onClick={() => setSearchQuery('')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)', marginTop: 12 }}>
                      <SafeIcon icon={FiX} size={13} />Clear search
                    </button>
                  ) : null}
                />
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {pageClients.map((c, i) => (
                      <PatientCard
                        key={c.id} c={c} index={i}
                        onView={cl => { setSelectedClient(cl); setProfileOpen(true); }}
                        onOffboard={cl => { setSelectedClient(cl); setOffboardReason(''); setModalMode('offboard'); }}
                        onToast={showToast}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 }}>
                      <button onClick={() => setPage(0)} disabled={page === 0} style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>«</button>
                      <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>‹</button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                        return (
                          <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, border: page === p ? 'none' : '1px solid var(--ac-border)', background: page === p ? 'var(--ac-primary)' : 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 700 : 500, color: page === p ? '#fff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p + 1}</button>
                        );
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>›</button>
                      <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1} style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>»</button>
                    </div>
                  )}
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredClients.length)} of {filteredClients.length} clients
                  </div>
                </>
              )}
            </>
          )}

          {/* Intake Requests */}
          {activeTab === 'requests' && (
            <div style={{ background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)' }}>
              <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--ac-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0', overflow: 'hidden', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ac-text)' }}>Intake Requests</span>
                  {pendingCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', background: '#FEF3C7', color: '#D97706', borderRadius: 99, border: '1px solid #FCD34D' }}>{pendingCount} pending</span>}
                </div>
                <button
                  onClick={() => setShowReqHistory(v => !v)}
                  style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: showReqHistory ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: showReqHistory ? 'var(--ac-primary)' : 'var(--ac-text-secondary)', cursor: 'pointer' }}
                >
                  {showReqHistory ? 'Showing all' : 'Show history'}
                </button>
              </div>
              {visibleRequests.length === 0 ? (
                <EmptyState icon="✅" title={showReqHistory ? 'No requests yet' : 'All caught up!'} sub={showReqHistory ? 'No intake requests have been submitted' : 'No pending intake requests'} />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 580 }}>
                    {visibleRequests.map(r => <RequestRow key={r.id} r={r} onApprove={handleApproveCRN} onReject={handleRejectCRN} onRaiseCrisis={openCrisisFromRequest} onEdit={openEditRequest} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Call List panel */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 16 }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--ac-border)', background: 'linear-gradient(135deg, #507C7B 0%, #345b5a 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <SafeIcon icon={FiPhoneCall} size={14} style={{ color: '#fff' }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Call List</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                Sorted by urgency — nearest to call first
                {calendarLinked && <span style={{ marginLeft: 4 }}>· Calendar linked</span>}
              </div>
            </div>

            {/* Pricing note */}
            <div style={{ padding: '8px 14px', background: '#F8FAFC', borderBottom: '1px solid var(--ac-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <SafeIcon icon={FiLink} size={11} style={{ color: 'var(--ac-muted)' }} />
              <span style={{ fontSize: 10, color: 'var(--ac-muted)' }}>CRM — <strong>$35/seat/mo</strong></span>
              {calendarLinked && (
                <span style={{ fontSize: 10, color: '#059669', fontWeight: 600, marginLeft: 'auto' }}>
                  <SafeIcon icon={FiCalendar} size={9} style={{ marginRight: 3 }} />Synced
                </span>
              )}
            </div>

            <div style={{ maxHeight: 520, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)', fontSize: 12 }}>Loading…</div>
              ) : callList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)', fontSize: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📞</div>
                  No active clients yet
                </div>
              ) : (
                callList.map((c, i) => (
                  <CallCard
                    key={c.id} c={c} rank={i + 1}
                    calendarLinked={calendarLinked}
                    onView={cl => { setSelectedClient(cl); setProfileOpen(true); }}
                  />
                ))
              )}
            </div>

            {callList.length > 0 && (
              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--ac-border)', fontSize: 11, color: 'var(--ac-muted)', textAlign: 'center' }}>
                {callList.length} client{callList.length !== 1 ? 's' : ''} · sorted by wellbeing & recency
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Modal ── */}
      {profileOpen && selectedClient && (
        <ClientProfileCard
          client={selectedClient}
          onClose={() => { setProfileOpen(false); setSelectedClient(null); }}
          onSaved={msg => { showToast(msg); fetchClients(); }}
          currentUserRole={currentUserRole}
          currentUserCareTeam={currentUserCareTeam}
        />
      )}

      {/* ── Purge Modal ── */}
      {modalMode === 'purge' && (
        <Modal title="Purge Inactive Clients" subtitle={`${inactiveCount} client(s) will be permanently deleted`} icon={FiAlertTriangle} iconColor="#DC2626" onClose={() => setModalMode(null)}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
            <p style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.6 }}>
              This permanently deletes <strong>{inactiveCount} offboarded/inactive client(s)</strong> and deactivates their CRNs. <strong>This cannot be undone.</strong>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => setModalMode(null)} style={ghostBtn}>Cancel</button>
            <button onClick={handlePurgeInactive} disabled={purging} style={{ ...primaryBtn, background: '#DC2626', boxShadow: '0 2px 8px rgba(220,38,38,0.3)', opacity: purging ? 0.6 : 1, justifyContent: 'center' }}>
              {purging ? 'Purging…' : `Purge ${inactiveCount} Client(s)`}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Register Client Modal ── */}
      {modalMode === 'create' && (
        <Modal title="Register New Client" subtitle="A unique CRN will be auto-generated on submission" icon={FiUserPlus} iconColor='var(--ac-primary)' onClose={() => setModalMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Full Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" autoFocus /></Field>
              <Field label="Support Type"><Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={catOptions} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 4XX XXX XXX" /></Field>
            </div>
            <Field label="Care Centre"><Select value={form.care_centre} onChange={e => setForm({ ...form, care_centre: e.target.value })} options={centreOptions} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button onClick={() => setModalMode(null)} style={ghostBtn}>Cancel</button>
              <button onClick={handleCreate} style={{ ...primaryBtn, justifyContent: 'center', flex: 1 }}>Register & Generate CRN</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Offboard Modal ── */}
      {modalMode === 'offboard' && (
        <Modal title="Offboard Client" subtitle={`Offboarding ${selectedClient?.name}`} icon={FiUserX} iconColor="#DC2626" onClose={() => setModalMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Reason for Offboarding *">
              <Textarea value={offboardReason} onChange={e => setOffboardReason(e.target.value)} placeholder="e.g. Treatment completed, transferred to another centre…" rows={4} autoFocus />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setModalMode(null)} style={ghostBtn}>Cancel</button>
              <button onClick={handleOffboard} style={{ ...primaryBtn, background: '#DC2626', boxShadow: '0 2px 8px rgba(220,38,38,0.3)', justifyContent: 'center', flex: 1 }}>Confirm Offboard</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Clear All Data Modal ── */}
      {modalMode === 'clearAll' && (
        <Modal title="Clear All CRM Data" subtitle={`Permanently delete all ${clients.length} client record${clients.length !== 1 ? 's' : ''} and ${pendingRequests.length} request${pendingRequests.length !== 1 ? 's' : ''}`} icon={FiAlertTriangle} iconColor="#7C3AED" onClose={() => { setModalMode(null); setClearAllConfirm(''); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 13, color: '#5B21B6', lineHeight: 1.6, margin: 0 }}>
                This will permanently delete <strong>all {clients.length} client record{clients.length !== 1 ? 's' : ''}</strong> and remove <strong>all {pendingRequests.length} intake request{pendingRequests.length !== 1 ? 's' : ''}</strong>. This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <Field label="Type CLEAR ALL to confirm">
              <Input value={clearAllConfirm} onChange={e => setClearAllConfirm(e.target.value)} placeholder="CLEAR ALL" autoFocus style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => { setModalMode(null); setClearAllConfirm(''); }} style={ghostBtn}>Cancel</button>
              <button
                onClick={handleClearAllPatients}
                disabled={clearAllConfirm !== 'CLEAR ALL' || clearingAll}
                style={{ ...primaryBtn, background: '#7C3AED', boxShadow: '0 2px 8px rgba(124,58,237,0.3)', justifyContent: 'center', flex: 1, opacity: (clearAllConfirm !== 'CLEAR ALL' || clearingAll) ? 0.5 : 1, cursor: (clearAllConfirm !== 'CLEAR ALL' || clearingAll) ? 'not-allowed' : 'pointer' }}
              >
                {clearingAll ? 'Clearing…' : 'Clear All CRM Data'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Crisis from Intake Request Modal ── */}
      {crisisReqModal && (
        <Modal title="Raise Crisis Event" subtitle={`From intake request: ${crisisReqModal.first_name}`} icon={FiZap} iconColor="#EF4444" onClose={() => setCrisisReqModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Client Name *">
                <Input value={crisisForm.client_name} onChange={e => setCrisisForm({ ...crisisForm, client_name: e.target.value })} />
              </Field>
              <Field label="Location">
                <Input value={crisisForm.location} onChange={e => setCrisisForm({ ...crisisForm, location: e.target.value })} placeholder="Address or area" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Severity">
                <Select value={crisisForm.severity} onChange={e => setCrisisForm({ ...crisisForm, severity: e.target.value })}
                  options={[{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]}
                />
              </Field>
              <Field label="Crisis Type">
                <Select value={crisisForm.crisis_type} onChange={e => setCrisisForm({ ...crisisForm, crisis_type: e.target.value })}
                  options={['mental_health', 'medical', 'violence', 'substance', 'suicide_risk', 'domestic', 'other'].map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
                />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea value={crisisForm.notes} onChange={e => setCrisisForm({ ...crisisForm, notes: e.target.value })} rows={3} />
            </Field>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#DC2626' }}>
              This will immediately flag the event as active in the Crisis Dashboard.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setCrisisReqModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={handleRaiseCrisisFromRequest} style={{ ...primaryBtn, background: '#DC2626', justifyContent: 'center', flex: 1 }}>Raise Crisis Event</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Intake Request Modal ── */}
      {editingRequest && (
        <Modal title="Edit Intake Request" subtitle={`Updating details for ${editingRequest.first_name}`} icon={FiEdit2} iconColor={INDIGO} onClose={() => setEditingRequest(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Full Name *">
                <Input value={editReqForm.first_name} onChange={e => setEditReqForm({ ...editReqForm, first_name: e.target.value })} autoFocus />
              </Field>
              <Field label="Care Centre">
                <Select value={editReqForm.care_centre} onChange={e => setEditReqForm({ ...editReqForm, care_centre: e.target.value })} options={centreOptions} />
              </Field>
              <Field label="Email">
                <Input type="email" value={editReqForm.email} onChange={e => setEditReqForm({ ...editReqForm, email: e.target.value })} />
              </Field>
              <Field label="Mobile">
                <Input value={editReqForm.mobile} onChange={e => setEditReqForm({ ...editReqForm, mobile: e.target.value })} />
              </Field>
              <Field label="Suburb">
                <Input value={editReqForm.suburb} onChange={e => setEditReqForm({ ...editReqForm, suburb: e.target.value })} />
              </Field>
              <Field label="Postcode">
                <Input value={editReqForm.postcode} onChange={e => setEditReqForm({ ...editReqForm, postcode: e.target.value })} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button onClick={() => setEditingRequest(null)} style={ghostBtn}>Cancel</button>
              <button onClick={handleSaveEditRequest} style={{ ...primaryBtn, background: INDIGO, justifyContent: 'center', flex: 1 }}>Save Changes</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Approve: pick care centre ── */}
      {approveModal && (
        <Modal title="Approve & Assign to Care Centre" subtitle={`Issuing CRN for ${approveModal.first_name}`} icon={FiCheck} iconColor="#059669" onClose={() => { setApproveModal(null); setApproving(false); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, fontSize: 13, color: '#065F46' }}>
              This request has no care centre assigned. Select one before approving — the client will be registered at that location.
            </div>
            <Field label="Assign to Care Centre *">
              <Select value={approveCentre} onChange={e => setApproveCentre(e.target.value)} options={[{ value: '', label: '— Select Care Centre —' }, ...centres.map(c => ({ value: c.name, label: c.name }))]} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button onClick={() => { setApproveModal(null); setApproving(false); }} style={ghostBtn} disabled={approving}>Cancel</button>
              <button onClick={() => doApprove(approveModal, approveCentre)} disabled={approving || !approveCentre} style={{ ...primaryBtn, background: '#059669', justifyContent: 'center', flex: 1, opacity: !approveCentre ? 0.5 : 1 }}>
                {approving ? 'Approving…' : 'Approve & Register Client'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const EmptyState = ({ icon, title, sub, action }) => (
  <div style={{ padding: '64px 24px', textAlign: 'center' }}>
    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--ac-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>{icon}</div>
    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ac-text)', marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 13, color: '#94A3B8' }}>{sub}</div>}
    {action}
  </div>
);

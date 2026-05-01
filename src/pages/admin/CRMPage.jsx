import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { generateCRN } from '../../lib/utils';
import { Field, Input, StatusBadge, Textarea, Select } from '../../components/UI';
import ClientProfileCard from './ClientProfileCard';

const {
  FiUserX, FiX, FiCheckCircle, FiCalendar, FiSearch,
  FiUserPlus, FiEye, FiCheck, FiTrash2, FiAlertTriangle,
  FiRefreshCw, FiChevronDown, FiMail, FiPhone, FiClock,
  FiMoreHorizontal, FiArrowDown, FiMessageSquare, FiActivity,
  FiZap,
} = FiIcons;

// ─── Design constants (use CSS variables for platform consistency) ────────────
const PRIMARY    = 'var(--ac-primary)';
const PRIMARY_H  = 'var(--ac-primary-hover)';

// Keep indigo for the CRN-requests accent (matches platform's violet badge tones)
const INDIGO  = '#4F46E5';
const INDIGO_H = '#4338CA';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initials = (name = '') =>
  (name || '').trim().split(/\s+/).filter(w => w).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const avatarColor = (name = '') =>
  AVATAR_PALETTE[Math.abs(((name || '').charCodeAt(0) || 0) + (name || '').length) % AVATAR_PALETTE.length];

const CATS = {
  crisis:          { label: 'Crisis Support',   color: '#DC2626', dot: '#EF4444' },
  mental_health:   { label: 'Mental Health',     color: '#D97706', dot: '#F59E0B' },
  substance_abuse: { label: 'Substance Abuse',   color: '#7C3AED', dot: '#8B5CF6' },
  housing:         { label: 'Housing Support',   color: '#059669', dot: '#10B981' },
  general:         { label: 'General Support',   color: '#0284C7', dot: '#38BDF8' },
};
const getCat = cat => CATS[cat] || CATS.general;

const conditionLabel = cat => {
  const map = {
    crisis: 'Crisis Support', mental_health: 'Mental Health', substance_abuse: 'Substance Abuse',
    housing: 'Housing Support', general: 'General Support',
  };
  return map[cat] || 'General Support';
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
const RequestRow = ({ r, onApprove, onReject, onRaiseCrisis }) => {
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
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '0 8px' }}>{r.status}</span>
        )}
        {/* Crisis button always visible */}
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

// ─── Patient Card (grid view, matches image) ──────────────────────────────────
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
      {/* Header: avatar + name + priority badge */}
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
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {conditionLabel(c.support_category)}
          </div>
        </div>
        {isHighPriority && (
          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0, border: '1px solid #FDE68A' }}>
            High Priority
          </div>
        )}
        {isNew && !isHighPriority && (
          <div style={{ background: '#EEF2FF', color: '#4338CA', padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 800, letterSpacing: 0.3, flexShrink: 0 }}>
            New
          </div>
        )}
      </div>

      {/* Check-in row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--ac-border)', borderBottom: '1px solid var(--ac-border)', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Last Check-In</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ac-text)', marginTop: 2 }}>
            {(lastCheckIn.split(' - ')[0] || 'Today')}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mood</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: moodColor, marginTop: 2 }}>
            {lastCheckIn.includes(' - ') ? lastCheckIn.split(' - ')[1] : `Mood ${mood}/10`}
          </div>
        </div>
      </div>

      {/* Mood progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ width: '100%', height: 5, background: 'var(--ac-bg)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min((mood / 10) * 100, 100)}%`, height: '100%', background: moodColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: moodColor }}>{mood}/10</span>
        </div>
      </div>

      {/* Action buttons */}
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CRMPage({ currentUserRole = 'admin', currentUserCareTeam = null }) {
  const [clients, setClients]               = useState([]);
  const [centres, setCentres]               = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
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
  // Crisis event from inbound request
  const [crisisReqModal, setCrisisReqModal] = useState(null); // holds the crn_request row
  const [crisisForm, setCrisisForm]         = useState({ client_name: '', client_crn: '', location: '', severity: 'high', crisis_type: 'mental_health', notes: '' });
  const PAGE_SIZE = 9;

  useEffect(() => { fetchClients(); fetchCentres(); fetchPendingRequests(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    let query = supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
    // Location-based filtering: admin only sees their care centre's patients
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
    const { data } = await supabase.from('crn_requests_1777090006').select('*').order('created_at', { ascending: false });
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
      ...form, crn, status: 'active', care_centre: form.care_centre || null,
      event_log: [{ summary: 'Profile created', who: 'Admin', time: new Date().toLocaleString() }],
    }]);
    if (!error) {
      showToast(`Patient registered! CRN: ${crn}`);
      setModalMode(null);
      setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
      fetchClients();
    } else alert(error.message);
  };

  const handleOffboard = async () => {
    if (!offboardReason) return alert('Please provide a reason.');
    const { error } = await supabase.from('clients_1777020684735').update({ status: 'offboarded', offboard_reason: offboardReason }).eq('id', selectedClient.id);
    if (!error) { showToast('Client offboarded.'); setModalMode(null); fetchClients(); }
    else alert(error.message);
  };

  const handlePurgeInactive = async () => {
    setPurging(true);
    try {
      const inactive = clients.filter(c => c.status === 'offboarded' || c.status === 'inactive');
      if (!inactive.length) { showToast('No inactive clients to purge.'); setPurging(false); setModalMode(null); return; }
      const crns = inactive.map(c => c.crn).filter(Boolean);
      if (crns.length) await supabase.from('crns_1740395000').update({ is_active: false }).in('code', crns);
      await supabase.from('clients_1777020684735').delete().in('id', inactive.map(c => c.id));
      showToast(`Purged ${inactive.length} inactive client(s).`);
      setModalMode(null); fetchClients();
    } catch (e) { alert('Purge failed: ' + e.message); }
    finally { setPurging(false); }
  };

  const handleApproveCRN = async req => {
    // Use the request's preferred care centre prefix if available
    const centre = req.care_centre ? centres.find(c => c.name === req.care_centre) : null;
    const crnPrefix = centre?.suffix?.toUpperCase() || 'CRN';
    const crn = generateCRN(crnPrefix);
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    await supabase.from('clients_1777020684735').insert([{
      name: req.first_name, email: req.email, phone: req.mobile, crn, status: 'active', support_category: 'general',
      care_centre: req.care_centre || null,
      event_log: [{ summary: 'Created from CRN request', who: 'Admin', time: new Date().toLocaleString() }],
    }]);
    await supabase.from('crn_requests_1777090006').update({ status: 'approved', crn_issued: crn }).eq('id', req.id);
    showToast(`Approved — CRN ${crn} issued to ${req.first_name}`);
    fetchPendingRequests(); fetchClients();
  };

  const handleRejectCRN = async req => {
    await supabase.from('crn_requests_1777090006').update({ status: 'rejected' }).eq('id', req.id);
    showToast(`Request from ${req.first_name} rejected.`);
    fetchPendingRequests();
  };

  const openCrisisFromRequest = (req) => {
    setCrisisForm({
      client_name: req.first_name || '',
      client_crn: '',
      location: req.suburb || req.postcode || '',
      severity: 'high',
      crisis_type: 'mental_health',
      notes: `Inbound CRN request from ${req.first_name} (${req.email || req.mobile || ''})`,
    });
    setCrisisReqModal(req);
  };

  const handleRaiseCrisisFromRequest = async () => {
    if (!crisisForm.client_name) return showToast('Client name is required');
    const { error } = await supabase.from('crisis_events_1777090000').insert([{
      ...crisisForm, status: 'active', created_at: new Date().toISOString(),
    }]);
    if (!error) {
      showToast('🚨 Crisis event raised from inbound request');
      setCrisisReqModal(null);
    } else {
      showToast('Failed to raise crisis event', 'error');
    }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const activeCount   = clients.filter(c => c.status === 'active').length;
  const inactiveCount = clients.filter(c => c.status === 'offboarded' || c.status === 'inactive').length;
  const newTodayCount = clients.filter(c => new Date(c.created_at) >= today).length;
  const pendingCount  = pendingRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected').length;

  const filteredClients = useMemo(() => {
    let list = [...clients];
    const q = searchQuery.toLowerCase();
    if (q) list = list.filter(c => c.name?.toLowerCase().includes(q) || c.crn?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || conditionLabel(c.support_category).toLowerCase().includes(q));
    if (activeFilter === 'Active')    list = list.filter(c => c.status === 'active');
    if (activeFilter === 'New')       list = list.filter(c => new Date(c.created_at) >= today);
    if (activeFilter === 'High Risk') list = list.filter(c => (c.current_mood || c.mood || 8) <= 4 || c.priority === 'High Priority');
    return list;
  }, [clients, searchQuery, activeFilter, today]);

  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);
  const pageClients = filteredClients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const categories   = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing'];
  const catOptions   = categories.map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
  const centreOptions = centres.length > 0
    ? [{ value: '', label: '— Select Care Centre —' }, ...centres.map(c => ({ value: c.name, label: c.name }))]
    : [{ value: '', label: '— No Care Centres in DB —' }];

  const openRegister = () => { setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' }); setModalMode('create'); };

  const FILTERS = [
    { id: 'All',       label: 'All',       count: clients.length },
    { id: 'Active',    label: 'Active',    count: activeCount    },
    { id: 'New',       label: 'New',       count: newTodayCount  },
    { id: 'High Risk', label: 'High Risk', count: null           },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ac-text)', letterSpacing: -0.5, margin: 0 }}>
              All Patients ({clients.length.toLocaleString()})
            </h1>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              {activeCount} active · {newTodayCount} new today · {pendingCount} pending CRN request{pendingCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {inactiveCount > 0 && (
              <button onClick={() => setModalMode('purge')} style={{ ...ghostBtn, color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}>
                <SafeIcon icon={FiTrash2} size={14} />Purge ({inactiveCount})
              </button>
            )}
            <button onClick={openRegister} style={{ ...primaryBtn, background: 'var(--ac-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <SafeIcon icon={FiUserPlus} size={14} />Add New Patient
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <SafeIcon icon={FiSearch} size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', pointerEvents: 'none' }} />
          <input
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search patients by name, ID or condition..."
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

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFilter(f.id); setPage(0); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 34, padding: '0 14px', borderRadius: 8,
                  border: active ? 'none' : '1px solid var(--ac-border)',
                  background: active ? 'var(--ac-primary)' : 'var(--ac-surface)',
                  color: active ? '#fff' : '#64748B',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f.id === 'Active' && <SafeIcon icon={FiRefreshCw} size={11} />}
                {f.id === 'New' && <SafeIcon icon={FiActivity} size={11} />}
                {f.id === 'High Risk' && <SafeIcon icon={FiAlertTriangle} size={11} />}
                {f.label}
                {f.count != null && f.count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: active ? 'rgba(255,255,255,0.25)' : 'var(--ac-bg)', color: active ? '#fff' : '#64748B' }}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          {/* CRN Requests toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'patients' ? 'requests' : 'patients')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 14px', borderRadius: 8,
              border: activeTab === 'requests' ? 'none' : '1px solid var(--ac-border)',
              background: activeTab === 'requests' ? INDIGO : 'var(--ac-surface)',
              color: activeTab === 'requests' ? '#fff' : '#64748B',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <SafeIcon icon={FiCalendar} size={11} />
            CRN Requests
            {pendingCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: '#EF4444', color: '#fff' }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button onClick={fetchClients} title="Refresh" style={{ width: 34, height: 34, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            <SafeIcon icon={FiRefreshCw} size={13} />
          </button>
        </div>
      </div>

      {/* ── Patients Grid ── */}
      {activeTab === 'patients' && (
        <>
          {loading ? (
            <EmptyState icon="⏳" title="Loading patients…" sub="" />
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon="🔍" title="No patients found"
              sub={searchQuery ? `No results for "${searchQuery}"` : 'Adjust filters or register a new patient'}
              action={searchQuery ? (
                <button onClick={() => setSearchQuery('')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)', marginTop: 12 }}>
                  <SafeIcon icon={FiX} size={13} />Clear search
                </button>
              ) : null}
            />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {pageClients.map((c, i) => (
                  <PatientCard
                    key={c.id} c={c} index={i}
                    onView={cl => { setSelectedClient(cl); setProfileOpen(true); }}
                    onOffboard={cl => { setSelectedClient(cl); setOffboardReason(''); setModalMode('offboard'); }}
                    onToast={showToast}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 }}>
                  <button onClick={() => setPage(0)} disabled={page === 0}
                    style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    «
                  </button>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: 32, height: 32, border: page === p ? 'none' : '1px solid var(--ac-border)', background: page === p ? 'var(--ac-primary)' : 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 700 : 500, color: page === p ? '#fff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p + 1}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                    style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    ›
                  </button>
                  <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
                    style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    »
                  </button>
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredClients.length)} of {filteredClients.length} patients
              </div>
            </>
          )}
        </>
      )}

      {/* ── CRN Requests ── */}
      {activeTab === 'requests' && (
        <div style={{ background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)' }}>
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--ac-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ac-text)' }}>CRN Registration Requests</span>
            {pendingCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', background: '#FEF3C7', color: '#D97706', borderRadius: 99, border: '1px solid #FCD34D' }}>{pendingCount} pending</span>}
          </div>
          {pendingRequests.length === 0 ? (
            <EmptyState icon="✅" title="All caught up!" sub="No pending CRN requests" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* minWidth ensures all action buttons (Approve/Reject/Crisis) are reachable via horizontal scroll on narrow viewports */}
              <div style={{ minWidth: 580 }}>
                {pendingRequests.map(r => <RequestRow key={r.id} r={r} onApprove={handleApproveCRN} onReject={handleRejectCRN} onRaiseCrisis={openCrisisFromRequest} />)}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* ── Register Patient Modal ── */}
      {modalMode === 'create' && (
        <Modal title="Register New Patient" subtitle="A unique CRN will be auto-generated on submission" icon={FiUserPlus} iconColor='var(--ac-primary)' onClose={() => setModalMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Full Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" autoFocus /></Field>
              <Field label="Support Category"><Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={catOptions} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" /></Field>
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

      {/* ── Crisis Event from Inbound Request Modal ── */}
      {crisisReqModal && (
        <Modal title="🚨 Raise Crisis Event" subtitle={`From inbound request: ${crisisReqModal.first_name}`} icon={FiZap} iconColor="#EF4444" onClose={() => setCrisisReqModal(null)}>
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
              ⚠️ This will immediately flag the event as active in the Crisis Dashboard.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setCrisisReqModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={handleRaiseCrisisFromRequest} style={{ ...primaryBtn, background: '#DC2626', justifyContent: 'center', flex: 1 }}>Raise Crisis Event</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tiny helper components ───────────────────────────────────────────────────
const EmptyState = ({ icon, title, sub, action }) => (
  <div style={{ padding: '64px 24px', textAlign: 'center' }}>
    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--ac-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>{icon}</div>
    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ac-text)', marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 13, color: '#94A3B8' }}>{sub}</div>}
    {action}
  </div>
);

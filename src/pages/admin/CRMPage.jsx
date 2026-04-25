import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { generateCRN } from '../../lib/utils';
import { Field, Input, StatusBadge, Textarea, Select } from '../../components/UI';
import ClientProfileCard from './ClientProfileCard';

const {
  FiUserX, FiX, FiCheckCircle, FiCalendar, FiSearch,
  FiUserPlus, FiEye, FiCheck, FiTrash2, FiAlertTriangle,
  FiRefreshCw, FiChevronDown, FiMapPin, FiMail, FiPhone,
  FiClock, FiMoreHorizontal, FiArrowDown,
} = FiIcons;

// ─── Design constants ────────────────────────────────────────────────────────
const INDIGO   = '#4F46E5';
const INDIGO_H = '#4338CA';
const AVATAR_PALETTE = [
  '#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706',
  '#059669','#0284C7','#0891B2','#BE185D','#4338CA',
];

// ─── Module-level style objects ──────────────────────────────────────────────
const primaryBtn = {
  height: 42, border: 'none', background: INDIGO, borderRadius: 10,
  cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff',
  boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
};
const ghostBtn = {
  height: 42, border: '1.5px solid var(--ac-border)', background: 'transparent',
  borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--ac-text)',
};
const menuItem = {
  width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
  fontSize: 13, fontWeight: 600, color: '#0F172A', textAlign: 'left',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initials = (name = '') =>
  (name || '').trim().split(/\s+/).filter(w => w).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const avatarColor = (name = '') =>
  AVATAR_PALETTE[Math.abs(((name || '').charCodeAt(0) || 0) + (name || '').length) % AVATAR_PALETTE.length];

const CATS = {
  crisis:          { label: 'Crisis Support',    color: '#DC2626', dot: '#EF4444' },
  mental_health:   { label: 'Mental Health',      color: '#D97706', dot: '#F59E0B' },
  substance_abuse: { label: 'Substance Abuse',    color: '#7C3AED', dot: '#8B5CF6' },
  housing:         { label: 'Housing Support',    color: '#059669', dot: '#10B981' },
  general:         { label: 'General Support',    color: '#0284C7', dot: '#38BDF8' },
};
const getCat = cat => CATS[cat] || CATS.general;

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

// ─── Metric Column (matches Trafft's Employees/Services/Features columns) ────
const MetricCol = ({ label, value, display, max, barColor }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : Math.min(value * 5, 100);
  return (
    <div style={{ minWidth: 68 }}>
      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ac-text)', marginBottom: 7, letterSpacing: -0.3 }}>{display}</div>
      <div style={{ height: 3, background: 'var(--ac-border)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
};

// ─── Row action dropdown (⋯ menu matching Trafft) ────────────────────────────
const RowMenu = ({ c, onView, onOffboard }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isOff = c.status === 'offboarded' || c.status === 'inactive';

  useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: 32, height: 32, border: '1px solid var(--ac-border)',
          background: open ? '#F1F5F9' : 'var(--ac-surface)',
          borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#64748B', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'var(--ac-surface)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; } }}
      >
        <SafeIcon icon={FiMoreHorizontal} size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 38, background: '#fff',
          border: '1px solid #E2E8F0', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 200, minWidth: 192, overflow: 'hidden', padding: '4px 0',
        }}>
          <button
            onClick={() => { onView(c); setOpen(false); }}
            style={menuItem}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <SafeIcon icon={FiEye} size={14} style={{ color: '#64748B' }} />
            View Profile
          </button>
          {!isOff && (
            <>
              <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
              <button
                onClick={() => { onOffboard(c); setOpen(false); }}
                style={{ ...menuItem, color: '#DC2626' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <SafeIcon icon={FiUserX} size={14} style={{ color: '#DC2626' }} />
                Offboard Client
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Client Row (Trafft agency row style) ────────────────────────────────────
const ClientRow = ({ c, onView, onOffboard }) => {
  const cat = getCat(c.support_category);
  const bg = avatarColor(c.name);
  const isOff = c.status === 'offboarded' || c.status === 'inactive';
  const teamSize = Array.isArray(c.assigned_team) ? c.assigned_team.length : 0;
  const eventCount = Array.isArray(c.event_log) ? c.event_log.length : 0;
  const daysActive = c.created_at
    ? Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)
    : 0;
  const joinDate = c.created_at
    ? new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div
      onClick={() => onView(c)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '15px 20px',
        borderBottom: '1px solid var(--ac-border)', cursor: 'pointer',
        transition: 'background 0.12s', opacity: isOff ? 0.6 : 1,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--ac-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Colored square avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: 0.5,
      }}>
        {initials(c.name)}
      </div>

      {/* Name + CRN + email */}
      <div style={{ flex: '0 0 210px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8', marginTop: 2 }}>{c.crn}</div>
        {c.email && (
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
            <SafeIcon icon={FiMail} size={9} />{c.email}
          </div>
        )}
      </div>

      {/* Category + "Active since" — matches Trafft's "Pro license / Active since" */}
      <div style={{ flex: '0 0 178px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: cat.color }}>{cat.label}</span>
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
          {isOff ? 'Offboarded' : `Active since ${joinDate}`}
        </div>
      </div>

      {/* Care Centre */}
      <div style={{ flex: '0 0 148px' }}>
        {c.care_centre ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <SafeIcon icon={FiMapPin} size={11} style={{ color: '#94A3B8', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.care_centre}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' }}>Not assigned</span>
        )}
      </div>

      {/* 3 Metric columns — mirrors Trafft's Employees / Services / Features */}
      <div style={{ display: 'flex', gap: 20, flex: '0 0 252px' }} onClick={e => e.stopPropagation()}>
        <MetricCol label="Team"   value={teamSize}   display={`${teamSize}/5`}       max={5}   barColor={INDIGO} />
        <MetricCol label="Events" value={eventCount} display={`${eventCount}`}        max={20}  barColor="#0284C7" />
        <MetricCol label="Days"   value={daysActive} display={`${daysActive}`}        max={365} barColor="#059669" />
      </div>

      {/* ⋯ dropdown */}
      <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <RowMenu c={c} onView={onView} onOffboard={onOffboard} />
      </div>
    </div>
  );
};

// ─── CRN Request Row ─────────────────────────────────────────────────────────
const RequestRow = ({ r, onApprove, onReject }) => {
  const isPending = r.status !== 'approved' && r.status !== 'rejected';
  const joinDate = r.created_at
    ? new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const dotColor = r.status === 'approved' ? '#10B981' : r.status === 'rejected' ? '#EF4444' : '#F59E0B';
  const textColor = r.status === 'approved' ? '#059669' : r.status === 'rejected' ? '#DC2626' : '#D97706';

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 20px', borderBottom: '1px solid var(--ac-border)', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--ac-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
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
            <button
              onClick={() => onApprove(r)}
              style={{ height: 34, padding: '0 14px', border: 'none', background: '#ECFDF5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#059669'; }}
            ><SafeIcon icon={FiCheck} size={13} />Approve</button>
            <button
              onClick={() => onReject(r)}
              style={{ height: 34, padding: '0 14px', border: 'none', background: '#FEF2F2', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
            ><SafeIcon icon={FiX} size={13} />Reject</button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '0 8px' }}>{r.status}</span>
        )}
      </div>
    </div>
  );
};

// ─── Inline styled dropdown (search toolbar) ─────────────────────────────────
const FilterSelect = ({ value, onChange, children, icon: Icon }) => (
  <div style={{ position: 'relative' }}>
    {Icon && <SafeIcon icon={Icon} size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />}
    <select
      value={value} onChange={onChange}
      style={{ height: 38, paddingLeft: Icon ? 28 : 12, paddingRight: 28, border: '1px solid var(--ac-border)', borderRadius: 10, background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'var(--ac-font)', fontWeight: 500 }}
    >
      {children}
    </select>
    <SafeIcon icon={FiChevronDown} size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
  </div>
);

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
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('active');
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeTab, setActiveTab]           = useState('clients');
  const [profileOpen, setProfileOpen]       = useState(false);
  const [purging, setPurging]               = useState(false);
  const [sortBy, setSortBy]                 = useState('newest');

  useEffect(() => { fetchClients(); fetchCentres(); fetchPendingRequests(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
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
    const crn = generateCRN();
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
    const crn = generateCRN();
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    await supabase.from('clients_1777020684735').insert([{
      name: req.first_name, email: req.email, phone: req.mobile, crn, status: 'active', support_category: 'general',
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

  const activeCount   = clients.filter(c => c.status === 'active').length;
  const inactiveCount = clients.filter(c => c.status === 'offboarded' || c.status === 'inactive').length;
  const pendingCount  = pendingRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected').length;

  const filteredClients = useMemo(() => {
    let list = [...clients];
    const q = searchQuery.toLowerCase();
    if (q) list = list.filter(c => c.name?.toLowerCase().includes(q) || c.crn?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
    if (filterCategory !== 'all') list = list.filter(c => c.support_category === filterCategory);
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);
    if (sortBy === 'name')   list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return list;
  }, [clients, searchQuery, filterCategory, filterStatus, sortBy]);

  const categories   = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing'];
  const catOptions   = categories.map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
  const centreOptions = centres.length > 0
    ? [{ value: '', label: '— Select Care Centre —' }, ...centres.map(c => ({ value: c.name, label: c.name }))]
    : [{ value: '', label: '— No Care Centres in DB —' }];

  const openRegister = () => { setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' }); setModalMode('create'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* ══════════════════════════════════════════════════════════════
          MAIN CARD  — matches the Trafft white agency panel
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, border: '1px solid var(--ac-border)', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* ── Card header: title left | "Your Clients" stats right ── */}
        <div style={{ padding: '24px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, borderBottom: '1px solid var(--ac-border)', flexWrap: 'wrap' }}>

          {/* Left: title + subtitle + CTA buttons */}
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ac-text)', letterSpacing: -0.5, lineHeight: 1.2 }}>Client CRM</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 5 }}>Welcome to your Acute Connect client dashboard.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              {/* Primary CTA — indigo filled matching "+ Create Tenant" */}
              <button
                onClick={openRegister}
                style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', border: 'none', background: INDIGO, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.35)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = INDIGO_H}
                onMouseLeave={e => e.currentTarget.style.background = INDIGO}
              >
                <SafeIcon icon={FiUserPlus} size={14} />Register Patient
              </button>
              {/* Ghost CTA — matches "Add Existing" */}
              <button
                onClick={() => showToast('Calendar sync initiated.')}
                style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', border: '1.5px solid var(--ac-border)', background: 'transparent', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--ac-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <SafeIcon icon={FiCalendar} size={14} />Sync Calendars
              </button>
              {inactiveCount > 0 && (
                <button
                  onClick={() => setModalMode('purge')}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', border: '1.5px solid #FECACA', background: '#FEF2F2', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#DC2626', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FCA5A5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                >
                  <SafeIcon icon={FiTrash2} size={14} />Purge ({inactiveCount})
                </button>
              )}
            </div>
          </div>

          {/* Right: "Your Clients" stats panel — mirrors "Your licenses" card */}
          <div style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '16px 22px', minWidth: 268 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 }}>Your Clients</span>
              <button onClick={openRegister} style={{ fontSize: 12, fontWeight: 700, color: INDIGO, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Add client</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { val: `${activeCount}/${clients.length}`, label: 'Active',       color: '#10B981', pct: clients.length ? (activeCount / clients.length) * 100 : 0 },
                { val: pendingCount,                       label: 'Pending CRNs', color: '#F59E0B', pct: pendingCount > 0 ? 65 : 0 },
                { val: inactiveCount,                      label: 'Offboarded',   color: '#94A3B8', pct: clients.length ? (inactiveCount / clients.length) * 100 : 0 },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: 'var(--ac-text)' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, marginBottom: 8 }}>{s.label}</div>
                  <div style={{ height: 3, background: 'var(--ac-border)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ac-border)', padding: '0 24px', background: 'var(--ac-surface)' }}>
          {[
            { id: 'clients',  label: 'All Clients',   count: clients.length,  alert: false },
            { id: 'requests', label: 'CRN Requests',  count: pendingCount,    alert: pendingCount > 0 },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 4px', marginRight: 24,
              border: 'none', background: 'transparent',
              borderBottom: activeTab === t.id ? `2px solid ${INDIGO}` : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer', fontSize: 14,
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? INDIGO : '#94A3B8',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {t.label}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 99, minWidth: 22, textAlign: 'center',
                background: t.alert ? '#EF4444' : (activeTab === t.id ? '#EEF2FF' : 'var(--ac-bg)'),
                color: t.alert ? '#fff' : (activeTab === t.id ? INDIGO : '#94A3B8'),
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Search + filter toolbar (clients tab) ── */}
        {activeTab === 'clients' && (
          <div style={{ display: 'flex', gap: 10, padding: '13px 20px', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-surface)', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search — full prominent width like image */}
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <SafeIcon icon={FiSearch} size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', pointerEvents: 'none' }} />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, CRN or email…"
                style={{ width: '100%', height: 38, paddingLeft: 36, paddingRight: searchQuery ? 36 : 12, border: '1px solid var(--ac-border)', borderRadius: 10, background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--ac-font)', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = INDIGO}
                onBlur={e => e.target.style.borderColor = 'var(--ac-border)'}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 2 }}>
                  <SafeIcon icon={FiX} size={13} />
                </button>
              )}
            </div>
            {/* "All licenses" style dropdown */}
            <FilterSelect value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
            </FilterSelect>
            {/* "Sort by Date Added" dropdown matching image */}
            <FilterSelect value={sortBy} onChange={e => setSortBy(e.target.value)} icon={FiArrowDown}>
              <option value="newest">Sort by Date Added</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A → Z</option>
            </FilterSelect>
            <FilterSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="all">All Statuses</option>
              <option value="offboarded">Offboarded</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>
            <button onClick={fetchClients} title="Refresh" style={{ width: 38, height: 38, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexShrink: 0 }}>
              <SafeIcon icon={FiRefreshCw} size={14} />
            </button>
          </div>
        )}

        {/* ── Column header row (clients tab) ── */}
        {activeTab === 'clients' && !loading && filteredClients.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 20px', background: 'var(--ac-bg)', borderBottom: '1px solid var(--ac-border)' }}>
            <div style={{ width: 44, flexShrink: 0 }} />
            <ColHead style={{ flex: '0 0 210px' }}>Patient</ColHead>
            <ColHead style={{ flex: '0 0 178px' }}>Category</ColHead>
            <ColHead style={{ flex: '0 0 148px' }}>Care Centre</ColHead>
            <div style={{ flex: '0 0 252px', display: 'flex', gap: 20 }}>
              {['Team', 'Events', 'Days'].map(h => <ColHead key={h} style={{ minWidth: 68 }}>{h}</ColHead>)}
            </div>
            <div style={{ width: 32, flexShrink: 0 }} />
          </div>
        )}

        {/* ── Client rows ── */}
        {activeTab === 'clients' && (
          <>
            {loading ? (
              <EmptyState icon="⏳" title="Loading clients…" sub="" />
            ) : filteredClients.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No clients found"
                sub={searchQuery ? `No results for "${searchQuery}"` : 'Adjust filters or register a new patient'}
                action={searchQuery ? <button onClick={() => setSearchQuery('')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)', marginTop: 12 }}><SafeIcon icon={FiX} size={13} />Clear search</button> : null}
              />
            ) : (
              filteredClients.map(c => (
                <ClientRow
                  key={c.id} c={c}
                  onView={cl => { setSelectedClient(cl); setProfileOpen(true); }}
                  onOffboard={cl => { setSelectedClient(cl); setOffboardReason(''); setModalMode('offboard'); }}
                />
              ))
            )}
            {!loading && filteredClients.length > 0 && (
              <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ac-bg)', borderTop: '1px solid var(--ac-border)' }}>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  Showing <strong style={{ color: 'var(--ac-text)' }}>{filteredClients.length}</strong> of <strong style={{ color: 'var(--ac-text)' }}>{clients.length}</strong> clients
                </span>
              </div>
            )}
          </>
        )}

        {/* ── CRN Requests tab ── */}
        {activeTab === 'requests' && (
          <>
            <div style={{ padding: '13px 20px 12px', borderBottom: '1px solid var(--ac-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Review and action incoming client CRN registration requests</span>
              {pendingCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', background: '#FEF3C7', color: '#D97706', borderRadius: 99, border: '1px solid #FCD34D' }}>{pendingCount} pending</span>}
            </div>
            {pendingRequests.length === 0 ? (
              <EmptyState icon="✅" title="All caught up!" sub="No pending CRN requests" />
            ) : (
              pendingRequests.map(r => <RequestRow key={r.id} r={r} onApprove={handleApproveCRN} onReject={handleRejectCRN} />)
            )}
          </>
        )}
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
            <button onClick={handlePurgeInactive} disabled={purging} style={{ ...primaryBtn, background: '#DC2626', boxShadow: '0 2px 8px rgba(220,38,38,0.3)', opacity: purging ? 0.6 : 1 }}>
              {purging ? 'Purging…' : `Purge ${inactiveCount} Client(s)`}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Register Patient Modal ── */}
      {modalMode === 'create' && (
        <Modal title="Register New Patient" subtitle="A unique CRN will be auto-generated on submission" icon={FiUserPlus} iconColor={INDIGO} onClose={() => setModalMode(null)}>
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
              <button onClick={handleCreate} style={primaryBtn}>Register & Generate CRN</button>
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
              <button onClick={handleOffboard} style={{ ...primaryBtn, background: '#DC2626', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>Confirm Offboard</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tiny helper components ───────────────────────────────────────────────────
const ColHead = ({ children, style }) => (
  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: '#94A3B8', ...style }}>{children}</div>
);

const EmptyState = ({ icon, title, sub, action }) => (
  <div style={{ padding: '64px 24px', textAlign: 'center' }}>
    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--ac-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>{icon}</div>
    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ac-text)', marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 13, color: '#94A3B8' }}>{sub}</div>}
    {action}
  </div>
);

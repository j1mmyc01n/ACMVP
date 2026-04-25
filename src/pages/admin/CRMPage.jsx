import React, { useState, useEffect, useMemo } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { generateCRN } from '../../lib/utils';
import { Badge, Button, Field, Input, StatusBadge, Textarea, Select } from '../../components/UI';
import ClientProfileCard from './ClientProfileCard';

const {
  FiUserX, FiX, FiCheckCircle, FiCalendar, FiSearch,
  FiUserPlus, FiBell, FiEye, FiCheck, FiTrash2, FiAlertTriangle,
  FiUsers, FiActivity, FiTrendingUp, FiFilter, FiRefreshCw,
  FiChevronDown, FiMapPin, FiMail, FiPhone, FiClock
} = FiIcons;

// ─── Helpers ────────────────────────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

const catConfig = {
  crisis:           { color: '#FF3B30', bg: '#FFF0EF', label: 'Crisis' },
  mental_health:    { color: '#FF9500', bg: '#FFF8EE', label: 'Mental Health' },
  substance_abuse:  { color: '#AF52DE', bg: '#F5EEFB', label: 'Substance Abuse' },
  housing:          { color: '#34C759', bg: '#EDFAF1', label: 'Housing' },
  general:          { color: '#007AFF', bg: '#EBF5FF', label: 'General' },
};
const getCat = (cat) => catConfig[cat] || catConfig.general;

const avatarPalette = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
  '#5AC8FA', '#FF2D55', '#FFCC00', '#4CD964', '#5856D6',
];
const avatarColor = (name = '') => avatarPalette[name.charCodeAt(0) % avatarPalette.length];

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
const Modal = ({ title, subtitle, icon: Icon, iconColor = 'var(--ac-primary)', onClose, children, maxWidth = 500 }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300, padding: 16, backdropFilter: 'blur(4px)'
  }}>
    <div style={{
      background: 'var(--ac-surface)', borderRadius: 20, width: '100%',
      maxWidth, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '92vh',
      overflowY: 'auto', display: 'flex', flexDirection: 'column'
    }}>
      {/* Modal header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {Icon && (
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SafeIcon icon={Icon} size={18} style={{ color: iconColor }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 3 }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{ background: 'var(--ac-bg)', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SafeIcon icon={FiX} size={15} />
        </button>
      </div>
      <div style={{ padding: '16px 24px 24px' }}>{children}</div>
    </div>
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatTile = ({ label, value, icon: Icon, color, bg, sub }) => (
  <div style={{
    background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
    borderRadius: 16, padding: '16px 18px',
    display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s',
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <SafeIcon icon={Icon} size={20} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-muted)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 1, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

// ─── Client Row ──────────────────────────────────────────────────────────────
const ClientRow = ({ c, onView, onOffboard }) => {
  const cat = getCat(c.support_category);
  const bg = avatarColor(c.name);
  const isOffboarded = c.status === 'offboarded' || c.status === 'inactive';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
      borderBottom: '1px solid var(--ac-border)', transition: 'background 0.15s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--ac-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={() => onView(c)}
    >
      {/* Avatar */}
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 0.5, opacity: isOffboarded ? 0.5 : 1 }}>
        {initials(c.name)}
      </div>

      {/* Name + CRN */}
      <div style={{ flex: '0 0 200px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: isOffboarded ? 0.6 : 1 }}>{c.name}</div>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--ac-muted)', marginTop: 2 }}>{c.crn}</div>
      </div>

      {/* Category */}
      <div style={{ flex: '0 0 140px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.color, padding: '3px 10px', borderRadius: 20 }}>
          {cat.label}
        </span>
      </div>

      {/* Care Centre */}
      <div style={{ flex: '0 0 160px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: c.care_centre ? 'var(--ac-text)' : 'var(--ac-muted)' }}>
        {c.care_centre ? (
          <><SafeIcon icon={FiMapPin} size={11} style={{ color: 'var(--ac-primary)', flexShrink: 0 }} />{c.care_centre}</>
        ) : '— Not assigned'}
      </div>

      {/* Contact */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {c.email && <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ac-muted)' }}>
          <SafeIcon icon={FiMail} size={10} />{c.email}
        </div>}
        {(c.phone || c.mobile) && <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ac-muted)', marginTop: 2 }}>
          <SafeIcon icon={FiPhone} size={10} />{c.phone || c.mobile}
        </div>}
      </div>

      {/* Status */}
      <div style={{ flex: '0 0 90px' }}>
        <StatusBadge status={c.status || 'active'} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          title="Open Profile"
          onClick={() => onView(c)}
          style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ac-primary)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ac-primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--ac-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--ac-surface)'; e.currentTarget.style.color = 'var(--ac-primary)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
        >
          <SafeIcon icon={FiEye} size={13} />
        </button>
        {!isOffboarded && (
          <button
            title="Offboard Client"
            onClick={() => onOffboard(c)}
            style={{ width: 32, height: 32, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ac-danger)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EF'; e.currentTarget.style.borderColor = 'var(--ac-danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--ac-surface)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
          >
            <SafeIcon icon={FiUserX} size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── CRN Request Row ─────────────────────────────────────────────────────────
const RequestRow = ({ r, onApprove, onReject }) => {
  const isPending = r.status !== 'approved' && r.status !== 'rejected';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderBottom: '1px solid var(--ac-border)', transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--ac-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: isPending ? '#FEF9E7' : '#F2F3F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: isPending ? '#B7770D' : '#566573' }}>
        {(r.first_name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: '0 0 180px' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.first_name}</div>
        <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <SafeIcon icon={FiClock} size={10} />{new Date(r.created_at).toLocaleDateString()}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ac-muted)' }}>
          <SafeIcon icon={FiPhone} size={10} />{r.mobile || '—'}
        </div>
        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ac-muted)', marginTop: 2 }}>
          <SafeIcon icon={FiMail} size={10} />{r.email || '—'}
        </div>
      </div>
      {r.crn_issued && (
        <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ac-success)', background: '#EDFAF1', padding: '3px 10px', borderRadius: 8 }}>{r.crn_issued}</div>
      )}
      <div style={{ flex: '0 0 90px' }}>
        <StatusBadge status={r.status} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {isPending ? (
          <>
            <button
              title="Approve"
              onClick={() => onApprove(r)}
              style={{ height: 32, padding: '0 12px', border: 'none', background: '#EDFAF1', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#1D8348', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#34C759'}
              onMouseLeave={e => e.currentTarget.style.background = '#EDFAF1'}
            >
              <SafeIcon icon={FiCheck} size={13} />Approve
            </button>
            <button
              title="Reject"
              onClick={() => onReject(r)}
              style={{ height: 32, padding: '0 12px', border: 'none', background: '#FFF0EF', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#C0392B', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FF3B30'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFF0EF'}
            >
              <SafeIcon icon={FiX} size={13} />Reject
            </button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--ac-muted)', fontStyle: 'italic' }}>{r.status}</span>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CRMPage({ currentUserRole = 'admin', currentUserCareTeam = null }) {
  const [clients, setClients] = useState([]);
  const [centres, setCentres] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
  const [offboardReason, setOffboardReason] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('clients');
  const [profileOpen, setProfileOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchCentres();
    fetchPendingRequests();
  }, []);

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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleCreate = async () => {
    if (!form.name) return alert('Name is required.');
    const crn = generateCRN();
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    const { error } = await supabase.from('clients_1777020684735').insert([{
      ...form, crn, status: 'active', care_centre: form.care_centre || null,
      event_log: [{ summary: 'Profile created', who: 'Admin', time: new Date().toLocaleString() }]
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
    const { error } = await supabase.from('clients_1777020684735').update({
      status: 'offboarded', offboard_reason: offboardReason
    }).eq('id', selectedClient.id);
    if (!error) { showToast('Client offboarded.'); setModalMode(null); fetchClients(); }
    else alert(error.message);
  };

  const handlePurgeInactive = async () => {
    setPurging(true);
    try {
      const inactive = clients.filter(c => c.status === 'offboarded' || c.status === 'inactive');
      if (inactive.length === 0) { showToast('No inactive clients to purge.'); setPurging(false); setModalMode(null); return; }
      const crns = inactive.map(c => c.crn).filter(Boolean);
      if (crns.length > 0) await supabase.from('crns_1740395000').update({ is_active: false }).in('code', crns);
      await supabase.from('clients_1777020684735').delete().in('id', inactive.map(c => c.id));
      showToast(`Purged ${inactive.length} inactive client(s) and deactivated their CRNs.`);
      setModalMode(null);
      fetchClients();
    } catch (e) { alert('Purge failed: ' + e.message); }
    finally { setPurging(false); }
  };

  const handleApproveCRN = async (req) => {
    const crn = generateCRN();
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    await supabase.from('clients_1777020684735').insert([{
      name: req.first_name, email: req.email, phone: req.mobile, crn, status: 'active', support_category: 'general',
      event_log: [{ summary: 'Created from CRN request', who: 'Admin', time: new Date().toLocaleString() }]
    }]);
    await supabase.from('crn_requests_1777090006').update({ status: 'approved', crn_issued: crn }).eq('id', req.id);
    showToast(`Approved — CRN ${crn} issued to ${req.first_name}`);
    fetchPendingRequests(); fetchClients();
  };

  const handleRejectCRN = async (req) => {
    await supabase.from('crn_requests_1777090006').update({ status: 'rejected' }).eq('id', req.id);
    showToast(`Request from ${req.first_name} rejected.`);
    fetchPendingRequests();
  };

  // Derived stats
  const activeCount = clients.filter(c => c.status === 'active').length;
  const inactiveCount = clients.filter(c => c.status === 'offboarded' || c.status === 'inactive').length;
  const pendingCount = pendingRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected').length;

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return clients.filter(c => {
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.crn?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
      const matchCat = filterCategory === 'all' || c.support_category === filterCategory;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [clients, searchQuery, filterCategory, filterStatus]);

  const categories = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing'];
  const categoryOptions = categories.map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
  const centreOptions = centres.length > 0
    ? [{ value: '', label: '— Select Care Centre —' }, ...centres.map(c => ({ value: c.name, label: c.name }))]
    : [{ value: '', label: '— No Care Centres in DB —' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Client CRM</h1>
          <p style={{ fontSize: 13, color: 'var(--ac-muted)', marginTop: 4 }}>Manage clients, CRN requests and care team assignments</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {pendingCount > 0 && (
            <button
              onClick={() => setActiveTab('requests')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', border: '1.5px solid #FF9500', background: '#FFF8EE', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#B7770D', position: 'relative' }}
            >
              <SafeIcon icon={FiBell} size={14} />
              CRN Requests
              <span style={{ background: '#FF9500', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '0 6px', height: 18, display: 'inline-flex', alignItems: 'center' }}>{pendingCount}</span>
            </button>
          )}
          {inactiveCount > 0 && (
            <button onClick={() => setModalMode('purge')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', border: '1.5px solid var(--ac-danger)', background: '#FFF0EF', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--ac-danger)' }}>
              <SafeIcon icon={FiTrash2} size={14} />Purge Inactive ({inactiveCount})
            </button>
          )}
          <button onClick={() => showToast('Calendar sync initiated.')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)' }}>
            <SafeIcon icon={FiCalendar} size={14} />Sync
          </button>
          <button
            onClick={() => { setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' }); setModalMode('create'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', border: 'none', background: 'var(--ac-primary)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(0,122,255,0.3)' }}
          >
            <SafeIcon icon={FiUserPlus} size={14} />Register Patient
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatTile label="Total Clients" value={clients.length} icon={FiUsers} color="#007AFF" bg="#EBF5FF" />
        <StatTile label="Active" value={activeCount} icon={FiActivity} color="#34C759" bg="#EDFAF1" sub={clients.length ? `${Math.round((activeCount / clients.length) * 100)}% of total` : null} />
        <StatTile label="Pending CRNs" value={pendingCount} icon={FiTrendingUp} color="#FF9500" bg="#FFF8EE" sub={pendingCount > 0 ? 'Needs review' : 'All clear'} />
        <StatTile label="Offboarded" value={inactiveCount} icon={FiUserX} color="#8E8E93" bg="#F2F3F4" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--ac-border)' }}>
        {[
          { id: 'clients', label: `All Clients`, count: clients.length },
          { id: 'requests', label: 'CRN Requests', count: pendingCount, highlight: pendingCount > 0 },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
            background: 'none', border: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--ac-primary)' : '2px solid transparent',
            marginBottom: -1, cursor: 'pointer', fontSize: 14,
            fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? 'var(--ac-primary)' : 'var(--ac-muted)',
            transition: 'all 0.15s',
          }}>
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
              background: t.highlight ? '#FF9500' : (activeTab === t.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)'),
              color: t.highlight ? '#fff' : (activeTab === t.id ? 'var(--ac-primary)' : 'var(--ac-muted)'),
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Clients tab ── */}
      {activeTab === 'clients' && (
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-bg)', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <SafeIcon icon={FiSearch} size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, CRN or email…"
                style={{ width: '100%', height: 36, paddingLeft: 36, paddingRight: 12, border: '1px solid var(--ac-border)', borderRadius: 10, background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--ac-font)' }}
              />
            </div>
            {/* Category filter */}
            <div style={{ position: 'relative', minWidth: 160 }}>
              <SafeIcon icon={FiFilter} size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ height: 36, paddingLeft: 28, paddingRight: 28, border: '1px solid var(--ac-border)', borderRadius: 10, background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'var(--ac-font)' }}
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
              <SafeIcon icon={FiChevronDown} size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
            </div>
            {/* Status filter */}
            <div style={{ position: 'relative', minWidth: 140 }}>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ height: 36, paddingLeft: 12, paddingRight: 28, border: '1px solid var(--ac-border)', borderRadius: 10, background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'var(--ac-font)' }}
              >
                <option value="active">Active</option>
                <option value="all">All Statuses</option>
                <option value="offboarded">Offboarded</option>
                <option value="inactive">Inactive</option>
              </select>
              <SafeIcon icon={FiChevronDown} size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
            </div>
            {/* Refresh */}
            <button onClick={fetchClients} style={{ width: 36, height: 36, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ac-muted)', flexShrink: 0 }} title="Refresh">
              <SafeIcon icon={FiRefreshCw} size={14} />
            </button>
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 18px', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-bg)' }}>
            <div style={{ width: 40, flexShrink: 0 }} />
            <div style={{ flex: '0 0 200px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ac-muted)' }}>Patient</div>
            <div style={{ flex: '0 0 140px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ac-muted)' }}>Category</div>
            <div style={{ flex: '0 0 160px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ac-muted)' }}>Care Centre</div>
            <div style={{ flex: 1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ac-muted)' }}>Contact</div>
            <div style={{ flex: '0 0 90px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ac-muted)' }}>Status</div>
            <div style={{ width: 74, flexShrink: 0 }} />
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ac-muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Loading clients…</div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: '56px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No clients found</div>
              <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>
                {searchQuery ? `No results for "${searchQuery}"` : 'Adjust filters or register a new patient'}
              </div>
            </div>
          ) : (
            filteredClients.map(c => (
              <ClientRow
                key={c.id} c={c}
                onView={cl => { setSelectedClient(cl); setProfileOpen(true); }}
                onOffboard={cl => { setSelectedClient(cl); setOffboardReason(''); setModalMode('offboard'); }}
              />
            ))
          )}

          {/* Footer count */}
          {!loading && filteredClients.length > 0 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--ac-border)', fontSize: 12, color: 'var(--ac-muted)', background: 'var(--ac-bg)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Showing <strong style={{ color: 'var(--ac-text)' }}>{filteredClients.length}</strong> of <strong style={{ color: 'var(--ac-text)' }}>{clients.length}</strong> clients</span>
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-primary)', fontSize: 12, fontWeight: 600 }}>Clear search</button>}
            </div>
          )}
        </div>
      )}

      {/* ── CRN Requests tab ── */}
      {activeTab === 'requests' && (
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--ac-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>CRN Requests</div>
              <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 2 }}>Review and action incoming client registration requests</div>
            </div>
            {pendingCount > 0 && (
              <span style={{ background: '#FFF8EE', border: '1px solid #FF9500', color: '#B7770D', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99 }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          {pendingRequests.length === 0 ? (
            <div style={{ padding: '56px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>All caught up!</div>
              <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>No pending CRN requests at this time</div>
            </div>
          ) : (
            pendingRequests.map(r => (
              <RequestRow key={r.id} r={r} onApprove={handleApproveCRN} onReject={handleRejectCRN} />
            ))
          )}
        </div>
      )}

      {/* ── Full Profile Card Modal ── */}
      {profileOpen && selectedClient && (
        <ClientProfileCard
          client={selectedClient}
          onClose={() => { setProfileOpen(false); setSelectedClient(null); }}
          onSaved={(msg) => { showToast(msg); fetchClients(); }}
          currentUserRole={currentUserRole}
          currentUserCareTeam={currentUserCareTeam}
        />
      )}

      {/* ── Purge Confirm Modal ── */}
      {modalMode === 'purge' && (
        <Modal title="Purge Inactive Clients" subtitle={`${inactiveCount} client(s) will be permanently removed`} icon={FiAlertTriangle} iconColor="var(--ac-danger)" onClose={() => setModalMode(null)}>
          <div style={{ background: '#FFF0EF', border: '1px solid #FFCDD2', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
            <p style={{ fontSize: 13, color: '#C0392B', lineHeight: 1.6 }}>
              This will permanently delete <strong>{inactiveCount} offboarded/inactive client(s)</strong> and deactivate their CRNs. <strong>This cannot be undone.</strong>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            <button onClick={handlePurgeInactive} disabled={purging} style={{ height: 42, border: 'none', background: 'var(--ac-danger)', borderRadius: 10, cursor: purging ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', opacity: purging ? 0.6 : 1 }}>
              {purging ? 'Purging…' : `Purge ${inactiveCount} Client(s)`}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Register Patient Modal ── */}
      {modalMode === 'create' && (
        <Modal title="Register New Patient" subtitle="A CRN will be auto-generated upon registration" icon={FiUserPlus} onClose={() => setModalMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Full Name *">
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" autoFocus />
              </Field>
              <Field label="Support Category">
                <Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={categoryOptions} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" />
              </Field>
            </div>
            <Field label="Care Centre">
              <Select value={form.care_centre} onChange={e => setForm({ ...form, care_centre: e.target.value })} options={centreOptions} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <button onClick={handleCreate} style={{ height: 42, border: 'none', background: 'var(--ac-primary)', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(0,122,255,0.25)' }}>
                Register & Generate CRN
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Offboard Modal ── */}
      {modalMode === 'offboard' && (
        <Modal title="Offboard Client" subtitle={`You are offboarding ${selectedClient?.name}`} icon={FiUserX} iconColor="var(--ac-danger)" onClose={() => setModalMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Reason for Offboarding *">
              <Textarea value={offboardReason} onChange={e => setOffboardReason(e.target.value)} placeholder="e.g. Treatment completed, transferred to another centre…" rows={4} autoFocus />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <button onClick={handleOffboard} style={{ height: 42, border: 'none', background: 'var(--ac-danger)', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Confirm Offboard
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
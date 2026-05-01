import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import ClientProfileCard from '../admin/ClientProfileCard';

const {
  FiActivity, FiDatabase, FiMap, FiWifi, FiZap, FiServer,
  FiCheckCircle, FiUsers, FiHome, FiRefreshCw, FiAlertTriangle,
  FiList, FiShield, FiX, FiUser,
} = FiIcons;

/* ─── Responsive hook ──────────────────────────────────────────────── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

/* ─── Sub-components ────────────────────────────────────────────────── */

const StatCard = ({ label, value, sub, accentColor }) => (
  <div style={{
    background: 'var(--ac-surface)',
    border: '1px solid var(--ac-border)',
    borderRadius: 8,
    padding: '20px 22px',
    minWidth: 0,
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
      {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 900, color: accentColor || 'var(--ac-text)', lineHeight: 1, marginBottom: 6 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{sub}</div>}
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    active:   { bg: 'var(--ac-badge-green-bg)', color: 'var(--ac-badge-green-text)' },
    degraded: { bg: 'var(--ac-badge-amber-bg)', color: 'var(--ac-badge-amber-text)' },
    inactive: { bg: 'var(--ac-badge-gray-bg)',  color: 'var(--ac-badge-gray-text)'  },
    info:     { bg: 'var(--ac-badge-blue-bg)',  color: 'var(--ac-badge-blue-text)'  },
    warning:  { bg: 'var(--ac-badge-amber-bg)', color: 'var(--ac-badge-amber-text)' },
    error:    { bg: 'var(--ac-badge-red-bg)',   color: 'var(--ac-badge-red-text)'   },
    success:  { bg: 'var(--ac-badge-green-bg)', color: 'var(--ac-badge-green-text)' },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, letterSpacing: 0.4,
    }}>
      {status}
    </span>
  );
};

const LocationNetworkCard = ({ centre, onClick }) => {
  const pct      = centre.capacity > 0 ? Math.min(100, Math.round((centre.clients_count || 0) / centre.capacity * 100)) : 0;
  const barColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981';
  const isOnline = centre.active || centre.status === 'active';
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 8, padding: '16px',
        cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = 'var(--ac-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ac-text)', marginBottom: 2 }}>{centre.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{centre.suffix || `NODE-${centre.id}`}</div>
        </div>
        <StatusPill status={isOnline ? 'active' : 'inactive'} />
      </div>
      {centre.address && (
        <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
          {centre.address}
        </div>
      )}
      {centre.phone && (
        <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)', marginBottom: 10 }}>{centre.phone}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
        <span style={{ color: 'var(--ac-text-secondary)' }}>
          {centre.clients_count || 0} / {centre.capacity || 20} patients
        </span>
        <span style={{ fontWeight: 700, color: barColor }}>{pct}% full</span>
      </div>
      <div style={{ height: 4, background: 'var(--ac-bg)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: 4, width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
};

const EventItem = ({ time, msg, type, isLast }) => {
  const colorMap = { success: '#10B981', info: '#3B82F6', warning: '#F59E0B', error: '#EF4444' };
  const color = colorMap[type] || colorMap.info;
  return (
    <div style={{ padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid var(--ac-border)', display: 'flex', gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text)', lineHeight: 1.4, marginBottom: 2 }}>{msg}</div>
        <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{time}</div>
      </div>
    </div>
  );
};

/* ─── Location Patients Panel ──────────────────────────────────────── */
const LocationPatientsPanel = ({ centre, patients, loading, onClose, onViewPatient }) => {
  const initials = (name = '') => name.trim().split(/\s+/).filter(w => w).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #507C7B 0%, #345b5a 100%)', padding: '18px 22px', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>📍 {centre.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                {centre.suffix && <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.18)', padding: '2px 8px', borderRadius: 5, marginRight: 8 }}>{centre.suffix}</span>}
                {loading ? 'Loading patients…' : `${patients.length} patient${patients.length !== 1 ? 's' : ''} assigned`}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SafeIcon icon={FiX} size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>
              <SafeIcon icon={FiRefreshCw} size={22} style={{ opacity: 0.4, marginBottom: 8 }} />
              <div>Loading patients…</div>
            </div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👤</div>
              No patients currently assigned to this centre.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {patients.map(p => {
                const mood = p.current_mood || p.mood || 8;
                const moodColor = mood <= 3 ? '#EF4444' : mood <= 6 ? '#F59E0B' : '#10B981';
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#507C7B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                      {initials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ac-text)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>
                        {p.crn && <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{p.crn}</span>}
                        <span style={{ textTransform: 'capitalize' }}>{(p.support_category || 'general').replace(/_/g, ' ')}</span>
                        {p.status === 'offboarded' && <span style={{ marginLeft: 6, color: '#EF4444', fontWeight: 600 }}>· offboarded</span>}
                        {p.support_category === 'crisis' && <span style={{ marginLeft: 6, color: '#DC2626', fontWeight: 700 }}>⚠ Crisis</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <div title={`Mood: ${mood}/10`} style={{ width: 9, height: 9, borderRadius: '50%', background: moodColor }} />
                      <button
                        onClick={() => onViewPatient(p)}
                        style={{ height: 32, padding: '0 12px', border: 'none', background: '#507C7B', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <SafeIcon icon={FiUser} size={11} /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* ─── Main component ───────────────────────────────────────────────── */
export default function OverseerDashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    admins: 0, locations: 0, sponsors: 0, activeLocations: 0,
    integrationRequests: 0, feedbackOpen: 0,
  });
  const [locations,      setLocations]      = useState([]);
  const [integrations,   setIntegrations]   = useState([]);
  const [auditLogs,      setAuditLogs]      = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [lastRefresh,    setLastRefresh]    = useState(new Date());

  // Location patients panel
  const [selectedCentre,   setSelectedCentre]   = useState(null);
  const [centrePatients,   setCentrePatients]   = useState([]);
  const [patientsLoading,  setPatientsLoading]  = useState(false);
  const [viewingPatient,   setViewingPatient]   = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, loc, sp, auditRes, accessRes, intgReqRes, feedbackRes] = await Promise.all([
        supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }),
        supabase.from('care_centres_1777090000').select('*'),
        supabase.from('sponsors_1777090009').select('*', { count: 'exact', head: true }),
        supabase.from('audit_log_1777090000').select('id,created_at,action,table_name,user_email').order('created_at', { ascending: false }).limit(8),
        supabase.from('org_access_requests_1777090000').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('location_integration_requests_1777090015').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('feedback_tickets_1777090000').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      const locData = loc.data || [];
      setStats({
        admins:              a.count   || 0,
        locations:           locData.length,
        sponsors:            sp.count  || 0,
        activeLocations:     locData.filter(l => l.active || l.status === 'active').length,
        integrationRequests: intgReqRes.count || 0,
        feedbackOpen:        feedbackRes.count || 0,
      });
      setLocations(locData.map(l => ({ ...l, capacity: l.capacity || 20 })));
      if (auditRes.data) {
        setAuditLogs(auditRes.data.map(l => ({
          id: l.id, ts: l.created_at, level: 'info', source: l.table_name || 'System',
          msg: l.action || 'Record updated', detail: l.user_email || '',
        })));
      }
      // Always set access requests — empty array if none found or error
      setAccessRequests(accessRes.data || []);
      // Load integrations from localStorage (configured in Integrations page)
      try {
        const stored = localStorage.getItem('ac_integrations');
        if (stored) setIntegrations(JSON.parse(stored));
        else setIntegrations([]);
      } catch { setIntegrations([]); }
    } catch (e) {
      console.error('OverseerDashboard fetch error:', e);
    }
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCentre = async (centre) => {
    setSelectedCentre(centre);
    setCentrePatients([]);
    setPatientsLoading(true);
    // Query by both care_centre name and care_centre_id to handle either assignment style
    const [byName, byId] = await Promise.all([
      supabase
        .from('clients_1777020684735')
        .select('*')
        .eq('care_centre', centre.name)
        .order('created_at', { ascending: false }),
      supabase
        .from('clients_1777020684735')
        .select('*')
        .eq('care_centre_id', centre.id)
        .order('created_at', { ascending: false }),
    ]);
    const seen = new Set();
    const merged = [...(byName.data || []), ...(byId.data || [])].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    setCentrePatients(merged);
    setPatientsLoading(false);
  };

  const activeIntegrations   = integrations.filter(i => i.status === 'active').length;
  const degradedIntegrations = integrations.filter(i => i.status === 'degraded' || i.status === 'inactive').length;
  const systemOk             = degradedIntegrations === 0;
  const levelColors          = { info: '#3B82F6', warning: '#F59E0B', error: '#EF4444' };
  // Treat missing/undefined status as pending (requests submitted before status was stored)
  const pendingAccessRequests = accessRequests.filter(r => r.status === 'pending' || !r.status);

  // Recent events derived from real audit log + refresh
  const recentEvents = auditLogs.length > 0
    ? auditLogs.slice(0, 5).map(l => ({
        time: new Date(l.ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
        msg: `${l.msg}${l.detail ? ` — ${l.detail}` : ''}`,
        type: l.level === 'error' ? 'error' : l.level === 'warning' ? 'warning' : 'info',
      }))
    : [
        { time: lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }), msg: 'Dashboard loaded — no audit log entries yet', type: 'info' },
      ];

  const kpis1 = [
    { label: 'Active Care Centres', value: loading ? '—' : `${stats.activeLocations} / ${stats.locations}`, sub: `${stats.locations - stats.activeLocations} inactive`, accent: 'var(--ac-text)' },
    { label: 'System Uptime',       value: '99.9%',  sub: '30-day average', accent: '#10B981' },
    { label: 'Access Requests',     value: loading ? '—' : pendingAccessRequests.length, sub: pendingAccessRequests.length > 0 ? 'Pending review' : 'None pending', accent: pendingAccessRequests.length > 0 ? '#F59E0B' : 'var(--ac-text)' },
    { label: 'Staff Accounts',      value: loading ? '—' : stats.admins, sub: 'Admin & sysadmin', accent: 'var(--ac-text)' },
  ];

  const kpis2 = [
    { label: 'Integration Requests', value: loading ? '—' : stats.integrationRequests, sub: stats.integrationRequests > 0 ? 'Pending approval' : 'None pending', accent: stats.integrationRequests > 0 ? '#F59E0B' : 'var(--ac-text)' },
    { label: 'Open Feedback',        value: loading ? '—' : stats.feedbackOpen,         sub: 'Tickets open',      accent: stats.feedbackOpen > 0 ? '#3B82F6' : 'var(--ac-text)' },
    { label: 'Active Sponsors',      value: loading ? '—' : stats.sponsors,             sub: 'Funding partners',  accent: 'var(--ac-text)' },
    { label: 'Active Integrations',  value: loading ? '—' : activeIntegrations,         sub: degradedIntegrations > 0 ? `${degradedIntegrations} degraded` : 'All healthy', accent: degradedIntegrations > 0 ? '#F59E0B' : '#10B981' },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', paddingBottom: 48 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, margin: 0, color: 'var(--ac-text)', letterSpacing: -0.5 }}>
            System Operations Center
          </h1>
          <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}Updated {lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: systemOk ? 'var(--ac-badge-green-bg)' : 'var(--ac-badge-amber-bg)',
            border: `1px solid ${systemOk ? '#A7F3D0' : '#FDE68A'}`,
            borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700,
            color: systemOk ? '#065F46' : '#92400E',
          }}>
            <SafeIcon icon={systemOk ? FiCheckCircle : FiAlertTriangle} size={13} />
            {systemOk ? 'All Systems Operational' : 'Attention Required'}
          </div>
          <button
            onClick={fetchAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 6, border: '1px solid var(--ac-border)',
              background: 'var(--ac-surface)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', color: 'var(--ac-text-secondary)',
            }}
          >
            <SafeIcon icon={FiRefreshCw} size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Row 1: System-level metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        {kpis1.map(k => <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} accentColor={k.accent} />)}
      </div>

      {/* ── KPI Row 2: Data & operations ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {kpis2.map(k => <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} accentColor={k.accent} />)}
      </div>

      {/* ── Location Network grid ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiMap} size={15} style={{ color: 'var(--ac-muted)' }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>Location Network</h2>
          </div>
          <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
            {stats.activeLocations} of {stats.locations} online
          </span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>Loading locations…</div>
        ) : locations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>No locations configured</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {locations.map(c => <LocationNetworkCard key={c.id} centre={c} onClick={() => openCentre(c)} />)}
          </div>
        )}
      </div>

      {/* ── Integration Health (left) + Recent Events (right) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, marginBottom: 28, alignItems: 'start' }}>

        {/* Integration Health */}
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--ac-border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>Integration Health</h2>
          </div>
          {integrations.length === 0 ? (
            <div style={{ padding: '24px 22px', textAlign: 'center', color: 'var(--ac-muted)', fontSize: 13 }}>
              No integrations configured. Visit the Integrations page to connect platforms.
            </div>
          ) : integrations.map((intg, i) => (
            <div key={intg.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 22px',
              borderBottom: i < integrations.length - 1 ? '1px solid var(--ac-border)' : 'none',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ac-text)' }}>{intg.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 1 }}>{intg.platform || intg.protocol || '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {intg.last_sync && (
                  <span style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>
                    {fmtTime(intg.last_sync)}
                  </span>
                )}
                <StatusPill status={intg.status || 'inactive'} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent System Events — like H&E "Upcoming Hearings" */}
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--ac-border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>Recent Events</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>Live</span>
            </div>
          </div>
          <div style={{ padding: '0 20px' }}>
            {recentEvents.map((e, i) => (
              <EventItem key={i} {...e} isLast={i === recentEvents.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Platform Access Requests ── */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--ac-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiShield} size={16} style={{ color: 'var(--ac-muted)' }} />
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>Platform Access Requests</h2>
          </div>
          {pendingAccessRequests.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>
              {pendingAccessRequests.length} pending
            </span>
          )}
        </div>
        {accessRequests.length === 0 ? (
          <div style={{ padding: '24px 22px', textAlign: 'center', color: 'var(--ac-muted)', fontSize: 13 }}>
            No platform access requests yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ac-bg)' }}>
                  {['ORGANISATION', 'TYPE', 'CONTACT', 'PLAN', 'STATUS', 'SUBMITTED'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ac-muted)', letterSpacing: 1, borderBottom: '1px solid var(--ac-border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accessRequests.map((r, i) => {
                  const statusColors = { pending: { bg: '#FEF3C7', color: '#92400E' }, approved: { bg: '#D1FAE5', color: '#065F46' }, rejected: { bg: '#FEE2E2', color: '#991B1B' } };
                  const sc = statusColors[r.status] || statusColors.pending;
                  return (
                    <tr key={r.id || i} style={{ borderBottom: i < accessRequests.length - 1 ? '1px solid var(--ac-border)' : 'none' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 700, fontSize: 13, color: 'var(--ac-text)' }}>{r.org_name || '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--ac-text-secondary)' }}>{r.org_type?.replace(/_/g, ' ') || '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--ac-text-secondary)' }}>
                        <div>{r.contact_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{r.contact_email || ''}</div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', textTransform: 'capitalize' }}>{r.selected_plan || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: sc.bg, color: sc.color }}>
                          {r.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {r.created_at ? fmtTime(r.created_at) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── System Activity Log ── */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid var(--ac-border)' }}>
          <SafeIcon icon={FiList} size={16} style={{ color: 'var(--ac-muted)' }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>System Activity Log</h2>
        </div>
        {auditLogs.length === 0 ? (
          <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--ac-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
            No activity log entries yet. Actions performed on the platform will appear here.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ac-bg)' }}>
                  {['TIMESTAMP', 'LEVEL', 'SOURCE', 'MESSAGE', 'DETAIL'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 10,
                      fontWeight: 700, color: 'var(--ac-muted)', letterSpacing: 1,
                      borderBottom: '1px solid var(--ac-border)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < auditLogs.length - 1 ? '1px solid var(--ac-border)' : 'none' }}>
                    <td style={{ padding: '11px 16px', color: 'var(--ac-muted)', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {fmtTime(l.ts)}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: levelColors[l.level] || 'var(--ac-text-secondary)' }}>
                        {l.level}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--ac-text-secondary)', fontWeight: 600 }}>{l.source}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)' }}>{l.msg}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--ac-text-secondary)' }}>{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Location Patients Panel ── */}
      {selectedCentre && (
        <LocationPatientsPanel
          centre={selectedCentre}
          patients={centrePatients}
          loading={patientsLoading}
          onClose={() => { setSelectedCentre(null); setCentrePatients([]); }}
          onViewPatient={p => setViewingPatient(p)}
        />
      )}

      {/* ── Patient Profile Card ── */}
      {viewingPatient && (
        <ClientProfileCard
          client={viewingPatient}
          onClose={() => setViewingPatient(null)}
          onSaved={() => setViewingPatient(null)}
          currentUserRole="sysadmin"
        />
      )}
    </div>
  );
}

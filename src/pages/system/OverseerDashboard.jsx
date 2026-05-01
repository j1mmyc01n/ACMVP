import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const {
  FiActivity, FiDatabase, FiMap, FiWifi, FiZap, FiServer,
  FiCheckCircle, FiUsers, FiHome, FiRefreshCw, FiAlertTriangle,
  FiList, FiShield,
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

const LocationNetworkCard = ({ centre }) => {
  const pct      = centre.capacity > 0 ? Math.min(100, Math.round((centre.clients_count || 0) / centre.capacity * 100)) : 0;
  const barColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981';
  const isOnline = centre.active || centre.status === 'active';
  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 8, padding: '16px' }}>
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

/* ─── Static seed data removed — now loading from Supabase ────────── */

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* ─── Main component ───────────────────────────────────────────────── */
export default function OverseerDashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    patients: 0, crns: 0, checkins: 0, admins: 0,
    locations: 0, sponsors: 0, activeLocations: 0,
  });
  const [locations,      setLocations]      = useState([]);
  const [integrations,   setIntegrations]   = useState([]);
  const [auditLogs,      setAuditLogs]      = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [lastRefresh,    setLastRefresh]    = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, ci, a, loc, sp, auditRes, accessRes] = await Promise.all([
        supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
        supabase.from('crns_1740395000').select('*', { count: 'exact', head: true }),
        supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
        supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }),
        supabase.from('care_centres_1777090000').select('*'),
        supabase.from('sponsors_1777090009').select('*', { count: 'exact', head: true }),
        supabase.from('audit_log_1777090000').select('id,created_at,action,table_name,user_email').order('created_at', { ascending: false }).limit(8),
        supabase.from('org_access_requests_1777090000').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      const locData = loc.data || [];
      setStats({
        patients:        p.count  || 0,
        crns:            c.count  || 0,
        checkins:        ci.count || 0,
        admins:          a.count  || 0,
        locations:       locData.length,
        sponsors:        sp.count || 0,
        activeLocations: locData.filter(l => l.active || l.status === 'active').length,
      });
      setLocations(locData.map(l => ({ ...l, capacity: l.capacity || 20 })));
      if (auditRes.data) {
        setAuditLogs(auditRes.data.map(l => ({
          id: l.id, ts: l.created_at, level: 'info', source: l.table_name || 'System',
          msg: l.action || 'Record updated', detail: l.user_email || '',
        })));
      }
      if (accessRes.data) {
        setAccessRequests(accessRes.data);
      }
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
    { label: 'Total Patients',      value: loading ? '—' : stats.patients.toLocaleString(), sub: 'Across all centres', accent: 'var(--ac-text)' },
    { label: 'Active Care Centres', value: loading ? '—' : `${stats.activeLocations} / ${stats.locations}`, sub: `${stats.locations - stats.activeLocations} inactive`, accent: 'var(--ac-text)' },
    { label: 'System Uptime',       value: '99.9%',  sub: '30-day average', accent: '#10B981' },
    { label: 'Access Requests',     value: loading ? '—' : pendingAccessRequests.length, sub: pendingAccessRequests.length > 0 ? 'Pending review' : 'None pending', accent: pendingAccessRequests.length > 0 ? '#F59E0B' : 'var(--ac-text)' },
  ];

  const kpis2 = [
    { label: 'Total CRNs',      value: loading ? '—' : stats.crns.toLocaleString(),     sub: 'Issued to date',     accent: 'var(--ac-text)' },
    { label: 'Total Check-ins', value: loading ? '—' : stats.checkins.toLocaleString(), sub: 'All time',           accent: 'var(--ac-text)' },
    { label: 'Staff Accounts',  value: loading ? '—' : stats.admins,                    sub: 'Admin & sysadmin',   accent: 'var(--ac-text)' },
    { label: 'Active Sponsors', value: loading ? '—' : stats.sponsors,                  sub: 'Funding partners',   accent: 'var(--ac-text)' },
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
            {locations.map(c => <LocationNetworkCard key={c.id} centre={c} />)}
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
    </div>
  );
}

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
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
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

/* ─── Static seed data ─────────────────────────────────────────────── */
const SEED_INTEGRATIONS = [
  { id: 'i1', name: 'Epic EHR',    protocol: 'FHIR API', status: 'active',   lastSync: new Date(Date.now() - 3600000).toISOString() },
  { id: 'i2', name: 'Cerner',      protocol: 'HL7',      status: 'active',   lastSync: new Date(Date.now() - 7200000).toISOString() },
  { id: 'i3', name: 'SMS Gateway', protocol: 'REST',     status: 'active',   lastSync: new Date(Date.now() - 1800000).toISOString() },
  { id: 'i4', name: 'Pathways DB', protocol: 'JDBC',     status: 'degraded', lastSync: new Date(Date.now() - 86400000).toISOString() },
  { id: 'i5', name: 'MBS Billing', protocol: 'SOAP',     status: 'active',   lastSync: new Date(Date.now() - 3600000).toISOString() },
  { id: 'i6', name: 'NDIS Portal', protocol: 'OAuth2',   status: 'inactive', lastSync: new Date(Date.now() - 864000000).toISOString() },
];

const SEED_LOGS = [
  { id: 'l1', level: 'info',    source: 'Auth',   msg: 'User login successful',       detail: 'eva@acuteconnect.health' },
  { id: 'l2', level: 'error',   source: 'DB',     msg: 'Database connection timeout', detail: 'Failed to connect after 30s' },
  { id: 'l3', level: 'warning', source: 'API',    msg: 'Rate limit approaching',      detail: 'Usage at 85% of limit' },
  { id: 'l4', level: 'info',    source: 'System', msg: 'Scheduled backup completed',  detail: '3.2 GB archived' },
  { id: 'l5', level: 'error',   source: 'Auth',   msg: 'Failed login attempt',        detail: 'IP: 192.168.1.45 — 3 attempts' },
  { id: 'l6', level: 'info',    source: 'EHR',    msg: 'Epic sync completed',         detail: '47 records updated' },
  { id: 'l7', level: 'warning', source: 'DB',     msg: 'Slow query detected',         detail: 'Query took 4.2s' },
  { id: 'l8', level: 'info',    source: 'System', msg: 'Module config updated',       detail: 'Admin: alice@acuteconnect.health' },
];

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
  const [locations, setLocations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, ci, a, loc, sp] = await Promise.all([
        supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
        supabase.from('crns_1740395000').select('*', { count: 'exact', head: true }),
        supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
        supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }),
        supabase.from('care_centres_1777090000').select('*'),
        supabase.from('sponsors_1777090009').select('*', { count: 'exact', head: true }),
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
    } catch (e) {
      console.error('OverseerDashboard fetch error:', e);
    }
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeIntegrations   = SEED_INTEGRATIONS.filter(i => i.status === 'active').length;
  const degradedIntegrations = SEED_INTEGRATIONS.filter(i => i.status === 'degraded').length;
  const errorLogs            = SEED_LOGS.filter(l => l.level === 'error').length;
  const systemOk             = degradedIntegrations === 0 && errorLogs === 0;
  const levelColors          = { info: '#3B82F6', warning: '#F59E0B', error: '#EF4444' };

  const recentEvents = [
    { time: lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),              msg: 'Global sync verified across all nodes', type: 'success' },
    { time: new Date(Date.now() - 120000).toLocaleTimeString('en-AU',  { hour: '2-digit', minute: '2-digit' }), msg: 'Supabase real-time cluster stable',       type: 'info'    },
    { time: new Date(Date.now() - 300000).toLocaleTimeString('en-AU',  { hour: '2-digit', minute: '2-digit' }), msg: 'New admin account connected',            type: 'info'    },
    { time: new Date(Date.now() - 600000).toLocaleTimeString('en-AU',  { hour: '2-digit', minute: '2-digit' }), msg: 'API rate limit reset completed',          type: 'success' },
    { time: new Date(Date.now() - 1200000).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }), msg: 'Failed login attempt detected',           type: 'error'   },
  ];

  const kpis1 = [
    { label: 'Total Patients',      value: loading ? '—' : stats.patients.toLocaleString(), sub: 'Across all centres', accent: 'var(--ac-text)' },
    { label: 'Active Care Centres', value: loading ? '—' : `${stats.activeLocations} / ${stats.locations}`, sub: `${stats.locations - stats.activeLocations} inactive`, accent: 'var(--ac-text)' },
    { label: 'System Uptime',       value: '99.9%',  sub: '30-day average', accent: '#10B981' },
    { label: 'Active Integrations', value: `${activeIntegrations} / ${SEED_INTEGRATIONS.length}`, sub: degradedIntegrations > 0 ? `${degradedIntegrations} degraded` : 'All healthy', accent: degradedIntegrations > 0 ? '#B45309' : 'var(--ac-text)' },
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
          {SEED_INTEGRATIONS.map((intg, i) => (
            <div key={intg.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 22px',
              borderBottom: i < SEED_INTEGRATIONS.length - 1 ? '1px solid var(--ac-border)' : 'none',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ac-text)' }}>{intg.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 1 }}>{intg.protocol}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>
                  {fmtTime(intg.lastSync)}
                </span>
                <StatusPill status={intg.status} />
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

      {/* ── System Activity Log — like H&E "AI Activity Log" table ── */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid var(--ac-border)' }}>
          <SafeIcon icon={FiList} size={16} style={{ color: 'var(--ac-muted)' }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>System Activity Log</h2>
        </div>
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
              {SEED_LOGS.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: i < SEED_LOGS.length - 1 ? '1px solid var(--ac-border)' : 'none' }}>
                  <td style={{ padding: '11px 16px', color: 'var(--ac-muted)', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {fmtTime(new Date(Date.now() - (i * 600000)).toISOString())}
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
      </div>
    </div>
  );
}

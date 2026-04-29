import React, { useState } from 'react';

// ─── Re-exports from system/ subdirectory ────────────────────────────
export { default as AuditLogPage }     from './system/AuditLogPage';
export { default as OverseerDashboard } from './system/OverseerDashboard';
export { default as LocationRollout }  from './system/LocationRollout';
export { default as LocationsPage }    from './system/LocationsPage';
export { default as UsersPage }        from './system/UsersPage';

// ─── Stub pages (placeholder until fully implemented) ─────────────────
const Stub = ({ title, icon = '🔧' }) => (
  <div style={{ padding: '0 0 32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{title}</h1>
    </div>
    <p style={{ color: 'var(--ac-muted)', fontSize: 14, marginBottom: 24 }}>This module is being configured. Check back soon.</p>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Coming Soon</div>
      <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>This feature is in active development.</div>
    </div>
  </div>
);

export const IntegrationPage     = () => <Stub title="Integrations"       icon="⚡" />;
export const SettingsPage        = () => <Stub title="Settings"            icon="⚙️" />;
export const SuperAdminPage      = () => <Stub title="Super Admin"         icon="🛡️" />;
export const FeedbackPage        = () => <Stub title="Feedback & Tickets"  icon="💬" />;
export const FeatureRequestPage  = () => <Stub title="Feature Requests"    icon="🚀" />;
export const ProviderMetricsPage = () => <Stub title="Provider Metrics"    icon="📊" />;
export const AICodeFixerPage     = () => <Stub title="AI Code Fixer"       icon="🤖" />;
export const GitHubAgentPage     = () => <Stub title="GitHub Agent"        icon="🐙" />;

// Import actual pages from system folder
export { default as IntegrationPage } from './system/IntegrationPage';

// HeatMap redirects to Comprehensive Crisis Management (merged)
export const HeatMapPage = () => {
  // This will be rendered, but the router should redirect to crisis management
  return <Stub title="Heat Map & Dispatch" icon="🗺️" />;
};

// ─── SysAdmin Dashboard ──────────────────────────────────────────────

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; }
    catch { return init; }
  });
  React.useEffect(() => localStorage.setItem(key, JSON.stringify(val)), [key, val]);
  return [val, setVal];
}

function fmt(iso) {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const SEED_USERS = [
  { id: 'u1', name: 'Alice Nguyen',  role: 'admin',    email: 'alice@acutecare.com.au', active: true,  lastLogin: '2025-05-28T08:10:00Z' },
  { id: 'u2', name: 'Ben Hartley',   role: 'admin',    email: 'ben@acutecare.com.au',   active: true,  lastLogin: '2025-05-27T14:32:00Z' },
  { id: 'u3', name: 'Cass Morgan',   role: 'staff',    email: 'cass@acutecare.com.au',  active: true,  lastLogin: '2025-05-28T09:00:00Z' },
  { id: 'u4', name: 'Dan Wu',        role: 'staff',    email: 'dan@acutecare.com.au',   active: false, lastLogin: '2025-04-10T11:00:00Z' },
  { id: 'u5', name: 'Eva Singh',     role: 'sysadmin', email: 'eva@acutecare.com.au',   active: true,  lastLogin: '2025-05-28T10:45:00Z' },
];

const SEED_INTEGRATIONS = [
  { id: 'i1', name: 'Epic EHR',    protocol: 'FHIR API', status: 'active',   lastSync: '2025-05-28T14:30:00Z' },
  { id: 'i2', name: 'Cerner',      protocol: 'HL7',      status: 'active',   lastSync: '2025-05-28T12:15:00Z' },
  { id: 'i3', name: 'SMS Gateway', protocol: 'REST',     status: 'active',   lastSync: '2025-05-28T13:00:00Z' },
  { id: 'i4', name: 'Pathways DB', protocol: 'JDBC',     status: 'degraded', lastSync: '2025-05-27T18:00:00Z' },
  { id: 'i5', name: 'MBS Billing', protocol: 'SOAP',     status: 'active',   lastSync: '2025-05-28T11:00:00Z' },
  { id: 'i6', name: 'NDIS Portal', protocol: 'OAuth2',   status: 'inactive', lastSync: '2025-05-20T09:00:00Z' },
];

const SEED_LOGS = [
  { id: 'l1', ts: '2025-05-28T14:17:00Z', level: 'info',    source: 'Auth',   msg: 'User login successful',       detail: 'User: eva@acutecare.com.au' },
  { id: 'l2', ts: '2025-05-28T14:12:00Z', level: 'error',   source: 'DB',     msg: 'Database connection timeout', detail: 'Failed to connect after 30s' },
  { id: 'l3', ts: '2025-05-28T14:07:00Z', level: 'warning', source: 'API',    msg: 'Rate limit approaching',      detail: 'Usage at 85% of limit' },
  { id: 'l4', ts: '2025-05-28T14:02:00Z', level: 'info',    source: 'System', msg: 'Scheduled backup completed',  detail: '3.2 GB archived' },
  { id: 'l5', ts: '2025-05-28T13:55:00Z', level: 'error',   source: 'Auth',   msg: 'Failed login attempt',        detail: 'IP: 192.168.1.45 — 3 attempts' },
  { id: 'l6', ts: '2025-05-28T13:44:00Z', level: 'info',    source: 'EHR',    msg: 'Epic sync completed',         detail: '47 records updated' },
  { id: 'l7', ts: '2025-05-28T13:30:00Z', level: 'warning', source: 'DB',     msg: 'Slow query detected',         detail: 'Query took 4.2s' },
  { id: 'l8', ts: '2025-05-28T13:20:00Z', level: 'info',    source: 'System', msg: 'Module config updated',       detail: 'Admin: alice@acutecare.com.au' },
];

const SEED_MODULES = [
  { id: 'm1', name: 'Client Check-In',    enabled: true  },
  { id: 'm2', name: 'Resources',          enabled: true  },
  { id: 'm3', name: 'Admin Panel',        enabled: true  },
  { id: 'm4', name: 'Integrations',       enabled: true  },
  { id: 'm5', name: 'Client Management',  enabled: true  },
  { id: 'm6', name: 'Office Management',  enabled: true  },
  { id: 'm7', name: 'Reports',            enabled: false },
  { id: 'm8', name: 'Testing & QA',       enabled: true  },
];

function StatusPill({ status }) {
  const map = {
    active:   { bg: '#D1FAE5', color: '#065F46' },
    degraded: { bg: '#FEF3C7', color: '#92400E' },
    inactive: { bg: '#F3F4F6', color: '#6B7280' },
    info:     { bg: '#DBEAFE', color: '#1E40AF' },
    warning:  { bg: '#FEF3C7', color: '#92400E' },
    error:    { bg: '#FEE2E2', color: '#991B1B' },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function Overview({ users, integrations, logs }) {
  const activeUsers = users.filter(u => u.active).length;
  const activeConns = integrations.filter(i => i.status === 'active').length;
  const degraded    = integrations.filter(i => i.status === 'degraded').length;
  const errors      = logs.filter(l => l.level === 'error').length;
  const ok          = degraded === 0 && errors === 0;

  return (
    <div className="ac-stack">
      {/* System health banner */}
      <div style={{ padding: '16px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, background: ok ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${ok ? '#A7F3D0' : '#FDE68A'}` }}>
        <span style={{ fontSize: 28 }}>{ok ? '✅' : '⚠️'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: ok ? '#065F46' : '#92400E' }}>
            {ok ? 'All systems operational' : 'Some systems need attention'}
          </div>
          <div style={{ fontSize: 12, color: ok ? '#047857' : '#B45309', marginTop: 2 }}>Last checked: {fmt(new Date().toISOString())}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="ac-grid-4">
        {[
          { label: 'Active Users',        value: activeUsers, icon: '👤', color: '#3B82F6' },
          { label: 'Active Integrations', value: activeConns, icon: '🔗', color: '#10B981' },
          { label: 'Degraded Services',   value: degraded,    icon: '⚠️', color: degraded > 0 ? '#F59E0B' : '#94A3B8' },
          { label: 'Recent Errors',       value: errors,      icon: '🔴', color: errors > 0 ? '#EF4444' : '#94A3B8' },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Integration health */}
      <div style={{ background: 'var(--ac-surface)', borderRadius: 14, border: '1px solid var(--ac-border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14 }}>Integration Health</div>
        {integrations.map((intg, i) => (
          <div key={intg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < integrations.length - 1 ? '1px solid var(--ac-border)' : 'none', background: i % 2 === 0 ? 'var(--ac-surface)' : 'var(--ac-surface-soft)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{intg.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{intg.protocol}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{fmt(intg.lastSync)}</span>
              <StatusPill status={intg.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Users({ users, setUsers }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggleActive(id) { setUsers(p => p.map(u => u.id === id ? { ...u, active: !u.active } : u)); }
  function changeRole(id, role) { setUsers(p => p.map(u => u.id === id ? { ...u, role } : u)); setEditId(null); }

  return (
    <div className="ac-stack">
      <input className="ac-input" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.map(u => (
        <div key={u.id} className="ac-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{u.email}</div>
            </div>
            <StatusPill status={u.active ? 'active' : 'inactive'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {editId === u.id ? (
              <>
                {['staff', 'admin', 'sysadmin'].map(r => (
                  <button key={r} onClick={() => changeRole(u.id, r)}
                    style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1.5px solid', cursor: 'pointer',
                      borderColor: u.role === r ? 'var(--ac-primary)' : 'var(--ac-border)',
                      background: u.role === r ? 'var(--ac-primary)' : 'transparent',
                      color: u.role === r ? '#fff' : 'var(--ac-text-secondary)',
                    }}>{r}</button>
                ))}
                <button onClick={() => setEditId(null)} style={{ fontSize: 11, color: 'var(--ac-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--ac-surface-soft)', color: 'var(--ac-text-secondary)' }}>{u.role}</span>
                <button onClick={() => setEditId(u.id)} style={{ fontSize: 12, color: 'var(--ac-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit Role</button>
                <button onClick={() => toggleActive(u.id)} style={{ fontSize: 12, color: u.active ? 'var(--ac-danger)' : 'var(--ac-success)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {u.active ? 'Deactivate' : 'Activate'}
                </button>
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 6 }}>Last login: {fmt(u.lastLogin)}</div>
        </div>
      ))}
    </div>
  );
}

function Logs({ logs, setLogs }) {
  const [search, setSearch] = useState('');
  const [level,  setLevel]  = useState('all');
  const [source, setSource] = useState('all');
  const sources = ['all', ...new Set(logs.map(l => l.source))];
  const filtered = logs.filter(l =>
    (level  === 'all' || l.level  === level) &&
    (source === 'all' || l.source === source) &&
    (l.msg.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase()))
  );

  function exportCSV() {
    const csv = ['Timestamp,Level,Source,Message,Detail',
      ...filtered.map(l => `"${fmt(l.ts)}","${l.level}","${l.source}","${l.msg}","${l.detail}"`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const lc = { info: '#1D4ED8', warning: '#B45309', error: '#DC2626' };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={exportCSV} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>Export CSV</button>
        <button onClick={() => setLogs([])} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid var(--ac-danger)', background: 'transparent', color: 'var(--ac-danger)', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
      </div>
      <input className="ac-input" placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select className="ac-input" style={{ width: 'auto' }} value={level} onChange={e => setLevel(e.target.value)}>
          {['all', 'info', 'warning', 'error'].map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="ac-input" style={{ width: 'auto' }} value={source} onChange={e => setSource(e.target.value)}>
          {sources.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--ac-muted)', alignSelf: 'center' }}>{filtered.length} entries</span>
      </div>
      {filtered.map(l => (
        <div key={l.id} className="ac-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: lc[l.level] || '#64748B' }}>{l.level}</span>
            <span style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{fmt(l.ts)}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{l.msg}</div>
          <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{l.source} — {l.detail}</div>
        </div>
      ))}
      {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ac-muted)', fontSize: 13, padding: '24px 0' }}>No entries match.</p>}
    </div>
  );
}

function Modules({ modules, setModules }) {
  return (
    <div className="ac-stack">
      {modules.map(m => (
        <div key={m.id} className="ac-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>{m.enabled ? 'Enabled' : 'Disabled'}</div>
          </div>
          <button
            onClick={() => setModules(p => p.map(x => x.id === m.id ? { ...x, enabled: !x.enabled } : x))}
            style={{ position: 'relative', display: 'inline-flex', height: 24, width: 44, alignItems: 'center', borderRadius: 12, transition: 'background 0.2s', border: 'none', cursor: 'pointer', background: m.enabled ? 'var(--ac-primary)' : 'var(--ac-border)' }}
          >
            <span style={{ display: 'inline-block', height: 18, width: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: m.enabled ? 'translateX(22px)' : 'translateX(3px)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview',   icon: '🏠' },
  { id: 'users',    label: 'Users',      icon: '👥' },
  { id: 'logs',     label: 'Logs',       icon: '📋' },
  { id: 'modules',  label: 'Modules',    icon: '🧩' },
];

export function SysAdminDashboard() {
  const [tab,     setTab]     = useState('overview');
  const [users,   setUsers]   = useLocalStorage('ac_users',   SEED_USERS);
  const [intgs]               = useLocalStorage('ac_intgs',   SEED_INTEGRATIONS);
  const [logs,    setLogs]    = useLocalStorage('ac_logs',    SEED_LOGS);
  const [modules, setModules] = useLocalStorage('ac_modules', SEED_MODULES);

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>System Dashboard</h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>Live system control and configuration</div>
      </div>

      {/* Tabs */}
      <div className="ac-tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`ac-tab${tab === t.id ? ' ac-tab-active' : ''}`}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview users={users} integrations={intgs} logs={logs} />}
      {tab === 'users'    && <Users users={users} setUsers={setUsers} />}
      {tab === 'logs'     && <Logs  logs={logs}   setLogs={setLogs}   />}
      {tab === 'modules'  && <Modules modules={modules} setModules={setModules} />}
    </div>
  );
}

export default SysAdminDashboard;

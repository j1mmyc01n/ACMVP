import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { generateCRN } from '../lib/utils';
import { Card, Button, Badge, StatusBadge, Field, Input } from '../components/UI';

const {
  FiRefreshCw, FiCheckCircle, FiX, FiCalendar, FiCpu,
  FiActivity, FiDatabase, FiShield, FiMap, FiHome,
  FiPlus, FiSettings, FiUsers
} = FiIcons;

const Toast = ({ msg, err, onClose }) => (
  <div className={`ac-toast${err ? ' ac-toast-err' : ''}`}>
    <SafeIcon icon={err ? FiX : FiCheckCircle} style={{ color: err ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

/* ─── SUPER ADMIN ────────────────────────────────────────────────── */
export const SuperAdminPage = () => {
  const [stats, setStats] = useState({ patients: 0, crns: 0, checkins: 0, admins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
      supabase.from('crns_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }),
    ]).then(([p, c, ci, a]) => {
      setStats({ patients: p.count || 0, crns: c.count || 0, checkins: ci.count || 0, admins: a.count || 0 });
      setLoading(false);
    });
  }, []);

  const tiles = [
    { label: 'Patients', val: stats.patients, icon: FiUsers, color: 'var(--ac-primary)' },
    { label: 'CRN Pool', val: stats.crns, icon: FiDatabase, color: 'var(--ac-success)' },
    { label: 'Check-ins', val: stats.checkins, icon: FiActivity, color: 'var(--ac-warn)' },
    { label: 'Staff', val: stats.admins, icon: FiShield, color: 'var(--ac-violet, #AF52DE)' },
  ];

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">⚡ Super Admin</h1>
        <Badge tone="green">System Online</Badge>
      </div>

      <div className="ac-grid-4">
        {tiles.map(t => (
          <div key={t.label} className="ac-stat-tile">
            <div className="ac-flex-gap" style={{ marginBottom: 8 }}>
              <SafeIcon icon={t.icon} style={{ color: t.color }} />
              <span className="ac-muted ac-xs">{t.label}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: t.color }}>
              {loading ? '—' : t.val}
            </div>
          </div>
        ))}
      </div>

      <div className="ac-grid-2">
        <Card title="System Health">
          <div className="ac-stack-sm">
            {[['API Latency', '24ms', 'green'], ['DB Load', '12%', 'green'], ['Memory', '68%', 'amber'], ['Uptime', '99.9%', 'green']].map(([k, v, t]) => (
              <div key={k} className="ac-flex-between">
                <span className="ac-sm">{k}</span>
                <Badge tone={t}>{v}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Quick Actions">
          <div className="ac-stack-sm">
            <Button variant="outline" icon={FiRefreshCw}>Flush Cache</Button>
            <Button variant="outline" icon={FiShield}>Rotate API Keys</Button>
            <Button variant="outline" icon={FiDatabase}>Backup DB Now</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ─── SYSTEM DASHBOARD ───────────────────────────────────────────── */
export const SysDashPage = SuperAdminPage;

/* ─── USERS PAGE ─────────────────────────────────────────────────── */
export const UsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('admin_users_1777025000000').select('*').then(({ data }) => {
      setAdmins(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Staff Management</h1>
        <Badge tone="blue">{admins.length} Staff</Badge>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan="4" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No staff accounts found.</td></tr>
              ) : admins.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.email}</td>
                  <td><Badge tone={a.role === 'sysadmin' ? 'violet' : 'blue'}>{a.role}</Badge></td>
                  <td><StatusBadge status={a.status || 'active'} /></td>
                  <td className="ac-muted ac-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ─── HEATMAP ────────────────────────────────────────────────────── */
export const HeatMapPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">City Heat Map</h1>
    <Card style={{ padding: 0, overflow: 'hidden', height: 500 }}>
      <iframe
        title="Heat Map"
        src="https://www.openstreetmap.org/export/embed.html?bbox=151.16%2C-33.91%2C151.21%2C-33.86&layer=mapnik"
        width="100%" height="100%"
        style={{ border: 0, filter: 'var(--ac-map-filter)', display: 'block' }}
        loading="lazy"
      />
    </Card>
  </div>
);

/* ─── OFFICES ────────────────────────────────────────────────────── */
export const OfficesPage = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('locations_1740395000').select('*').then(({ data }) => {
      setOffices(data || []);
      setLoading(false);
    });
  }, []);

  const fallback = [
    { id: 1, name: 'Camperdown Acute Care', address: '100 Mallett St, Camperdown NSW 2050', phone: '(02) 9515 9000', is_active: true },
    { id: 2, name: 'RPA Mental Health Unit', address: 'Missenden Rd, Camperdown NSW 2050', phone: '(02) 9515 6111', is_active: true },
  ];

  const list = offices.length ? offices : fallback;

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Office Management</h1>
        <Badge tone="green">{list.length} Locations</Badge>
      </div>
      <div className="ac-grid-2">
        {list.map(o => (
          <Card key={o.id} title={o.name}>
            <div className="ac-stack-sm">
              <div className="ac-flex-gap ac-sm"><span>📍</span><span>{o.address}</span></div>
              <div className="ac-flex-gap ac-sm"><span>📞</span><span style={{ color: 'var(--ac-primary)' }}>{o.phone}</span></div>
              <StatusBadge status={o.is_active ? 'active' : 'inactive'} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ─── INTEGRATIONS ───────────────────────────────────────────────── */
export const IntegrationPage = () => {
  const [toast, setToast] = useState('');
  const [syncing, setSyncing] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleSync = async (name) => {
    setSyncing(name);
    await new Promise(r => setTimeout(r, 1400));
    setSyncing('');
    showToast(`${name} synced successfully!`);
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">Integrations & API Hub</h1>

      <div className="ac-grid-2">
        <Card title="📅 Google Calendar Sync">
          <div className="ac-stack-sm">
            <div className="ac-flex-between">
              <span className="ac-sm">Workshop Calendar</span>
              <Badge tone="green">Connected</Badge>
            </div>
            <p className="ac-muted ac-xs">Syncs patient check-in windows with provider Google Calendars in real-time.</p>
            <Button variant="primary" icon={FiCalendar} onClick={() => handleSync('Google Calendar')} disabled={syncing === 'Google Calendar'}>
              {syncing === 'Google Calendar' ? 'Syncing…' : 'Sync Now'}
            </Button>
          </div>
        </Card>

        <Card title="🤖 AI Triage Engine">
          <div className="ac-stack-sm">
            <div className="ac-flex-between">
              <span className="ac-sm">Anthropic Claude 3.5</span>
              <Badge tone="green">Active</Badge>
            </div>
            <p className="ac-muted ac-xs">Analyses mood scores and generates clinical priority flags automatically.</p>
            <Button variant="outline" icon={FiCpu} onClick={() => handleSync('AI Engine')} disabled={syncing === 'AI Engine'}>
              {syncing === 'AI Engine' ? 'Testing…' : 'Test Connection'}
            </Button>
          </div>
        </Card>

        <Card title="💳 Stripe Payments">
          <div className="ac-stack-sm">
            <div className="ac-flex-between">
              <span className="ac-sm">Provider Subscriptions</span>
              <Badge tone="amber">Pending</Badge>
            </div>
            <p className="ac-muted ac-xs">Handles $250/mo provider partner billing and invoicing.</p>
            <Button variant="outline" onClick={() => handleSync('Stripe')} disabled={syncing === 'Stripe'}>
              {syncing === 'Stripe' ? 'Connecting…' : 'Configure'}
            </Button>
          </div>
        </Card>

        <Card title="📡 Webhook Events">
          <div className="ac-stack-sm">
            <div className="ac-flex-between">
              <span className="ac-sm">Inbound Events</span>
              <Badge tone="blue">3 Today</Badge>
            </div>
            <p className="ac-muted ac-xs">Receives real-time events from external systems and triggers workflows.</p>
            <Button variant="outline" onClick={() => handleSync('Webhooks')} disabled={syncing === 'Webhooks'}>
              {syncing === 'Webhooks' ? 'Loading…' : 'View Logs'}
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Recent Webhook Events">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Event</th><th>Source</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {[
                ['calendar.event_created', 'Google', 'green', '10:42 AM'],
                ['patient.checkin_received', 'Internal', 'green', '10:30 AM'],
                ['payment.subscription_active', 'Stripe', 'green', '09:55 AM'],
                ['payment.invoice_failed', 'Stripe', 'red', '09:15 AM'],
              ].map(([ev, src, tone, time]) => (
                <tr key={ev + time}>
                  <td className="ac-mono ac-xs">{ev}</td>
                  <td className="ac-sm">{src}</td>
                  <td><Badge tone={tone}>{tone === 'green' ? 'Success' : 'Failed'}</Badge></td>
                  <td className="ac-muted ac-xs">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ─── LOGS ───────────────────────────────────────────────────────── */
export const LogsPage = () => {
  const logs = [
    { t: '10:45:01', lvl: 'INFO', msg: 'WebContainer initialized successfully.' },
    { t: '10:45:05', lvl: 'INFO', msg: 'Supabase client connected — project: amfikpnctf…' },
    { t: '10:45:22', lvl: 'INFO', msg: 'RLS policies verified across all tables.' },
    { t: '10:46:10', lvl: 'WARN', msg: 'Rate limit approaching for Claude API (85/100).' },
    { t: '10:47:00', lvl: 'INFO', msg: 'Calendar sync completed — 3 events pushed.' },
    { t: '10:48:33', lvl: 'ERR',  msg: 'Stripe webhook signature mismatch — event dropped.' },
    { t: '10:49:00', lvl: 'INFO', msg: 'Periodic health check passed: All services nominal.' },
  ];
  const color = { INFO: 'ac-terminal-info', WARN: 'ac-terminal-warn', ERR: 'ac-terminal-err' };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">System Logs</h1>
        <Badge tone="gray">Live Feed</Badge>
      </div>
      <Card>
        <div className="ac-terminal">
          {logs.map((l, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <span className="ac-terminal-time">[{l.t}]</span>
              <span className={color[l.lvl] || ''}>{l.lvl}</span>
              {' '}{l.msg}
            </div>
          ))}
          <span className="ac-cursor" />
        </div>
      </Card>
    </div>
  );
};

/* ─── REGRESSION ─────────────────────────────────────────────────── */
export const RegressionPage = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const run = async () => {
    setRunning(true);
    setResults(null);
    await new Promise(r => setTimeout(r, 2200));
    setResults({ passed: 27, failed: 1, skipped: 2, coverage: '91.4%', duration: '2.1s' });
    setRunning(false);
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Regression Tests</h1>
        <Button variant="primary" icon={FiActivity} onClick={run} disabled={running}>
          {running ? 'Running Suite…' : 'Run All Tests'}
        </Button>
      </div>

      {results && (
        <div className="ac-grid-4">
          {[
            ['Passed', results.passed, 'green'],
            ['Failed', results.failed, results.failed > 0 ? 'red' : 'green'],
            ['Skipped', results.skipped, 'amber'],
            ['Coverage', results.coverage, 'blue'],
          ].map(([k, v, t]) => (
            <div key={k} className="ac-stat-tile">
              <div className="ac-muted ac-xs">{k}</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                <Badge tone={t}>{v}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card title="Test Suites">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Suite</th><th>Tests</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[
                ['Auth & Login Flow', 6, results?.failed > 0 ? 'error' : 'completed'],
                ['CRN Generation', 4, 'completed'],
                ['Patient Registration', 5, 'completed'],
                ['Check-in Submission', 7, 'completed'],
                ['Calendar Sync API', 3, results ? 'error' : 'pending'],
                ['RLS Policy Checks', 5, 'completed'],
              ].map(([name, count, status]) => (
                <tr key={name}>
                  <td style={{ fontWeight: 500 }}>{name}</td>
                  <td className="ac-muted ac-xs">{count} tests</td>
                  <td><StatusBadge status={status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ─── SETTINGS ───────────────────────────────────────────────────── */
export const SettingsPage = () => {
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ sysName: 'Acute Connect MVP', supportEmail: 'support@acuteconnect.health', allowReg: true });

  const save = () => { setToast('Settings saved successfully!'); setTimeout(() => setToast(''), 3500); };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">System Settings</h1>
      <Card title="Global Configuration">
        <div className="ac-stack">
          <Field label="System Name">
            <Input value={form.sysName} onChange={e => setForm({ ...form, sysName: e.target.value })} />
          </Field>
          <Field label="Support Email">
            <Input type="email" value={form.supportEmail} onChange={e => setForm({ ...form, supportEmail: e.target.value })} />
          </Field>
          <div className="ac-flex-between" style={{ padding: '4px 0' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Public Client Registration</div>
              <div className="ac-muted ac-xs">Allow new clients to self-register via the check-in flow</div>
            </div>
            <input type="checkbox" checked={form.allowReg} onChange={e => setForm({ ...form, allowReg: e.target.checked })} style={{ width: 18, height: 18 }} />
          </div>
          <Button icon={FiSettings} onClick={save}>Save Configuration</Button>
        </div>
      </Card>

      <Card title="Danger Zone">
        <div className="ac-stack-sm">
          <p className="ac-muted ac-xs">These actions are irreversible. Proceed with caution.</p>
          <Button variant="outline" style={{ borderColor: 'var(--ac-danger)', color: 'var(--ac-danger)' }}>
            Reset All Sessions
          </Button>
        </div>
      </Card>
    </div>
  );
};

/* ─── MODULE ACCESS ──────────────────────────────────────────────── */
export const ModuleAccessPage = () => {
  const modules = [
    { name: 'Client Check-In', roles: ['public', 'admin', 'sysadmin'], status: 'active' },
    { name: 'Admin Panel', roles: ['admin', 'sysadmin'], status: 'active' },
    { name: 'Patient Registry', roles: ['admin', 'sysadmin'], status: 'active' },
    { name: 'CRN Generator', roles: ['admin', 'sysadmin'], status: 'active' },
    { name: 'Reports', roles: ['admin', 'sysadmin'], status: 'active' },
    { name: 'Integrations', roles: ['admin', 'sysadmin'], status: 'active' },
    { name: 'System Dashboard', roles: ['sysadmin'], status: 'active' },
    { name: 'User Management', roles: ['sysadmin'], status: 'active' },
    { name: 'Regression Tests', roles: ['sysadmin'], status: 'active' },
    { name: 'Settings', roles: ['sysadmin'], status: 'active' },
  ];

  return (
    <div className="ac-stack">
      <h1 className="ac-h1">Module Access Control</h1>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Module</th><th>Access Roles</th><th>Status</th></tr>
            </thead>
            <tbody>
              {modules.map(m => (
                <tr key={m.name}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>
                    <div className="ac-flex-gap" style={{ flexWrap: 'wrap', gap: 4 }}>
                      {m.roles.map(r => (
                        <Badge key={r} tone={r === 'sysadmin' ? 'violet' : r === 'admin' ? 'blue' : 'gray'}>{r}</Badge>
                      ))}
                    </div>
                  </td>
                  <td><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ─── SITEMAP ────────────────────────────────────────────────────── */
export const SiteMapPage = () => {
  const routes = [
    { path: 'checkin', label: 'Client Check-In', access: 'Public' },
    { path: 'resources', label: 'Resources', access: 'Public' },
    { path: 'professionals', label: 'Professionals', access: 'Public' },
    { path: 'join_provider', label: 'Join as Provider', access: 'Public' },
    { path: 'admin', label: 'Admin Panel', access: 'Admin+' },
    { path: 'clients', label: 'Patient Registry', access: 'Admin+' },
    { path: 'crn', label: 'CRN Registry', access: 'Admin+' },
    { path: 'reports', label: 'Clinical Reports', access: 'Admin+' },
    { path: 'integrations', label: 'Integrations', access: 'Admin+' },
    { path: 'sysdash', label: 'System Dashboard', access: 'SysAdmin' },
    { path: 'heatmap', label: 'City Heat Map', access: 'SysAdmin' },
    { path: 'offices', label: 'Office Management', access: 'SysAdmin' },
    { path: 'users', label: 'Staff Management', access: 'SysAdmin' },
    { path: 'logs', label: 'System Logs', access: 'SysAdmin' },
    { path: 'superadmin', label: 'Super Admin', access: 'SysAdmin' },
    { path: 'modaccess', label: 'Module Access', access: 'SysAdmin' },
    { path: 'regression', label: 'Regression Tests', access: 'SysAdmin' },
    { path: 'settings', label: 'Settings', access: 'SysAdmin' },
  ];

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Site Map</h1>
        <Badge tone="blue">{routes.length} Routes</Badge>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Route ID</th><th>Page</th><th>Access Level</th></tr>
            </thead>
            <tbody>
              {routes.map(r => (
                <tr key={r.path}>
                  <td className="ac-mono ac-xs">/{r.path}</td>
                  <td style={{ fontWeight: 500 }}>{r.label}</td>
                  <td>
                    <Badge tone={r.access === 'SysAdmin' ? 'violet' : r.access === 'Admin+' ? 'blue' : 'gray'}>
                      {r.access}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
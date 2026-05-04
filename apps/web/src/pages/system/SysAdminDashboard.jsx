import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBell } = FiIcons;

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

const emailToDisplayName = (email = '') =>
  email.split('@')[0]?.replace(/[._-]+/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || email;

const DEFAULT_MODULES = [
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
      <div style={{ padding: '16px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, background: ok ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${ok ? '#A7F3D0' : '#FDE68A'}` }}>
        <span style={{ fontSize: 28 }}>{ok ? '✅' : '⚠️'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: ok ? '#065F46' : '#92400E' }}>
            {ok ? 'All systems operational' : 'Some systems need attention'}
          </div>
          <div style={{ fontSize: 12, color: ok ? '#047857' : '#B45309', marginTop: 2 }}>Last checked: {fmt(new Date().toISOString())}</div>
        </div>
      </div>

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

      <div style={{ background: 'var(--ac-surface)', borderRadius: 14, border: '1px solid var(--ac-border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14 }}>Integration Health</div>
        {integrations.length === 0 ? (
          <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--ac-muted)', fontSize: 13 }}>
            No integrations configured. Visit the Integrations page to connect platforms.
          </div>
        ) : integrations.map((intg, i) => (
          <div key={intg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < integrations.length - 1 ? '1px solid var(--ac-border)' : 'none', background: i % 2 === 0 ? 'var(--ac-surface)' : 'var(--ac-surface-soft)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{intg.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{intg.protocol || intg.platform}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {intg.lastSync && <span style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{fmt(intg.lastSync)}</span>}
              <StatusPill status={intg.status || 'inactive'} />
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
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ac-muted)', fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          {users.length === 0 ? 'No staff accounts found in the database.' : 'No staff match your search.'}
        </div>
      )}
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

const SYS_TABS = [
  { id: 'overview',      label: 'Overview',        icon: '🏠' },
  { id: 'users',         label: 'Users',           icon: '👥' },
  { id: 'logs',          label: 'Logs',            icon: '📋' },
  { id: 'modules',       label: 'Modules',         icon: '🧩' },
  { id: 'test_platform', label: 'Test Platform',   icon: '🧪' },
];

const TEST_LOCATIONS = [
  { name: 'Camperdown Medical Centre', suffix: 'CMP', address: '12 Church St, Camperdown NSW 2050', phone: '02 9559 1234' },
  { name: 'Newtown Support Centre',    suffix: 'NWT', address: '45 King St, Newtown NSW 2042',      phone: '02 9519 5678' },
];

const TEST_PATIENTS = [
  { name: 'Jamie Anderson',   dob: '1990-03-15', postcode: '2050', support_category: 'mental_health',   status: 'active' },
  { name: 'Riley Thompson',   dob: '1985-07-22', postcode: '2050', support_category: 'crisis',          status: 'active' },
  { name: 'Morgan Williams',  dob: '1998-11-08', postcode: '2042', support_category: 'general',         status: 'active' },
  { name: 'Casey Martinez',   dob: '1976-01-30', postcode: '2042', support_category: 'substance_abuse', status: 'active' },
];

function TestPlatformTab() {
  const [locations, setLocations] = useState([]);
  const [patients,  setPatients]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const loadExisting = useCallback(async () => {
    const [{ data: locs }, { data: pts }] = await Promise.all([
      supabase.from('care_centres_1777090000').select('id,name,suffix,address,active').order('created_at'),
      supabase.from('clients_1777020684735').select('id,crn,name,care_centre,status').order('created_at').limit(20),
    ]);
    setLocations(locs || []);
    setPatients(pts || []);
  }, []);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const createTestLocations = async () => {
    setLoading(true);
    try {
      for (const loc of TEST_LOCATIONS) {
        const exists = locations.find(l => l.name === loc.name);
        if (!exists) {
          await supabase.from('care_centres_1777090000').insert([{ ...loc, active: true, clients_count: 0 }]);
        }
      }
      await loadExisting();
      showToast('✅ Test locations created — 2 care centres added.');
    } catch (e) {
      showToast('⚠️ Error creating locations: ' + e.message);
    }
    setLoading(false);
  };

  const createTestPatients = async () => {
    setLoading(true);
    try {
      const { data: locs } = await supabase.from('care_centres_1777090000').select('id,name,suffix').order('created_at');
      if (!locs || locs.length === 0) {
        showToast('⚠️ Please create test locations first.');
        setLoading(false);
        return;
      }
      const locPairs = [
        { loc: locs[0], patients: TEST_PATIENTS.slice(0, 2) },
        { loc: locs[1] || locs[0], patients: TEST_PATIENTS.slice(2, 4) },
      ];
      for (const { loc, patients: pts } of locPairs) {
        for (const pt of pts) {
          const randomPart = Math.random().toString(36).toUpperCase().slice(-5);
          const crn = `${loc.suffix || 'TST'}-${randomPart}`;
          const exists = patients.find(p => p.name === pt.name);
          if (!exists) {
            await supabase.from('clients_1777020684735').insert([{
              ...pt, crn, care_centre: loc.name,
              mood_score: 6, created_at: new Date().toISOString(),
            }]);
          }
        }
      }
      await loadExisting();
      showToast('✅ Test patients created — 4 clients across 2 locations.');
    } catch (e) {
      showToast('⚠️ Error creating patients: ' + e.message);
    }
    setLoading(false);
  };

  const clearTestData = async () => {
    if (!window.confirm('Remove all test locations and patients? This cannot be undone.')) return;
    setLoading(true);
    try {
      const testNames = TEST_LOCATIONS.map(l => l.name);
      const { data: locs } = await supabase.from('care_centres_1777090000').select('id,name').in('name', testNames);
      if (locs && locs.length > 0) {
        const locNames = locs.map(l => l.name);
        await supabase.from('clients_1777020684735').delete().in('care_centre', locNames);
        await supabase.from('care_centres_1777090000').delete().in('id', locs.map(l => l.id));
      }
      await loadExisting();
      showToast('🗑️ Test data removed.');
    } catch (e) {
      showToast('⚠️ Error clearing data: ' + e.message);
    }
    setLoading(false);
  };

  const testLocExist = TEST_LOCATIONS.every(tl => locations.find(l => l.name === tl.name));
  const testPtsExist = TEST_PATIENTS.some(tp => patients.find(p => p.name === tp.name));

  return (
    <div className="ac-stack">
      {toast && (
        <div style={{ position: 'fixed', top: 76, right: 16, zIndex: 999, padding: '12px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderLeft: '4px solid var(--ac-success)', borderRadius: 10, boxShadow: 'var(--ac-shadow-lg)', fontSize: 14, fontWeight: 600, animation: 'slideIn 0.3s ease', maxWidth: 360 }}>
          {toast}
        </div>
      )}

      <div style={{ padding: '16px 20px', borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E40AF', marginBottom: 4 }}>🧪 Test Platform Setup</div>
        <div style={{ fontSize: 13, color: '#3B82F6' }}>
          Create 2 sample locations and patients to test the full platform flow. Data created here will appear in Crisis Management, CRM, Invoicing, and all other platform views.
        </div>
      </div>

      <div className="ac-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Step 1 — Create Test Locations</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>Creates 2 care centres: Camperdown Medical and Newtown Support.</div>
          </div>
          {testLocExist
            ? <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '4px 10px', borderRadius: 20 }}>✓ Created</span>
            : <button className="ac-btn ac-btn-primary" style={{ fontSize: 13 }} onClick={createTestLocations} disabled={loading}>
                {loading ? 'Creating…' : '+ Create Locations'}
              </button>
          }
        </div>
        {locations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {locations.map(loc => (
              <div key={loc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--ac-bg)', borderRadius: 10, border: '1px solid var(--ac-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{loc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Suffix: {loc.suffix} · {loc.address}</div>
                </div>
                <StatusPill status={loc.active ? 'active' : 'inactive'} />
              </div>
            ))}
          </div>
        )}
        {locations.length === 0 && <div style={{ fontSize: 13, color: 'var(--ac-muted)', textAlign: 'center', padding: '16px 0' }}>No locations yet — click Create Locations to start.</div>}
      </div>

      <div className="ac-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Step 2 — Create Test Patients</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>Adds 4 clients (2 per location) across different support categories.</div>
          </div>
          {testPtsExist
            ? <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '4px 10px', borderRadius: 20 }}>✓ Created</span>
            : <button className="ac-btn ac-btn-primary" style={{ fontSize: 13 }} onClick={createTestPatients} disabled={loading || locations.length === 0}>
                {loading ? 'Creating…' : '+ Create Patients'}
              </button>
          }
        </div>
        {patients.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patients.map(pt => (
              <div key={pt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--ac-bg)', borderRadius: 10, border: '1px solid var(--ac-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{pt.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>CRN: {pt.crn} · {pt.care_centre}</div>
                </div>
                <StatusPill status={pt.status || 'active'} />
              </div>
            ))}
          </div>
        )}
        {patients.length === 0 && <div style={{ fontSize: 13, color: 'var(--ac-muted)', textAlign: 'center', padding: '16px 0' }}>No patients yet — create locations first, then add patients.</div>}
      </div>

      {(testLocExist || testPtsExist) && (
        <div style={{ textAlign: 'center' }}>
          <button onClick={clearTestData} disabled={loading} style={{ background: 'none', border: '1px solid var(--ac-danger)', color: 'var(--ac-danger)', borderRadius: 10, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            🗑️ Remove All Test Data
          </button>
        </div>
      )}
    </div>
  );
}

export function SysAdminDashboard() {
  const [tab,     setTab]     = useState('overview');
  const [users,   setUsers]   = useState([]);
  const [intgs,   setIntgs]   = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [modules, setModules] = useLocalStorage('ac_modules', DEFAULT_MODULES);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setDbLoading(true);
      try {
        const [usersRes, logsRes] = await Promise.all([
          supabase.from('admin_users_1777025000000').select('id,email,role,status,last_login_at').order('created_at', { ascending: false }).limit(50),
          supabase.from('audit_logs_1777090020').select('id,created_at,action,table_name,record_id,user_email').order('created_at', { ascending: false }).limit(40),
        ]);
        if (usersRes.data) {
          setUsers(usersRes.data.map(u => ({
            id: u.id,
            name: emailToDisplayName(u.email),
            email: u.email, role: u.role || 'staff', active: u.status === 'active',
            lastLogin: u.last_login_at || u.created_at,
          })));
        }
        if (logsRes.data) {
          setLogs(logsRes.data.map(l => ({
            id: l.id, ts: l.created_at, level: 'info', source: l.table_name || 'System',
            msg: l.action || 'Record updated', detail: l.user_email || '',
          })));
        }
        const stored = localStorage.getItem('ac_integrations');
        if (stored) {
          try { setIntgs(JSON.parse(stored)); } catch { setIntgs([]); }
        }
      } catch (e) {
        console.error('SysAdmin load error:', e);
      }
      setDbLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>System Dashboard</h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>Live system control and configuration</div>
      </div>

      <div className="ac-tabs" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 2 }}>
        {SYS_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`ac-tab${tab === t.id ? ' ac-tab-active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}>
            <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {dbLoading && tab !== 'test_platform' && tab !== 'modules' && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>Loading…</div>
      )}
      {!dbLoading && tab === 'overview'      && <Overview users={users} integrations={intgs} logs={logs} />}
      {!dbLoading && tab === 'users'         && <Users users={users} setUsers={setUsers} />}
      {!dbLoading && tab === 'logs'          && <Logs  logs={logs}   setLogs={setLogs}   />}
      {tab === 'modules'       && <Modules modules={modules} setModules={setModules} />}
      {tab === 'test_platform' && <TestPlatformTab />}
    </div>
  );
}

export default SysAdminDashboard;

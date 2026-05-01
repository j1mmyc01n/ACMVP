import React, { useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Card, Badge } from '../../components/UI';

const {
  FiDatabase, FiGlobe, FiCheckCircle, FiAlertCircle, FiRefreshCw,
  FiActivity, FiServer, FiWifi, FiClock,
} = FiIcons;

const DB_TABLES = [
  { key: 'admin_users',       table: 'admin_users_1777025000000',     label: 'Admin Users' },
  { key: 'care_centres',      table: 'care_centres_1777090000',       label: 'Care Centres' },
  { key: 'clients',           table: 'clients_1777020684735',         label: 'Clients' },
  { key: 'crn_requests',      table: 'crn_requests_1777090006',       label: 'CRN Requests' },
  { key: 'crns',              table: 'crns_1740395000',               label: 'CRNs' },
  { key: 'check_ins',         table: 'check_ins_1740395000',          label: 'Check-Ins' },
  { key: 'location_instances',table: 'location_instances',            label: 'Location Instances' },
  { key: 'audit_log',         table: 'audit_log_1777090000',          label: 'Audit Log' },
  { key: 'providers',         table: 'providers_1740395000',          label: 'Providers' },
  { key: 'crisis_events',     table: 'crisis_events_1777090008',      label: 'Crisis Events' },
];

const PLATFORM_CHECKS = [
  { key: 'supabase_api', label: 'Supabase REST API', url: `${import.meta.env.VITE_SUPABASE_URL || 'https://amfikpnctfgesifwdkkd.supabase.co'}/rest/v1/` },
  { key: 'github',        label: 'GitHub API',        url: 'https://api.github.com' },
  { key: 'netlify',       label: 'Netlify API',       url: 'https://api.netlify.com' },
];

function statusBadge(status) {
  if (status === 'ok')      return { color: '#34C759', bg: '#E8FAF0', label: '✓ OK',      icon: FiCheckCircle };
  if (status === 'error')   return { color: '#FF3B30', bg: '#FDEDEC', label: '✗ Error',   icon: FiAlertCircle };
  if (status === 'testing') return { color: '#FF9500', bg: '#FEF9E7', label: '⏳ Testing', icon: FiRefreshCw };
  return                           { color: '#6B7280', bg: 'var(--ac-bg)', label: '— Untested', icon: FiActivity };
}

function fmt(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ConnectivityPage() {
  const [dbResults, setDbResults]         = useState({});
  const [platformResults, setPlatformResults] = useState({});
  const [testing, setTesting]             = useState(false);
  const [lastRun, setLastRun]             = useState(null);

  const testDatabase = useCallback(async () => {
    const results = {};
    for (const { key, table, label } of DB_TABLES) {
      setDbResults(prev => ({ ...prev, [key]: { status: 'testing', label } }));
      const start = Date.now();
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        const ms = Date.now() - start;
        results[key] = { status: error ? 'error' : 'ok', label, ms, error: error?.message };
      } catch (err) {
        results[key] = { status: 'error', label, ms: Date.now() - start, error: err.message };
      }
      setDbResults(prev => ({ ...prev, [key]: results[key] }));
    }
    return results;
  }, []);

  const testPlatform = useCallback(async () => {
    const results = {};
    for (const { key, label, url } of PLATFORM_CHECKS) {
      setPlatformResults(prev => ({ ...prev, [key]: { status: 'testing', label } }));
      const start = Date.now();
      try {
        const res = await fetch(url, { method: 'GET', mode: 'cors', signal: AbortSignal.timeout(8000) });
        const ms = Date.now() - start;
        results[key] = { status: res.ok || res.status === 401 || res.status === 200 ? 'ok' : 'error', label, ms, httpStatus: res.status };
      } catch (err) {
        results[key] = { status: 'error', label, ms: Date.now() - start, error: err.message };
      }
      setPlatformResults(prev => ({ ...prev, [key]: results[key] }));
    }
    return results;
  }, []);

  const runAll = useCallback(async () => {
    setTesting(true);
    setDbResults({});
    setPlatformResults({});
    await Promise.all([testDatabase(), testPlatform()]);
    setLastRun(new Date());
    setTesting(false);
  }, [testDatabase, testPlatform]);

  const dbList = DB_TABLES.map(({ key, label }) => ({ key, label, ...dbResults[key] }));
  const platformList = PLATFORM_CHECKS.map(({ key, label }) => ({ key, label, ...platformResults[key] }));

  const dbOk       = dbList.filter(r => r.status === 'ok').length;
  const platformOk = platformList.filter(r => r.status === 'ok').length;
  const hasResults = Object.keys(dbResults).length > 0 || Object.keys(platformResults).length > 0;

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiWifi} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Connectivity Tests</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            Test database table access and platform API reachability
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRun && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ac-muted)' }}>
              <SafeIcon icon={FiClock} size={12} />
              Last run: {lastRun.toLocaleTimeString('en-AU')}
            </div>
          )}
          <Button icon={testing ? FiRefreshCw : FiActivity} onClick={runAll} disabled={testing}>
            {testing ? 'Testing…' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Summary tiles */}
      {hasResults && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: dbOk === DB_TABLES.length ? '#E8FAF0' : '#FDEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SafeIcon icon={FiDatabase} size={22} style={{ color: dbOk === DB_TABLES.length ? '#34C759' : '#FF3B30' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Database Tables</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: dbOk === DB_TABLES.length ? '#34C759' : '#FF3B30' }}>
                {dbOk} / {DB_TABLES.length} OK
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: platformOk === PLATFORM_CHECKS.length ? '#E8FAF0' : '#FDEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SafeIcon icon={FiGlobe} size={22} style={{ color: platformOk === PLATFORM_CHECKS.length ? '#34C759' : '#FF3B30' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Platform APIs</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: platformOk === PLATFORM_CHECKS.length ? '#34C759' : '#FF3B30' }}>
                {platformOk} / {PLATFORM_CHECKS.length} Reachable
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasResults && !testing && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiWifi} size={40} style={{ opacity: 0.25, marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No tests run yet</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Click "Run All Tests" to check database and platform connectivity.</div>
            <Button icon={FiActivity} onClick={runAll}>Run All Tests</Button>
          </div>
        </Card>
      )}

      {/* Database results */}
      {(hasResults || testing) && (
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiDatabase} size={16} />
            <span>Database Tables</span>
          </div>
        } style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {dbList.map(r => {
              const sb = statusBadge(r.status);
              return (
                <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: sb.bg, borderRadius: 10, border: `1px solid ${sb.color}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafeIcon icon={FiServer} size={14} style={{ color: sb.color }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                      {r.error && <div style={{ fontSize: 10, color: '#c62828', marginTop: 2 }}>{r.error}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: sb.color }}>{sb.label}</div>
                    {r.ms != null && <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 2 }}>{fmt(r.ms)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Platform results */}
      {(hasResults || testing) && (
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiGlobe} size={16} />
            <span>Platform APIs</span>
          </div>
        }>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {platformList.map(r => {
              const sb = statusBadge(r.status);
              return (
                <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: sb.bg, borderRadius: 10, border: `1px solid ${sb.color}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafeIcon icon={FiGlobe} size={14} style={{ color: sb.color }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                      {r.httpStatus && <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 2 }}>HTTP {r.httpStatus}</div>}
                      {r.error && <div style={{ fontSize: 10, color: '#c62828', marginTop: 2 }}>{r.error}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: sb.color }}>{sb.label}</div>
                    {r.ms != null && <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 2 }}>{fmt(r.ms)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

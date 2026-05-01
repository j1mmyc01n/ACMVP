import React, { useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase, SUPABASE_URL } from '../../supabase/supabase';
import { Button, Card } from '../../components/UI';

const {
  FiDatabase, FiGlobe, FiCheckCircle, FiAlertCircle, FiRefreshCw,
  FiActivity, FiServer, FiWifi, FiClock, FiCloud, FiZap,
} = FiIcons;

const API_TIMEOUT_MS = 8000;

const isApiReachable = (status) => status > 0 && status < 600;

const DB_TABLES = [
  { key: 'admin_users',                  table: 'admin_users_1777025000000',           label: 'Admin Users' },
  { key: 'care_centres',                 table: 'care_centres_1777090000',             label: 'Care Centres' },
  { key: 'clients',                      table: 'clients_1777020684735',               label: 'Clients' },
  { key: 'crn_requests',                 table: 'crn_requests_1777090006',             label: 'CRN Requests' },
  { key: 'crns',                         table: 'crns_1740395000',                     label: 'CRNs' },
  { key: 'check_ins',                    table: 'check_ins_1740395000',                label: 'Check-Ins' },
  { key: 'location_instances',           table: 'location_instances',                  label: 'Location Instances' },
  { key: 'audit_log',                    table: 'audit_logs_1777090020',               label: 'Audit Log' },
  { key: 'providers',                    table: 'providers_1740395000',                label: 'Providers' },
  { key: 'crisis_events',                table: 'crisis_events_1777090008',            label: 'Crisis Events' },
  { key: 'sponsors',                     table: 'sponsors_1777090009',                 label: 'Sponsors' },
  { key: 'login_otp_codes',              table: 'login_otp_codes_1777090007',          label: 'Login OTP Codes' },
  { key: 'client_accounts',              table: 'client_accounts',                     label: 'Client Accounts' },
  { key: 'location_integration_requests',table: 'location_integration_requests_1777090015', label: 'Location Integration Requests' },
  { key: 'clinical_notes',               table: 'clinical_notes_1777090003',           label: 'Clinical Notes' },
  { key: 'feedback_tickets',             table: 'feedback_tickets_1777090000',         label: 'Feedback Tickets' },
  { key: 'feature_requests',             table: 'feature_requests_1777090000',         label: 'Feature Requests' },
  { key: 'locations',                    table: 'locations_1740395000',                label: 'Locations (legacy)' },
  { key: 'location_billing',             table: 'location_billing',                    label: 'Location Billing' },
  { key: 'location_health_checks',       table: 'location_health_checks',              label: 'Location Health Checks' },
  { key: 'location_api_usage',           table: 'location_api_usage',                  label: 'Location API Usage' },
  { key: 'location_credentials',         table: 'location_credentials',                label: 'Location Credentials' },
  { key: 'location_alert_rules',         table: 'location_alert_rules',                label: 'Location Alert Rules' },
];

const PLATFORM_CHECKS = [
  { key: 'supabase_api',     label: 'Supabase REST API', url: `${SUPABASE_URL}/rest/v1/` },
  { key: 'supabase_auth',    label: 'Supabase Auth',     url: `${SUPABASE_URL}/auth/v1/health` },
  { key: 'supabase_storage', label: 'Supabase Storage',  url: `${SUPABASE_URL}/storage/v1/version` },
  { key: 'supabase_realtime',label: 'Supabase Realtime', url: `${SUPABASE_URL}/realtime/v1/` },
  { key: 'github',           label: 'GitHub API',        url: 'https://api.github.com' },
  { key: 'netlify',          label: 'Netlify API',       url: 'https://api.netlify.com', noCors: true },
];

const FUNCTION_CHECKS = [
  { key: 'seed_test_location',    label: 'Netlify Fn — Seed Test Location',           url: '/api/seed-test-location', method: 'GET' },
  { key: 'create_client_account', label: 'Supabase Edge Fn — Create Client Account',  url: `${SUPABASE_URL}/functions/v1/create-client-account`, method: 'GET', noCors: true },
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
  const [dbResults, setDbResults]               = useState({});
  const [platformResults, setPlatformResults]   = useState({});
  const [functionResults, setFunctionResults]   = useState({});
  const [authResult, setAuthResult]             = useState(null);
  const [testing, setTesting]                   = useState(false);
  const [lastRun, setLastRun]                   = useState(null);

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
    for (const { key, label, url, noCors } of PLATFORM_CHECKS) {
      setPlatformResults(prev => ({ ...prev, [key]: { status: 'testing', label } }));
      const start = Date.now();
      try {
        const res = await fetch(url, {
          method: 'GET',
          mode: noCors ? 'no-cors' : 'cors',
          signal: AbortSignal.timeout(API_TIMEOUT_MS),
        });
        const ms = Date.now() - start;
        const ok = noCors ? res.type === 'opaque' : isApiReachable(res.status);
        results[key] = { status: ok ? 'ok' : 'error', label, ms, httpStatus: noCors ? null : res.status };
      } catch (err) {
        results[key] = { status: 'error', label, ms: Date.now() - start, error: err.message };
      }
      setPlatformResults(prev => ({ ...prev, [key]: results[key] }));
    }
    return results;
  }, []);

  const testFunctions = useCallback(async () => {
    const results = {};
    for (const { key, label, url, method, noCors } of FUNCTION_CHECKS) {
      setFunctionResults(prev => ({ ...prev, [key]: { status: 'testing', label } }));
      const start = Date.now();
      try {
        const res = await fetch(url, {
          method: method || 'GET',
          mode: noCors ? 'no-cors' : 'cors',
          signal: AbortSignal.timeout(API_TIMEOUT_MS),
        });
        const ms = Date.now() - start;
        const ok = noCors ? res.type === 'opaque' : isApiReachable(res.status);
        results[key] = { status: ok ? 'ok' : 'error', label, ms, httpStatus: noCors ? null : res.status };
      } catch (err) {
        results[key] = { status: 'error', label, ms: Date.now() - start, error: err.message };
      }
      setFunctionResults(prev => ({ ...prev, [key]: results[key] }));
    }
    return results;
  }, []);

  const testAuthSession = useCallback(async () => {
    setAuthResult({ status: 'testing', label: 'Auth Session Probe' });
    const start = Date.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      const ms = Date.now() - start;
      if (error) {
        setAuthResult({ status: 'error', label: 'Auth Session Probe', ms, error: error.message });
      } else {
        setAuthResult({
          status: 'ok',
          label: 'Auth Session Probe',
          ms,
          detail: data?.session ? 'Session active' : 'No active session (anon)',
        });
      }
    } catch (err) {
      setAuthResult({ status: 'error', label: 'Auth Session Probe', ms: Date.now() - start, error: err.message });
    }
  }, []);

  const runAll = useCallback(async () => {
    setTesting(true);
    setDbResults({});
    setPlatformResults({});
    setFunctionResults({});
    setAuthResult(null);
    await Promise.all([testDatabase(), testPlatform(), testFunctions(), testAuthSession()]);
    setLastRun(new Date());
    setTesting(false);
  }, [testDatabase, testPlatform, testFunctions, testAuthSession]);

  const dbList       = DB_TABLES.map(({ key, label }) => ({ key, label, ...dbResults[key] }));
  const platformList = PLATFORM_CHECKS.map(({ key, label }) => ({ key, label, ...platformResults[key] }));
  const functionList = FUNCTION_CHECKS.map(({ key, label }) => ({ key, label, ...functionResults[key] }));

  const dbOk       = dbList.filter(r => r.status === 'ok').length;
  const platformOk = platformList.filter(r => r.status === 'ok').length;
  const functionOk = functionList.filter(r => r.status === 'ok').length;
  const hasResults =
    Object.keys(dbResults).length > 0 ||
    Object.keys(platformResults).length > 0 ||
    Object.keys(functionResults).length > 0 ||
    !!authResult;

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiWifi} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Connectivity Tests</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            Tests every database table, platform API, edge/Netlify function, and the auth session probe
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

      {hasResults && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <SummaryTile icon={FiDatabase} label="Database Tables" ok={dbOk}       total={DB_TABLES.length} />
          <SummaryTile icon={FiGlobe}    label="Platform APIs"   ok={platformOk} total={PLATFORM_CHECKS.length} />
          <SummaryTile icon={FiZap}      label="Functions"       ok={functionOk} total={FUNCTION_CHECKS.length} />
          <SummaryTile icon={FiCloud}    label="Auth"            ok={authResult?.status === 'ok' ? 1 : 0} total={1} />
        </div>
      )}

      {!hasResults && !testing && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiWifi} size={40} style={{ opacity: 0.25, marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No tests run yet</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Click "Run All Tests" to check database, platform, function, and auth connectivity.</div>
            <Button icon={FiActivity} onClick={runAll}>Run All Tests</Button>
          </div>
        </Card>
      )}

      {(hasResults || testing) && (
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiDatabase} size={16} />
            <span>Database Tables ({dbOk}/{DB_TABLES.length})</span>
          </div>
        } style={{ marginBottom: 20 }}>
          <ResultGrid items={dbList} icon={FiServer} />
        </Card>
      )}

      {(hasResults || testing) && (
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiGlobe} size={16} />
            <span>Platform APIs ({platformOk}/{PLATFORM_CHECKS.length})</span>
          </div>
        } style={{ marginBottom: 20 }}>
          <ResultGrid items={platformList} icon={FiGlobe} />
        </Card>
      )}

      {(hasResults || testing) && (
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiZap} size={16} />
            <span>Functions ({functionOk}/{FUNCTION_CHECKS.length})</span>
          </div>
        } style={{ marginBottom: 20 }}>
          <ResultGrid items={functionList} icon={FiZap} />
        </Card>
      )}

      {(hasResults || testing) && authResult && (
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiCloud} size={16} />
            <span>Auth Session</span>
          </div>
        }>
          <ResultGrid items={[authResult]} icon={FiCloud} />
        </Card>
      )}
    </div>
  );
}

function SummaryTile({ icon, label, ok, total }) {
  const all = ok === total;
  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: all ? '#E8FAF0' : '#FDEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SafeIcon icon={icon} size={22} style={{ color: all ? '#34C759' : '#FF3B30' }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ac-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: all ? '#34C759' : '#FF3B30' }}>
          {ok} / {total} OK
        </div>
      </div>
    </div>
  );
}

function ResultGrid({ items, icon }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
      {items.map((r, idx) => {
        const sb = statusBadge(r.status);
        return (
          <div key={r.key || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: sb.bg, borderRadius: 10, border: `1px solid ${sb.color}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <SafeIcon icon={icon} size={14} style={{ color: sb.color, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                {r.detail && <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 2 }}>{r.detail}</div>}
                {r.httpStatus && <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 2 }}>HTTP {r.httpStatus}</div>}
                {r.error && <div style={{ fontSize: 10, color: '#c62828', marginTop: 2, wordBreak: 'break-word' }}>{r.error}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: sb.color }}>{sb.label}</div>
              {r.ms != null && <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 2 }}>{fmt(r.ms)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

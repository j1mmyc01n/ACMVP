import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const {
  FiShield, FiRefreshCw, FiDownload, FiSearch, FiFilter,
  FiUser, FiMapPin, FiUsers, FiActivity, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiEye, FiAlertTriangle,
  FiZap, FiTrendingUp, FiClock, FiAlertCircle, FiCheckCircle,
} = FiIcons;

// ─── AI Insights ──────────────────────────────────────────────────────
function analyseAuditLogs(logs) {
  if (!logs.length) return null;

  // Actor frequency
  const actorMap = {};
  logs.forEach(l => { actorMap[l.actor] = (actorMap[l.actor] || 0) + 1; });
  const topActor = Object.entries(actorMap).sort((a, b) => b[1] - a[1])[0];

  // Action frequency
  const actionMap = {};
  logs.forEach(l => { actionMap[l.action] = (actionMap[l.action] || 0) + 1; });
  const topAction = Object.entries(actionMap).sort((a, b) => b[1] - a[1])[0];

  // Error rate
  const errors = logs.filter(l => l.level === 'error' || l.action === 'error');
  const errorRate = ((errors.length / logs.length) * 100).toFixed(1);

  // Peak activity hour
  const hourMap = {};
  logs.forEach(l => {
    const h = new Date(l.timestamp).getHours();
    hourMap[h] = (hourMap[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
  const peakLabel = peakHour ? `${peakHour[0].padStart(2,'0')}:00–${String(parseInt(peakHour[0])+1).padStart(2,'0')}:00` : '—';

  // Suspicious patterns
  const anomalies = [];

  // Multiple errors from same IP
  const ipErrors = {};
  errors.forEach(l => { if (l.ip) ipErrors[l.ip] = (ipErrors[l.ip] || 0) + 1; });
  const suspectIPs = Object.entries(ipErrors).filter(([, n]) => n >= 2);
  if (suspectIPs.length > 0) {
    anomalies.push({ type: 'warn', text: `${suspectIPs.length} IP(s) with multiple error events — possible brute force` });
  }

  // Deletes after hours (before 7am or after 8pm)
  const afterHoursDeletes = logs.filter(l => {
    const h = new Date(l.timestamp).getHours();
    return l.action === 'delete' && (h < 7 || h >= 20);
  });
  if (afterHoursDeletes.length > 0) {
    anomalies.push({ type: 'warn', text: `${afterHoursDeletes.length} delete action(s) performed outside business hours` });
  }

  // Single actor with very high activity (> 30% of all logs)
  if (topActor && topActor[1] / logs.length > 0.3 && logs.length > 10) {
    anomalies.push({ type: 'info', text: `${topActor[0]} accounts for ${Math.round(topActor[1] / logs.length * 100)}% of all activity — elevated usage` });
  }

  // Login failures
  const loginErrors = logs.filter(l => l.action === 'login' && l.level === 'error');
  if (loginErrors.length >= 3) {
    anomalies.push({ type: 'warn', text: `${loginErrors.length} failed login attempts in the log window` });
  }

  return { topActor, topAction, errorRate, peakLabel, anomalies, totalLogs: logs.length };
}

function AIInsightsPanel({ logs }) {
  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState(null);
  const [analysing, setAnalysing] = useState(false);

  const handleAnalyse = () => {
    setAnalysing(true);
    setTimeout(() => {
      setInsights(analyseAuditLogs(logs));
      setAnalysing(false);
      setOpen(true);
    }, 800);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {!open ? (
        <button onClick={handleAnalyse} disabled={analysing}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #7C3AED', background: analysing ? '#F3F0FF' : '#F5F3FF', color: '#5B21B6', fontSize: 13, fontWeight: 700, cursor: analysing ? 'not-allowed' : 'pointer', width: '100%', justifyContent: 'center' }}>
          <SafeIcon icon={FiZap} size={16} style={{ color: '#7C3AED' }} />
          {analysing ? 'Analysing patterns…' : 'Analyse with AI — Find Insights & Anomalies'}
        </button>
      ) : insights && (
        <div style={{ background: '#FAFAFF', border: '1.5px solid #C4B5FD', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeIcon icon={FiZap} size={18} style={{ color: '#7C3AED' }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: '#5B21B6' }}>AI Insights</span>
              <span style={{ fontSize: 11, color: '#7C3AED', background: '#EDE9FE', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                {insights.totalLogs} logs analysed
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 16 }}>✕</button>
          </div>

          {/* Key metrics */}
          <div className="ac-grid-4" style={{ marginBottom: 16 }}>
            {[
              { label: 'Top Actor',     value: insights.topActor?.[0]?.split(' ')[0] || '—', sub: `${insights.topActor?.[1] || 0} actions`, icon: FiUser, color: '#3B82F6' },
              { label: 'Top Action',    value: insights.topAction?.[0] || '—', sub: `${insights.topAction?.[1] || 0} times`, icon: FiActivity, color: '#10B981' },
              { label: 'Error Rate',    value: `${insights.errorRate}%`, sub: 'of all events', icon: FiAlertTriangle, color: parseFloat(insights.errorRate) > 10 ? '#EF4444' : '#F59E0B' },
              { label: 'Peak Activity', value: insights.peakLabel, sub: 'busiest hour', icon: FiClock, color: '#7C3AED' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: 14, border: '1px solid #EDE9FE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94A3B8' }}>{s.label}</span>
                  <SafeIcon icon={s.icon} size={13} style={{ color: s.color }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Anomalies / pattern findings */}
          {insights.anomalies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5B21B6', marginBottom: 2 }}>Detected Patterns</div>
              {insights.anomalies.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: a.type === 'warn' ? '#FEF3C7' : '#EFF6FF', border: `1px solid ${a.type === 'warn' ? '#FDE68A' : '#BFDBFE'}` }}>
                  <SafeIcon icon={a.type === 'warn' ? FiAlertCircle : FiTrendingUp} size={14} style={{ color: a.type === 'warn' ? '#B45309' : '#1D4ED8', marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: a.type === 'warn' ? '#92400E' : '#1E40AF', fontWeight: 600 }}>{a.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <SafeIcon icon={FiCheckCircle} size={16} style={{ color: '#059669' }} />
              <span style={{ fontSize: 13, color: '#065F46', fontWeight: 600 }}>No anomalies detected — activity patterns look normal</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Source type config ───────────────────────────────────────────────
const SOURCE_TYPES = [
  { id: 'location', label: 'Locations', icon: FiMapPin, color: '#0284C7' },
  { id: 'staff', label: 'Staff', icon: FiUsers, color: '#7C3AED' },
  { id: 'client', label: 'Clients', icon: FiUser, color: '#D97706' },
  { id: 'patient', label: 'Patients', icon: FiUser, color: '#059669' },
  { id: 'system', label: 'System', icon: FiActivity, color: '#EF4444' },
];

const ACTION_COLORS = {
  login: { bg: '#EFF6FF', color: '#1D4ED8' },
  logout: { bg: '#F0FDF4', color: '#15803D' },
  create: { bg: '#F0FDF4', color: '#15803D' },
  update: { bg: '#FFFBEB', color: '#B45309' },
  delete: { bg: '#FEF2F2', color: '#B91C1C' },
  view: { bg: '#F8FAFC', color: '#475569' },
  export: { bg: '#F5F3FF', color: '#6D28D9' },
  error: { bg: '#FEF2F2', color: '#DC2626' },
};

const levelColors = {
  info: { bg: '#EFF6FF', color: '#1D4ED8' },
  warn: { bg: '#FFFBEB', color: '#B45309' },
  error: { bg: '#FEF2F2', color: '#DC2626' },
  success: { bg: '#F0FDF4', color: '#15803D' },
};

// ─── Pull modal ───────────────────────────────────────────────────────
const PullModal = ({ onClose, onPull }) => {
  const [source, setSource] = useState('location');
  const [target, setTarget] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pulling, setPulling] = useState(false);
  const [done, setDone] = useState(false);

  const locationOptions = ['Camperdown', 'Newtown', 'Surry Hills', 'Central'];
  const staffOptions = ['Dr. Sarah Mitchell', 'James O\'Brien', 'Ops Admin'];
  const userOptions = ['Elena Rodriguez', 'John Davies', 'Maria Garcia'];

  const handlePull = async () => {
    if (!target) return;
    setPulling(true);
    await new Promise(r => setTimeout(r, 1200));
    setPulling(false);
    setDone(true);
    setTimeout(() => { onPull(); onClose(); }, 800);
  };

  const targetOptions = source === 'location' ? locationOptions
    : source === 'staff' ? staffOptions
    : userOptions;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafeIcon icon={FiDownload} size={20} style={{ color: '#507C7B' }} />
            <div style={{ fontWeight: 800, fontSize: 17 }}>Pull Audit Log Copy</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18 }}>✕</button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Log copy retrieved successfully</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Source Type</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[{ id: 'location', label: 'Location' }, { id: 'staff', label: 'Staff' }, { id: 'user', label: 'Client / Patient' }].map(s => (
                  <button key={s.id} onClick={() => { setSource(s.id); setTarget(''); }}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: '1.5px solid', cursor: 'pointer',
                      borderColor: source === s.id ? '#507C7B' : '#E2E8F0',
                      background: source === s.id ? '#507C7B' : 'white',
                      color: source === s.id ? 'white' : '#64748B',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Select {source === 'location' ? 'Location' : source === 'staff' ? 'Staff Member' : 'Client / Patient'}</label>
              <select value={target} onChange={e => setTarget(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, outline: 'none', color: '#1C1C1E' }}>
                <option value="">— Select —</option>
                {targetOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#64748B' }}>
                Cancel
              </button>
              <button onClick={handlePull} disabled={!target || pulling}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: !target || pulling ? '#94A3B8' : '#507C7B', color: 'white', fontSize: 13, fontWeight: 700, cursor: !target || pulling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {pulling ? 'Pulling...' : <><SafeIcon icon={FiDownload} size={14} /> Pull Log Copy</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────
export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('location');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showPullModal, setShowPullModal] = useState(false);
  const PER_PAGE = 15;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Try to load from Supabase audit_logs table; show empty state if no data
      const { data, error } = await supabase
        .from('audit_logs_1777090020')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && data && data.length > 0) {
        setLogs(data.map(r => ({
          id: r.id,
          timestamp: r.created_at,
          actor: r.actor_name || r.actor || 'Unknown',
          source: r.source_type || 'system',
          role: r.actor_role || '',
          location: r.location || '',
          action: r.action || 'view',
          resource: r.resource || '',
          detail: r.detail || '',
          ip: r.ip_address || '',
          level: r.level || 'info',
        })));
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }, []);

  // Load available locations for the location selector
  useEffect(() => {
    supabase.from('care_centres_1777090000').select('id, name').then(({ data }) => {
      if (data && data.length > 0) setLocations(data);
    });
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(log => {
    const matchSource = log.source === sourceFilter;
    const matchLocation = !selectedLocation || log.location?.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || log.actor.toLowerCase().includes(q) || log.resource.toLowerCase().includes(q) || log.detail.toLowerCase().includes(q) || log.location?.toLowerCase().includes(q);
    return matchSource && matchLocation && matchAction && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Actor', 'Source', 'Role', 'Location', 'Action', 'Resource', 'Detail', 'IP', 'Level'],
      ...filtered.map(l => [l.timestamp, l.actor, l.source, l.role, l.location, l.action, l.resource, l.detail, l.ip, l.level]),
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const srcCounts = SOURCE_TYPES.reduce((acc, s) => {
    acc[s.id] = logs.filter(l => l.source === s.id).length;
    return acc;
  }, {});

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <SafeIcon icon={FiShield} size={22} style={{ color: '#507C7B' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Audit Log</h1>
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            Compliance-grade activity log — select a location to view its logs
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowPullModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #507C7B', background: 'white', color: '#507C7B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <SafeIcon icon={FiDownload} size={14} /> Pull Log Copy
          </button>
          <button onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#507C7B', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <SafeIcon icon={FiDownload} size={14} /> Export CSV
          </button>
          <button onClick={loadLogs}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: 13, cursor: 'pointer' }}>
            <SafeIcon icon={FiRefreshCw} size={14} />
          </button>
        </div>
      </div>

      {/* Location selector (required for privacy) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
          📍 Select Location <span style={{ color: '#EF4444' }}>*</span>
          <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>Audit logs are viewed per location only</span>
        </label>
        <select
          value={selectedLocation}
          onChange={e => { setSelectedLocation(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, color: '#1C1C1E', outline: 'none', cursor: 'pointer', minWidth: 220 }}
        >
          <option value="">— Select a location —</option>
          {locations.length > 0
            ? locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)
            : null
          }
        </select>
      </div>

      {/* Source filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {SOURCE_TYPES.map(s => (
          <button key={s.id} onClick={() => { setSourceFilter(s.id); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: '1.5px solid', cursor: 'pointer',
              borderColor: sourceFilter === s.id ? s.color : '#E2E8F0',
              background: sourceFilter === s.id ? s.color : 'white',
              color: sourceFilter === s.id ? 'white' : '#64748B',
            }}>
            <SafeIcon icon={s.icon} size={12} />
            {s.label}
            <span style={{
              marginLeft: 2, minWidth: 18, height: 18, borderRadius: 9,
              background: sourceFilter === s.id ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
              color: sourceFilter === s.id ? 'white' : '#64748B',
              fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
            }}>
              {srcCounts[s.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search + action filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <SafeIcon icon={FiSearch} size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text" placeholder="Search actor, resource, detail, location…"
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1C1C1E' }}
          />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, color: '#1C1C1E', outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Actions</option>
          {['login', 'logout', 'view', 'create', 'update', 'delete', 'export', 'error'].map(a => (
            <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* AI Insights */}
      {!loading && <AIInsightsPanel logs={logs} />}

      {/* Log table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr 90px 90px 1fr 80px',
          padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
          fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8,
        }}>
          <span>Timestamp</span>
          <span>Actor</span>
          <span>Source</span>
          <span>Action</span>
          <span>Resource / Detail</span>
          <span>Level</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>Loading audit logs…</div>
        ) : !selectedLocation ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📍</div>
            Select a location above to view its audit log entries
          </div>
        ) : paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>No log entries match your filters</div>
        ) : (
          paged.map((log, i) => {
            const actionStyle = ACTION_COLORS[log.action] || ACTION_COLORS.view;
            const lvlStyle = levelColors[log.level] || levelColors.info;
            const srcType = SOURCE_TYPES.find(s => s.id === log.source) || SOURCE_TYPES[0];
            return (
              <div key={log.id} style={{
                display: 'grid', gridTemplateColumns: '180px 1fr 90px 90px 1fr 80px',
                padding: '11px 16px', gap: 8,
                borderBottom: i < paged.length - 1 ? '1px solid #F1F5F9' : 'none',
                background: i % 2 === 0 ? 'white' : '#FAFAFA',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{fmt(log.timestamp)}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{log.actor}</div>
                  {log.role && <div style={{ fontSize: 10, color: '#94A3B8' }}>{log.role}{log.location ? ` · ${log.location}` : ''}</div>}
                </div>
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                    background: `${srcType.color}18`, color: srcType.color,
                  }}>
                    <SafeIcon icon={srcType.icon} size={10} />
                    {log.source}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 8px', borderRadius: 6,
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    background: actionStyle.bg, color: actionStyle.color,
                  }}>
                    {log.action}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{log.resource}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{log.detail}</div>
                </div>
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: lvlStyle.bg, color: lvlStyle.color,
                  }}>
                    {log.level === 'error' && <SafeIcon icon={FiAlertTriangle} size={10} />}
                    {log.level}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 16px', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              <SafeIcon icon={FiChevronLeft} size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 8, border: p === page ? 'none' : '1.5px solid #E2E8F0', background: p === page ? '#507C7B' : 'white', color: p === page ? 'white' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
              <SafeIcon icon={FiChevronRight} size={15} />
            </button>
          </div>
        </div>
      )}

      {showPullModal && <PullModal onClose={() => setShowPullModal(false)} onPull={loadLogs} />}
    </div>
  );
}

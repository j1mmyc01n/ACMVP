import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const {
  FiUsers, FiAlertTriangle, FiHeart, FiClock, FiCheckCircle,
  FiTrendingUp, FiShield, FiUserPlus, FiRefreshCw,
  FiCalendar, FiMapPin, FiActivity, FiPlus,
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

// Clean institutional KPI card (H&E LLP style)
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

const MoodTag = ({ mood }) => {
  const isHigh = mood <= 3;
  const isMid  = mood > 3 && mood <= 6;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700,
      background: isHigh ? 'var(--ac-badge-red-bg)'   : isMid ? 'var(--ac-badge-amber-bg)'  : 'var(--ac-badge-green-bg)',
      color:      isHigh ? 'var(--ac-badge-red-text)'  : isMid ? 'var(--ac-badge-amber-text)' : 'var(--ac-badge-green-text)',
    }}>
      {mood}/10
    </span>
  );
};

const StatusTag = ({ status }) => {
  const map = {
    pending:   { bg: 'var(--ac-badge-amber-bg)', color: 'var(--ac-badge-amber-text)', label: 'PENDING' },
    active:    { bg: 'var(--ac-badge-blue-bg)',  color: 'var(--ac-badge-blue-text)',  label: 'ACTIVE' },
    completed: { bg: 'var(--ac-badge-gray-bg)',  color: 'var(--ac-badge-gray-text)',  label: 'COMPLETED' },
    resolved:  { bg: 'var(--ac-badge-green-bg)', color: 'var(--ac-badge-green-text)', label: 'RESOLVED' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, letterSpacing: 0.5,
    }}>
      {s.label}
    </span>
  );
};

// Patient card shown in the pipeline
const PatientPipelineCard = ({ checkin, client }) => (
  <div style={{
    background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
    borderRadius: 8, padding: '12px 14px', marginBottom: 8,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ac-text)', lineHeight: 1.3 }}>
        {client?.name || 'Anonymous'}
      </div>
      {checkin.mood != null && <MoodTag mood={checkin.mood} />}
    </div>
    <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace', marginBottom: 4 }}>
      {checkin.crn}
    </div>
    {client?.support_category && (
      <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)', marginBottom: 4 }}>
        {client.support_category}
      </div>
    )}
    {checkin.scheduled_window && (
      <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)', marginBottom: 6 }}>
        {checkin.scheduled_window}
      </div>
    )}
    <StatusTag status={checkin.status} />
  </div>
);

// H&E LLP style schedule item (Upcoming Hearings equivalent)
const ScheduleItem = ({ time, date, type, patient, room, isLast }) => (
  <div style={{ padding: '14px 0', borderBottom: isLast ? 'none' : '1px solid var(--ac-border)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {date}
      </span>
      {room && (
        <span style={{
          fontSize: 10, fontWeight: 700, background: 'var(--ac-bg)',
          color: 'var(--ac-text-secondary)', padding: '2px 7px', borderRadius: 4,
          letterSpacing: 0.5, border: '1px solid var(--ac-border)',
        }}>
          {room}
        </span>
      )}
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ac-text)', marginBottom: 2 }}>{time}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text)', marginBottom: 2 }}>{type}</div>
    <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{patient}</div>
  </div>
);

// Location stays / occupancy card
const LocationStayCard = ({ centre }) => {
  const pct      = centre.capacity > 0 ? Math.min(100, Math.round((centre.clients_count || 0) / centre.capacity * 100)) : 0;
  const barColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981';
  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ac-text)' }}>{centre.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2, fontFamily: 'monospace' }}>{centre.suffix}</div>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: centre.active ? '#10B981' : '#94A3B8', marginTop: 4, flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
        <span style={{ color: 'var(--ac-text-secondary)' }}>{centre.clients_count || 0} / {centre.capacity || 20} patients</span>
        <span style={{ fontWeight: 700, color: barColor }}>{pct}% full</span>
      </div>
      <div style={{ height: 4, background: 'var(--ac-bg)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: 4, width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
};

/* ─── Static seed data ─────────────────────────────────────────────── */
const STAGE_DEFS = [
  { key: 'new',       label: 'NEW / INTAKE' },
  { key: 'pending',   label: 'PENDING REVIEW' },
  { key: 'active',    label: 'ACTIVE CARE' },
  { key: 'completed', label: 'COMPLETED' },
];

/* ─── Main component ───────────────────────────────────────────────── */
export default function ModernTriageDashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    activePatients: 0, highPriority: 0, avgMoodScore: 0, pendingCheckins: 0,
    sessionsCompleted: 0, retentionRate: 0, crisisOpen: 0, newToday: 0,
  });
  const [checkins,    setCheckins]    = useState([]);
  const [clients,     setClients]     = useState([]);
  const [centres,     setCentres]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeStage, setActiveStage] = useState('pending');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: cl }, { data: ci }, { data: cc }] = await Promise.all([
        supabase.from('clients_1777020684735').select('*'),
        supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('care_centres_1777090000').select('*'),
      ]);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const active   = (cl || []).filter(c => c.status === 'active').length;
      const newToday = (cl || []).filter(c => new Date(c.created_at) >= todayStart).length;
      const pending  = (ci || []).filter(c => c.status === 'pending').length;
      const highPri  = (ci || []).filter(c => (c.mood || 10) <= 3).length;
      const avgMood  = ci?.length
        ? parseFloat((ci.reduce((s, c) => s + (c.mood || 0), 0) / ci.length).toFixed(1))
        : null;

      setStats(prev => ({
        ...prev,
        activePatients: active || (cl || []).length,
        avgMoodScore:   avgMood !== null ? avgMood : prev.avgMoodScore,
        highPriority:   highPri,
        newToday,
        pendingCheckins: pending,
      }));
      setCheckins(ci || []);
      setClients(cl  || []);
      setCentres(cc  || []);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
    setLastRefresh(new Date());
    setLoading(false);
  };

  // Compute pipeline stage buckets
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const stageMap = {
    new:       checkins.filter(c => new Date(c.created_at) >= todayStart && !['completed', 'resolved'].includes(c.status)),
    pending:   checkins.filter(c => c.status === 'pending'),
    active:    checkins.filter(c => ['active', 'in_progress'].includes(c.status)),
    completed: checkins.filter(c => ['completed', 'resolved'].includes(c.status)),
  };

  const kpis1 = [
    { label: 'Active Patients',      value: loading ? '—' : stats.activePatients.toLocaleString(), sub: `+${stats.newToday} new today`,     accent: 'var(--ac-text)' },
    { label: 'High Priority Alerts', value: loading ? '—' : stats.highPriority,                    sub: 'Mood ≤ 3/10 · needs review',        accent: stats.highPriority > 0 ? '#DC2626' : 'var(--ac-text)' },
    { label: 'Avg Mood Score',       value: loading ? '—' : `${stats.avgMoodScore}/10`,             sub: 'Across recent check-ins',            accent: 'var(--ac-text)' },
    { label: 'Pending Check-ins',    value: loading ? '—' : stats.pendingCheckins,                  sub: 'Awaiting clinical review',           accent: stats.pendingCheckins > 0 ? '#B45309' : 'var(--ac-text)' },
  ];

  const kpis2 = [
    { label: 'Sessions Completed', value: stats.sessionsCompleted.toLocaleString(), sub: 'This week',           accent: 'var(--ac-text)' },
    { label: '30-Day Retention',   value: stats.retentionRate > 0 ? `${stats.retentionRate}%` : '—', sub: 'Rolling 30-day average',  accent: 'var(--ac-text)' },
    { label: 'Open Crisis Cases',  value: stats.crisisOpen || 0,                    sub: 'Escalated this month', accent: stats.crisisOpen > 0 ? '#DC2626' : 'var(--ac-text)' },
    { label: 'New Registrations',  value: loading ? '—' : stats.newToday,          sub: 'Today',                accent: 'var(--ac-text)' },
  ];

  const recentLog = checkins.slice(0, 10);

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', paddingBottom: 48 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, margin: 0, color: 'var(--ac-text)', letterSpacing: -0.5 }}>
            Clinical Triage Dashboard
          </h1>
          <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}Updated {lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {stats.highPriority > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--ac-badge-red-bg)', border: '1px solid #FECACA',
              borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#DC2626',
            }}>
              <SafeIcon icon={FiAlertTriangle} size={13} />
              {stats.highPriority} High Priority
            </div>
          )}
          <button
            onClick={fetchData}
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

      {/* ── KPI Row 1: Clinical metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        {kpis1.map(k => <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} accentColor={k.accent} />)}
      </div>

      {/* ── KPI Row 2: Performance & operations ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {kpis2.map(k => <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} accentColor={k.accent} />)}
      </div>

      {/* ── Main content: Patient Pipeline (left) + Today's Schedule (right) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, marginBottom: 28, alignItems: 'start' }}>

        {/* Patient Pipeline — like H&E "Case Pipeline" */}
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--ac-border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>Patient Pipeline</h2>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'var(--ac-text)', color: 'var(--ac-surface)', border: 'none',
              borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <SafeIcon icon={FiPlus} size={12} /> NEW CHECK-IN
            </button>
          </div>

          {/* Stage tabs — like H&E pipeline stage tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--ac-border)', padding: '0 22px', overflowX: 'auto' }}>
            {STAGE_DEFS.map(s => {
              const count = stageMap[s.key]?.length || 0;
              const isAct = activeStage === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveStage(s.key)}
                  style={{
                    padding: '12px 0', marginRight: 28, fontSize: 11, fontWeight: 700,
                    letterSpacing: 0.8, color: isAct ? 'var(--ac-text)' : 'var(--ac-muted)',
                    background: 'none', border: 'none',
                    borderBottom: isAct ? '2px solid var(--ac-text)' : '2px solid transparent',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {s.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Stage card grid */}
          <div style={{ padding: '18px 22px', minHeight: 180 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>Loading…</div>
            ) : (stageMap[activeStage] || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
                <SafeIcon icon={FiCheckCircle} size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
                <div style={{ fontSize: 13 }}>No patients in this stage</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {(stageMap[activeStage] || []).slice(0, 12).map(ci => {
                  const client = clients.find(c => c.crn === ci.crn);
                  return <PatientPipelineCard key={ci.id} checkin={ci} client={client} />;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule — like H&E "Upcoming Hearings" */}
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--ac-border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>Today's Schedule</h2>
            <SafeIcon icon={FiCalendar} size={17} style={{ color: 'var(--ac-muted)' }} />
          </div>
          <div style={{ padding: '20px', color: 'var(--ac-muted)', fontSize: 13, textAlign: 'center' }}>
            No appointments scheduled for today.
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ac-border)' }}>
            <button style={{
              width: '100%', padding: '10px', border: '1px solid var(--ac-border)',
              borderRadius: 6, background: 'none', fontSize: 11, fontWeight: 700,
              color: 'var(--ac-text-secondary)', cursor: 'pointer', letterSpacing: 0.8,
            }}>
              VIEW FULL SCHEDULE
            </button>
          </div>
        </div>
      </div>

      {/* ── Location Stays & Occupancy ── */}
      {centres.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <SafeIcon icon={FiMapPin} size={15} style={{ color: 'var(--ac-muted)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>
              Location Stays &amp; Occupancy
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {centres.map(c => <LocationStayCard key={c.id} centre={c} />)}
          </div>
        </div>
      )}

      {/* ── Clinical Activity Log — like H&E "AI Activity Log" table ── */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid var(--ac-border)' }}>
          <SafeIcon icon={FiActivity} size={16} style={{ color: 'var(--ac-muted)' }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ac-text)' }}>Clinical Activity Log</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--ac-bg)' }}>
                {['TIMESTAMP', 'ACTION TYPE', 'PATIENT / CRN', 'MOOD', 'STATUS', 'OUTCOME'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 10,
                    fontWeight: 700, color: 'var(--ac-muted)', letterSpacing: 1,
                    borderBottom: '1px solid var(--ac-border)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--ac-muted)', fontSize: 13 }}>Loading…</td></tr>
              ) : recentLog.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--ac-muted)', fontSize: 13 }}>No recent activity</td></tr>
              ) : recentLog.map((ci, i) => {
                const client = clients.find(c => c.crn === ci.crn);
                return (
                  <tr key={ci.id} style={{ borderBottom: i < recentLog.length - 1 ? '1px solid var(--ac-border)' : 'none' }}>
                    <td style={{ padding: '11px 16px', color: 'var(--ac-muted)', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {new Date(ci.created_at).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 600, fontSize: 13, color: 'var(--ac-text)' }}>Check-In</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ac-text)' }}>{client?.name || 'Anonymous'}</div>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{ci.crn}</div>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {ci.mood != null ? <MoodTag mood={ci.mood} /> : <span style={{ color: 'var(--ac-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 16px' }}><StatusTag status={ci.status} /></td>
                    <td style={{ padding: '11px 16px', color: 'var(--ac-text-secondary)', fontSize: 12 }}>
                      {['completed', 'resolved'].includes(ci.status) ? '✓ Resolved'
                        : ci.status === 'pending' ? 'Awaiting review'
                        : 'In progress'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

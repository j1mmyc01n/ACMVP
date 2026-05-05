import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { generateCRN } from '../../lib/utils';
import { logActivity } from '../../lib/audit';
import CallerScreen from './CallerScreen';
import PatientCard, { escalationBand } from '../../components/crm/PatientCard';
import PatientDrawer from '../../components/crm/PatientDrawer';
import IntakeDrawer from '../../components/crm/IntakeDrawer';

const {
  FiActivity, FiUsers, FiPhoneCall, FiCalendar, FiZap,
  FiX, FiCheckCircle, FiSearch, FiUserPlus, FiRefreshCw,
  FiCheck, FiAlertTriangle, FiTrendingUp, FiPhone, FiClock,
  FiMoreHorizontal, FiEdit2, FiMail, FiExternalLink, FiPhoneForwarded,
  FiChevronLeft, FiChevronRight, FiGrid, FiList,
  FiBarChart2, FiSettings, FiAward, FiShield, FiDatabase,
  FiUserCheck, FiClipboard,
} = FiIcons;

// ─── Constants ────────────────────────────────────────────────────────────────
const POPOUT_AUTH_KEY = 'ac_popout_auth';

const SUPPORT_CATS = {
  crisis:          { label: 'Crisis Support',   color: '#DC2626' },
  mental_health:   { label: 'Mental Health',     color: '#D97706' },
  substance_abuse: { label: 'Substance Abuse',   color: '#7C3AED' },
  housing:         { label: 'Housing Support',   color: '#059669' },
  general:         { label: 'General Support',   color: '#0284C7' },
};

const TAB_NAV = [
  { id: 'overview',  label: 'Overview',     icon: FiActivity },
  { id: 'patients',  label: 'Patients',     icon: FiUsers },
  { id: 'callqueue', label: 'Call Queue',   icon: FiPhoneCall },
  { id: 'calendar',  label: 'Calendar',     icon: FiCalendar },
  { id: 'requests',  label: 'CRN Requests', icon: FiZap },
];

const ADMIN_NAV = [
  { id: 'analytics', label: 'Analytics',       icon: FiBarChart2 },
  { id: 'staff',     label: 'Staff Activity',  icon: FiUserCheck },
  { id: 'crmsettings', label: 'CRM Settings',  icon: FiSettings },
];

const RISK_BANDS = [
  { id: 'all',       label: 'All',       color: '#64748B' },
  { id: 'critical',  label: 'Critical',  color: '#EF4444' },
  { id: 'elevated',  label: 'Elevated',  color: '#F97316' },
  { id: 'monitoring',label: 'Monitoring',color: '#F59E0B' },
  { id: 'stable',    label: 'Stable',    color: '#10B981' },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toPatient = (c) => {
  const mood = c.current_mood || c.mood || 7;
  const score = Math.max(0, Math.min(100, Math.round((10 - mood) * 10)));
  return {
    ...c,
    phone: c.phone || c.mobile,
    concern: (SUPPORT_CATS[c.support_category] || SUPPORT_CATS.general).label,
    escalation_score: score,
    ai_probability: Math.max(0, Math.min(1, (10 - mood) / 10)),
    next_appt: c.next_call_at || c.scheduled_call_at || null,
  };
};

const bandOf = (score) => {
  if (score <= 25) return 'stable';
  if (score <= 50) return 'monitoring';
  if (score <= 75) return 'elevated';
  return 'critical';
};

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
      style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9000, background: '#0F172A', color: '#fff', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}
    >
      <SafeIcon icon={FiCheckCircle} size={15} style={{ color: '#10B981' }} />
      {msg}
      <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
        <SafeIcon icon={FiX} size={13} />
      </button>
    </motion.div>
  );
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────
function KpiTile({ label, value, delta, icon: Icon, color = '#4F46E5', bg = '#EEF2FF' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SafeIcon icon={Icon} size={16} style={{ color }} />
        </div>
        {delta !== undefined && (
          <div style={{ fontSize: 11, fontWeight: 700, color: delta >= 0 ? '#10B981' : '#EF4444' }}>
            {delta >= 0 ? '+' : ''}{delta}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ patients, callLogs }) {
  const total = patients.length;
  const critical = patients.filter(p => p.escalation_score > 75).length;
  const elevated = patients.filter(p => p.escalation_score > 50 && p.escalation_score <= 75).length;
  const todayCalls = callLogs.filter(l => {
    const d = new Date(l.created_at); const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // 14-day chart data
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const intakes = patients.filter(p => { const c = new Date(p.created_at); return c >= d && c < next; }).length;
      const escalations = patients.filter(p => {
        const c = new Date(p.updated_at || p.created_at); return c >= d && c < next && p.escalation_score > 75;
      }).length;
      days.push({ day: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), intakes, escalations });
    }
    return days;
  }, [patients]);

  // Band distribution
  const bands = [
    { label: 'Critical',   count: critical,                              color: '#EF4444' },
    { label: 'Elevated',   count: elevated,                              color: '#F97316' },
    { label: 'Monitoring', count: patients.filter(p => p.escalation_score > 25 && p.escalation_score <= 50).length, color: '#F59E0B' },
    { label: 'Stable',     count: patients.filter(p => p.escalation_score <= 25).length, color: '#10B981' },
  ];

  // Top escalations
  const topEscalations = [...patients].sort((a, b) => b.escalation_score - a.escalation_score).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KpiTile label="Total Patients" value={total} icon={FiUsers} color="#4F46E5" bg="#EEF2FF" />
        <KpiTile label="Critical" value={critical} icon={FiAlertTriangle} color="#DC2626" bg="#FEF2F2" />
        <KpiTile label="Elevated" value={elevated} icon={FiTrendingUp} color="#F97316" bg="#FFF7ED" />
        <KpiTile label="Calls Today" value={todayCalls} icon={FiPhone} color="#0284C7" bg="#E0F2FE" />
      </div>

      {/* Chart + Distribution */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 280, background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>14-Day Activity</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="escalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="intakes" name="Intakes" stroke="#4F46E5" strokeWidth={2} fill="url(#intakeGrad)" />
              <Area type="monotone" dataKey="escalations" name="Escalations" stroke="#EF4444" strokeWidth={2} fill="url(#escalGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: 220, background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Risk Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bands.map(b => {
              const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
              return (
                <div key={b.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: '#475569' }}>{b.label}</span>
                    <span style={{ color: b.color }}>{b.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: b.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top escalations */}
      {topEscalations.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Highest Risk Patients</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {topEscalations.map((p, i) => {
              const band = escalationBand(p.escalation_score);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: i < topEscalations.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: band.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: band.color, flexShrink: 0 }}>
                    {(p.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{p.concern}</div>
                  </div>
                  <div style={{ padding: '3px 10px', borderRadius: 8, background: band.bg, color: band.text, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {p.escalation_score} · {band.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Patients Tab ─────────────────────────────────────────────────────────────
function PatientsTab({ patients, onView, onCall, search, setSearch }) {
  const [riskFilter, setRiskFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const filtered = useMemo(() => {
    let list = patients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q) || (p.phone || '').toLowerCase().includes(q));
    }
    if (riskFilter !== 'all') list = list.filter(p => bandOf(p.escalation_score) === riskFilter);
    return list;
  }, [patients, search, riskFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const bandCounts = useMemo(() => {
    const c = { all: patients.length, critical: 0, elevated: 0, monitoring: 0, stable: 0 };
    patients.forEach(p => { c[bandOf(p.escalation_score)] = (c[bandOf(p.escalation_score)] || 0) + 1; });
    return c;
  }, [patients]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* risk band strip */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {RISK_BANDS.map(b => (
          <button key={b.id} onClick={() => { setRiskFilter(b.id); setPage(1); }}
            style={{
              height: 32, padding: '0 14px', border: `1.5px solid ${riskFilter === b.id ? b.color : '#E2E8F0'}`,
              borderRadius: 20, background: riskFilter === b.id ? b.color : '#fff',
              color: riskFilter === b.id ? '#fff' : '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
            {b.label}
            <span style={{ background: riskFilter === b.id ? 'rgba(255,255,255,0.3)' : '#F1F5F9', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>
              {bandCounts[b.id] || 0}
            </span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={() => setViewMode('grid')} style={{ width: 32, height: 32, border: `1.5px solid ${viewMode === 'grid' ? 'var(--ac-primary)' : '#E2E8F0'}`, borderRadius: 8, background: viewMode === 'grid' ? '#EEF2FF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: viewMode === 'grid' ? '#4F46E5' : '#94A3B8' }}>
            <SafeIcon icon={FiGrid} size={14} />
          </button>
          <button onClick={() => setViewMode('list')} style={{ width: 32, height: 32, border: `1.5px solid ${viewMode === 'list' ? 'var(--ac-primary)' : '#E2E8F0'}`, borderRadius: 8, background: viewMode === 'list' ? '#EEF2FF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: viewMode === 'list' ? '#4F46E5' : '#94A3B8' }}>
            <SafeIcon icon={FiList} size={14} />
          </button>
        </div>
      </div>

      {/* grid / list */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {paginated.map((p, i) => (
            <PatientCard key={p.id} patient={p} index={i} onView={onView} onCall={onCall} />
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, overflow: 'hidden' }}>
          {paginated.map((p, i) => {
            const band = escalationBand(p.escalation_score);
            return (
              <div key={p.id} onClick={() => onView(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px', borderBottom: i < paginated.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: band.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.concern}</div>
                </div>
                <div style={{ fontSize: 12, color: band.text, fontWeight: 700, background: band.bg, padding: '3px 10px', borderRadius: 8, flexShrink: 0 }}>{p.escalation_score}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, minWidth: 90 }}>{p.phone || '—'}</div>
                <button onClick={(e) => { e.stopPropagation(); onCall(p); }}
                  style={{ width: 32, height: 32, border: 'none', background: band.bg, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: band.color, flexShrink: 0 }}>
                  <SafeIcon icon={FiPhone} size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 14, padding: '40px 0' }}>
          No patients match this filter.
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ width: 32, height: 32, border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiChevronLeft} size={15} />
          </button>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ width: 32, height: 32, border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiChevronRight} size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Call Queue Tab ───────────────────────────────────────────────────────────
function CallQueueTab({ patients, onCall }) {
  const sorted = useMemo(() =>
    [...patients].sort((a, b) => b.escalation_score - a.escalation_score),
    [patients]
  );

  const lanes = [
    { id: 'critical',   label: 'Critical',   color: '#EF4444', bg: '#FEF2F2', threshold: [76, 100] },
    { id: 'elevated',   label: 'Elevated',   color: '#F97316', bg: '#FFF7ED', threshold: [51, 75] },
    { id: 'monitoring', label: 'Monitoring', color: '#F59E0B', bg: '#FFFBEB', threshold: [26, 50] },
    { id: 'stable',     label: 'Stable',     color: '#10B981', bg: '#ECFDF5', threshold: [0, 25] },
  ];

  return (
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
      {lanes.map(lane => {
        const cards = sorted.filter(p => p.escalation_score >= lane.threshold[0] && p.escalation_score <= lane.threshold[1]);
        return (
          <div key={lane.id} style={{ minWidth: 240, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: lane.bg, borderRadius: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: lane.color }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: lane.color }}>{lane.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: lane.color, background: `${lane.color}22`, padding: '1px 8px', borderRadius: 10 }}>{cards.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.length === 0 && (
                <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '16px 0', fontStyle: 'italic' }}>Clear</div>
              )}
              {cards.map((p) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ background: '#fff', border: `1.5px solid ${lane.color}33`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}
                  whileHover={{ boxShadow: `0 4px 16px ${lane.color}22` }}
                  onClick={() => onCall(p)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: lane.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: lane.color, flexShrink: 0 }}>
                      {(p.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{p.concern}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: lane.color, flexShrink: 0 }}>{p.escalation_score}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onCall(p); }}
                    style={{ width: '100%', height: 30, border: 'none', borderRadius: 8, background: lane.color, color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <SafeIcon icon={FiPhone} size={11} />Call Now
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab({ callLogs }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1);
  // Monday-start offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay = useMemo(() => {
    const map = {};
    callLogs.forEach(log => {
      if (!log.created_at) return;
      const d = new Date(log.created_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(log);
      }
    });
    return map;
  }, [callLogs, year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const upcoming = [...callLogs]
    .filter(l => l.created_at && new Date(l.created_at) >= today)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 8);

  const monthLabel = firstDay.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 2, minWidth: 300, background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
        {/* nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiChevronLeft} size={15} />
          </button>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{monthLabel}</div>
          <button onClick={nextMonth} style={{ width: 32, height: 32, border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiChevronRight} size={15} />
          </button>
        </div>

        {/* day labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>

        {/* grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const events = eventsByDay[day] || [];
            return (
              <div key={day} style={{ minHeight: 52, borderRadius: 8, border: `1.5px solid ${isToday ? '#4F46E5' : '#F1F5F9'}`, background: isToday ? '#EEF2FF' : '#fff', padding: '4px 5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? '#4F46E5' : '#475569' }}>{day}</div>
                {events.slice(0, 2).map((ev, j) => (
                  <div key={j} style={{ height: 4, borderRadius: 2, background: ev.status === 'completed' ? '#10B981' : ev.status === 'missed' ? '#EF4444' : '#F59E0B' }} />
                ))}
                {events.length > 2 && <div style={{ fontSize: 8, color: '#94A3B8', fontWeight: 600 }}>+{events.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* upcoming */}
      <div style={{ flex: 1, minWidth: 200, background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Upcoming</div>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No upcoming calls.</div>
        ) : (
          upcoming.map((ev, i) => {
            const d = new Date(ev.created_at);
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < upcoming.length - 1 ? '1px solid #F1F5F9' : 'none', display: 'flex', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.status === 'completed' ? '#10B981' : '#F59E0B', marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{ev.client_name || 'Patient'}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── CRN Requests Tab ─────────────────────────────────────────────────────────
function RequestsTab({ requests, onApprove, onReject }) {
  const pending = requests.filter(r => r.status === 'pending' || !r.status);
  const resolved = requests.filter(r => r.status === 'approved' || r.status === 'rejected');

  const RequestRow = ({ r }) => {
    const isPending = !r.status || r.status === 'pending';
    const statusColor = r.status === 'approved' ? '#10B981' : r.status === 'rejected' ? '#EF4444' : '#F59E0B';
    const dt = r.created_at ? new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: isPending ? '#FFFBEB' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPending ? '#F59E0B' : '#94A3B8', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {((r.first_name || r.name || '?')[0] || '?').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.first_name || r.name || '—'}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{r.email || r.mobile || '—'} · {dt}</div>
        </div>
        {r.crn_issued && (
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#059669', background: '#ECFDF5', padding: '3px 9px', borderRadius: 7, fontWeight: 700, flexShrink: 0 }}>{r.crn_issued}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, textTransform: 'capitalize' }}>{r.status || 'pending'}</span>
        </div>
        {isPending && (
          <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
            <button onClick={() => onApprove(r)}
              style={{ height: 32, padding: '0 12px', border: 'none', background: '#ECFDF5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 5 }}>
              <SafeIcon icon={FiCheck} size={12} />Approve
            </button>
            <button onClick={() => onReject(r)}
              style={{ height: 32, padding: '0 12px', border: 'none', background: '#FEF2F2', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}>
              <SafeIcon icon={FiX} size={12} />Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiClock} size={14} style={{ color: '#F59E0B' }} />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>Pending</span>
          <span style={{ background: '#FFFBEB', color: '#B45309', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <div style={{ padding: '24px 20px', fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No pending requests.</div>
        ) : (
          pending.map(r => <RequestRow key={r.id} r={r} />)
        )}
      </div>

      {resolved.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiCheckCircle} size={14} style={{ color: '#10B981' }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>Resolved</span>
            <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>{resolved.length}</span>
          </div>
          {resolved.map(r => <RequestRow key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ patients, callLogs }) {
  const total = patients.length;

  // Call outcomes breakdown
  const outcomes = useMemo(() => {
    const map = {};
    callLogs.forEach(l => { const s = l.status || 'unknown'; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count, pct: callLogs.length > 0 ? Math.round((count / callLogs.length) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }, [callLogs]);

  // Mood trend (average mood per day, last 14 days)
  const moodTrend = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayPats = patients.filter(p => { const c = new Date(p.updated_at || p.created_at); return c >= d && c < next; });
      const avg = dayPats.length > 0 ? Math.round(dayPats.reduce((s, p) => s + (p.current_mood || p.mood || 7), 0) / dayPats.length * 10) / 10 : null;
      days.push({ day: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), mood: avg });
    }
    return days;
  }, [patients]);

  // Support category breakdown
  const catBreakdown = useMemo(() => {
    const map = {};
    patients.forEach(p => { const c = p.support_category || 'general'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).map(([cat, count]) => ({ cat, label: (SUPPORT_CATS[cat] || SUPPORT_CATS.general).label, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }, [patients, total]);

  const avgScore = total > 0 ? Math.round(patients.reduce((s, p) => s + (p.escalation_score || 0), 0) / total) : 0;
  const durLogs = callLogs.filter(l => l.duration_seconds);
  const avgCallDur = durLogs.length > 0
    ? Math.round(durLogs.reduce((s, l) => s + l.duration_seconds, 0) / durLogs.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* summary tiles */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KpiTile label="Avg Risk Score" value={avgScore} icon={FiActivity} color="#4F46E5" bg="#EEF2FF" />
        <KpiTile label="Total Calls" value={callLogs.length} icon={FiPhone} color="#0284C7" bg="#E0F2FE" />
        <KpiTile label="Avg Call Duration" value={avgCallDur > 0 ? `${Math.floor(avgCallDur/60)}m${avgCallDur%60}s` : '—'} icon={FiClock} color="#059669" bg="#ECFDF5" />
        <KpiTile label="Support Categories" value={catBreakdown.length} icon={FiClipboard} color="#D97706" bg="#FFFBEB" />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* mood chart */}
        <div style={{ flex: 2, minWidth: 280, background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Average Mood (14 days)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={moodTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="mood" name="Avg Mood" stroke="#10B981" strokeWidth={2} fill="url(#moodGrad)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* call outcomes */}
        <div style={{ flex: 1, minWidth: 200, background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Call Outcomes</div>
          {outcomes.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No calls recorded.</div>
          ) : outcomes.map(o => {
            const color = ['ended', 'bridged', 'completed'].includes(o.status) ? '#10B981'
              : ['abandoned', 'missed'].includes(o.status) ? '#94A3B8'
              : ['dialing', 'active', 'on_hold'].includes(o.status) ? '#F59E0B' : '#64748B';
            return (
              <div key={o.status} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ color: '#475569', textTransform: 'capitalize' }}>{o.status}</span>
                  <span style={{ color }}>{o.count} ({o.pct}%)</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${o.pct}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* support categories */}
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Support Category Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {catBreakdown.map(c => {
            const catColor = (SUPPORT_CATS[c.cat] || SUPPORT_CATS.general).color;
            return (
              <div key={c.cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 140, fontSize: 12, fontWeight: 600, color: '#475569' }}>{c.label}</div>
                <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${c.pct}%`, background: catColor, borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ minWidth: 60, textAlign: 'right', fontSize: 12, fontWeight: 700, color: catColor }}>{c.count} ({c.pct}%)</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Staff Activity Tab ────────────────────────────────────────────────────────
function StaffTab({ callLogs }) {
  const staffStats = useMemo(() => {
    const map = {};
    callLogs.forEach(l => {
      const name = l.agent_name || l.staff_name || l.initiated_by || 'Unknown';
      if (!map[name]) map[name] = { name, total: 0, completed: 0, abandoned: 0, totalDur: 0 };
      map[name].total++;
      if (['ended', 'bridged', 'completed'].includes(l.status)) { map[name].completed++; map[name].totalDur += (l.duration_seconds || 0); }
      if (['abandoned', 'missed'].includes(l.status)) map[name].abandoned++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [callLogs]);

  const recentLogs = callLogs.slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* staff leaderboard */}
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiAward} size={14} style={{ color: '#F59E0B' }} />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>Staff Call Activity</span>
        </div>
        {staffStats.length === 0 ? (
          <div style={{ padding: '24px 20px', fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No call data yet.</div>
        ) : (
          <div>
            {/* header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px', gap: 12, padding: '10px 20px', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #F1F5F9' }}>
              <span>Staff Member</span><span style={{ textAlign: 'center' }}>Total</span><span style={{ textAlign: 'center' }}>Completed</span><span style={{ textAlign: 'center' }}>Abandoned</span><span style={{ textAlign: 'right' }}>Avg Duration</span>
            </div>
            {staffStats.map((s, i) => {
              const avgDur = s.completed > 0 ? Math.round(s.totalDur / s.completed) : 0;
              const compRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
              const abandoned = s.abandoned;
              return (
                <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px', gap: 12, padding: '12px 20px', borderBottom: i < staffStats.length - 1 ? '1px solid #F8FAFC' : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#4F46E5', flexShrink: 0 }}>
                      {s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{compRate}% completion rate</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{s.total}</div>
                  <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#10B981' }}>{s.completed}</div>
                  <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>{abandoned}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>{avgDur > 0 ? `${Math.floor(avgDur/60)}m ${avgDur%60}s` : '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* recent call log */}
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiClock} size={14} style={{ color: '#64748B' }} />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>Recent Call Log</span>
        </div>
        {recentLogs.length === 0 ? (
          <div style={{ padding: '24px 20px', fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No calls yet.</div>
        ) : recentLogs.map((log, i) => {
          const statusColor = ['ended', 'bridged', 'completed'].includes(log.status) ? '#10B981'
            : ['abandoned', 'missed'].includes(log.status) ? '#94A3B8'
            : ['dialing', 'active', 'on_hold'].includes(log.status) ? '#F59E0B' : '#64748B';
          const dt = log.created_at ? new Date(log.created_at) : null;
          const dur = log.duration_seconds ? `${Math.floor(log.duration_seconds/60)}m ${log.duration_seconds%60}s` : '—';
          return (
            <div key={log.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', borderBottom: i < recentLogs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{log.client_name || log.client_id || '—'}</div>
                {log.notes && <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.notes}</div>}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>{dt ? dt.toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, minWidth: 50, textAlign: 'right' }}>{dur}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: 'capitalize', flexShrink: 0, minWidth: 70, textAlign: 'right' }}>{log.status || 'unknown'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CRM Settings Tab ─────────────────────────────────────────────────────────
const THRESHOLD_KEY = 'ac_crm_thresholds';
function CRMSettingsTab({ role, careTeam }) {
  const [thresholds, setThresholds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(THRESHOLD_KEY)) || { critical: 75, elevated: 50, monitoring: 25 }; } catch { return { critical: 75, elevated: 50, monitoring: 25 }; }
  });
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const save = () => {
    localStorage.setItem(THRESHOLD_KEY, JSON.stringify(thresholds));
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 2500);
  };

  const DB_TABLES = [
    { label: 'Patients',     table: 'clients_1777020684735',   icon: FiShield },
    { label: 'Call logs',    table: 'call_logs_1777090000',    icon: FiPhone },
    { label: 'CRN requests', table: 'crn_requests_1777090006', icon: FiZap },
    { label: 'Check-ins',    table: 'check_ins_1740395000',    icon: FiClipboard },
  ];
  const [dbStatus, setDbStatus] = useState(() => Object.fromEntries(DB_TABLES.map(t => [t.table, 'loading'])));

  useEffect(() => {
    let cancelled = false;
    Promise.all(DB_TABLES.map(async ({ table }) => {
      try {
        const { error } = await supabase.from(table).select('id', { head: true });
        return [table, error ? 'error' : 'ok'];
      } catch { return [table, 'error']; }
    })).then(results => {
      if (!cancelled) setDbStatus(Object.fromEntries(results));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Session Info — sysadmin only */}
      {role === 'sysadmin' && (
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiShield} size={14} style={{ color: '#4F46E5' }} />Session Info
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Role', value: role },
            { label: 'Care Team / Centre', value: careTeam || 'All centres' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, minWidth: 120 }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Escalation thresholds */}
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Escalation Thresholds</div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>Scores above each value trigger that risk band.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'monitoring', label: 'Monitoring (above)', color: '#F59E0B' },
            { key: 'elevated',   label: 'Elevated (above)',   color: '#F97316' },
            { key: 'critical',   label: 'Critical (above)',   color: '#EF4444' },
          ].map(t => (
            <div key={t.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</label>
                <span style={{ fontSize: 13, fontWeight: 800, color: t.color }}>{thresholds[t.key]}</span>
              </div>
              <input type="range" min={0} max={100} value={thresholds[t.key]}
                onChange={e => setThresholds(th => ({ ...th, [t.key]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: t.color }} />
            </div>
          ))}
        </div>
        <button onClick={save} style={{ marginTop: 16, height: 38, padding: '0 20px', border: 'none', borderRadius: 10, background: saved ? '#10B981' : '#4F46E5', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <SafeIcon icon={saved ? FiCheckCircle : FiDatabase} size={14} />
          {saved ? 'Saved!' : 'Save Thresholds'}
        </button>
      </div>

      {/* Data info */}
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiDatabase} size={14} style={{ color: '#4F46E5' }} />Table Access Status
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>Verifies read access to each table (RLS-aware).</div>
        {DB_TABLES.map(r => {
          const st = dbStatus[r.table];
          const dot = st === 'ok' ? '#10B981' : st === 'error' ? '#F97316' : '#F59E0B';
          const stLabel = st === 'ok' ? 'Accessible' : st === 'error' ? 'Restricted / Error' : 'Checking…';
          return (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, marginBottom: 8 }}>
              <SafeIcon icon={r.icon} size={13} style={{ color: '#4F46E5', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{r.label}</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#0F172A', marginTop: 2 }}>{r.table}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, animation: st === 'loading' ? 'pulse 1s infinite' : 'none' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: dot }}>{stLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CRM Sidebar ──────────────────────────────────────────────────────────────
const SIDEBAR_KEY = 'ac_crm_sidebar_collapsed';
function CRMSidebar({ tab, setTab, pendingCount }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
  });

  const toggle = () => setCollapsed(c => {
    const next = !c;
    try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
    return next;
  });

  const w = collapsed ? 52 : 210;

  const navBtn = (id, active) => ({
    width: '100%', height: 38, border: 'none', borderRadius: 9, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
    padding: collapsed ? '0' : '0 12px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    background: active ? '#EEF2FF' : 'transparent',
    color: active ? '#4F46E5' : '#64748B',
    fontWeight: active ? 700 : 500, fontSize: 13, textAlign: 'left',
    transition: 'all 0.13s', position: 'relative',
  });

  return (
    <div style={{ width: w, flexShrink: 0, background: '#fff', borderRight: '1px solid #E8EAED', display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'auto', transition: 'width 0.2s ease' }}>
      {/* collapse toggle */}
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: '10px 8px 4px' }}>
        <button onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ width: 28, height: 28, border: '1.5px solid #E2E8F0', borderRadius: 7, background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
          <SafeIcon icon={collapsed ? FiChevronRight : FiChevronLeft} size={13} />
        </button>
      </div>

      <div style={{ padding: collapsed ? '4px 6px' : '6px 12px' }}>
        {!collapsed && <div style={{ fontSize: 9, fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 1, padding: '0 4px', marginBottom: 4 }}>Navigation</div>}
        {TAB_NAV.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            aria-label={t.id === 'requests' && pendingCount > 0 ? `${t.label}, ${pendingCount} pending` : t.label}
            aria-current={tab === t.id ? 'page' : undefined}
            style={navBtn(t.id, tab === t.id)}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent'; }}>
            <SafeIcon icon={t.icon} size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{t.label}</span>}
            {!collapsed && t.id === 'requests' && pendingCount > 0 && (
              <span aria-hidden="true" style={{ background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>{pendingCount}</span>
            )}
            {collapsed && t.id === 'requests' && pendingCount > 0 && (
              <span aria-hidden="true" style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: collapsed ? '4px 6px' : '6px 12px', borderTop: '1px solid #F1F5F9', marginTop: 4 }}>
        {!collapsed && <div style={{ fontSize: 9, fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 1, padding: '0 4px', marginBottom: 4 }}>Admin</div>}
        {ADMIN_NAV.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            aria-label={t.label}
            aria-current={tab === t.id ? 'page' : undefined}
            style={navBtn(t.id, tab === t.id)}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent'; }}>
            <SafeIcon icon={t.icon} size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{t.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main CRMPage ─────────────────────────────────────────────────────────────
export default function CRMPage({ role, careTeam, currentUserRole, currentUserCareTeam }) {
  role = role ?? currentUserRole;
  careTeam = careTeam ?? currentUserCareTeam;
  const [tab, setTab] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [drawerPatient, setDrawerPatient] = useState(null);
  const [showIntake, setShowIntake] = useState(false);

  const showToast = useCallback((msg) => setToast(msg), []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pRes, logsRes, reqRes] = await Promise.all([
      supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false }),
      supabase.from('call_logs_1777090000').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('crn_requests_1777090006').select('*').order('created_at', { ascending: false }),
    ]);
    setPatients((pRes.data || []).map(toPatient));
    setCallLogs(logsRes.data || []);
    setRequests(reqRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async (r) => {
    const crn = generateCRN();
    const { error } = await supabase.from('crn_requests_1777090006').update({ status: 'approved', crn_issued: crn }).eq('id', r.id);
    if (!error) {
      setRequests(rs => rs.map(x => x.id === r.id ? { ...x, status: 'approved', crn_issued: crn } : x));
      showToast(`CRN ${crn} issued for ${r.first_name || r.name}.`);
      logActivity?.({ action: 'crn_approved', detail: `request_id=${r.id} crn=${crn}` });
    }
  };

  const handleReject = async (r) => {
    const { error } = await supabase.from('crn_requests_1777090006').update({ status: 'rejected' }).eq('id', r.id);
    if (!error) {
      setRequests(rs => rs.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x));
      showToast('Request rejected.');
    }
  };

  const handlePopOut = () => {
    const blob = JSON.stringify({ role, careTeam, ts: Date.now() });
    localStorage.setItem(POPOUT_AUTH_KEY, blob);
    window.open('/?standalone=crm', 'crm-popout', 'width=1200,height=800,resizable=yes,noopener');
  };

  const pendingCount = requests.filter(r => !r.status || r.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC', minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8EAED', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 14, height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiUsers} size={15} style={{ color: '#4F46E5' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>Patient CRM</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{patients.length} patients · {careTeam || 'All centres'}</div>
          </div>
        </div>

        {/* search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <SafeIcon icon={FiSearch} size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients…"
            style={{ width: '100%', height: 34, border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '0 10px 0 32px', fontSize: 12, background: '#F8FAFC', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={fetchAll} title="Refresh" style={{ width: 34, height: 34, border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <SafeIcon icon={FiRefreshCw} size={13} />
          </button>
          <button onClick={handlePopOut} style={{ height: 34, padding: '0 14px', border: '1.5px solid #4F46E5', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SafeIcon icon={FiExternalLink} size={13} />Bridge
          </button>
          <button onClick={() => setShowIntake(true)} style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 8, background: '#4F46E5', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SafeIcon icon={FiUserPlus} size={13} />Add Patient
          </button>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <CRMSidebar tab={tab} setTab={setTab} pendingCount={pendingCount} />

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94A3B8', fontSize: 14 }}>
              <SafeIcon icon={FiRefreshCw} size={18} style={{ marginRight: 10 }} />Loading…
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {tab === 'overview'    && <OverviewTab patients={patients} callLogs={callLogs} />}
                {tab === 'patients'    && <PatientsTab patients={patients} onView={setDrawerPatient} onCall={setActiveCall} search={search} setSearch={setSearch} />}
                {tab === 'callqueue'   && <CallQueueTab patients={patients} onCall={setActiveCall} />}
                {tab === 'calendar'    && <CalendarTab callLogs={callLogs} />}
                {tab === 'requests'    && <RequestsTab requests={requests} onApprove={handleApprove} onReject={handleReject} />}
                {tab === 'analytics'   && <AnalyticsTab patients={patients} callLogs={callLogs} />}
                {tab === 'staff'       && <StaffTab callLogs={callLogs} />}
                {tab === 'crmsettings' && <CRMSettingsTab role={role} careTeam={careTeam} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Overlays */}
      {activeCall && (
        <CallerScreen
          client={activeCall}
          onClose={() => setActiveCall(null)}
          role={role}
          careTeam={careTeam}
        />
      )}

      {drawerPatient && (
        <PatientDrawer
          patient={drawerPatient}
          onClose={() => setDrawerPatient(null)}
          onCall={(p) => { setDrawerPatient(null); setActiveCall(p); }}
        />
      )}

      {showIntake && (
        <IntakeDrawer
          careTeam={careTeam}
          onClose={() => setShowIntake(false)}
          onSuccess={(newPatient) => {
            setPatients(ps => [toPatient(newPatient), ...ps]);
            showToast(`Patient ${newPatient.name} created.`);
          }}
        />
      )}

      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

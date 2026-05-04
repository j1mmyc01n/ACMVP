import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { Button } from './UI';

const {
  FiAlertTriangle, FiUserCheck, FiShield, FiCheckCircle,
  FiPhone, FiUser, FiMapPin,
  FiMove, FiSearch, FiFilter, FiWifi, FiWifiOff,
  FiActivity, FiAlertCircle, FiTrendingUp, FiExternalLink,
  FiClock, FiList,
} = FiIcons;

const CRISIS_TABLE = 'crisis_events_1777090008';

const SEVERITY_META = {
  critical: { color: '#be123c', label: 'CRITICAL',    scoreRange: [85, 100] },
  high:     { color: '#dc2626', label: 'HIGH RISK',   scoreRange: [66, 84] },
  medium:   { color: '#ea580c', label: 'ELEVATED',    scoreRange: [21, 65] }, // spans monitoring+elevated; split by score
  low:      { color: '#059669', label: 'STABLE',      scoreRange: [0,  20] },
};

const COLUMNS = [
  { id: 'stable',     label: 'Stable',     scoreRange: '0 – 20',   color: '#059669', icon: FiActivity,      group: 'clinical' },
  { id: 'monitoring', label: 'Monitoring', scoreRange: '21 – 45',  color: '#d97706', icon: FiTrendingUp,    group: 'clinical' },
  { id: 'elevated',   label: 'Elevated',   scoreRange: '46 – 65',  color: '#ea580c', icon: FiAlertCircle,   group: 'clinical' },
  { id: 'high_risk',  label: 'High Risk',  scoreRange: '66 – 84',  color: '#dc2626', icon: FiAlertTriangle, group: 'clinical' },
  { id: 'critical',   label: 'Critical',   scoreRange: '85 – 100', color: '#be123c', icon: FiAlertTriangle, group: 'clinical' },
  { id: 'assigned',   label: 'Assigned',   scoreRange: null,        color: '#7C3AED', icon: FiUserCheck,     group: 'workflow' },
  { id: 'dispatched', label: 'Dispatched', scoreRange: null,        color: '#007AFF', icon: FiShield,        group: 'workflow' },
  { id: 'resolved',   label: 'Resolved',   scoreRange: null,        color: '#34C759', icon: FiCheckCircle,   group: 'workflow' },
];

// medium severity spans monitoring+elevated; COL_TO_SEV maps both back to 'medium'
const COL_TO_SEV = { stable: 'low', monitoring: 'medium', elevated: 'medium', high_risk: 'high', critical: 'critical' };
const SEV_ORDER  = { critical: 0, high: 1, medium: 2, low: 3 };

const AVATAR_COLORS = ['#059669','#ea580c','#dc2626','#7C3AED','#007AFF','#d97706','#be123c','#0891b2'];

function getColumn(event) {
  if (event.status === 'resolved') return 'resolved';
  if (event.police_requested || event.ambulance_requested) return 'dispatched';
  if (event.assigned_team?.length > 0) return 'assigned';
  if (event.severity === 'high') return 'high_risk';
  if (event.severity === 'critical') return 'critical';
  if (event.severity === 'low') return 'stable';
  // medium: split into monitoring (score ≤ 45) vs elevated (score > 45) — no DB change needed
  if (event.severity === 'medium') return getScore(event) <= 45 ? 'monitoring' : 'elevated';
  return 'stable';
}

function sortBySeverity(a, b) {
  const sd = (SEV_ORDER[a.severity] ?? 2) - (SEV_ORDER[b.severity] ?? 2);
  return sd !== 0 ? sd : new Date(a.created_at) - new Date(b.created_at);
}

function getAvatarColor(name) {
  const seed = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

function getInitials(name) {
  return (name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getScore(event) {
  const meta = SEVERITY_META[event.severity];
  if (!meta) return 50;
  const [lo, hi] = meta.scoreRange;
  const seed = (event.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return lo + (seed % (hi - lo + 1));
}

function calcElapsed(startTime, now) {
  const diff = Math.floor((now - new Date(startTime)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

function isOverdue(event, now) {
  return event.status === 'active' && (now - new Date(event.created_at)) > 4 * 3600 * 1000;
}

// ── Score Ring ────────────────────────────────────────────────────
const ScoreRing = ({ score, color }) => {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <svg width={40} height={40} style={{ flexShrink: 0 }}>
      <circle cx={20} cy={20} r={r} fill="none" stroke={`${color}28`} strokeWidth={3} />
      <circle
        cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      <text x={20} y={20} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 10, fontWeight: 800, fill: color, fontFamily: 'inherit' }}>
        {score}
      </text>
    </svg>
  );
};

// ── Avatar ────────────────────────────────────────────────────────
const Avatar = ({ name, size = 36 }) => {
  const color = getAvatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}20`, border: `2px solid ${color}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 700, color }}>{getInitials(name)}</span>
    </div>
  );
};

// ── Severity Badge ────────────────────────────────────────────────
const SevBadge = ({ severity, color, label }) => (
  <span style={{
    fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
    padding: '2px 8px', borderRadius: 12,
    background: `${color}20`, color, border: `1px solid ${color}40`,
  }}>
    {label}
  </span>
);

// ── Kanban Card ───────────────────────────────────────────────────
const KanbanCard = ({ event, now, onDragStart, onView, pulsing, colColor }) => {
  const meta  = SEVERITY_META[event.severity] || SEVERITY_META.low;
  const score = getScore(event);
  const elapsed = calcElapsed(event.created_at, now);
  const overdue = isOverdue(event, now);
  const assignedTo = event.assigned_team?.[0] || null;
  const dateStr = new Date(event.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      onClick={() => onView(event)}
      style={{
        background: 'var(--ac-surface)',
        border: `1px solid ${colColor}28`,
        borderLeft: `3px solid ${colColor}`,
        borderRadius: 10,
        padding: '12px 12px 10px',
        cursor: 'grab',
        userSelect: 'none',
        marginBottom: 8,
        transition: 'transform 0.12s, box-shadow 0.12s',
        animation: pulsing ? 'kanban-pulse 1.4s ease-out' : 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 18px ${colColor}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Row 1: Avatar + name/CRN + badge + score ring */}
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 8 }}>
        <Avatar name={event.client_name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.25, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.client_name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>
            {event.client_crn || '—'}
          </div>
          <div style={{ marginTop: 5 }}>
            <SevBadge severity={event.severity} color={meta.color} label={meta.label} />
          </div>
        </div>
        <ScoreRing score={score} color={meta.color} />
      </div>

      {/* Row 2: Stats grid (type / location / time) */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 4, padding: '8px 0',
        borderTop: '1px solid var(--ac-border)', borderBottom: '1px solid var(--ac-border)',
        marginBottom: 9,
      }}>
        {[
          { icon: FiActivity, label: 'Type',     val: event.crisis_type?.replace(/_/g, ' ') || '—' },
          { icon: FiMapPin,   label: 'Location', val: event.location || '—' },
          { icon: FiClock,    label: 'Active',   val: elapsed, alert: overdue },
        ].map(({ icon, label, val, alert }) => (
          <div key={label}>
            <div style={{ fontSize: 8, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
              <SafeIcon icon={icon} size={8} />{label}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: alert ? '#EF4444' : 'var(--ac-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Row 3: Assigned + dispatch tags + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--ac-muted)', minWidth: 0 }}>
          <SafeIcon icon={FiUser} size={10} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {assignedTo || 'Unassigned'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {event.police_requested && (
            <span style={{ fontSize: 8, background: '#1A3A5C', color: '#93C5FD', padding: '1px 5px', borderRadius: 10, fontWeight: 600 }}>PD</span>
          )}
          {event.ambulance_requested && (
            <span style={{ fontSize: 8, background: '#14532D', color: '#86EFAC', padding: '1px 5px', borderRadius: 10, fontWeight: 600 }}>AMB</span>
          )}
          <span style={{ fontSize: 9, color: overdue ? '#EF4444' : 'var(--ac-muted)', fontFamily: 'monospace', fontWeight: overdue ? 700 : 400 }}>
            {overdue ? '⚠ ' : ''}{dateStr}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Kanban Column ─────────────────────────────────────────────────
const KanbanColumn = ({ col, events, now, onDragStart, onDrop, onDragEnter, onView, isDragOver, pulsingIds }) => {
  const overdueCount = events.filter(ev => isOverdue(ev, now)).length;
  return (
    <div
      style={{
        flex: '0 0 230px', width: 230,
        display: 'flex', flexDirection: 'column',
        background: isDragOver ? `${col.color}0A` : 'var(--ac-bg)',
        border: `1.5px solid ${isDragOver ? col.color : 'var(--ac-border)'}`,
        borderRadius: 14, overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
        minHeight: 360,
      }}
      onDragOver={e => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDrop={() => onDrop(col.id)}
    >
      {/* Colour bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${col.color} 0%, ${col.color}44 70%, transparent 100%)` }} />

      {/* Header */}
      <div style={{ padding: '10px 12px 9px', borderBottom: `1px solid ${col.color}20` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}80`, flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: 11, color: col.color, textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>
            {col.label}
          </span>
          {col.scoreRange && (
            <span style={{ fontSize: 9, color: 'var(--ac-muted)', fontVariantNumeric: 'tabular-nums' }}>{col.scoreRange}</span>
          )}
          {overdueCount > 0 && (
            <span style={{ fontSize: 8, fontWeight: 700, color: '#EF4444', background: '#EF444420', padding: '1px 6px', borderRadius: 10 }}>
              {overdueCount} OVERDUE
            </span>
          )}
          <span style={{ background: `${col.color}22`, color: col.color, borderRadius: 12, fontSize: 10, fontWeight: 800, padding: '1px 8px', flexShrink: 0 }}>
            {events.length}
          </span>
        </div>
      </div>

      {/* Drop hint */}
      {isDragOver && (
        <div style={{ margin: '8px', border: `2px dashed ${col.color}`, borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 11, color: col.color, fontWeight: 600 }}>
          Drop here
        </div>
      )}

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {events.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 12px', color: 'var(--ac-muted)', fontSize: 11, textAlign: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${col.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <SafeIcon icon={col.icon} size={13} style={{ color: col.color }} />
            </div>
            No events
          </div>
        ) : (
          events.map(ev => (
            <KanbanCard
              key={ev.id}
              event={ev}
              now={now}
              colColor={col.color}
              pulsing={pulsingIds.has(ev.id)}
              onDragStart={onDragStart}
              onView={onView}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ── Assign Modal ──────────────────────────────────────────────────
const AssignModal = ({ event, staffList, onClose, onConfirm }) => {
  const [selected, setSelected] = useState(new Set(event.assigned_team || []));
  const toggle = m => { const n = new Set(selected); n.has(m) ? n.delete(m) : n.add(m); setSelected(n); };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Assign Team</h3>
        <p style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 16 }}>Select staff for <strong>{event.client_name}</strong></p>
        <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
          {staffList.map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1px solid ${selected.has(m) ? 'var(--ac-primary)' : 'var(--ac-border)'}`, marginBottom: 6, cursor: 'pointer', background: selected.has(m) ? 'var(--ac-primary-soft)' : 'transparent', transition: 'all 0.12s' }}>
              <input type="checkbox" checked={selected.has(m)} onChange={() => toggle(m)} style={{ accentColor: 'var(--ac-primary)' }} />
              <SafeIcon icon={FiUser} size={13} style={{ color: selected.has(m) ? 'var(--ac-primary)' : 'var(--ac-muted)' }} />
              <span style={{ fontSize: 13, fontWeight: selected.has(m) ? 600 : 400 }}>{m}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(Array.from(selected))}>Confirm Assignment</Button>
        </div>
      </div>
    </div>
  );
};

// ── Dispatch Modal ────────────────────────────────────────────────
const DispatchModal = ({ event, onClose, onConfirm }) => {
  const [police, setPolice] = useState(false);
  const [ambulance, setAmbulance] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Dispatch Services</h3>
        <p style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 16 }}>Choose services for <strong>{event.client_name}</strong></p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1px solid ${police ? '#007AFF' : 'var(--ac-border)'}`, marginBottom: 8, cursor: 'pointer', background: police ? '#1A3A5C' : 'transparent', transition: 'all 0.12s' }}>
          <input type="checkbox" checked={police} onChange={e => setPolice(e.target.checked)} style={{ accentColor: '#007AFF' }} />
          <SafeIcon icon={FiShield} size={14} style={{ color: '#007AFF' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: police ? '#93C5FD' : 'var(--ac-text)' }}>Police</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1px solid ${ambulance ? '#34C759' : 'var(--ac-border)'}`, marginBottom: 16, cursor: 'pointer', background: ambulance ? '#14532D' : 'transparent', transition: 'all 0.12s' }}>
          <input type="checkbox" checked={ambulance} onChange={e => setAmbulance(e.target.checked)} style={{ accentColor: '#34C759' }} />
          <SafeIcon icon={FiPhone} size={14} style={{ color: '#34C759' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: ambulance ? '#86EFAC' : 'var(--ac-text)' }}>Ambulance</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm({ police, ambulance })} disabled={!police && !ambulance}>Dispatch</Button>
        </div>
      </div>
    </div>
  );
};

// ── Main CrisisKanban ─────────────────────────────────────────────
export default function CrisisKanban({ events, onRefresh, onViewEvent, showToast }) {
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [pulsingIds, setPulsingIds] = useState(new Set());
  const [now, setNow] = useState(Date.now());
  const pulseTimers = useRef({});

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const triggerPulse = useCallback(id => {
    setPulsingIds(prev => new Set(prev).add(id));
    clearTimeout(pulseTimers.current[id]);
    pulseTimers.current[id] = setTimeout(() => {
      setPulsingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 1500);
  }, []);

  useEffect(() => {
    const timers = pulseTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    supabase.from('admin_users_1777025000000').select('name, email').eq('status', 'active').order('name')
      .then(({ data }) => { if (data?.length) setStaffList(data.map(u => u.name || u.email).filter(Boolean)); });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('crisis-kanban-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: CRISIS_TABLE }, payload => {
        const id = payload.new?.id || payload.old?.id;
        if (id) triggerPulse(id);
        onRefresh();
      })
      .subscribe(status => setRealtimeConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [onRefresh, triggerPulse]);

  const activeTeamMembers = useMemo(() => {
    const members = new Set();
    events.forEach(ev => ev.assigned_team?.forEach(m => members.add(m)));
    return Array.from(members).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(ev => {
      if (teamFilter !== 'all' && !(ev.assigned_team || []).includes(teamFilter)) return false;
      if (!q) return true;
      return (
        ev.client_name?.toLowerCase().includes(q) ||
        ev.client_crn?.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q)
      );
    });
  }, [events, search, teamFilter]);

  const columnEvents = useMemo(() => {
    const map = {};
    COLUMNS.forEach(col => {
      map[col.id] = filteredEvents.filter(ev => getColumn(ev) === col.id).sort(sortBySeverity);
    });
    return map;
  }, [filteredEvents]);

  const handleDragStart = useCallback(ev => setDraggedEvent(ev), []);

  const handleDrop = useCallback(async targetColId => {
    setDragOverCol(null);
    if (!draggedEvent) return;
    const fromCol = getColumn(draggedEvent);
    if (fromCol === targetColId) { setDraggedEvent(null); return; }

    if (targetColId === 'resolved') {
      const { error } = await supabase.from(CRISIS_TABLE)
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', draggedEvent.id);
      if (error) showToast?.('Failed to resolve event.', 'error');
      else { showToast?.('Event resolved.'); onRefresh(); }
    } else if (targetColId === 'assigned') {
      setPendingAction({ type: 'assign', event: draggedEvent });
    } else if (targetColId === 'dispatched') {
      setPendingAction({ type: 'dispatch', event: draggedEvent });
    } else if (COL_TO_SEV[targetColId]) {
      const { error } = await supabase.from(CRISIS_TABLE)
        .update({ severity: COL_TO_SEV[targetColId], status: 'active', resolved_at: null, assigned_team: [], police_requested: false, ambulance_requested: false })
        .eq('id', draggedEvent.id);
      if (error) showToast?.('Failed to update event.', 'error');
      else { showToast?.(`Moved to ${COLUMNS.find(c => c.id === targetColId)?.label}.`); onRefresh(); }
    }
    setDraggedEvent(null);
  }, [draggedEvent, onRefresh, showToast]);

  const handleAssignConfirm = async members => {
    const { error } = await supabase.from(CRISIS_TABLE)
      .update({ assigned_team: members, status: 'active', resolved_at: null })
      .eq('id', pendingAction.event.id);
    if (error) { showToast?.('Failed to assign team.', 'error'); return; }
    showToast?.('Team assigned.');
    setPendingAction(null);
    onRefresh();
  };

  const handleDispatchConfirm = async ({ police, ambulance }) => {
    const { error } = await supabase.from(CRISIS_TABLE)
      .update({ status: 'active', resolved_at: null, police_requested: police, ambulance_requested: ambulance })
      .eq('id', pendingAction.event.id);
    if (error) { showToast?.('Failed to dispatch.', 'error'); return; }
    showToast?.('Services dispatched.');
    setPendingAction(null);
    onRefresh();
  };

  const handlePopOut = () => {
    const win = window.open(window.location.href, '_blank', 'noopener,noreferrer');
    if (!win) showToast?.('Pop-out blocked by your browser. Allow pop-ups for this site and try again.', 'error');
  };

  const totalOverdue = useMemo(() => filteredEvents.filter(ev => isOverdue(ev, now)).length, [filteredEvents, now]);

  return (
    <div onDragEnd={() => { setDraggedEvent(null); setDragOverCol(null); }}>

      {/* Board meta bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 260 }}>
          <SafeIcon icon={FiSearch} size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, CRN, location…"
            style={{ width: '100%', paddingLeft: 27, paddingRight: 8, paddingTop: 6, paddingBottom: 6, borderRadius: 9, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Clinician filter */}
        {activeTeamMembers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <SafeIcon icon={FiFilter} size={11} style={{ color: 'var(--ac-muted)' }} />
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 9, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All clinicians</option>
              {activeTeamMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Lane / patient counts */}
          <span style={{ fontSize: 11, color: 'var(--ac-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {COLUMNS.length} Lanes
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            {filteredEvents.length} Events
            {totalOverdue > 0 && (
              <span style={{ marginLeft: 8, color: '#EF4444' }}>· {totalOverdue} overdue</span>
            )}
          </span>

          {/* Drag hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiMove} size={10} />Drag to update
          </div>

          {/* Realtime indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: realtimeConnected ? '#34C759' : 'var(--ac-muted)', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: realtimeConnected ? '#34C759' : 'var(--ac-muted)', boxShadow: realtimeConnected ? '0 0 6px #34C759' : 'none' }} />
            <SafeIcon icon={realtimeConnected ? FiWifi : FiWifiOff} size={11} />
            {realtimeConnected ? 'Realtime' : 'Connecting…'}
          </div>

          {/* Pop out */}
          <button
            onClick={handlePopOut}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--ac-muted)', background: 'transparent', border: '1px solid var(--ac-border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--ac-text)'; e.currentTarget.style.borderColor = 'var(--ac-text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ac-muted)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
          >
            <SafeIcon icon={FiExternalLink} size={11} />Pop Out
          </button>
        </div>
      </div>

      {/* Group labels */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ac-muted)' }}>Clinical Acuity</span>
          <div style={{ width: 280, height: 1, background: 'var(--ac-border)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ac-muted)' }}>Operational</span>
          <div style={{ width: 120, height: 1, background: 'var(--ac-border)' }} />
        </div>
      </div>

      {/* Board */}
      <div
        style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
      >
        {COLUMNS.map((col, i) => (
          <React.Fragment key={col.id}>
            {col.group === 'workflow' && COLUMNS[i - 1]?.group === 'clinical' && (
              <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--ac-border)', flexShrink: 0, margin: '0 4px' }} />
            )}
            <KanbanColumn
              col={col}
              events={columnEvents[col.id]}
              now={now}
              isDragOver={dragOverCol === col.id}
              pulsingIds={pulsingIds}
              onDragStart={handleDragStart}
              onDragEnter={() => draggedEvent && setDragOverCol(col.id)}
              onDrop={handleDrop}
              onView={onViewEvent}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Modals */}
      {pendingAction?.type === 'assign' && (
        <AssignModal
          event={pendingAction.event}
          staffList={staffList}
          onClose={() => { setPendingAction(null); setDraggedEvent(null); }}
          onConfirm={handleAssignConfirm}
        />
      )}
      {pendingAction?.type === 'dispatch' && (
        <DispatchModal
          event={pendingAction.event}
          onClose={() => { setPendingAction(null); setDraggedEvent(null); }}
          onConfirm={handleDispatchConfirm}
        />
      )}

      <style>{`
        @keyframes kanban-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(52,199,89,0.5); }
          60%  { box-shadow: 0 0 0 8px rgba(52,199,89,0); }
          100% { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}

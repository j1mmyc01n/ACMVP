import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { Badge, Button } from './UI';

const {
  FiAlertTriangle, FiUserCheck, FiShield, FiCheckCircle,
  FiPhone, FiClock, FiUser, FiMapPin, FiList,
  FiEye, FiMove, FiSearch, FiFilter, FiWifi, FiWifiOff,
  FiActivity, FiAlertCircle, FiTrendingUp,
} = FiIcons;

const CRISIS_TABLE = 'crisis_events_1777090008';

const SEVERITY_BADGE = {
  critical: { color: '#FF3B30', label: 'CRITICAL', tone: 'red' },
  high:     { color: '#FF9500', label: 'HIGH',     tone: 'amber' },
  medium:   { color: '#007AFF', label: 'MEDIUM',   tone: 'blue' },
  low:      { color: '#34C759', label: 'LOW',      tone: 'green' },
};

// ── Column definitions ────────────────────────────────────────────
// Clinical severity lanes (Emergent-style acuity staging)
// Workflow lanes (operational response tracking)
const COLUMNS = [
  { id: 'stable',     label: 'Stable',     color: '#059669', accentBg: '#052E16', icon: FiActivity,      description: 'Low acuity — stable',       group: 'clinical' },
  { id: 'elevated',   label: 'Elevated',   color: '#ea580c', accentBg: '#2A0F00', icon: FiTrendingUp,    description: 'Medium acuity — monitoring', group: 'clinical' },
  { id: 'high_risk',  label: 'High Risk',  color: '#dc2626', accentBg: '#450A0A', icon: FiAlertCircle,   description: 'High acuity — urgent',       group: 'clinical' },
  { id: 'critical',   label: 'Critical',   color: '#be123c', accentBg: '#4C0519', icon: FiAlertTriangle, description: 'Critical — immediate',       group: 'clinical' },
  { id: 'assigned',   label: 'Assigned',   color: '#7C3AED', accentBg: '#2E1065', icon: FiUserCheck,     description: 'Team responding',            group: 'workflow' },
  { id: 'dispatched', label: 'Dispatched', color: '#007AFF', accentBg: '#1A3A5C', icon: FiShield,        description: 'Emergency services en route', group: 'workflow' },
  { id: 'resolved',   label: 'Resolved',   color: '#34C759', accentBg: '#14532D', icon: FiCheckCircle,   description: 'Event closed',               group: 'workflow' },
];

// Severity → clinical column
const SEV_TO_COL = { critical: 'critical', high: 'high_risk', medium: 'elevated', low: 'stable' };
// Clinical column → severity value written back to DB
const COL_TO_SEV = { stable: 'low', elevated: 'medium', high_risk: 'high', critical: 'critical' };

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function getColumn(event) {
  if (event.status === 'resolved') return 'resolved';
  if (event.police_requested || event.ambulance_requested) return 'dispatched';
  if (event.assigned_team?.length > 0) return 'assigned';
  return SEV_TO_COL[event.severity] || 'stable';
}

function sortBySeverity(a, b) {
  const sd = (SEV_ORDER[a.severity] ?? 2) - (SEV_ORDER[b.severity] ?? 2);
  return sd !== 0 ? sd : new Date(a.created_at) - new Date(b.created_at);
}

// ── Elapsed helper ────────────────────────────────────────────────
// Pure function — no per-card timers. Board passes a shared `now` value.
function calcElapsed(startTime, now) {
  const diff = Math.floor((now - new Date(startTime)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

// ── Kanban Card ───────────────────────────────────────────────────
const KanbanCard = ({ event, now, onDragStart, onView, pulsing, colColor }) => {
  const sev = SEVERITY_BADGE[event.severity] || SEVERITY_BADGE.high;
  const elapsed = calcElapsed(event.created_at, now);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      style={{
        background: 'var(--ac-surface)',
        border: `1px solid ${colColor}2A`,
        borderTop: `2px solid ${colColor}`,
        borderRadius: 10,
        padding: '11px 12px',
        cursor: 'grab',
        userSelect: 'none',
        marginBottom: 8,
        transition: 'transform 0.12s, box-shadow 0.12s',
        animation: pulsing ? 'kanban-pulse 1.4s ease-out' : 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = `0 4px 14px ${colColor}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Name + severity badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, lineHeight: 1.3 }}>{event.client_name}</div>
          {event.client_crn && (
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--ac-muted)', background: 'var(--ac-bg)', padding: '1px 6px', borderRadius: 5 }}>
              {event.client_crn}
            </span>
          )}
        </div>
        <Badge tone={sev.tone}>{sev.label}</Badge>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--ac-muted)', marginBottom: 7 }}>
        {event.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <SafeIcon icon={FiMapPin} size={10} />{event.location}
          </span>
        )}
        {event.crisis_type && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <SafeIcon icon={FiList} size={10} />{event.crisis_type.replace(/_/g, ' ')}
          </span>
        )}
        {event.status === 'active' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: sev.color, fontWeight: 600 }}>
            <SafeIcon icon={FiClock} size={10} />{elapsed}
          </span>
        )}
      </div>

      {/* Status tags + view button */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {event.police_requested && (
            <span style={{ fontSize: 9, background: '#1A3A5C', color: '#93C5FD', padding: '2px 7px', borderRadius: 12, fontWeight: 600 }}>Police</span>
          )}
          {event.ambulance_requested && (
            <span style={{ fontSize: 9, background: '#14532D', color: '#86EFAC', padding: '2px 7px', borderRadius: 12, fontWeight: 600 }}>Ambulance</span>
          )}
          {event.assigned_team?.length > 0 && (
            <span style={{ fontSize: 9, background: '#2E1065', color: '#D8B4FE', padding: '2px 7px', borderRadius: 12, fontWeight: 600 }}>
              {event.assigned_team.length} staff
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onView(event); }}
          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
        >
          <SafeIcon icon={FiEye} size={10} />View
        </button>
      </div>
    </div>
  );
};

// ── Kanban Column ─────────────────────────────────────────────────
const KanbanColumn = ({ col, events, now, onDragStart, onDrop, onDragEnter, onView, isDragOver, pulsingIds, isFirst, isLast }) => (
  <div
    style={{
      flex: '0 0 220px',
      width: 220,
      display: 'flex',
      flexDirection: 'column',
      background: isDragOver ? `${col.color}0D` : 'var(--ac-bg)',
      border: `1.5px solid ${isDragOver ? col.color : 'var(--ac-border)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.15s, background 0.15s',
      minHeight: 340,
    }}
    onDragOver={e => e.preventDefault()}
    onDragEnter={onDragEnter}
    onDrop={() => onDrop(col.id)}
  >
    {/* Gradient top bar (Emergent-style) */}
    <div style={{ height: 3, background: `linear-gradient(90deg, ${col.color} 0%, ${col.color}44 60%, transparent 100%)` }} />

    {/* Header */}
    <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${col.color}22` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, boxShadow: `0 0 8px ${col.color}66`, flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: 12, color: col.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.label}</span>
        <span style={{ marginLeft: 'auto', background: `${col.color}20`, color: col.color, borderRadius: 12, fontSize: 10, fontWeight: 800, padding: '1px 8px' }}>
          {events.length}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--ac-muted)' }}>{col.description}</div>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 12px', color: 'var(--ac-muted)', fontSize: 11, textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${col.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <SafeIcon icon={col.icon} size={14} style={{ color: col.color }} />
          </div>
          No events — drag cards here
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

  // Single board-level clock — replaces per-card setInterval timers
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

  // Clear all pending pulse timeouts on unmount
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

    const isClinical = COL_TO_SEV[targetColId] !== undefined;

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
    } else if (isClinical) {
      // Drop to clinical severity lane: update severity, reopen if resolved, clear ops flags
      const { error } = await supabase.from(CRISIS_TABLE)
        .update({
          severity: COL_TO_SEV[targetColId],
          status: 'active',
          resolved_at: null,
          assigned_team: [],
          police_requested: false,
          ambulance_requested: false,
        })
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

  return (
    <div onDragEnd={() => { setDraggedEvent(null); setDragOverCol(null); }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <SafeIcon icon={FiSearch} size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, CRN, location..."
            style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {activeTeamMembers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SafeIcon icon={FiFilter} size={12} style={{ color: 'var(--ac-muted)' }} />
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All clinicians</option>
              {activeTeamMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: realtimeConnected ? 'var(--ac-success)' : 'var(--ac-muted)', fontWeight: 600 }}>
          <SafeIcon icon={realtimeConnected ? FiWifi : FiWifiOff} size={11} />
          {realtimeConnected ? 'Live' : 'Connecting...'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ac-muted)' }}>
          <SafeIcon icon={FiMove} size={10} />
          Drag to update
        </div>
      </div>

      {/* Column group labels */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 6, paddingRight: 8 }}>
        <div style={{ flex: '0 0 908px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ac-muted)' }}>Clinical Acuity</span>
          <div style={{ flex: 1, height: 1, background: 'var(--ac-border)' }} />
        </div>
        <div style={{ flex: '0 0 672px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ac-muted)' }}>Operational</span>
          <div style={{ flex: 1, height: 1, background: 'var(--ac-border)' }} />
        </div>
      </div>

      {/* Board */}
      <div
        style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
      >
        {COLUMNS.map((col, i) => (
          <React.Fragment key={col.id}>
            {/* Visual divider between clinical and operational groups */}
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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { Badge, Button } from './UI';

const {
  FiAlertTriangle, FiUserCheck, FiShield, FiCheckCircle,
  FiPhone, FiClock, FiUser, FiMapPin, FiList,
  FiEye, FiMove, FiSearch, FiFilter, FiWifi, FiWifiOff,
} = FiIcons;

const CRISIS_TABLE = 'crisis_events_1777090008';

const SEVERITY = {
  critical: { color: '#FF3B30', bg: '#450A0A', label: 'CRITICAL' },
  high:     { color: '#FF9500', bg: '#451A03', label: 'HIGH' },
  medium:   { color: '#007AFF', bg: '#1A3A5C', label: 'MEDIUM' },
  low:      { color: '#34C759', bg: '#14532D', label: 'LOW' },
};

const SEV_TONE = { critical: 'red', high: 'amber', medium: 'blue', low: 'green' };
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const COLUMNS = [
  { id: 'unassigned', label: 'Incoming',   color: '#FF3B30', accentBg: '#450A0A', icon: FiAlertTriangle, description: 'New events awaiting assignment' },
  { id: 'assigned',   label: 'Assigned',   color: '#FF9500', accentBg: '#451A03', icon: FiUserCheck,    description: 'Team responding' },
  { id: 'dispatched', label: 'Dispatched', color: '#007AFF', accentBg: '#1A3A5C', icon: FiShield,       description: 'Emergency services en route' },
  { id: 'resolved',   label: 'Resolved',   color: '#34C759', accentBg: '#14532D', icon: FiCheckCircle,  description: 'Event closed' },
];

function getColumn(event) {
  if (event.status === 'resolved') return 'resolved';
  if (event.police_requested || event.ambulance_requested) return 'dispatched';
  if (event.assigned_team?.length > 0) return 'assigned';
  return 'unassigned';
}

function sortBySeverity(a, b) {
  const sd = (SEV_ORDER[a.severity] ?? 1) - (SEV_ORDER[b.severity] ?? 1);
  return sd !== 0 ? sd : new Date(a.created_at) - new Date(b.created_at);
}

// ── Elapsed hook ──────────────────────────────────────────────────
const useElapsed = (startTime) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(startTime)) / 1000);
      if (diff < 60) return setElapsed(`${diff}s`);
      if (diff < 3600) return setElapsed(`${Math.floor(diff / 60)}m`);
      return setElapsed(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
    };
    calc();
    const t = setInterval(calc, 5000);
    return () => clearInterval(t);
  }, [startTime]);
  return elapsed;
};

// ── Kanban Card ───────────────────────────────────────────────────
const KanbanCard = ({ event, onDragStart, onView, pulsing }) => {
  const sev = SEVERITY[event.severity] || SEVERITY.high;
  const elapsed = useElapsed(event.created_at);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      style={{
        background: 'var(--ac-surface)',
        border: `1px solid ${sev.color}33`,
        borderLeft: `3px solid ${sev.color}`,
        borderRadius: 10,
        padding: '12px 13px',
        cursor: 'grab',
        userSelect: 'none',
        marginBottom: 8,
        transition: 'transform 0.12s, box-shadow 0.12s',
        animation: pulsing ? 'kanban-pulse 1.4s ease-out' : 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{event.client_name}</div>
          {event.client_crn && (
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--ac-muted)', background: 'var(--ac-bg)', padding: '1px 6px', borderRadius: 5 }}>
              {event.client_crn}
            </span>
          )}
        </div>
        <Badge tone={SEV_TONE[event.severity] || 'amber'}>{sev.label}</Badge>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--ac-muted)', marginBottom: 8 }}>
        {event.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <SafeIcon icon={FiMapPin} size={10} />{event.location}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <SafeIcon icon={FiList} size={10} />{event.crisis_type?.replace(/_/g, ' ')}
        </span>
        {event.status === 'active' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: sev.color, fontWeight: 600 }}>
            <SafeIcon icon={FiClock} size={10} />{elapsed}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {event.police_requested && (
            <span style={{ fontSize: 9, background: '#1A3A5C', color: '#93C5FD', padding: '2px 7px', borderRadius: 12, fontWeight: 600 }}>Police</span>
          )}
          {event.ambulance_requested && (
            <span style={{ fontSize: 9, background: '#14532D', color: '#86EFAC', padding: '2px 7px', borderRadius: 12, fontWeight: 600 }}>Ambulance</span>
          )}
          {event.assigned_team?.length > 0 && (
            <span style={{ fontSize: 9, background: '#2E1065', color: '#D8B4FE', padding: '2px 7px', borderRadius: 12, fontWeight: 600 }}>
              {event.assigned_team.length} assigned
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onView(event); }}
          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          <SafeIcon icon={FiEye} size={10} />View
        </button>
      </div>
    </div>
  );
};

// ── Kanban Column ─────────────────────────────────────────────────
const KanbanColumn = ({ col, events, onDragStart, onDrop, onDragEnter, onView, isDragOver, pulsingIds }) => (
  <div
    style={{
      flex: '1 1 220px', minWidth: 210, maxWidth: 320,
      display: 'flex', flexDirection: 'column',
      background: isDragOver ? `${col.color}0D` : 'var(--ac-bg)',
      border: `1.5px solid ${isDragOver ? col.color : 'var(--ac-border)'}`,
      borderRadius: 14, padding: 12,
      transition: 'border-color 0.15s, background 0.15s',
      minHeight: 320,
    }}
    onDragOver={e => e.preventDefault()}
    onDragEnter={onDragEnter}
    onDrop={() => onDrop(col.id)}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${col.color}33` }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: col.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <SafeIcon icon={col.icon} size={13} style={{ color: col.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: col.color }}>{col.label}</div>
        <div style={{ fontSize: 10, color: 'var(--ac-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.description}</div>
      </div>
      <div style={{ background: col.accentBg, color: col.color, borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '2px 9px', flexShrink: 0 }}>
        {events.length}
      </div>
    </div>

    {isDragOver && (
      <div style={{ border: `2px dashed ${col.color}`, borderRadius: 10, padding: '12px', marginBottom: 8, textAlign: 'center', fontSize: 12, color: col.color, fontWeight: 600 }}>
        Drop here
      </div>
    )}

    <div style={{ flex: 1, overflowY: 'auto' }}>
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--ac-muted)', fontSize: 11 }}>No events</div>
      ) : (
        events.map(ev => (
          <KanbanCard
            key={ev.id}
            event={ev}
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
  const pulseTimers = useRef({});

  // Trigger pulse animation on a card for 1.5s
  const triggerPulse = useCallback(id => {
    setPulsingIds(prev => new Set(prev).add(id));
    clearTimeout(pulseTimers.current[id]);
    pulseTimers.current[id] = setTimeout(() => {
      setPulsingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 1500);
  }, []);

  // Fetch assignable staff from admin_users
  useEffect(() => {
    supabase
      .from('admin_users_1777025000000')
      .select('name, email')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        if (data?.length) setStaffList(data.map(u => u.name || u.email).filter(Boolean));
      });
  }, []);

  // Supabase Realtime subscription — equivalent to the Emergent WebSocket
  useEffect(() => {
    const channel = supabase
      .channel('crisis-kanban-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: CRISIS_TABLE }, payload => {
        const id = payload.new?.id || payload.old?.id;
        if (id) triggerPulse(id);
        onRefresh();
      })
      .subscribe(status => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [onRefresh, triggerPulse]);

  // Unique team members appearing across active events (for the filter dropdown)
  const activeTeamMembers = useMemo(() => {
    const members = new Set();
    events.forEach(ev => ev.assigned_team?.forEach(m => members.add(m)));
    return Array.from(members).sort();
  }, [events]);

  // Apply search + team filter
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

  // Group filtered events into columns
  const columnEvents = useMemo(() => {
    const map = {};
    COLUMNS.forEach(col => {
      map[col.id] = filteredEvents.filter(ev => getColumn(ev) === col.id).sort(sortBySeverity);
    });
    return map;
  }, [filteredEvents]);

  const handleDragStart = useCallback(event => setDraggedEvent(event), []);

  const handleDrop = useCallback(async targetColId => {
    setDragOverCol(null);
    if (!draggedEvent) return;
    const fromCol = getColumn(draggedEvent);
    if (fromCol === targetColId) { setDraggedEvent(null); return; }

    switch (targetColId) {
      case 'resolved': {
        const { error } = await supabase.from(CRISIS_TABLE)
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', draggedEvent.id);
        if (error) { showToast?.('Failed to resolve event.', 'error'); } else { showToast?.('Event resolved.'); onRefresh(); }
        break;
      }
      case 'assigned':
        setPendingAction({ type: 'assign', event: draggedEvent });
        break;
      case 'dispatched':
        setPendingAction({ type: 'dispatch', event: draggedEvent });
        break;
      case 'unassigned': {
        const { error } = await supabase.from(CRISIS_TABLE)
          .update({ assigned_team: [], police_requested: false, ambulance_requested: false, status: 'active', resolved_at: null })
          .eq('id', draggedEvent.id);
        if (error) { showToast?.('Failed to update event.', 'error'); } else { showToast?.('Event moved to Incoming.'); onRefresh(); }
        break;
      }
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
    const update = { status: 'active', resolved_at: null };
    if (police) update.police_requested = true;
    if (ambulance) update.ambulance_requested = true;
    const { error } = await supabase.from(CRISIS_TABLE).update(update).eq('id', pendingAction.event.id);
    if (error) { showToast?.('Failed to dispatch services.', 'error'); return; }
    showToast?.('Services dispatched.');
    setPendingAction(null);
    onRefresh();
  };

  return (
    <div onDragEnd={() => { setDraggedEvent(null); setDragOverCol(null); }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <SafeIcon icon={FiSearch} size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, CRN, location..."
            style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Clinician filter */}
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

        {/* Realtime indicator */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: realtimeConnected ? 'var(--ac-success)' : 'var(--ac-muted)', fontWeight: 600 }}>
          <SafeIcon icon={realtimeConnected ? FiWifi : FiWifiOff} size={11} />
          {realtimeConnected ? 'Live' : 'Connecting...'}
        </div>

        {/* Drag hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ac-muted)' }}>
          <SafeIcon icon={FiMove} size={10} />
          Drag to update
        </div>
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            events={columnEvents[col.id]}
            isDragOver={dragOverCol === col.id}
            pulsingIds={pulsingIds}
            onDragStart={handleDragStart}
            onDragEnter={() => draggedEvent && setDragOverCol(col.id)}
            onDrop={handleDrop}
            onView={onViewEvent}
          />
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
          0%   { box-shadow: 0 0 0 0 rgba(52,199,89,0.6); }
          60%  { box-shadow: 0 0 0 8px rgba(52,199,89,0); }
          100% { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}

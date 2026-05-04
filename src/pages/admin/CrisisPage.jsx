import React, { useState, useEffect, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, Select, StatusBadge, Textarea } from '../../components/UI';
import CrisisKanban from '../../components/CrisisKanban';

const {
  FiAlertTriangle, FiCheckCircle, FiX, FiUserCheck, FiShield,
  FiPhone, FiClock, FiActivity, FiMapPin, FiUser, FiList,
  FiRefreshCw, FiEye, FiEdit2, FiZap, FiTrendingUp, FiAlertCircle
} = FiIcons;

const Toast = ({ msg, type = 'success', onClose }) => (
  <div className={`ac-toast ${type === 'error' ? 'ac-toast-err' : ''}`}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle} style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

const ModalOverlay = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: wide ? 680 : 460, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '92vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 22 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ── Severity config ──────────────────────────────────────────────
const SEVERITY = {
  critical: { color: '#FF3B30', bg: '#450A0A', label: 'CRITICAL', pulse: true },
  high:     { color: '#FF9500', bg: '#451A03', label: 'HIGH',     pulse: false },
  medium:   { color: '#007AFF', bg: '#1A3A5C', label: 'MEDIUM',   pulse: false },
  low:      { color: '#34C759', bg: '#14532D', label: 'LOW',      pulse: false },
};

const SEV_TONE = { critical: 'red', high: 'amber', medium: 'blue', low: 'green' };

const CRISIS_TYPES = ['mental_health', 'medical', 'violence', 'substance', 'suicide_risk', 'domestic', 'other'];

const TEAM_MEMBERS = ['Dr. Sarah Smith', 'Dr. James Wilson', 'Nurse Chen', 'Paramedic Team Alpha', 'Social Worker Lee', 'Security Officer Brown'];

// ── Elapsed time helper ──────────────────────────────────────────
const useElapsed = (startTime) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(startTime)) / 1000);
      if (diff < 60) return setElapsed(`${diff}s`);
      if (diff < 3600) return setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`);
      return setElapsed(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [startTime]);
  return elapsed;
};

// ── Live Clock ────────────────────────────────────────────────────
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{time.toLocaleTimeString()}</span>;
};

// ── Event Timer Badge ─────────────────────────────────────────────
const EventTimer = ({ createdAt, severity }) => {
  const elapsed = useElapsed(createdAt);
  const sev = SEVERITY[severity] || SEVERITY.high;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: sev.color, fontWeight: 700 }}>
      <SafeIcon icon={FiClock} size={12} />
      {elapsed}
    </div>
  );
};

// ── Stats Bar ─────────────────────────────────────────────────────
const StatsBar = ({ events }) => {
  const active = events.filter(e => e.status === 'active');
  const critical = active.filter(e => e.severity === 'critical').length;
  const high = active.filter(e => e.severity === 'high').length;
  const policeOut = active.filter(e => e.police_requested).length;
  const ambulanceOut = active.filter(e => e.ambulance_requested).length;

  const stats = [
    { label: 'Active Events', value: active.length, color: 'var(--ac-danger)', icon: FiActivity },
    { label: 'Critical', value: critical, color: '#FF3B30', icon: FiAlertTriangle },
    { label: 'High Priority', value: high, color: '#FF9500', icon: FiAlertCircle },
    { label: 'Police Dispatched', value: policeOut, color: 'var(--ac-primary)', icon: FiShield },
    { label: 'Ambulance Out', value: ambulanceOut, color: 'var(--ac-success)', icon: FiPhone },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
          <SafeIcon icon={s.icon} size={18} style={{ color: s.color, marginBottom: 6 }} />
          <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};

// ── Event Card ────────────────────────────────────────────────────
const EventCard = ({ event, onView, onDispatch, onResolve, onAssign }) => {
  const sev = SEVERITY[event.severity] || SEVERITY.high;

  return (
    <div style={{
      border: `2px solid ${sev.color}`,
      borderRadius: 14, padding: 16, background: 'var(--ac-surface)',
      position: 'relative', overflow: 'hidden',
      animation: sev.pulse ? 'crisis-pulse 2.5s ease-in-out infinite' : 'none'
    }}>
      {/* Severity stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, bottom: 0, background: sev.color, borderRadius: '14px 0 0 14px' }} />
      <div style={{ paddingLeft: 8 }}>
        {/* Header */}
        <div className="ac-flex-between" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{event.client_name}</span>
            {event.client_crn && <span className="ac-mono ac-xs" style={{ color: 'var(--ac-muted)', background: 'var(--ac-bg)', padding: '2px 7px', borderRadius: 6 }}>{event.client_crn}</span>}
            <Badge tone={SEV_TONE[event.severity] || 'amber'}>{sev.label}</Badge>
          </div>
          <EventTimer createdAt={event.created_at} severity={event.severity} />
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          {event.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ac-muted)' }}>
              <SafeIcon icon={FiMapPin} size={11} />
              {event.location}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiList} size={11} />
            {event.crisis_type?.replace(/_/g, ' ')}
          </div>
          {event.assigned_team?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ac-primary)' }}>
              <SafeIcon icon={FiUser} size={11} />
              {event.assigned_team.join(', ')}
            </div>
          )}
        </div>

        {/* Notes */}
        {event.notes && (
          <div style={{ background: 'var(--ac-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, color: 'var(--ac-text)', borderLeft: `3px solid ${sev.color}` }}>
            {event.notes}
          </div>
        )}

        {/* Dispatch Status */}
        {(event.police_requested || event.ambulance_requested) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {event.police_requested && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, background: '#1A3A5C', color: '#93C5FD', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                <SafeIcon icon={FiShield} size={10} /> Police Dispatched
              </div>
            )}
            {event.ambulance_requested && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, background: '#14532D', color: '#86EFAC', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                <SafeIcon icon={FiPhone} size={10} /> Ambulance En Route
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => onView(event)} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <SafeIcon icon={FiEye} size={11} /> View
          </button>
          <button onClick={() => onAssign(event)} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <SafeIcon icon={FiUserCheck} size={11} /> Assign
          </button>
          {!event.police_requested && (
            <button onClick={() => onDispatch(event, 'police')} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1px solid #1A5276', background: '#EAF2FB', color: '#1A5276', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SafeIcon icon={FiShield} size={11} /> Police
            </button>
          )}
          {!event.ambulance_requested && (
            <button onClick={() => onDispatch(event, 'ambulance')} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1px solid #1D8348', background: '#E8FAF0', color: '#1D8348', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SafeIcon icon={FiPhone} size={11} /> Ambulance
            </button>
          )}
          <button onClick={() => onResolve(event)} style={{ marginLeft: 'auto', fontSize: 11, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--ac-success)', color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <SafeIcon icon={FiCheckCircle} size={11} /> Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Event Detail Modal ────────────────────────────────────────────
const EventDetailModal = ({ event, onClose, onUpdate }) => {
  const [notes, setNotes] = useState(event.notes || '');
  const [saving, setSaving] = useState(false);
  const elapsed = useElapsed(event.created_at);
  const sev = SEVERITY[event.severity] || SEVERITY.high;

  const timeline = [
    { time: event.created_at, label: 'Event raised', icon: FiAlertTriangle, color: sev.color },
    ...(event.police_requested ? [{ time: event.created_at, label: 'Police dispatched', icon: FiShield, color: '#007AFF' }] : []),
    ...(event.ambulance_requested ? [{ time: event.created_at, label: 'Ambulance requested', icon: FiPhone, color: '#34C759' }] : []),
    ...(event.assigned_team?.length > 0 ? event.assigned_team.map(m => ({ time: event.created_at, label: `${m} assigned`, icon: FiUserCheck, color: '#AF52DE' })) : []),
    ...(event.status === 'resolved' ? [{ time: event.resolved_at, label: 'Event resolved', icon: FiCheckCircle, color: '#34C759' }] : []),
  ];

  const handleSaveNotes = async () => {
    setSaving(true);
    await supabase.from('crisis_events_1777090000').update({ notes }).eq('id', event.id);
    setSaving(false);
    onUpdate();
  };

  return (
    <ModalOverlay title="Crisis Event Details" onClose={onClose} wide>
      <div className="ac-stack">
        {/* Header strip */}
        <div style={{ background: sev.bg, border: `1px solid ${sev.color}`, borderRadius: 12, padding: '14px 18px' }}>
          <div className="ac-flex-between" style={{ marginBottom: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: sev.color }}>{event.client_name}</div>
            <Badge tone={SEV_TONE[event.severity] || 'amber'}>{sev.label}</Badge>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--ac-muted)' }}>
            {event.client_crn && <span className="ac-mono">CRN: {event.client_crn}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SafeIcon icon={FiMapPin} size={10} />{event.location || 'Location not set'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SafeIcon icon={FiList} size={10} />{event.crisis_type?.replace(/_/g, ' ')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: sev.color, fontWeight: 700 }}><SafeIcon icon={FiClock} size={10} />Active for {elapsed}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Timeline */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Event Timeline</div>
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'var(--ac-border)' }} />
              {timeline.map((t, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: 14 }}>
                  <div style={{ position: 'absolute', left: -13, top: 3, width: 10, height: 10, borderRadius: '50%', background: t.color, border: '2px solid var(--ac-surface)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <SafeIcon icon={t.icon} size={11} style={{ color: t.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 2 }}>{new Date(t.time).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch & Team */}
          <div className="ac-stack-sm">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🚨 Response Status</div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: event.police_requested ? '#1A3A5C' : 'var(--ac-bg)', border: `1px solid ${event.police_requested ? '#007AFF' : 'var(--ac-border)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeIcon icon={FiShield} size={14} style={{ color: event.police_requested ? '#93C5FD' : 'var(--ac-muted)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: event.police_requested ? '#93C5FD' : 'var(--ac-muted)' }}>
                Police: {event.police_requested ? 'Dispatched ✓' : 'Not Requested'}
              </span>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: event.ambulance_requested ? '#14532D' : 'var(--ac-bg)', border: `1px solid ${event.ambulance_requested ? '#34C759' : 'var(--ac-border)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeIcon icon={FiPhone} size={14} style={{ color: event.ambulance_requested ? '#86EFAC' : 'var(--ac-muted)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: event.ambulance_requested ? '#86EFAC' : 'var(--ac-muted)' }}>
                Ambulance: {event.ambulance_requested ? 'En Route ✓' : 'Not Requested'}
              </span>
            </div>
            {event.assigned_team?.length > 0 && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--ac-bg)', border: '1px solid var(--ac-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 6, fontWeight: 600 }}>ASSIGNED TEAM</div>
                {event.assigned_team.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 0' }}>
                    <SafeIcon icon={FiUser} size={10} style={{ color: '#AF52DE' }} />
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes editor */}
        <Field label="Clinical Notes">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="Add clinical notes, observations, or updates..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </Field>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Close</Button>
          <Button onClick={handleSaveNotes} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Notes'}</Button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ── Assign Team Modal ─────────────────────────────────────────────
const AssignTeamModal = ({ event, onClose, onSave }) => {
  const [selected, setSelected] = useState(new Set(event.assigned_team || []));

  const toggle = (m) => {
    const next = new Set(selected);
    next.has(m) ? next.delete(m) : next.add(m);
    setSelected(next);
  };

  const handleSave = async () => {
    await supabase.from('crisis_events_1777090000').update({ assigned_team: Array.from(selected) }).eq('id', event.id);
    onSave();
    onClose();
  };

  return (
    <ModalOverlay title={`Assign Team — ${event.client_name}`} onClose={onClose}>
      <div className="ac-stack">
        <p className="ac-muted ac-sm">Select team members to assign to this crisis event.</p>
        <div className="ac-stack-sm">
          {TEAM_MEMBERS.map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1px solid ${selected.has(m) ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: selected.has(m) ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', cursor: 'pointer', transition: 'all 0.15s' }}>
              <input type="checkbox" checked={selected.has(m)} onChange={() => toggle(m)} style={{ accentColor: 'var(--ac-primary)' }} />
              <SafeIcon icon={FiUser} size={14} style={{ color: selected.has(m) ? 'var(--ac-primary)' : 'var(--ac-muted)' }} />
              <span style={{ fontSize: 13, fontWeight: selected.has(m) ? 700 : 400 }}>{m}</span>
            </label>
          ))}
        </div>
        <div className="ac-grid-2" style={{ marginTop: 8 }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Confirm Assignment</Button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
export default function CrisisPage() {
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [modal, setModal] = useState(null); // 'create' | 'detail' | 'assign'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'resolved' | 'all'
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const refreshRef = useRef(null);

  const [form, setForm] = useState({
    client_name: '', client_crn: '', location: '', severity: 'high',
    crisis_type: 'mental_health', notes: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshRef.current = setInterval(fetchEvents, 15000);
    } else {
      clearInterval(refreshRef.current);
    }
    return () => clearInterval(refreshRef.current);
  }, [autoRefresh]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('crisis_events_1777090000')
      .select('*')
      .order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients_1777020684735').select('id,name,crn,care_centre').eq('status', 'active').order('name');
    setClients(data || []);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  // Pre-fill form when a patient is selected from the search list
  const selectPatient = (client) => {
    setForm(prev => ({ ...prev, client_name: client.name, client_crn: client.crn, location: client.care_centre || '' }));
    setPatientSearch('');
  };

  const handleCreate = async () => {
    if (!form.client_name) return showToast('Client name is required', 'error');
    const { error } = await supabase.from('crisis_events_1777090000').insert([{ ...form, status: 'active' }]);
    if (!error) { showToast('🚨 Crisis Event Raised!'); setModal(null); fetchEvents(); }
    else showToast(error.message, 'error');
  };

  const handleDispatch = async (event, type) => {
    const update = type === 'police' ? { police_requested: true } : { ambulance_requested: true };
    await supabase.from('crisis_events_1777090000').update(update).eq('id', event.id);
    showToast(`${type === 'police' ? '🚔 Police' : '🚑 Ambulance'} dispatched.`);
    fetchEvents();
  };

  const handleResolve = async (event) => {
    await supabase.from('crisis_events_1777090000')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', event.id);
    showToast('✅ Crisis Event Resolved.');
    fetchEvents();
  };

  // Filter logic
  const filtered = events
    .filter(e => activeTab === 'all' ? true : e.status === activeTab)
    .filter(e => filterSeverity === 'all' ? true : e.severity === filterSeverity);

  const activeEvents = events.filter(e => e.status === 'active');
  const resolvedEvents = events.filter(e => e.status === 'resolved');

  const tabs = [
    { id: 'active', label: `Active (${activeEvents.length})` },
    { id: 'resolved', label: `Resolved (${resolvedEvents.length})` },
    { id: 'all', label: `All (${events.length})` },
    { id: 'kanban', label: 'Kanban Board' },
  ];

  return (
    <div className="ac-stack">
      {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />}

      {/* Header */}
      <div className="ac-flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="ac-h1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiActivity} style={{ color: 'var(--ac-danger)' }} />
            Crisis Event Dashboard
          </h1>
          <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🕐 <LiveClock /></span>
            <span>·</span>
            <span style={{ color: autoRefresh ? 'var(--ac-success)' : 'var(--ac-muted)' }}>
              {autoRefresh ? '🟢 Live' : '⏸ Paused'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid var(--ac-border)', background: autoRefresh ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: autoRefresh ? 'var(--ac-primary)' : 'var(--ac-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
          >
            <SafeIcon icon={FiRefreshCw} size={12} />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
          <Button onClick={fetchEvents} variant="outline" icon={FiRefreshCw}>Refresh</Button>
          <Button
            icon={FiAlertTriangle}
            style={{ background: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }}
            onClick={() => { setForm({ client_name: '', client_crn: '', location: '', severity: 'high', crisis_type: 'mental_health', notes: '' }); setModal('create'); }}
          >
            Raise Event
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar events={events} />

      {/* Tabs + Filter */}
      <div className="ac-flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="ac-tabs" style={{ flex: 1, minWidth: 240 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`ac-tab ${activeTab === t.id ? 'ac-tab-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTab !== 'kanban' && (
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        )}
      </div>

      {/* Kanban Board */}
      {activeTab === 'kanban' && (
        <CrisisKanban
          events={events}
          onRefresh={fetchEvents}
          onViewEvent={e => { setSelectedEvent(e); setModal('detail'); }}
          showToast={showToast}
        />
      )}

      {/* Events List */}
      {activeTab !== 'kanban' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>Loading crisis events...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--ac-muted)', background: 'var(--ac-surface)', borderRadius: 14, border: '1px solid var(--ac-border)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No events found</div>
            <div style={{ fontSize: 13 }}>
              {activeTab === 'active' ? 'No active crisis events. All clear.' : 'No events match the current filter.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'resolved' ? '1fr 1fr' : '1fr', gap: 14 }}>
            {filtered.map(event =>
              event.status === 'resolved' ? (
                <div key={event.id} style={{ padding: '12px 16px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12 }}>
                  <div className="ac-flex-between">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{event.client_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>
                        {event.location} · {event.crisis_type?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>
                        Resolved: {event.resolved_at ? new Date(event.resolved_at).toLocaleString() : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <Badge tone={SEV_TONE[event.severity] || 'amber'}>{event.severity}</Badge>
                      <StatusBadge status="resolved" />
                    </div>
                  </div>
                </div>
              ) : (
                <EventCard
                  key={event.id}
                  event={event}
                  onView={e => { setSelectedEvent(e); setModal('detail'); }}
                  onDispatch={handleDispatch}
                  onResolve={handleResolve}
                  onAssign={e => { setSelectedEvent(e); setModal('assign'); }}
                />
              )
            )}
          </div>
        )
      )}

      {/* Create Modal */}
      {modal === 'create' && (
        <ModalOverlay title="🚨 Raise Crisis Event" onClose={() => setModal(null)}>
          <div className="ac-stack">
            {/* Patient search — pull from CRM */}
            <Field label="Search Existing Patient (CRM)">
              <div style={{ position: 'relative' }}>
                <Input
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Type name or CRN to search..."
                />
                {patientSearch.trim().length >= 2 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, zIndex: 50, maxHeight: 160, overflowY: 'auto', boxShadow: 'var(--ac-shadow-lg)', marginTop: 4 }}>
                    {clients
                      .filter(c => c.name?.toLowerCase().includes(patientSearch.toLowerCase()) || c.crn?.toLowerCase().includes(patientSearch.toLowerCase()))
                      .slice(0, 8)
                      .map(c => (
                        <div
                          key={c.id}
                          onClick={() => selectPatient(c)}
                          style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ac-border)', fontSize: 13 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--ac-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ac-muted)' }}>{c.crn}</span>
                        </div>
                      ))}
                    {clients.filter(c => c.name?.toLowerCase().includes(patientSearch.toLowerCase()) || c.crn?.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ac-muted)', textAlign: 'center' }}>No matching patients found</div>
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Client Name *">
              <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Full name" />
            </Field>
            <div className="ac-grid-2">
              <Field label="CRN">
                <Input value={form.client_crn} onChange={e => setForm({ ...form, client_crn: e.target.value })} placeholder="Enter CRN or search above" />
              </Field>
              <Field label="Location *">
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Address or area" />
              </Field>
            </div>
            <div className="ac-grid-2">
              <Field label="Severity">
                <Select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} options={['critical', 'high', 'medium', 'low']} />
              </Field>
              <Field label="Crisis Type">
                <Select value={form.crisis_type} onChange={e => setForm({ ...form, crisis_type: e.target.value })} options={CRISIS_TYPES} />
              </Field>
            </div>
            <Field label="Initial Notes">
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Describe the situation..." />
            </Field>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#450A0A', border: '1px solid var(--ac-danger)', fontSize: 12, color: '#FCA5A5' }}>
              ⚠️ This will immediately flag the event as active and notify all on-call staff.
            </div>
            <div className="ac-grid-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button style={{ background: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }} onClick={handleCreate}>
                Raise Crisis Event
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Detail Modal */}
      {modal === 'detail' && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setModal(null)}
          onUpdate={() => { fetchEvents(); showToast('Notes saved.'); }}
        />
      )}

      {/* Assign Modal */}
      {modal === 'assign' && selectedEvent && (
        <AssignTeamModal
          event={selectedEvent}
          onClose={() => setModal(null)}
          onSave={() => { fetchEvents(); showToast('Team assigned successfully.'); }}
        />
      )}

      <style>{`
        @keyframes crisis-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,48,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(255,59,48,0); }
        }
      `}</style>
    </div>
  );
}
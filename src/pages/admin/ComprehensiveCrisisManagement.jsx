import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, Select, StatusBadge, Textarea } from '../../components/UI';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const {
  FiAlertTriangle, FiCheckCircle, FiX, FiUserCheck, FiShield,
  FiPhone, FiClock, FiActivity, FiMapPin, FiUser, FiList,
  FiRefreshCw, FiEye, FiEdit2, FiZap, FiTrendingUp, FiAlertCircle,
  FiPlus, FiMap, FiFilter, FiCalendar, FiPieChart
} = FiIcons;

// ── Toast Notification ────────────────────────────────────────────────
const Toast = ({ msg, type = 'success', onClose }) => (
  <div className={`ac-toast ${type === 'error' ? 'ac-toast-err' : ''}`}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle} style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

// ── Modal Overlay ─────────────────────────────────────────────────────
const ModalOverlay = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: wide ? 800 : 500, boxShadow: 'var(--ac-shadow-xl)', maxHeight: '92vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 22 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ── Severity Configuration ────────────────────────────────────────────
const SEVERITY = {
  critical: { color: '#FF3B30', bg: 'var(--ac-badge-red-bg)',   label: 'CRITICAL', pulse: true },
  high:     { color: '#FF9500', bg: 'var(--ac-badge-amber-bg)', label: 'HIGH',     pulse: false },
  medium:   { color: '#007AFF', bg: 'var(--ac-badge-blue-bg)',  label: 'MEDIUM',   pulse: false },
  low:      { color: '#34C759', bg: 'var(--ac-badge-green-bg)', label: 'LOW',      pulse: false },
};

const SEV_TONE = { critical: 'red', high: 'amber', medium: 'blue', low: 'green' };

const CRISIS_TYPES = ['mental_health', 'medical', 'violence', 'substance', 'suicide_risk', 'domestic', 'other'];

const TEAM_MEMBERS = ['Dr. Sarah Smith', 'Dr. James Wilson', 'Nurse Chen', 'Paramedic Team Alpha', 'Social Worker Lee', 'Security Officer Brown'];

// ── Helper Functions ──────────────────────────────────────────────────
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

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{time.toLocaleTimeString()}</span>;
};

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

// ── Stats Bar (Critical Information Top) ──────────────────────────────
const CriticalStatsBar = ({ events }) => {
  const active = events.filter(e => e.status === 'active');
  const critical = active.filter(e => e.severity === 'critical').length;
  const high = active.filter(e => e.severity === 'high').length;
  const policeOut = active.filter(e => e.police_requested).length;
  const ambulanceOut = active.filter(e => e.ambulance_requested).length;

  const stats = [
    { label: 'Active Events', value: active.length, color: '#EF4444', icon: FiActivity, critical: true },
    { label: 'Critical', value: critical, color: '#FF3B30', icon: FiAlertTriangle, critical: true },
    { label: 'High Priority', value: high, color: '#FF9500', icon: FiAlertCircle, critical: true },
    { label: 'Police Dispatched', value: policeOut, color: '#507C7B', icon: FiShield, critical: false },
    { label: 'Ambulance Out', value: ambulanceOut, color: '#10B981', icon: FiPhone, critical: false },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
      {stats.map(s => (
        <motion.div key={s.label}
          className="ac-stat-tile"
          style={{
            borderLeft: s.critical ? `4px solid ${s.color}` : 'none',
            background: s.critical ? `linear-gradient(135deg, ${s.color}10 0%, ${s.color}05 100%)` : 'var(--ac-surface)',
          }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)' }}>{s.label}</span>
            <SafeIcon icon={s.icon} size={18} style={{ color: s.color, opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
        </motion.div>
      ))}
    </div>
  );
};

// ── Crisis Analytics Charts ───────────────────────────────────────────
const CrisisAnalytics = ({ events }) => {
  // Generate analytics data from events
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const trendData = last7Days.map((day) => ({
    day,
    events: events.filter(e => {
      const d = new Date(e.created_at);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === day;
    }).length,
    resolved: events.filter(e => {
      const d = new Date(e.resolved_at || e.created_at);
      return e.status === 'resolved' && d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === day;
    }).length,
  }));

  const typeData = CRISIS_TYPES.map(type => ({
    name: type.replace(/_/g, ' '),
    value: events.filter(e => e.crisis_type === type).length || 0,
  })).filter(t => t.value > 0);

  const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#64748B'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
      {/* Event Trends */}
      <Card title="7-Day Crisis Event Trends">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="day" style={{ fontSize: 12 }} />
            <YAxis style={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="events" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} name="Total Events" />
            <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
          {[{ color: '#EF4444', label: 'Total Events' }, { color: '#10B981', label: 'Resolved' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 12, height: 3, background: l.color, borderRadius: 2 }} />
              {l.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Crisis Type Distribution */}
      <Card title="Crisis Type Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" label={(entry) => `${entry.name}: ${entry.value}`}>
              {typeData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ── Interactive Heatmap & Dispatch ────────────────────────────────────
const HeatmapDispatch = ({ events }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Sydney metro bounds: lng 151.15–151.23, lat -33.86 (north) to -33.92 (south)
  const LNG_MIN = 151.15, LNG_MAX = 151.23;
  const LAT_NORTH = -33.86, LAT_SOUTH = -33.92;

  const regions = [
    { id: 'camperdown', name: 'Camperdown', events: events.filter(e => e.location?.toLowerCase().includes('camperdown')).length || 5, lat: -33.888, lng: 151.184 },
    { id: 'newtown',    name: 'Newtown',    events: events.filter(e => e.location?.toLowerCase().includes('newtown')).length    || 3, lat: -33.898, lng: 151.179 },
    { id: 'surry',      name: 'Surry Hills',events: events.filter(e => e.location?.toLowerCase().includes('surry')).length     || 7, lat: -33.885, lng: 151.214 },
    { id: 'redfern',    name: 'Redfern',    events: events.filter(e => e.location?.toLowerCase().includes('redfern')).length   || 2, lat: -33.893, lng: 151.204 },
  ];

  const getHeatColor = (count) => {
    if (count >= 7) return '#EF4444';
    if (count >= 4) return '#F59E0B';
    if (count >= 2) return '#3B82F6';
    return '#10B981';
  };

  const lngPct = (lng) => 10 + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 80;
  // lat: -33.86 (north=top=10%) → -33.92 (south=bottom=90%)
  const latPct = (lat) => 10 + ((lat - LAT_NORTH) / (LAT_SOUTH - LAT_NORTH)) * 80;

  return (
    <Card title="🗺️ Live Crisis Heatmap & Dispatch">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Heatmap visualization */}
        <div style={{ background: 'var(--ac-surface-soft)', borderRadius: 12, padding: 16, minHeight: 280, position: 'relative' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 12 }}>Sydney Metro Crisis Activity</div>
          <div style={{ position: 'relative', width: '100%', height: 240, border: '1px solid var(--ac-border)', borderRadius: 8, background: 'var(--ac-bg)' }}>
            {/* Grid lines for visual reference */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--ac-border) 1px, transparent 1px), linear-gradient(90deg, var(--ac-border) 1px, transparent 1px)', backgroundSize: '25% 25%', opacity: 0.4 }} />
            {regions.map(r => {
              const size = 36 + r.events * 7;
              const left = lngPct(r.lng);
              const top  = latPct(r.lat);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRegion(r === selectedRegion ? null : r)}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: getHeatColor(r.events),
                    opacity: selectedRegion?.id === r.id ? 0.9 : 0.7,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: `0 4px 16px ${getHeatColor(r.events)}60`,
                    transition: 'all 0.2s',
                    border: selectedRegion?.id === r.id ? '3px solid white' : '2px solid transparent',
                    zIndex: 2,
                    flexDirection: 'column',
                    lineHeight: 1.2,
                  }}
                  title={`${r.name}: ${r.events} events`}
                >
                  <span>{r.events}</span>
                </div>
              );
            })}
            {/* Region labels */}
            {regions.map(r => (
              <div key={`lbl-${r.id}`} style={{
                position: 'absolute',
                left: `${lngPct(r.lng)}%`,
                top: `calc(${latPct(r.lat)}% + ${(36 + r.events * 7) / 2 + 4}px)`,
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--ac-text-secondary)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 3,
              }}>{r.name}</div>
            ))}
          </div>
          {selectedRegion && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: `${getHeatColor(selectedRegion.events)}18`, border: `1px solid ${getHeatColor(selectedRegion.events)}`, borderRadius: 10, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: getHeatColor(selectedRegion.events), marginBottom: 4 }}>{selectedRegion.name}</div>
              <div style={{ color: 'var(--ac-text-secondary)' }}>{selectedRegion.events} active events in this area</div>
            </div>
          )}
        </div>

        {/* Region details */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 12 }}>Region Summary</div>
          {regions.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedRegion(r === selectedRegion ? null : r)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 8,
                cursor: 'pointer',
                background: selectedRegion?.id === r.id ? 'var(--ac-primary-soft)' : 'var(--ac-surface-soft)',
                border: `1px solid ${selectedRegion?.id === r.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                <span style={{
                  background: getHeatColor(r.events),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {r.events}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────────────────────
export default function ComprehensiveCrisisManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [raiseModal, setRaiseModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [crmClients, setCrmClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');

  const [newEvent, setNewEvent] = useState({
    client_crn: '', client_name: '', location: '', severity: 'medium',
    crisis_type: 'mental_health', description: '', police_requested: false, ambulance_requested: false,
  });

  useEffect(() => {
    fetchEvents();
    // Load CRM clients for linking
    supabase.from('clients_1777020684735').select('id, name, crn, care_centre, status')
      .eq('status', 'active').order('name').limit(200)
      .then(({ data }) => setCrmClients(data || []));
  }, []);

  const filteredCrmClients = useMemo(() => {
    if (clientSearch.length < 2) return [];
    const q = clientSearch.toLowerCase();
    return crmClients.filter(c =>
      c.name?.toLowerCase().includes(q) || c.crn?.toLowerCase().includes(q)
    );
  }, [crmClients, clientSearch]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('crisis_events_1777090008').select('*').order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  const generateMockEvents = () => { return []; }; // Deprecated — no longer used

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3500);
  };

  const handleRaiseEvent = async () => {
    if (!newEvent.client_name || !newEvent.location) {
      return showToast('Client name and location are required', 'error');
    }

    const { error } = await supabase.from('crisis_events_1777090008').insert([{
      ...newEvent,
      status: 'active',
      created_at: new Date().toISOString(),
    }]);

    if (!error) {
      showToast('Crisis event raised successfully');
      setRaiseModal(false);
      setNewEvent({ client_crn: '', client_name: '', location: '', severity: 'medium', crisis_type: 'mental_health', description: '', police_requested: false, ambulance_requested: false });
      fetchEvents();
    } else {
      showToast('Failed to raise crisis event', 'error');
    }
  };

  const handleResolveEvent = async (id) => {
    const { error } = await supabase.from('crisis_events_1777090008').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      showToast('Crisis event resolved');
      fetchEvents();
    }
  };

  const handleUpdateEvent = async (id, updates) => {
    const { error } = await supabase.from('crisis_events_1777090008').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      showToast('Event updated');
      setEditModal(null);
      fetchEvents();
    } else {
      showToast('Failed to update event', 'error');
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ padding: '0 0 40px' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast('')} />}

      {/* Header with live clock - wraps on small screens */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SafeIcon icon={FiAlertTriangle} size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
            <span>Crisis Management</span>
          </h1>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginTop: 4 }}>
            Real-time monitoring · <LiveClock />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button variant="outline" icon={FiRefreshCw} onClick={fetchEvents}>Refresh</Button>
          <Button icon={FiPlus} onClick={() => setRaiseModal(true)} style={{ background: '#EF4444', borderColor: '#EF4444' }}>
            Raise Event
          </Button>
        </div>
      </div>

      {/* Critical Stats - Top Priority */}
      <CriticalStatsBar events={events} />

      {/* Analytics Charts */}
      <CrisisAnalytics events={events} />

      {/* Heatmap & Dispatch */}
      <HeatmapDispatch events={events} />

      {/* Active Events List */}
      <Card title="Active Crisis Events" icon={FiList}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <Select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} style={{ width: 'auto' }}
            options={[
              { value: 'all', label: 'All Severities' },
              ...Object.keys(SEVERITY).map(s => ({ value: s, label: SEVERITY[s].label }))
            ]}
          />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 'auto' }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: 'var(--ac-muted)', alignSelf: 'center' }}>
            {filteredEvents.length} events
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ac-muted)', fontSize: 14 }}>Loading events…</div>
          )}
          {!loading && filteredEvents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🟢</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No crisis events</div>
              <div style={{ color: 'var(--ac-muted)', fontSize: 13 }}>
                {events.length === 0 ? 'No events have been raised yet.' : 'No events match the current filters.'}
              </div>
            </div>
          )}
          {filteredEvents.map(event => {
            const sev = SEVERITY[event.severity] || SEVERITY.medium;
            return (
              <div key={event.id} style={{
                background: event.status === 'active' ? sev.bg : 'var(--ac-surface-soft)',
                border: `2px solid ${event.status === 'active' ? sev.color : 'var(--ac-border)'}`,
                borderRadius: 14,
                padding: 14,
                transition: 'all 0.2s',
              }}>
                {/* Top row: name + timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>{event.client_name}</span>
                    <Badge tone={SEV_TONE[event.severity]}>{sev.label}</Badge>
                    {event.client_crn && crmClients.some(c => c.crn === event.client_crn) && (
                      <Badge tone="teal">👤 CRM</Badge>
                    )}
                  </div>
                  {event.status === 'active' && <EventTimer createdAt={event.created_at} severity={event.severity} />}
                </div>
                {/* Dispatch badges */}
                {(event.police_requested || event.ambulance_requested) && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {event.police_requested && <Badge tone="violet">🚔 Police</Badge>}
                    {event.ambulance_requested && <Badge tone="green">🚑 Ambulance</Badge>}
                  </div>
                )}
                {/* Meta */}
                <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginBottom: 6 }}>
                  <SafeIcon icon={FiMapPin} size={12} style={{ marginRight: 4 }} />
                  {event.location} · {event.crisis_type?.replace(/_/g, ' ')}
                </div>
                {event.description && (
                  <div style={{ fontSize: 13, color: 'var(--ac-text)', marginBottom: 10 }}>
                    {event.description}
                  </div>
                )}
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setEditModal({ ...event })} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '6px 14px' }}>
                    <SafeIcon icon={FiEdit2} size={13} /> Edit / Notes
                  </button>
                  {event.status === 'active' && (
                    <button onClick={() => handleResolveEvent(event.id)} className="ac-btn ac-btn-primary" style={{ fontSize: 12, padding: '6px 14px', background: '#10B981', borderColor: '#10B981' }}>
                      <SafeIcon icon={FiCheckCircle} size={13} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Raise Event Modal */}
      {raiseModal && (
        <ModalOverlay title="Raise Crisis Event" onClose={() => setRaiseModal(false)} wide>
          <div className="ac-stack">
            {/* CRM Client Lookup */}
            <div style={{ background: 'var(--ac-surface-soft)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ac-text-secondary)' }}>🔗 Link to CRM Client</div>
              <Input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search by name or CRN…"
              />
              {clientSearch.length >= 2 && (
                <div style={{ marginTop: 8, maxHeight: 160, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)' }}>
                  {filteredCrmClients.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ac-muted)' }}>No matching clients found</div>
                  ) : filteredCrmClients.map(c => (
                    <button key={c.id} onClick={() => {
                      setNewEvent(e => ({ ...e, client_crn: c.crn || '', client_name: c.name || '', location: c.care_centre || e.location }));
                      setClientSearch('');
                    }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--ac-border)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--ac-text)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ac-primary)', color: 'var(--ac-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{(c.name || '?')[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{c.crn} {c.care_centre ? `· ${c.care_centre}` : ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {newEvent.client_name && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#D1FAE5', borderRadius: 8, fontSize: 13, color: '#065F46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SafeIcon icon={FiCheckCircle} size={14} /> Linked: {newEvent.client_name} ({newEvent.client_crn || 'no CRN'})
                </div>
              )}
            </div>
            <div className="ac-grid-2">
              <Field label="Client CRN">
                <Input value={newEvent.client_crn} onChange={(e) => setNewEvent({ ...newEvent, client_crn: e.target.value })} placeholder="CRN-12345" />
              </Field>
              <Field label="Client Name *">
                <Input value={newEvent.client_name} onChange={(e) => setNewEvent({ ...newEvent, client_name: e.target.value })} placeholder="John Doe" />
              </Field>
            </div>
            <div className="ac-grid-2">
              <Field label="Location *">
                <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Street address" />
              </Field>
              <Field label="Severity">
                <Select value={newEvent.severity} onChange={(e) => setNewEvent({ ...newEvent, severity: e.target.value })}
                  options={Object.keys(SEVERITY).map(s => ({ value: s, label: SEVERITY[s].label }))}
                />
              </Field>
            </div>
            <Field label="Crisis Type">
              <Select value={newEvent.crisis_type} onChange={(e) => setNewEvent({ ...newEvent, crisis_type: e.target.value })}
                options={CRISIS_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').toUpperCase() }))}
              />
            </Field>
            <Field label="Description">
              <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Describe the situation..." rows={4} />
            </Field>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={newEvent.police_requested} onChange={(e) => setNewEvent({ ...newEvent, police_requested: e.target.checked })} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>🚔 Request Police</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={newEvent.ambulance_requested} onChange={(e) => setNewEvent({ ...newEvent, ambulance_requested: e.target.checked })} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>🚑 Request Ambulance</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 12 }}>
              <Button variant="outline" onClick={() => setRaiseModal(false)}>Cancel</Button>
              <Button onClick={handleRaiseEvent} style={{ flex: 1, background: '#EF4444', borderColor: '#EF4444' }}>
                Raise Crisis Event
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Edit / Notes Modal */}
      {editModal && (
        <ModalOverlay title="Edit Crisis Event & Notes" onClose={() => setEditModal(null)} wide>
          <EditCrisisEventModal
            event={editModal}
            onSave={handleUpdateEvent}
            onClose={() => setEditModal(null)}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────
function EditCrisisEventModal({ event, onSave, onClose }) {
  const [form, setForm] = useState({
    client_name:  event.client_name  || '',
    client_crn:   event.client_crn   || '',
    location:     event.location     || '',
    severity:     event.severity     || 'medium',
    crisis_type:  event.crisis_type  || 'mental_health',
    description:  event.description  || '',
    notes:        event.notes        || '',
    clinical_note: event.clinical_note || '',
    police_requested:    !!event.police_requested,
    ambulance_requested: !!event.ambulance_requested,
  });
  const [tab, setTab] = useState('details');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(event.id, form);
    setSaving(false);
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', gap: 6, marginBottom: 4, borderBottom: '1px solid var(--ac-border)', paddingBottom: 12 }}>
        {[
          { id: 'details',  label: '📋 Details' },
          { id: 'notes',    label: '📝 Notes' },
          { id: 'clinical', label: '🏥 Clinical Notes' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, background: tab === t.id ? 'var(--ac-primary-soft)' : 'transparent', color: tab === t.id ? 'var(--ac-primary)' : 'var(--ac-text-secondary)', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <>
          <div className="ac-grid-2">
            <Field label="Client Name">
              <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            </Field>
            <Field label="Client CRN">
              <Input value={form.client_crn} onChange={e => setForm({ ...form, client_crn: e.target.value })} />
            </Field>
          </div>
          <div className="ac-grid-2">
            <Field label="Location">
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Severity">
              <Select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                options={Object.keys(SEVERITY).map(s => ({ value: s, label: SEVERITY[s].label }))} />
            </Field>
          </div>
          <Field label="Crisis Type">
            <Select value={form.crisis_type} onChange={e => setForm({ ...form, crisis_type: e.target.value })}
              options={CRISIS_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').toUpperCase() }))} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.police_requested} onChange={e => setForm({ ...form, police_requested: e.target.checked })} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>🚔 Police Requested</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.ambulance_requested} onChange={e => setForm({ ...form, ambulance_requested: e.target.checked })} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>🚑 Ambulance Requested</span>
            </label>
          </div>
        </>
      )}

      {tab === 'notes' && (
        <Field label="Event Notes">
          <Textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Add notes about this crisis event, updates, or follow-up actions…"
            style={{ minHeight: 180 }}
          />
        </Field>
      )}

      {tab === 'clinical' && (
        <Field label="Clinical Notes">
          <Textarea
            value={form.clinical_note}
            onChange={e => setForm({ ...form, clinical_note: e.target.value })}
            placeholder="Record clinical observations, interventions, medications, and treatment notes…"
            style={{ minHeight: 180 }}
          />
          <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 6, padding: '8px 12px', background: 'var(--ac-bg)', borderRadius: 8, border: '1px solid var(--ac-border)' }}>
            ⚕️ Clinical notes are confidential and subject to privacy requirements. Ensure all entries comply with your organisation's clinical documentation standards.
          </div>
        </Field>
      )}

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button icon={FiCheckCircle} onClick={save} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

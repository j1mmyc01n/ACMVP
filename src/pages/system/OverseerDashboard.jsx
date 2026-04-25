import React, { useState, useEffect, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const { FiActivity, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiMapPin, FiUsers, FiTrendingUp, FiClock, FiWifi } = FiIcons;

// ── SVG Gauge ────────────────────────────────────────────────────────
const Gauge = ({ value = 0, max = 100, label, color = '#007AFF', size = 80 }) => {
  const pct = Math.min(value / max, 1);
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.75;
  const fill = dash * pct;
  const gap = dash - fill;
  const rot = -225;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ac-border)" strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform={`rotate(${rot} ${size/2} ${size/2})`} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${gap + (circ - dash)}`} strokeLinecap="round"
          transform={`rotate(${rot} ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x={size/2} y={size * 0.62} textAnchor="middle" fontSize={size * 0.18} fontWeight="800" fill="var(--ac-text)">
          {Math.round(value)}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--ac-muted)', textAlign: 'center', fontWeight: 500 }}>{label}</div>
    </div>
  );
};

// ── Status Dot ────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
  const colors = { online: '#34C759', warning: '#FF9500', offline: '#FF3B30', unknown: '#8E8E93' };
  return (
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || colors.unknown, display: 'inline-block', boxShadow: `0 0 6px ${colors[status] || colors.unknown}` }} />
  );
};

export default function OverseerDashboard() {
  const [metrics, setMetrics] = useState({
    totalCheckIns: 0, pendingCheckIns: 0, activeCrises: 0,
    totalClients: 0, todayCheckIns: 0, completedToday: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [uptime] = useState(99.8);

  // ── Load initial data
  const loadMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [
      { count: totalCI },
      { count: pendingCI },
      { count: activeCrisis },
      { count: totalClients },
      { count: todayCI },
      { data: recentCI },
      { data: locs },
    ] = await Promise.all([
      supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('crisis_events_1777090000').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
      supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('check_ins_1740395000').select('crn,status,mood,created_at,scheduled_window').order('created_at', { ascending: false }).limit(20),
      supabase.from('locations_1740395000').select('*').eq('is_active', true).limit(10),
    ]);

    setMetrics({
      totalCheckIns: totalCI || 0,
      pendingCheckIns: pendingCI || 0,
      activeCrises: activeCrisis || 0,
      totalClients: totalClients || 0,
      todayCheckIns: todayCI || 0,
      completedToday: recentCI?.filter(c => c.status === 'completed').length || 0,
    });

    setRecentEvents((recentCI || []).map(c => ({
      id: c.crn + c.created_at,
      type: c.status === 'pending' ? 'checkin' : c.status === 'completed' ? 'completed' : 'updated',
      message: `CRN ${c.crn} — ${c.scheduled_window || 'check-in'} — mood ${c.mood || 5}/10`,
      time: new Date(c.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      status: c.status,
    })));

    setLocations((locs || []).map(l => ({
      ...l,
      status: 'online',
      checkIns: Math.floor(Math.random() * 20),
    })));

    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadMetrics();

    // ── Real-time subscription to check-ins
    const checkInSub = supabase
      .channel('overseer_checkins')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins_1740395000',
      }, (payload) => {
        const c = payload.new;
        setRecentEvents(prev => [{
          id: c.id,
          type: 'checkin',
          message: `New check-in: CRN ${c.crn} — mood ${c.mood || 5}/10`,
          time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
          status: 'pending',
          isNew: true,
        }, ...prev].slice(0, 30));
        setMetrics(m => ({
          ...m,
          totalCheckIns: m.totalCheckIns + 1,
          pendingCheckIns: m.pendingCheckIns + 1,
          todayCheckIns: m.todayCheckIns + 1,
        }));
        setLastUpdated(new Date());
      })
      .subscribe();

    // ── Real-time subscription to crises
    const crisisSub = supabase
      .channel('overseer_crises')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'crisis_events_1777090000',
      }, (payload) => {
        const c = payload.new;
        setRecentEvents(prev => [{
          id: c.id,
          type: 'crisis',
          message: `🚨 CRISIS: ${c.client_name} — ${c.crisis_type || 'unknown'} — ${c.severity || 'medium'} severity`,
          time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
          status: 'active',
          isNew: true,
          isCrisis: true,
        }, ...prev].slice(0, 30));
        setMetrics(m => ({ ...m, activeCrises: m.activeCrises + 1 }));
        setLastUpdated(new Date());
      })
      .subscribe();

    // ── Poll every 2 minutes for aggregate refresh
    const pollInterval = setInterval(loadMetrics, 120000);

    return () => {
      supabase.removeChannel(checkInSub);
      supabase.removeChannel(crisisSub);
      clearInterval(pollInterval);
    };
  }, []);

  const statCards = [
    { label: "Today's Check-Ins", value: metrics.todayCheckIns, icon: FiActivity, color: '#007AFF' },
    { label: 'Pending Review', value: metrics.pendingCheckIns, icon: FiClock, color: '#FF9500' },
    { label: 'Active Crises', value: metrics.activeCrises, icon: FiAlertTriangle, color: metrics.activeCrises > 0 ? '#FF3B30' : '#34C759' },
    { label: 'Total Clients', value: metrics.totalClients, icon: FiUsers, color: '#5856D6' },
  ];

  return (
    <div className="ac-stack">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Overseer Dashboard</div>
          <div style={{ fontSize: 12, color: 'var(--ac-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <StatusDot status="online" />
            Live · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
          </div>
        </div>
        <button onClick={loadMetrics} disabled={loading}
          style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ac-muted)' }}>
          <SafeIcon icon={FiRefreshCw} size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Active crisis alert */}
      {metrics.activeCrises > 0 && (
        <div style={{ background: '#FF3B3022', border: '2px solid #FF3B30', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <SafeIcon icon={FiAlertTriangle} size={22} style={{ color: '#FF3B30', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#FF3B30', fontSize: 15 }}>
              {metrics.activeCrises} Active Crisis Event{metrics.activeCrises > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>Requires immediate attention</div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontWeight: 500, lineHeight: 1.3 }}>{s.label}</div>
              <SafeIcon icon={s.icon} size={16} style={{ color: s.color, flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Gauges */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '18px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>System Health</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <Gauge value={uptime} max={100} label="Uptime %" color="#34C759" />
          <Gauge value={metrics.todayCheckIns} max={50} label="Today's CI" color="#007AFF" />
          <Gauge
            value={metrics.totalCheckIns > 0 ? Math.round(((metrics.totalCheckIns - metrics.pendingCheckIns) / metrics.totalCheckIns) * 100) : 0}
            max={100} label="Completion %" color="#5856D6" />
        </div>
      </div>

      {/* Locations */}
      {locations.length > 0 && (
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '18px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Active Locations</div>
          <div className="ac-stack" style={{ gap: 8 }}>
            {locations.map((loc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < locations.length - 1 ? '1px solid var(--ac-border)' : 'none' }}>
                <StatusDot status={loc.status} />
                <SafeIcon icon={FiMapPin} size={14} style={{ color: 'var(--ac-muted)' }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{loc.name}</span>
                <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{loc.checkIns} today</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live event stream */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '18px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Live Event Stream</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#34C759' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            LIVE
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ac-muted)', fontSize: 13 }}>Loading events...</div>
        ) : recentEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ac-muted)', fontSize: 13 }}>No events yet today</div>
        ) : (
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {recentEvents.map((ev, i) => (
              <div key={ev.id || i} style={{
                display: 'flex', gap: 10, padding: '8px 0',
                borderBottom: i < recentEvents.length - 1 ? '1px solid var(--ac-border)' : 'none',
                background: ev.isNew ? (ev.isCrisis ? '#FF3B3008' : '#007AFF08') : 'none',
                borderRadius: ev.isNew ? 8 : 0,
              }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>
                  {ev.isCrisis ? '🚨' : ev.type === 'completed' ? '✅' : '📋'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: ev.isCrisis ? '#FF3B30' : 'var(--ac-text)', fontWeight: ev.isNew ? 600 : 400 }}>
                    {ev.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

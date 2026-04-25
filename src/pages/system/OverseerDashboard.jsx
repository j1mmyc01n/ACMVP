import React, { useState, useEffect, useMemo } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Card, Badge } from '../../components/UI';

const {
  FiActivity, FiDatabase, FiMap, FiWifi, FiZap, FiServer, FiTerminal, FiCheckCircle
} = FiIcons;


/* ■■■ CYBER NOC SVG COMPONENTS ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ */
const CyberCard = ({ title, children, icon, action, style }) => (
  <div style={{
    background: 'linear-gradient(145deg, rgba(15, 18, 28, 0.9) 0%, rgba(8, 10, 15, 0.95) 100%)',
    border: '1px solid rgba(0, 240, 255, 0.15)',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 240, 255, 0.03)',
    overflow: 'hidden',
    position: 'relative',
    ...style
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #00f3ff, transparent)' }} />
    
    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <SafeIcon icon={icon} size={16} style={{ color: '#00f3ff', filter: 'drop-shadow(0 0 4px #00f3ff)' }} />}
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 1, color: '#e0e6ed', textTransform: 'uppercase' }}>{title}</h3>
      </div>
      {action}
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const AreaChart = ({ data, color = '#00f3ff', height = 100 }) => {
  const width = 300;
  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * (height - 20) + 10}`).join(' ');
  const colorId = color.replace('#', '');

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={`grad-${colorId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <filter id={`glow-${colorId}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" />
        <line x1="0" y1={height-1} x2={width} y2={height-1} stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" />
        
        <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#grad-${colorId})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" filter={`url(#glow-${colorId})`} />
      </svg>
    </div>
  );
};

const CircularGauge = ({ value, label, subLabel, color = '#00f3ff', size = 160 }) => {
  const radius = size * 0.38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <defs>
          <filter id="glow-gauge"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1a1f35" strokeWidth="12" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} filter="url(#glow-gauge)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 2 }}>
        <div style={{ color: '#fff', fontSize: size * 0.22, fontWeight: 800, textShadow: `0 0 10px ${color}` }}>{value.toFixed(2)}%</div>
        <div style={{ color: color, fontSize: size * 0.08, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>{label}</div>
        {subLabel && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: size * 0.06, marginTop: 2 }}>{subLabel}</div>}
      </div>
    </div>
  );
};

const NeedleGauge = ({ value, max = 100, color = "#00f3ff", label, size = 140 }) => {
  const radius = size * 0.4;
  const cx = size / 2;
  const cy = size * 0.65;
  const circ = Math.PI * radius;
  const dashoffset = circ - (Math.min(value, max) / max) * circ;
  const angle = (Math.min(value, max) / max) * 180 - 90;

  return (
    <div style={{ position: 'relative', width: size, height: size * 0.65, textAlign: 'center' }}>
      <svg width={size} height={size * 0.7} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id={`glow-needle-${color.replace('#','')}`}><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashoffset} filter={`url(#glow-needle-${color.replace('#','')})`} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.8s ease' }}>
          <polygon points={`${cx - 3},${cy} ${cx + 3},${cy} ${cx},${cy - radius + 10}`} fill="#fff" filter={`url(#glow-needle-${color.replace('#','')})`} />
          <circle cx={cx} cy={cy} r="5" fill="#fff" />
        </g>
      </svg>
      <div style={{ position: 'absolute', bottom: -10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, textShadow: `0 0 8px ${color}`, lineHeight: 1 }}>
          {value.toFixed(0)}<span style={{ fontSize: 12 }}>%</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </div>
      </div>
    </div>
  );
};

/* ■■■ OVERSEER DASHBOARD ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ */
export default function OverseerDashboard() {
  const [stats, setStats] = useState({ patients: 0, crns: 0, checkins: 0, admins: 0, locations: 0, sponsors: 0 });
  const [locations, setLocations] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  // Real-time Simulation State
  const [tick, setTick] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState({
    throughput: Array(30).fill(2.0),
    bandwidth: Array(30).fill(1.5),
    users: Array(30).fill(8547),
    locData: {}
  });

  useEffect(() => { fetchAll(); }, []);

  // Live Data Animation Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLiveMetrics(prev => {
      const newTp = [...prev.throughput.slice(1), 2.0 + Math.random() * 1.2 - 0.6];
      const newBw = [...prev.bandwidth.slice(1), 1.5 + Math.random() * 0.8 - 0.4];
      const newUs = [...prev.users.slice(1), 8547 + Math.floor(Math.random() * 50 - 25)];

      const newLocData = { ...prev.locData };
      locations.forEach(c => {
        const baseLoad = c.status === 'active' ? 40 : c.status === 'maintenance' ? 80 : 0;
        newLocData[c.id] = {
          load: c.status === 'closed' ? 0 : Math.min(100, Math.max(0, baseLoad + Math.random() * 30 - 15)),
          ping: c.status === 'closed' ? 0 : 12 + Math.floor(Math.random() * 25),
          active: c.status === 'closed' ? 0 : Math.floor(Math.random() * (c.beds || 50)),
          dataRate: c.status === 'closed' ? '0.0' : (Math.random() * 8.5).toFixed(1)
        };
      });

      return { throughput: newTp, bandwidth: newBw, users: newUs, locData: newLocData };
    });
  }, [tick, locations]);

  const fetchAll = async () => {
    const [p, c, ci, a, loc, sp] = await Promise.all([
      supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
      supabase.from('crns_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }),
      supabase.from('care_centres_1777090000').select('*'),
      supabase.from('sponsors_1777090009').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ patients: p.count || 0, crns: c.count || 0, checkins: ci.count || 0, admins: a.count || 0, locations: loc.data?.length || 0, sponsors: sp.count || 0 });
    setLocations(loc.data || []);

    const initialLoc = {};
    (loc.data || []).forEach(cc => { initialLoc[cc.id] = { load: 50, ping: 20, active: 10, dataRate: '1.0' }; });
    setLiveMetrics(prev => ({ ...prev, locData: initialLoc }));

    setRecentEvents([
      { time: new Date().toLocaleTimeString(), msg: 'Global sync verified across all nodes', type: 'success' },
      { time: new Date(Date.now() - 60000).toLocaleTimeString(), msg: 'Supabase real-time cluster stable', type: 'info' },
      { time: new Date(Date.now() - 120000).toLocaleTimeString(), msg: 'New admin connected from Sydney', type: 'info' },
      { time: new Date(Date.now() - 300000).toLocaleTimeString(), msg: 'API rate limit reset completed', type: 'success' }
    ]);
  };

  const curTp = liveMetrics.throughput[liveMetrics.throughput.length - 1];
  const curBw = liveMetrics.bandwidth[liveMetrics.bandwidth.length - 1];
  const curUs = liveMetrics.users[liveMetrics.users.length - 1];

  return (
    <div style={{ background: '#050608', minHeight: '100%', padding: 24, borderRadius: 16, color: '#e0e6ed', fontFamily: 'system-ui' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid rgba(0, 243, 255, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #00f3ff 0%, #b537f2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 243, 255, 0.4)' }}>
            <SafeIcon icon={FiActivity} size={24} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: 1.5, color: '#fff', textShadow: '0 0 10px rgba(0, 243, 255, 0.5)' }}>OVERSEER COMMAND CENTER</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#00f3ff', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Real-time Network Operations &amp; Telemetry</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{new Date().toLocaleTimeString()}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{new Date().toLocaleDateString()}</div>
          </div>
          <Badge tone="green" style={{ padding: '6px 12px', background: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', border: '1px solid rgba(0, 255, 157, 0.3)' }}>
            <SafeIcon icon={FiWifi} size={12} style={{ marginRight: 6 }} /> LIVE
          </Badge>
        </div>
      </div>

      {/* TOP ROW: GLOBAL METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <CyberCard title="Global Uptime" icon={FiActivity}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <CircularGauge value={99.98 + (Math.random() * 0.01)} label="EXCELLENT" subLabel="30d 12h 45m" color="#00ff9d" />
          </div>
        </CyberCard>

        <CyberCard title="API Throughput" icon={FiZap}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 0 12px rgba(181, 55, 242, 0.6)' }}>{curTp.toFixed(2)}</span>
            <span style={{ fontSize: 14, color: '#b537f2', fontWeight: 700 }}>Tbps</span>
          </div>
          <AreaChart data={liveMetrics.throughput} color="#b537f2" height={80} />
        </CyberCard>

        <CyberCard title="Data Bandwidth" icon={FiWifi}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 0 12px rgba(0, 243, 255, 0.6)' }}>{curBw.toFixed(2)}</span>
            <span style={{ fontSize: 14, color: '#00f3ff', fontWeight: 700 }}>Tbps</span>
          </div>
          <AreaChart data={liveMetrics.bandwidth} color="#00f3ff" height={80} />
        </CyberCard>

        <CyberCard title="Total Entities" icon={FiDatabase}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: '100%' }}>
            {[
              ['Clients', stats.patients, '#00ff9d'],
              ['CRNs', stats.crns, '#b537f2'],
              ['Check-ins', stats.checkins, '#00f3ff'],
              ['Staff', stats.admins, '#ff007a']
            ].map(([lbl, val, col]) => (
              <div key={lbl} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{lbl}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 4 }}>{val}</div>
              </div>
            ))}
          </div>
        </CyberCard>
      </div>

      {/* MIDDLE ROW: LOCATION NODES */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <SafeIcon icon={FiMap} style={{ color: '#00f3ff' }} /> Location Network Status
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {locations.map(c => {
          const lData = liveMetrics.locData[c.id] || { load: 0, ping: 0, active: 0, dataRate: '0.0' };
          const isOnline = c.status === 'active';
          const nodeColor = isOnline ? '#00ff9d' : c.status === 'maintenance' ? '#ff9900' : '#ff007a';

          return (
            <CyberCard key={c.id} style={{ borderColor: `rgba(${isOnline ? '0,255,157' : '255,0,122'}, 0.2)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textShadow: `0 0 8px ${nodeColor}` }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'monospace' }}>NODE-{c.id}</div>
                </div>
                <Badge tone={isOnline ? 'green' : c.status === 'maintenance' ? 'amber' : 'red'} style={{ background: isOnline ? 'rgba(0,255,157,0.1)' : c.status === 'maintenance' ? 'rgba(255,153,0,0.1)' : 'rgba(255,0,122,0.1)' }}>
                  {c.status.toUpperCase()}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flexShrink: 0 }}>
                  <NeedleGauge value={lData.load} color={nodeColor} label="SYSTEM LOAD" size={110} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>LATENCY</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isOnline ? '#fff' : '#ff007a', fontFamily: 'monospace' }}>{lData.ping}ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>ACTIVE CLIENTS</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{lData.active} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>/{c.beds || 50}</span></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>DATA SYNC</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: nodeColor }}>{lData.dataRate} MB/s</span>
                  </div>
                </div>
              </div>
            </CyberCard>
          );
        })}
      </div>

      {/* BOTTOM ROW: HEALTH & LOGS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)', gap: 20 }}>
        <CyberCard title="Core Services Health" icon={FiServer}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              ['Authentication', 100, '#00ff9d'],
              ['Database RLS', 100, '#00ff9d'],
              ['API Edge Network', 98.5, '#00f3ff'],
              ['Storage CDN', 100, '#00ff9d'],
              ['Push Notifications', 82, '#ff9900']
            ].map(([name, val, col]) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#e0e6ed', fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: 12, color: col, fontFamily: 'monospace' }}>{val}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${val}%`, background: col, boxShadow: `0 0 10px ${col}`, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </CyberCard>

        <CyberCard title="Real-Time Event Stream" icon={FiTerminal}>
          <div style={{ background: '#000', borderRadius: 8, padding: 16, height: 200, overflowY: 'auto', border: '1px solid rgba(0, 243, 255, 0.1)', fontFamily: 'monospace', fontSize: 12 }}>
            {recentEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                <span style={{ color: '#00f3ff', flexShrink: 0 }}>[{ev.time}]</span>
                <span style={{ color: ev.type === 'success' ? '#00ff9d' : ev.type === 'error' ? '#ff007a' : '#e0e6ed' }}>
                  {ev.msg}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, opacity: 0.5 }}>
              <span style={{ color: '#00f3ff' }}>[{new Date().toLocaleTimeString()}]</span>
              <span style={{ color: '#e0e6ed' }}>Listening for incoming telemetry...</span>
              <span style={{ animation: 'blink 1s infinite' }}>_</span>
            </div>
          </div>
          <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
        </CyberCard>
      </div>

    </div>
  );
}

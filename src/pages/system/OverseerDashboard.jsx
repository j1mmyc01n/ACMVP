import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format, subHours, subDays } from 'date-fns';
import { supabase } from '../../supabase/supabase';

// ── Circular Progress Ring ────────────────────────────────────────────
const CircularProgress = ({ value = 0, size = 180, strokeWidth = 12, color = '#00D9FF', label, status }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0, 217, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out',
            filter: `drop-shadow(0 0 8px ${color})`
          }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {progress.toFixed(2)}<span style={{ fontSize: 24 }}>%</span>
        </div>
        {status && (
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginTop: 4
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Metric Card Component ────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, unit, trend, trendValue, color, chart }) => {
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
  
  return (
    <div style={{
      background: 'rgba(44, 44, 64, 0.6)',
      border: '1px solid rgba(100, 100, 140, 0.3)',
      borderRadius: 16,
      padding: '20px',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `1px solid ${color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {Icon && <Icon size={20} />}
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: trendColor, fontWeight: 600 }}>
            <span>{trend === 'up' ? '↑' : '↓'}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginBottom: 8 }}>
        {label}
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 18, color: '#9CA3AF', fontWeight: 600 }}>
            {unit}
          </span>
        )}
      </div>

      {/* Mini chart */}
      {chart && (
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: 60, opacity: 0.3 }}>
          {chart}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
        vs yesterday
      </div>
    </div>
  );
};

// ── World Map Visual (simplified) ────────────────────────────────────
const WorldMap = ({ activities }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: 200, 
      background: 'linear-gradient(180deg, rgba(0, 100, 255, 0.05) 0%, rgba(150, 0, 255, 0.05) 100%)',
      borderRadius: 12,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Simplified world map dots */}
      <div style={{ position: 'relative', width: '90%', height: '80%' }}>
        {/* Grid overlay */}
        <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.1 }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00D9FF" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Activity dots */}
        {activities.map((activity, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${activity.x}%`,
              top: `${activity.y}%`,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: activity.color,
              boxShadow: `0 0 12px ${activity.color}`,
              animation: 'pulse 2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ── System Health Service Row ────────────────────────────────────────
const ServiceRow = ({ name, status, percentage }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
      <div style={{ fontSize: 13, color: '#E5E7EB' }}>{name}</div>
    </div>
    <div style={{ 
      width: 120, 
      height: 6, 
      background: 'rgba(100, 100, 140, 0.3)', 
      borderRadius: 3,
      overflow: 'hidden',
      marginRight: 12
    }}>
      <div style={{ 
        width: `${percentage}%`, 
        height: '100%', 
        background: percentage === 100 ? '#00D9FF' : percentage > 95 ? '#10B981' : '#EF4444',
        borderRadius: 3,
        transition: 'width 0.5s ease'
      }} />
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', minWidth: 50, textAlign: 'right' }}>
      {percentage}%
    </div>
  </div>
);

export default function OverseerDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState('Last 24 Hours');
  const [metrics, setMetrics] = useState({
    uptime: 99.98,
    throughput: 2.45,
    bandwidth: 1.72,
    usersOnline: 8547,
    totalCheckIns: 0,
    pendingCheckIns: 0,
    activeCrises: 0,
    totalClients: 0
  });

  const [realtimeActivities, setRealtimeActivities] = useState([
    { id: 1, type: 'login', location: 'New York, US', time: '12:45:21 AM', color: '#00D9FF', x: 25, y: 35 },
    { id: 2, type: 'transfer', location: 'Frankfurt, DE', time: '12:45:18 AM', color: '#E91E63', x: 52, y: 30 },
    { id: 3, type: 'sync', location: 'Singapore, SG', time: '12:45:15 AM', color: '#00D9FF', x: 75, y: 55 },
    { id: 4, type: 'login', location: 'São Paulo, BR', time: '12:45:11 AM', color: '#00D9FF', x: 32, y: 70 },
    { id: 5, type: 'transfer', location: 'Sydney, AU', time: '12:45:08 AM', color: '#E91E63', x: 85, y: 75 }
  ]);

  // Generate throughput data
  const [throughputData, setThroughputData] = useState([]);
  const [bandwidthData, setBandwidthData] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [uptimeHistoryData, setUptimeHistoryData] = useState([]);

  // Network usage data
  const networkUsageData = [
    { name: 'US East', value: 35, gbps: 857, color: '#00D9FF' },
    { name: 'US West', value: 25, gbps: 612, color: '#7C3AED' },
    { name: 'Europe', value: 20, gbps: 490, color: '#E91E63' },
    { name: 'Asia Pacific', value: 15, gbps: 367, color: '#F59E0B' },
    { name: 'South America', value: 5, gbps: 122, color: '#10B981' }
  ];

  // System health services
  const systemServices = [
    { name: 'Web Servers', status: 'online', percentage: 100 },
    { name: 'Database', status: 'online', percentage: 100 },
    { name: 'API Services', status: 'online', percentage: 100 },
    { name: 'Cache', status: 'warning', percentage: 99.9 },
    { name: 'CDN', status: 'online', percentage: 100 },
    { name: 'Storage', status: 'warning', percentage: 99.8 }
  ];

  useEffect(() => {
    // Update time
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Generate chart data
    const generateTimeSeriesData = () => {
      const now = new Date();
      const throughput = [];
      const bandwidth = [];
      const users = [];
      
      for (let i = 23; i >= 0; i--) {
        const time = subHours(now, i);
        const hour = format(time, 'ha');
        
        throughput.push({
          time: hour,
          value: 1.0 + Math.random() * 2.0
        });
        
        bandwidth.push({
          time: hour,
          value: 0.8 + Math.random() * 1.5
        });
        
        users.push({
          time: hour,
          value: 4000 + Math.random() * 5000
        });
      }
      
      setThroughputData(throughput);
      setBandwidthData(bandwidth);
      setActiveUsersData(users);
    };

    const generateUptimeHistory = () => {
      const history = [];
      for (let i = 30; i >= 0; i--) {
        const date = subDays(new Date(), i);
        history.push({
          date: format(date, 'MMM d'),
          uptime: 98 + Math.random() * 2
        });
      }
      setUptimeHistoryData(history);
    };

    generateTimeSeriesData();
    generateUptimeHistory();

    // Fetch real data from Supabase
    const loadMetrics = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [
        { count: totalCI },
        { count: pendingCI },
        { count: activeCrisis },
        { count: totalClients },
        { data: locations }
      ] = await Promise.all([
        supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
        supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('crisis_events_1777090000').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
        supabase.from('locations_1740395000').select('*').eq('is_active', true)
      ]);

      setMetrics(m => ({
        ...m,
        totalCheckIns: totalCI || 0,
        pendingCheckIns: pendingCI || 0,
        activeCrises: activeCrisis || 0,
        totalClients: totalClients || 0,
        usersOnline: totalClients || m.usersOnline
      }));

      // Map locations to activity points
      if (locations && locations.length > 0) {
        const mappedActivities = locations.slice(0, 10).map((loc, i) => ({
          id: loc.id,
          type: 'location',
          location: loc.name || `Location ${i + 1}`,
          time: format(new Date(), 'hh:mm:ss a'),
          color: ['#00D9FF', '#E91E63', '#7C3AED'][i % 3],
          x: 20 + (i * 8) % 70,
          y: 30 + (i * 7) % 50
        }));
        setRealtimeActivities(prev => [...mappedActivities, ...prev.slice(0, 5)]);
      }
    };

    loadMetrics();

    // Subscribe to real-time location updates
    const locationChannel = supabase
      .channel('overseer_locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'locations_1740395000'
      }, (payload) => {
        console.log('Location update:', payload);
        loadMetrics();
      })
      .subscribe();

    // Subscribe to check-ins for real-time updates
    const checkInChannel = supabase
      .channel('overseer_checkins')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins_1740395000'
      }, (payload) => {
        const newActivity = {
          id: payload.new.id,
          type: 'checkin',
          location: 'Check-in Received',
          time: format(new Date(), 'hh:mm:ss a'),
          color: '#10B981',
          x: Math.random() * 80,
          y: Math.random() * 80
        };
        setRealtimeActivities(prev => [newActivity, ...prev.slice(0, 9)]);
        setMetrics(m => ({
          ...m,
          totalCheckIns: m.totalCheckIns + 1,
          usersOnline: m.usersOnline + 1
        }));
      })
      .subscribe();

    // Simulate real-time activity updates
    const activityInterval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        type: ['login', 'transfer', 'sync'][Math.floor(Math.random() * 3)],
        location: ['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU', 'Frankfurt, DE'][Math.floor(Math.random() * 5)],
        time: format(new Date(), 'hh:mm:ss a'),
        color: ['#00D9FF', '#E91E63', '#00D9FF'][Math.floor(Math.random() * 3)],
        x: Math.random() * 90,
        y: Math.random() * 90
      };
      
      setRealtimeActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      
      // Simulate metric changes
      setMetrics(m => ({
        ...m,
        throughput: 2.0 + Math.random() * 1.0,
        bandwidth: 1.5 + Math.random() * 0.5,
        usersOnline: Math.max(7000, m.usersOnline + Math.floor(Math.random() * 200 - 100))
      }));
    }, 5000);

    // Refresh data periodically
    const refreshInterval = setInterval(loadMetrics, 60000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(activityInterval);
      clearInterval(refreshInterval);
      supabase.removeChannel(locationChannel);
      supabase.removeChannel(checkInChannel);
    };
  }, []);

  return (
    <div style={{
      background: '#0A0E27',
      minHeight: '100vh',
      color: '#fff',
      padding: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 200,
        background: 'rgba(20, 24, 48, 0.95)',
        borderRight: '1px solid rgba(100, 100, 140, 0.2)',
        backdropFilter: 'blur(10px)',
        padding: '24px 16px',
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#00D9FF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #00D9FF, #7C3AED)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>👁</div>
            OVERSEER
          </div>
          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, letterSpacing: 2, marginTop: 4, marginLeft: 40 }}>
            DASHBOARD
          </div>
        </div>

        {/* Nav Items */}
        {[
          { icon: '◫', label: 'OVERVIEW', active: true },
          { icon: '⚙', label: 'SERVERS' },
          { icon: '⚡', label: 'NETWORK' },
          { icon: '👥', label: 'USERS' },
          { icon: '⚠', label: 'ALERTS' },
          { icon: '📊', label: 'LOGS' },
          { icon: '📋', label: 'REPORTS' },
          { icon: '⚙', label: 'SETTINGS' }
        ].map((item, i) => (
          <div key={i} style={{
            padding: '12px 16px',
            marginBottom: 4,
            borderRadius: 10,
            background: item.active ? 'linear-gradient(90deg, rgba(0, 217, 255, 0.15), transparent)' : 'transparent',
            border: item.active ? '1px solid rgba(0, 217, 255, 0.3)' : '1px solid transparent',
            color: item.active ? '#00D9FF' : '#9CA3AF',
            fontSize: 12,
            fontWeight: item.active ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        {/* System Status at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 16,
          right: 16,
          padding: 12,
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981'
            }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>System Status</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>HEALTHY</div>
          <div style={{ marginTop: 8 }}>
            <svg width="100%" height="20">
              <path d="M 0 10 Q 10 5, 20 10 T 40 10 T 60 10 T 80 10 T 100 10" 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    fill="none"
                    style={{ filter: 'drop-shadow(0 0 4px #10B981)' }} />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 200, padding: '24px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>OVERVIEW</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Real-time system performance and metrics</p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(44, 44, 64, 0.6)',
                border: '1px solid rgba(100, 100, 140, 0.3)',
                borderRadius: 10,
                fontSize: 13,
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>🕐</span>
                {format(currentTime, 'hh:mm:ss a')}
              </div>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(44, 44, 64, 0.6)',
                border: '1px solid rgba(100, 100, 140, 0.3)',
                borderRadius: 10,
                fontSize: 13,
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>📅</span>
                {format(currentTime, 'MMMM dd, yyyy')}
              </div>
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(44, 44, 64, 0.6)',
                  border: '1px solid rgba(100, 100, 140, 0.3)',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
          {/* Uptime Card */}
          <div style={{
            background: 'rgba(44, 44, 64, 0.6)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>📡</span>
              UPTIME
            </div>
            <CircularProgress value={metrics.uptime} size={120} color="#00D9FF" status="EXCELLENT" />
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 12 }}>
              30d 12h 45m
              <br />
              Total Uptime
            </div>
          </div>

          {/* Throughput */}
          <MetricCard
            icon={() => <span style={{ fontSize: 18 }}>📈</span>}
            label="THROUGHPUT"
            value={metrics.throughput}
            unit="Tbps"
            trend="up"
            trendValue="12.5%"
            color="#7C3AED"
          />

          {/* Bandwidth */}
          <MetricCard
            icon={() => <span style={{ fontSize: 18 }}>📶</span>}
            label="BANDWIDTH"
            value={metrics.bandwidth}
            unit="Tbps"
            trend="up"
            trendValue="8.3%"
            color="#00D9FF"
          />

          {/* Users Online */}
          <MetricCard
            icon={() => <span style={{ fontSize: 18 }}>👥</span>}
            label="USERS ONLINE"
            value={metrics.usersOnline.toLocaleString()}
            trend="up"
            trendValue="15.2%"
            color="#E91E63"
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Throughput Over Time */}
          <div style={{
            background: 'rgba(44, 44, 64, 0.6)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(10px)',
            gridColumn: 'span 2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  📈 THROUGHPUT OVER TIME
                </div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>3.0 Tbps</div>
              </div>
              <div style={{
                padding: '4px 12px',
                background: 'rgba(124, 58, 237, 0.2)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: 6,
                fontSize: 11,
                color: '#7C3AED',
                fontWeight: 600
              }}>
                Area ▼
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280" 
                  style={{ fontSize: 10 }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20, 24, 48, 0.95)',
                    border: '1px solid rgba(124, 58, 237, 0.5)',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  fill="url(#throughputGradient)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Real-Time Activity */}
          <div style={{
            background: 'rgba(44, 44, 64, 0.6)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                🌍 REAL-TIME ACTIVITY
              </div>
              <div style={{
                padding: '2px 8px',
                background: 'rgba(233, 30, 99, 0.2)',
                border: '1px solid rgba(233, 30, 99, 0.4)',
                borderRadius: 12,
                fontSize: 10,
                color: '#E91E63',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#E91E63',
                  boxShadow: '0 0 8px #E91E63',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
                LIVE
              </div>
            </div>
            <WorldMap activities={realtimeActivities} />
            <div style={{ marginTop: 12, maxHeight: 150, overflowY: 'auto' }}>
              {realtimeActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} style={{
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(100, 100, 140, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#E5E7EB', marginBottom: 2 }}>
                      {activity.type === 'login' ? '🔵' : activity.type === 'transfer' ? '🔴' : '🔵'} {activity.type === 'login' ? 'New User Login' : activity.type === 'transfer' ? 'Data Transfer' : 'Server Sync'}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>{activity.location}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Bandwidth Over Time */}
          <div style={{
            background: 'rgba(44, 44, 64, 0.6)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(10px)',
            gridColumn: 'span 2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  📶 BANDWIDTH OVER TIME
                </div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>2.4 Tbps</div>
              </div>
              <div style={{
                padding: '4px 12px',
                background: 'rgba(0, 217, 255, 0.2)',
                border: '1px solid rgba(0, 217, 255, 0.4)',
                borderRadius: 6,
                fontSize: 11,
                color: '#00D9FF',
                fontWeight: 600
              }}>
                Area ▼
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={bandwidthData}>
                <defs>
                  <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#00D9FF" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280" 
                  style={{ fontSize: 10 }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20, 24, 48, 0.95)',
                    border: '1px solid rgba(0, 217, 255, 0.5)',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00D9FF"
                  strokeWidth={2}
                  fill="url(#bandwidthGradient)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* System Health */}
          <div style={{
            background: 'rgba(44, 44, 64, 0.6)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              ⚡ SYSTEM HEALTH
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <CircularProgress value={99.95} size={140} strokeWidth={10} color="#00D9FF" />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(0, 217, 255, 0.1)',
                  border: '2px solid rgba(0, 217, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  ✓
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11 }}>
              {systemServices.slice(0, 6).map((service, i) => (
                <ServiceRow key={i} {...service} />
              ))}
            </div>
          </div>
        </div>

        {/* Third Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Top Network Usage */}
          <div style={{
            background: 'rgba(44, 44, 64, 0.6)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              🌐 TOP NETWORK USAGE
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={networkUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {networkUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 24, 48, 0.95)',
                      border: '1px solid rgba(100, 100, 140, 0.5)',
                      borderRadius: 8,
                      fontSize: 11
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
                marginTop: 70
              }}>
                2.45 Tbps
                <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 500, textAlign: 'center' }}>Total</div>
              </div>
            </div>
            <div style={{ fontSize: 11 }}>
              {networkUsageData.map((region, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: i < networkUsageData.length - 1 ? '1px solid rgba(100, 100, 140, 0.2)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: region.color,
                      boxShadow: `0 0 6px ${region.color}`
                    }} />
                    <span style={{ color: '#E5E7EB' }}>{region.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>{region.value}%</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{region.gbps} Gbps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Users */}
          <div style={{
            background: 'rgba(44, 44, 64, 0.6)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(10px)',
            gridColumn: 'span 2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  👥 ACTIVE USERS
                </div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Users online over time</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#E91E63' }}>
                {metrics.usersOnline.toLocaleString()}
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Online Now</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={activeUsersData}>
                <defs>
                  <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E91E63" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#E91E63" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280" 
                  style={{ fontSize: 10 }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20, 24, 48, 0.95)',
                    border: '1px solid rgba(233, 30, 99, 0.5)',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#E91E63"
                  strokeWidth={2}
                  fill="url(#usersGradient)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime History */}
        <div style={{
          background: 'rgba(44, 44, 64, 0.6)',
          border: '1px solid rgba(100, 100, 140, 0.3)',
          borderRadius: 16,
          padding: 20,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                📊 UPTIME HISTORY
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                100%
                <span style={{ marginLeft: 120 }}>99%</span>
                <span style={{ marginLeft: 120 }}>98%</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>99.98%</span>
                <div style={{ fontSize: 11, color: '#6B7280' }}>
                  Average Uptime
                  <br />
                  (30 Days)
                </div>
              </div>
              <div style={{ width: 80, height: 60 }}>
                <svg width="100%" height="100%" viewBox="0 0 80 60">
                  <path
                    d="M 0 30 Q 10 20, 20 25 T 40 28 T 60 22 T 80 26"
                    stroke="#00D9FF"
                    strokeWidth="2"
                    fill="none"
                    style={{ filter: 'drop-shadow(0 0 4px #00D9FF)' }}
                  />
                </svg>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={uptimeHistoryData}>
              <XAxis 
                dataKey="date" 
                stroke="#6B7280" 
                style={{ fontSize: 9 }}
                tick={{ fill: '#6B7280' }}
                interval={4}
              />
              <YAxis hide domain={[98, 100]} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(20, 24, 48, 0.95)',
                  border: '1px solid rgba(0, 217, 255, 0.5)',
                  borderRadius: 8,
                  fontSize: 11
                }}
              />
              <Bar 
                dataKey="uptime" 
                fill="#00D9FF" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 20px currentColor; }
        }
        
        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(100, 100, 140, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 217, 255, 0.3);
          borderRadius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 217, 255, 0.5);
        }
        
        /* Card hover effects */
        [style*="background: rgba(44, 44, 64"] {
          transition: all 0.3s ease;
        }
        
        [style*="background: rgba(44, 44, 64"]:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 217, 255, 0.5) !important;
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
          /* Adjust grid layouts for tablets */
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          div[style*="gridTemplateColumns: '1fr 1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
          
          div[style*="gridColumn: 'span 2'"] {
            grid-column: span 1 !important;
          }
        }
        
        @media (max-width: 768px) {
          /* Hide sidebar on mobile */
          div[style*="position: fixed"][style*="width: 200"] {
            display: none !important;
          }
          
          /* Remove left margin on mobile */
          div[style*="marginLeft: 200"] {
            margin-left: 0 !important;
            padding: 16px !important;
          }
          
          /* Stack all grids vertically */
          div[style*="display: grid"] {
            grid-template-columns: 1fr !important;
          }
          
          /* Smaller text on mobile */
          h1 {
            font-size: 20px !important;
          }
          
          /* Hide some elements on mobile */
          div[style*="fontSize: 13"][style*="color: '#9CA3AF'"] {
            font-size: 11px !important;
          }
        }
        
        @media (max-width: 480px) {
          /* Extra small screens */
          div[style*="padding: '8px 16px'"] {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }
          
          /* Reduce chart heights */
          div[style*="height={180}"] {
            height: 120px !important;
          }
          
          /* Smaller circular progress */
          div[style*="size={120}"] svg,
          div[style*="size={140}"] svg {
            width: 100px !important;
            height: 100px !important;
          }
        }
      `}</style>
    </div>
  );
}

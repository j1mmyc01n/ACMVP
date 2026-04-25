import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button } from '../../components/UI';

const { 
  FiUsers, FiActivity, FiCheckCircle, FiTrendingUp, FiCalendar, FiVideo, 
  FiHome, FiMessageSquare, FiBookOpen, FiBarChart2, FiGlobe, FiSettings,
  FiBell, FiSearch, FiUser
} = FiIcons;

const KPICard = ({ label, value, trend, trendValue, icon: Icon, gradient, delay }) => (
  <motion.div
    className="ac-kpi-card"
    style={{
      background: gradient || 'white',
      color: gradient ? 'white' : '#1C1C1E',
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <div className="ac-kpi-label" style={{ color: gradient ? 'rgba(255,255,255,0.9)' : '#64748B' }}>
      {Icon && <SafeIcon icon={Icon} size={14} />}
      {label}
    </div>
    <div className="ac-kpi-value" style={{ color: gradient ? 'white' : '#1C1C1E' }}>
      {value}
    </div>
    {trend && (
      <div className={`ac-kpi-trend ${trend === 'up' ? 'ac-kpi-trend-up' : ''}`} style={{ color: gradient ? 'rgba(255,255,255,0.9)' : '#10B981' }}>
        <SafeIcon icon={FiTrendingUp} size={12} />
        {trendValue}
      </div>
    )}
  </motion.div>
);

const NavItem = ({ icon, label, active }) => (
  <button
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 8,
      border: 'none',
      background: active ? '#507C7B' : 'transparent',
      color: active ? 'white' : '#64748B',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'var(--ac-bg)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <SafeIcon icon={icon} size={18} />
    {label}
  </button>
);

export default function ModernTriageDashboard() {
  const [stats, setStats] = useState({
    activePatients: 1248,
    avgMoodScore: 7.9,
    sessionsCompleted: 342,
    retentionRate: 3.8,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock mood trend data
  const moodTrendData = [
    { month: 'Jan', value: 4000 },
    { month: 'Feb', value: 5500 },
    { month: 'Mar', value: 7000 },
    { month: 'Apr', value: 8200 },
    { month: 'May', value: 10000 },
  ];

  // Patient status data - matching the image percentages
  const patientStatusData = [
    { name: 'Stable', value: 62, color: '#507C7B' },
    { name: 'Improving', value: 22, color: '#93C5FD' },
    { name: 'Needs Attention', value: 10, color: '#F59E0B' },
  ];

  // Today's appointments - matching the image
  const todayAppointments = [
    { time: '1:00 pm', type: 'Virtual Therapy', patient: 'Maria G.' },
    { time: '3:00 pm', type: 'Virtual Therapy', patient: 'John D.' },
    { time: '1:00 pm', type: 'Virtual Therapy', patient: 'Sarah M.' },
    { time: '5:00 pm', type: 'Virtual Therapy', patient: 'Elena R.' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch real data from Supabase
    try {
      const { data: clients } = await supabase
        .from('clients_1777020684735')
        .select('*')
        .eq('status', 'active');
      
      const { data: checkIns } = await supabase
        .from('check_ins_1740395000')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (clients) {
        setStats((prev) => ({
          ...prev,
          activePatients: clients.length,
        }));
      }

      if (checkIns && checkIns.length > 0) {
        const avgMood = (
          checkIns.reduce((sum, c) => sum + (c.mood || 0), 0) / checkIns.length
        ).toFixed(1);
        setStats((prev) => ({
          ...prev,
          avgMoodScore: parseFloat(avgMood),
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Sidebar Navigation */}
      <div style={{
        width: 220,
        background: 'var(--ac-surface)',
        borderRight: '1px solid var(--ac-border)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{
              width: 32,
              height: 32,
              background: '#507C7B',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
            }}>AC</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Acute<br/>Connect</div>
          </div>
          
          {/* Global Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--ac-bg)',
            borderRadius: 8,
            border: '1px solid var(--ac-border)',
          }}>
            <SafeIcon icon={FiSearch} size={14} style={{ color: 'var(--ac-muted)' }} />
            <input
              type="text"
              placeholder="Global Search"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 12,
                color: 'var(--ac-text)',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Navigation Items */}
        <NavItem icon={FiHome} label="Home" active />
        <NavItem icon={FiUsers} label="Patients" />
        <NavItem icon={FiCalendar} label="Appointments" />
        <NavItem icon={FiMessageSquare} label="Messages" />
        <NavItem icon={FiBookOpen} label="Resources" />
        <NavItem icon={FiBarChart2} label="Analytics" />
        <NavItem icon={FiGlobe} label="Community" />
        <NavItem icon={FiSettings} label="Settings" />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 24 }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 24 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                Welcome back, Administrator
              </h1>
            </div>
            <div style={{ fontSize: 14, color: '#64748B' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
            </div>
          </div>
          
          {/* Top Right Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button
              variant="outline"
              style={{
                padding: '8px 16px',
                fontSize: 13,
                borderRadius: 8,
                background: '#507C7B',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Staff Connect →
            </Button>
            
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <SafeIcon icon={FiBell} size={18} />
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#EF4444',
                }} />
              </button>
            </div>
            
            {/* User Avatar */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#507C7B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
            }}>
              <SafeIcon icon={FiUser} size={18} />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 16,
          marginBottom: 24 
        }}>
          <KPICard
            label="Active Patients"
            value={stats.activePatients.toLocaleString()}
            trend="up"
            trendValue="+15% this month"
            icon={FiUsers}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={0}
          />
          <KPICard
            label="Average Mood Score"
            value={`${stats.avgMoodScore}/10`}
            trend="up"
            trendValue=""
            icon={FiActivity}
            gradient="linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)"
            delay={0.1}
          />
          <KPICard
            label="Therapy Sessions Completed"
            value={stats.sessionsCompleted}
            trend="up"
            trendValue="this week"
            icon={FiCheckCircle}
            gradient="linear-gradient(135deg, #507C7B 0%, #3E6261 100%)"
            delay={0.2}
          />
          <KPICard
            label="30-Day Retention Rate"
            value={`${stats.retentionRate}%`}
            trend="up"
            trendValue="+22%"
            icon={FiTrendingUp}
            gradient="linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: 16,
          marginBottom: 24 
        }}>
          {/* Mood Trends Chart */}
          <motion.div
            className="ac-chart-container"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="ac-chart-header">
              <h3 className="ac-chart-title">Mood Trends</h3>
              <button
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: '#F8F9FA',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Monthly
              </button>
            </div>
            <div style={{ height: 20, fontSize: 12, color: '#64748B', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span>0</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={moodTrendData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: 12 }}
                  ticks={[0, 2000, 4000, 6000, 8000, 10000]}
                  domain={[0, 10000]}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#14B8A6" 
                  strokeWidth={2}
                  dot={{ fill: '#14B8A6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Patient Status Pie Chart */}
          <motion.div
            className="ac-chart-container"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="ac-chart-header">
              <h3 className="ac-chart-title">Patient Status Overview</h3>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={patientStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {patientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -20%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>10%</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {patientStatusData.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%', 
                      background: item.color 
                    }} />
                    <span style={{ fontSize: 12, color: '#1C1C1E' }}>
                      {item.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Today's Appointments */}
        <motion.div
          className="ac-chart-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="ac-chart-header">
            <h3 className="ac-chart-title">Today's Appointments</h3>
            <button
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#F8F9FA',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View All
            </button>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 12,
            marginTop: 16 
          }}>
            {todayAppointments.map((apt, index) => (
              <motion.div
                key={index}
                style={{
                  background: '#F8F9FA',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #E2E8F0',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  {apt.time}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  fontSize: 12,
                  color: '#64748B',
                  marginBottom: 8,
                }}>
                  <SafeIcon icon={FiVideo} size={12} />
                  <span>{apt.type}</span>
                </div>
                {apt.patient && (
                  <div style={{ fontSize: 12, color: '#1C1C1E', fontWeight: 600 }}>
                    {apt.patient}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

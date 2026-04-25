import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button } from '../../components/UI';

const { FiUsers, FiActivity, FiCheckCircle, FiTrendingUp, FiCalendar, FiVideo } = FiIcons;

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
    { month: 'Mon', value: 4000 },
    { month: 'Aeb', value: 5500 },
    { month: 'Jun', value: 7000 },
    { month: 'Jul', value: 8200 },
    { month: 'May', value: 10000 },
  ];

  // Patient status data
  const patientStatusData = [
    { name: 'Stable', value: 62, color: '#507C7B' },
    { name: 'Improving', value: 22, color: '#93C5FD' },
    { name: 'Needs Attention', value: 10, color: '#F59E0B' },
  ];

  // Today's appointments
  const todayAppointments = [
    { time: '1:00 nm', type: 'Virtual Therapy', patient: 'Maria G.' },
    { time: '15:00 pm', type: 'Virtual Therapy', patient: 'John D.' },
    { time: '13:00 nm', type: 'Virtual Therapy', patient: 'Sarah M.' },
    { time: '2:7:00 nm', type: 'Virtual Therapy', patient: 'Elena R.' },
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
    <div style={{ padding: 24, background: '#F8F9FA', minHeight: '100vh' }}>
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
            <Button
              variant="outline"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 8,
                background: '#507C7B',
                color: 'white',
                border: 'none',
              }}
            >
              Stalle<br />Connect Henki →
            </Button>
          </div>
          <div style={{ fontSize: 14, color: '#64748B' }}>
            Today's Date ∧ 0pm
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
            }}
          >
            <SafeIcon icon={FiIcons.FiBell} size={18} />
            <div style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#EF4444',
            }} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16,
        marginBottom: 24 
      }}>
        <KPICard
          label="KPI Active Patients"
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
          trendValue="+0.3 from last week"
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
                background: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cecoltty
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
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
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#14B8A6" 
                strokeWidth={3}
                dot={{ fill: '#14B8A6', r: 4 }}
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
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={patientStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {patientStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
            {patientStatusData.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  background: item.color 
                }} />
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  {item.name} {item.value}%
                </span>
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
            Saincy
          </button>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 12,
          marginTop: 16 
        }}>
          {todayAppointments.map((apt, index) => (
            <motion.div
              key={index}
              style={{
                background: '#F8F9FA',
                borderRadius: 12,
                padding: 14,
                border: '1px solid #E2E8F0',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                {apt.time}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                fontSize: 12,
                color: '#64748B',
                marginBottom: 8
              }}>
                <SafeIcon icon={FiVideo} size={12} />
                <span>{apt.type}</span>
              </div>
              <div style={{ fontSize: 12, color: '#1C1C1E', fontWeight: 600 }}>
                {apt.patient}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

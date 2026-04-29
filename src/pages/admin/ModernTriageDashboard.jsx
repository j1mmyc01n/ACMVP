import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button } from '../../components/UI';

const {
  FiUsers, FiActivity, FiCheckCircle, FiTrendingUp, FiCalendar, FiVideo,
  FiAlertTriangle, FiUserPlus, FiRefreshCw, FiClock, FiHeart, FiShield,
} = FiIcons;

const KPICard = ({ label, value, sub, icon: Icon, gradient, delay }) => (
  <motion.div
    className="ac-kpi-card"
    style={{ background: gradient || 'white', color: gradient ? 'white' : '#1C1C1E' }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <div className="ac-kpi-label" style={{ color: gradient ? 'rgba(255,255,255,0.9)' : '#64748B' }}>
      {Icon && <SafeIcon icon={Icon} size={14} />}
      {label}
    </div>
    <div className="ac-kpi-value" style={{ color: gradient ? 'white' : '#1C1C1E' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, marginTop: 4, color: gradient ? 'rgba(255,255,255,0.8)' : '#94A3B8' }}>{sub}</div>}
  </motion.div>
);

export default function ModernTriageDashboard() {
  const [stats, setStats] = useState({
    activePatients: 0, avgMoodScore: 0, sessionsCompleted: 342,
    highPriority: 0, newToday: 0, crisisOpen: 0, pendingCheckins: 0, retentionRate: 94.2,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const moodTrendData = [
    { month: 'Jan', mood: 5.8, crisis: 12 },
    { month: 'Feb', mood: 6.2, crisis: 9  },
    { month: 'Mar', mood: 6.8, crisis: 7  },
    { month: 'Apr', mood: 7.1, crisis: 5  },
    { month: 'May', mood: 7.4, crisis: 4  },
  ];

  const categoryData = [
    { name: 'Mental Health',    value: 38, color: '#4F46E5' },
    { name: 'Crisis Support',   value: 18, color: '#EF4444' },
    { name: 'Substance Abuse',  value: 14, color: '#7C3AED' },
    { name: 'Housing',          value: 16, color: '#059669' },
    { name: 'General',          value: 14, color: '#0284C7' },
  ];

  const todayAppointments = [
    { time: '9:00 am',  type: 'Crisis Review',   patient: 'James T.',   urgent: true  },
    { time: '10:30 am', type: 'Virtual Therapy', patient: 'Maria G.',   urgent: false },
    { time: '1:00 pm',  type: 'Group Session',   patient: '6 Patients', urgent: false },
    { time: '3:00 pm',  type: 'Virtual Therapy', patient: 'John D.',    urgent: false },
    { time: '4:30 pm',  type: 'Assessment',      patient: 'Elena R.',   urgent: false },
  ];

  const recentAlerts = [
    { msg: 'Patient James T. — mood dropped to 2/10', time: '8 min ago',  level: 'danger'  },
    { msg: '3 check-ins pending review',              time: '22 min ago', level: 'warn'    },
    { msg: 'New CRN request from Sarah M.',           time: '45 min ago', level: 'info'    },
    { msg: 'Session completed — Maria G.',            time: '1 hr ago',   level: 'success' },
  ];

  const alertColor = { danger: '#EF4444', warn: '#F59E0B', info: '#3B82F6', success: '#10B981' };
  const alertBg    = { danger: '#FEF2F2', warn: '#FFFBEB', info: '#EFF6FF', success: '#F0FDF4' };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: clients }, { data: checkIns }] = await Promise.all([
        supabase.from('clients_1777020684735').select('*'),
        supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const active   = (clients || []).filter(c => c.status === 'active').length;
      const newToday = (clients || []).filter(c => new Date(c.created_at) >= today).length;
      const pending  = (checkIns || []).filter(c => c.status === 'pending').length;
      const highPri  = (checkIns || []).filter(c => (c.mood || 10) <= 3).length;
      const avgMood = checkIns?.length
        ? parseFloat((checkIns.reduce((s, c) => s + (c.mood || 0), 0) / checkIns.length).toFixed(1))
        : null;

      setStats(prev => ({
        ...prev,
        activePatients: active || (clients || []).length,
        avgMoodScore: avgMood !== null ? avgMood : prev.avgMoodScore,
        highPriority: highPri,
        newToday,
        pendingCheckins: pending,
      }));
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
    setLastRefresh(new Date());
    setLoading(false);
  };

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Clinical Triage Dashboard</h1>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}Last refreshed {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {stats.highPriority > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: '#DC2626' }}>
              <SafeIcon icon={FiAlertTriangle} size={14} />
              {stats.highPriority} High Priority
            </div>
          )}
          <Button variant="outline" icon={FiRefreshCw} onClick={fetchData} style={{ fontSize: 13 }}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
        <KPICard label="Active Patients" value={loading ? '…' : stats.activePatients.toLocaleString()}
          sub={`+${stats.newToday} new today`} icon={FiUsers}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" delay={0} />
        <KPICard label="High Priority Patients" value={loading ? '…' : stats.highPriority}
          sub="Mood ≤ 3/10 · needs review" icon={FiAlertTriangle}
          gradient={stats.highPriority > 0 ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}
          delay={0.05} />
        <KPICard label="Avg Mood Score" value={loading ? '…' : `${stats.avgMoodScore}/10`}
          sub="Across recent check-ins" icon={FiHeart}
          gradient="linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)" delay={0.1} />
        <KPICard label="Pending Check-ins" value={loading ? '…' : stats.pendingCheckins}
          sub="Awaiting clinical review" icon={FiClock}
          gradient={stats.pendingCheckins > 0 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #507C7B 0%, #3E6261 100%)'}
          delay={0.15} />
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Sessions Completed" value={stats.sessionsCompleted} sub="This week"
          icon={FiCheckCircle} gradient="linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)" delay={0.2} />
        <KPICard label="30-Day Retention" value={`${stats.retentionRate}%`} sub="+2.1% vs last month"
          icon={FiTrendingUp} gradient="linear-gradient(135deg, #507C7B 0%, #3E6261 100%)" delay={0.25} />
        <KPICard label="Open Crisis Cases" value={stats.crisisOpen || 0} sub="Escalated this month"
          icon={FiShield} gradient="linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)" delay={0.3} />
        <KPICard label="New Registrations" value={loading ? '…' : stats.newToday} sub="Today"
          icon={FiUserPlus} gradient="linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" delay={0.35} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        <motion.div className="ac-chart-container"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <div className="ac-chart-header">
            <h3 className="ac-chart-title">Clinical Trends — Mood &amp; Crisis Events</h3>
            <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>Sample data · 5 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodTrendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="mood"   stroke="#14B8A6" strokeWidth={2} dot={{ fill: '#14B8A6', r: 3 }} name="Avg Mood" />
              <Line type="monotone" dataKey="crisis" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} name="Crisis Cases" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {[{ color: '#14B8A6', label: 'Avg Mood Score' }, { color: '#EF4444', label: 'Crisis Events' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
                <div style={{ width: 12, height: 3, background: l.color, borderRadius: 2 }} />
                {l.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="ac-chart-container" style={{ position: 'relative' }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
          <div className="ac-chart-header">
            <h3 className="ac-chart-title">Patient Categories</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                paddingAngle={0} dataKey="value" startAngle={90} endAngle={450}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {categoryData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: 12, color: '#1C1C1E' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Appointments + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <motion.div className="ac-chart-container"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}>
          <div className="ac-chart-header">
            <h3 className="ac-chart-title">Today's Appointments</h3>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{todayAppointments.length} scheduled</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {todayAppointments.map((apt, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: apt.urgent ? '#FEF2F2' : '#F8F9FA', borderRadius: 10, padding: '10px 14px',
                border: apt.urgent ? '1px solid #FECACA' : '1px solid #E2E8F0',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: apt.urgent ? '#EF4444' : '#507C7B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SafeIcon icon={apt.urgent ? FiAlertTriangle : FiVideo} size={14} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{apt.type}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{apt.patient}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: apt.urgent ? '#DC2626' : '#507C7B', flexShrink: 0 }}>
                  {apt.time}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="ac-chart-container"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.65 }}>
          <div className="ac-chart-header">
            <h3 className="ac-chart-title">Recent Clinical Alerts</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>Live</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {recentAlerts.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: alertBg[a.level], borderRadius: 10, padding: '10px 14px',
                border: `1px solid ${alertColor[a.level]}22`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: alertColor[a.level], flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>{a.msg}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

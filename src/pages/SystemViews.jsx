import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { Card, Button, Badge, Field, Input, Textarea, Select, StatusBadge } from '../components/UI';

const {
  FiMessageSquare, FiZap, FiSend, FiRefreshCw, FiCheck, FiX,
  FiClock, FiAlertCircle, FiCheckCircle, FiPlus, FiFilter,
  FiThumbsUp, FiFlag, FiUser, FiBell, FiMapPin, FiUsers,
  FiGlobe, FiSmartphone, FiTarget,
} = FiIcons;

// ─── Re-exports from system/ subdirectory ────────────────────────────
export { default as AuditLogPage }     from './system/AuditLogPage';
export { default as OverseerDashboard } from './system/OverseerDashboard';
export { default as LocationRollout }  from './system/LocationRollout';
export { default as LocationsPage }    from './system/LocationsPage';
export { default as UsersPage }        from './system/UsersPage';

// ─── Stub pages (placeholder until fully implemented) ─────────────────
const Stub = ({ title, icon = '🔧' }) => (
  <div style={{ padding: '0 0 32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{title}</h1>
    </div>
    <p style={{ color: 'var(--ac-muted)', fontSize: 14, marginBottom: 24 }}>This module is being configured. Check back soon.</p>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Coming Soon</div>
      <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>This feature is in active development.</div>
    </div>
  </div>
);

// Import actual pages from system folder first
export { default as IntegrationPage } from './system/IntegrationPage';

// Stubs for features not yet implemented
export const SettingsPage        = () => <Stub title="Settings"            icon="⚙️" />;
export const SuperAdminPage      = () => <Stub title="Super Admin"         icon="🛡️" />;
export const ProviderMetricsPage = () => <Stub title="Provider Metrics"    icon="📊" />;
export const AICodeFixerPage     = () => <Stub title="AI Code Fixer"       icon="🤖" />;
export const GitHubAgentPage     = () => <Stub title="GitHub Agent"        icon="🐙" />;

// ─── FEEDBACK PAGE ────────────────────────────────────────────────────
const STATUS_COLORS = {
  open: { bg: '#DBEAFE', text: '#1E40AF' },
  in_progress: { bg: '#FEF3C7', text: '#92400E' },
  resolved: { bg: '#D1FAE5', text: '#065F46' },
  closed: { bg: '#F3F4F6', text: '#374151' },
};

const PRIORITY_COLORS = {
  low: { bg: '#F3F4F6', text: '#374151' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high: { bg: '#FEE2E2', text: '#991B1B' },
};

const MS_PER_DAY = 86400000;

const MOCK_FEEDBACK = [
  { id: 'f1', subject: 'Check-in process feels slow', category: 'feedback', priority: 'medium', status: 'open', message: 'The CRN check-in takes too long on mobile devices.', submitted_by: 'ops@acuteconnect.health', created_at: new Date(Date.now() - MS_PER_DAY * 2).toISOString() },
  { id: 'f2', subject: 'Crisis button not visible', category: 'bug', priority: 'high', status: 'in_progress', message: 'On smaller screens the crisis raise button is hidden behind other elements.', submitted_by: 'ops@acuteconnect.health', created_at: new Date(Date.now() - MS_PER_DAY).toISOString() },
  { id: 'f3', subject: 'Great UI update!', category: 'feedback', priority: 'low', status: 'resolved', message: 'The new dashboard layout is much cleaner and easier to use.', submitted_by: 'sysadmin@acuteconnect.health', created_at: new Date(Date.now() - MS_PER_DAY * 5).toISOString() },
];

const INITIAL_FEEDBACK_FORM = { subject: '', category: 'feedback', priority: 'medium', message: '', submitted_by: 'ops@acuteconnect.health' };

export const FeedbackPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FEEDBACK_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback_tickets_1777090000')
        .select('*')
        .order('created_at', { ascending: false });
      setTickets(!error && data ? data : []);
    } catch {
      setTickets([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setDone(false); setShowForm(false); setForm({ ...INITIAL_FEEDBACK_FORM }); };

  const handleSubmit = async () => {
    if (!form.subject || !form.message) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('feedback_tickets_1777090000')
        .insert([{ ...form, status: 'open' }])
        .select()
        .single();
      if (!error && data) {
        setTickets(prev => [data, ...prev]);
      }
      setDone(true);
      setTimeout(resetForm, 2000);
    } catch {
      setDone(true);
      setTimeout(resetForm, 2000);
    }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await supabase.from('feedback_tickets_1777090000').update({ status }).eq('id', id);
    } catch { /* no-op */ }
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const filtered = tickets.filter(t =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterCategory === 'all' || t.category === filterCategory)
  );

  const counts = { total: tickets.length, open: tickets.filter(t => t.status === 'open').length, in_progress: tickets.filter(t => t.status === 'in_progress').length, resolved: tickets.filter(t => t.status === 'resolved').length };

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiMessageSquare} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Feedback & Tickets</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>Submit and manage platform feedback, bug reports, and urgent issues</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <SafeIcon icon={FiRefreshCw} size={14} />
          </button>
          <Button icon={FiPlus} onClick={() => setShowForm(true)}>New Ticket</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="ac-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: counts.total, icon: FiMessageSquare, color: 'var(--ac-primary)' },
          { label: 'Open', value: counts.open, icon: FiAlertCircle, color: '#3B82F6' },
          { label: 'In Progress', value: counts.in_progress, icon: FiClock, color: '#F59E0B' },
          { label: 'Resolved', value: counts.resolved, icon: FiCheckCircle, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)' }}>{s.label}</span>
              <SafeIcon icon={s.icon} size={16} style={{ color: s.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--ac-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterStatus === s ? 'var(--ac-primary)' : 'var(--ac-surface)', color: filterStatus === s ? '#fff' : 'var(--ac-text)', transition: 'all 0.15s' }}>
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'feedback', 'bug', 'feature', 'urgent'].map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--ac-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterCategory === c ? 'var(--ac-text)' : 'var(--ac-surface)', color: filterCategory === c ? '#fff' : 'var(--ac-muted)', transition: 'all 0.15s' }}>
              {c === 'all' ? 'All Types' : c === 'bug' ? '🐛 Bug' : c === 'feature' ? '🚀 Feature' : c === 'urgent' ? '🚨 Urgent' : '💬 Feedback'}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 14 }}>Loading tickets…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No tickets found</div>
          <div style={{ color: 'var(--ac-muted)', marginBottom: 24, fontSize: 14 }}>Submit a ticket to get started.</div>
          <Button icon={FiPlus} onClick={() => setShowForm(true)}>New Ticket</Button>
        </div>
      ) : (
        <div className="ac-stack">
          {filtered.map(t => {
            const sc = STATUS_COLORS[t.status] || STATUS_COLORS.open;
            const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
            return (
              <div key={t.id} className="ac-card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{t.subject}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.text }}>{t.status.replace('_', ' ')}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: pc.bg, color: pc.text }}>{t.priority}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--ac-bg)', color: 'var(--ac-muted)', border: '1px solid var(--ac-border)' }}>
                        {t.category === 'bug' ? '🐛' : t.category === 'feature' ? '🚀' : t.category === 'urgent' ? '🚨' : '💬'} {t.category}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{t.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--ac-muted)' }}>
                      <span><SafeIcon icon={FiUser} size={11} style={{ marginRight: 3 }} />{t.submitted_by}</span>
                      <span><SafeIcon icon={FiClock} size={11} style={{ marginRight: 3 }} />{new Date(t.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  {t.status !== 'resolved' && t.status !== 'closed' && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {t.status === 'open' && (
                        <button onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          Start
                        </button>
                      )}
                      <button onClick={() => handleUpdateStatus(t.id, 'resolved')}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #10B981', background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <SafeIcon icon={FiCheck} size={11} /> Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New ticket form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
          <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SafeIcon icon={FiMessageSquare} size={20} style={{ color: 'var(--ac-primary)' }} />
                <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Submit Ticket</h2>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', alignItems: 'center' }}>
                <SafeIcon icon={FiX} size={18} />
              </button>
            </div>
            {done ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Ticket submitted! Thank you.</div>
              </div>
            ) : (
              <div className="ac-stack">
                <div className="ac-grid-2">
                  <Field label="Category">
                    <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      options={[{ value: 'feedback', label: '💬 Feedback' }, { value: 'bug', label: '🐛 Bug Report' }, { value: 'feature', label: '🚀 Feature Request' }, { value: 'urgent', label: '🚨 Urgent Issue' }]} />
                  </Field>
                  <Field label="Priority">
                    <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                      options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
                  </Field>
                </div>
                <Field label="Subject *"><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary of the issue or feedback…" /></Field>
                <Field label="Message *"><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe in detail…" style={{ minHeight: 100 }} /></Field>
                <Field label="Submitted By"><Input value={form.submitted_by} onChange={e => setForm({ ...form, submitted_by: e.target.value })} /></Field>
                <div className="ac-grid-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button icon={FiSend} onClick={handleSubmit} disabled={submitting || !form.subject || !form.message}>
                    {submitting ? 'Submitting…' : 'Submit Ticket'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FEATURE REQUEST PAGE ─────────────────────────────────────────────
const MOCK_FEATURES = [
  { id: 'r1', title: 'Dark mode for client portal', description: 'Allow clients to switch to dark mode on their portal.', category: 'ui', priority: 'medium', status: 'under_review', votes: 12, submitted_by: 'ops@acuteconnect.health', created_at: new Date(Date.now() - MS_PER_DAY * 3).toISOString() },
  { id: 'r2', title: 'Export patient list to PDF', description: 'Ability to export the full patient directory as a PDF report.', category: 'reporting', priority: 'high', status: 'planned', votes: 24, submitted_by: 'sysadmin@acuteconnect.health', created_at: new Date(Date.now() - MS_PER_DAY * 7).toISOString() },
  { id: 'r3', title: 'SMS check-in reminder', description: 'Send automated SMS reminders to clients before their check-in window.', category: 'automation', priority: 'high', status: 'under_review', votes: 18, submitted_by: 'ops@acuteconnect.health', created_at: new Date(Date.now() - MS_PER_DAY).toISOString() },
];

const FR_STATUS_COLORS = {
  under_review: { bg: '#DBEAFE', text: '#1E40AF' },
  planned: { bg: '#D1FAE5', text: '#065F46' },
  in_progress: { bg: '#FEF3C7', text: '#92400E' },
  completed: { bg: '#F3F4F6', text: '#374151' },
  declined: { bg: '#FEE2E2', text: '#991B1B' },
};

const INITIAL_FEATURE_FORM = { title: '', description: '', category: 'general', priority: 'medium', submitted_by: 'ops@acuteconnect.health' };

export const FeatureRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FEATURE_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_requests_1777090000')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests(!error && data ? data : []);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetFeatureForm = () => { setDone(false); setShowForm(false); setForm({ ...INITIAL_FEATURE_FORM }); };

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('feature_requests_1777090000')
        .insert([{ ...form, status: 'under_review', votes: 0 }])
        .select()
        .single();
      if (!error && data) {
        setRequests(prev => [data, ...prev]);
      }
      setDone(true);
      setTimeout(resetFeatureForm, 2000);
    } catch {
      setDone(true);
      setTimeout(resetFeatureForm, 2000);
    }
    setSubmitting(false);
  };

  const handleVote = async (id) => {
    try {
      const req = requests.find(r => r.id === id);
      const newVotes = (req?.votes || 0) + 1;
      await supabase.from('feature_requests_1777090000').update({ votes: newVotes }).eq('id', id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, votes: newVotes } : r));
    } catch {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, votes: (r.votes || 0) + 1 } : r));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await supabase.from('feature_requests_1777090000').update({ status }).eq('id', id);
    } catch { /* no-op */ }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const filtered = requests.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const counts = { total: requests.length, under_review: requests.filter(r => r.status === 'under_review').length, planned: requests.filter(r => r.status === 'planned').length, completed: requests.filter(r => r.status === 'completed').length };

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiZap} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Feature Requests</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>Submit and vote on platform improvements and new features</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <SafeIcon icon={FiRefreshCw} size={14} />
          </button>
          <Button icon={FiPlus} onClick={() => setShowForm(true)}>New Request</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="ac-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: counts.total, color: 'var(--ac-primary)' },
          { label: 'Under Review', value: counts.under_review, color: '#3B82F6' },
          { label: 'Planned', value: counts.planned, color: '#10B981' },
          { label: 'Completed', value: counts.completed, color: '#6B7280' },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'under_review', 'planned', 'in_progress', 'completed', 'declined'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--ac-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterStatus === s ? 'var(--ac-primary)' : 'var(--ac-surface)', color: filterStatus === s ? '#fff' : 'var(--ac-text)', transition: 'all 0.15s' }}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 14 }}>Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No requests found</div>
          <div style={{ color: 'var(--ac-muted)', marginBottom: 24, fontSize: 14 }}>Be the first to submit a feature request!</div>
          <Button icon={FiPlus} onClick={() => setShowForm(true)}>New Request</Button>
        </div>
      ) : (
        <div className="ac-stack">
          {filtered.map(r => {
            const sc = FR_STATUS_COLORS[r.status] || FR_STATUS_COLORS.under_review;
            const pc = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.medium;
            return (
              <div key={r.id} className="ac-card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {/* Vote button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => handleVote(r.id)}
                      style={{ width: 48, height: 48, borderRadius: 12, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac-primary)'; e.currentTarget.style.background = 'var(--ac-primary-soft)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ac-border)'; e.currentTarget.style.background = 'var(--ac-bg)'; }}>
                      <SafeIcon icon={FiThumbsUp} size={14} style={{ color: 'var(--ac-text-secondary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ac-text)' }}>{r.votes || 0}</span>
                    </button>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.text }}>{r.status.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: pc.bg, color: pc.text }}>{r.priority}</span>
                      {r.category && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--ac-bg)', color: 'var(--ac-muted)', border: '1px solid var(--ac-border)' }}>{r.category}</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{r.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--ac-muted)' }}>
                      <span><SafeIcon icon={FiUser} size={11} style={{ marginRight: 3 }} />{r.submitted_by}</span>
                      <span><SafeIcon icon={FiClock} size={11} style={{ marginRight: 3 }} />{new Date(r.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  {/* Status actions */}
                  {r.status !== 'completed' && r.status !== 'declined' && (
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {r.status === 'under_review' && (
                        <button onClick={() => handleUpdateStatus(r.id, 'planned')}
                          style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #10B981', background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Mark Planned
                        </button>
                      )}
                      {r.status === 'planned' && (
                        <button onClick={() => handleUpdateStatus(r.id, 'completed')}
                          style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #10B981', background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          <SafeIcon icon={FiCheck} size={11} /> Complete
                        </button>
                      )}
                      <button onClick={() => handleUpdateStatus(r.id, 'declined')}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New request form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
          <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SafeIcon icon={FiZap} size={20} style={{ color: 'var(--ac-primary)' }} />
                <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Submit Feature Request</h2>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', alignItems: 'center' }}>
                <SafeIcon icon={FiX} size={18} />
              </button>
            </div>
            {done ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Request submitted! Thank you.</div>
              </div>
            ) : (
              <div className="ac-stack">
                <div className="ac-grid-2">
                  <Field label="Category">
                    <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      options={[{ value: 'general', label: 'General' }, { value: 'ui', label: '🎨 UI/UX' }, { value: 'reporting', label: '📊 Reporting' }, { value: 'automation', label: '⚡ Automation' }, { value: 'integration', label: '🔌 Integration' }, { value: 'security', label: '🔒 Security' }]} />
                  </Field>
                  <Field label="Priority">
                    <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                      options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
                  </Field>
                </div>
                <Field label="Feature Title *"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief title for the feature…" /></Field>
                <Field label="Description *"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the feature and why it would be useful…" style={{ minHeight: 100 }} /></Field>
                <Field label="Submitted By"><Input value={form.submitted_by} onChange={e => setForm({ ...form, submitted_by: e.target.value })} /></Field>
                <div className="ac-grid-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button icon={FiSend} onClick={handleSubmit} disabled={submitting || !form.title || !form.description}>
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// HeatMap redirects to Comprehensive Crisis Management (merged)
export const HeatMapPage = () => {
  // This will be rendered, but the router should redirect to crisis management
  return <Stub title="Heat Map & Dispatch" icon="🗺️" />;
};

// ─── SysAdmin Dashboard ──────────────────────────────────────────────

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; }
    catch { return init; }
  });
  React.useEffect(() => localStorage.setItem(key, JSON.stringify(val)), [key, val]);
  return [val, setVal];
}

function fmt(iso) {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const SEED_USERS = [
  { id: 'u1', name: 'Alice Nguyen',  role: 'admin',    email: 'alice@acutecare.com.au', active: true,  lastLogin: '2025-05-28T08:10:00Z' },
  { id: 'u2', name: 'Ben Hartley',   role: 'admin',    email: 'ben@acutecare.com.au',   active: true,  lastLogin: '2025-05-27T14:32:00Z' },
  { id: 'u3', name: 'Cass Morgan',   role: 'staff',    email: 'cass@acutecare.com.au',  active: true,  lastLogin: '2025-05-28T09:00:00Z' },
  { id: 'u4', name: 'Dan Wu',        role: 'staff',    email: 'dan@acutecare.com.au',   active: false, lastLogin: '2025-04-10T11:00:00Z' },
  { id: 'u5', name: 'Eva Singh',     role: 'sysadmin', email: 'eva@acutecare.com.au',   active: true,  lastLogin: '2025-05-28T10:45:00Z' },
];

const SEED_INTEGRATIONS = [
  { id: 'i1', name: 'Epic EHR',    protocol: 'FHIR API', status: 'active',   lastSync: '2025-05-28T14:30:00Z' },
  { id: 'i2', name: 'Cerner',      protocol: 'HL7',      status: 'active',   lastSync: '2025-05-28T12:15:00Z' },
  { id: 'i3', name: 'SMS Gateway', protocol: 'REST',     status: 'active',   lastSync: '2025-05-28T13:00:00Z' },
  { id: 'i4', name: 'Pathways DB', protocol: 'JDBC',     status: 'degraded', lastSync: '2025-05-27T18:00:00Z' },
  { id: 'i5', name: 'MBS Billing', protocol: 'SOAP',     status: 'active',   lastSync: '2025-05-28T11:00:00Z' },
  { id: 'i6', name: 'NDIS Portal', protocol: 'OAuth2',   status: 'inactive', lastSync: '2025-05-20T09:00:00Z' },
];

const SEED_LOGS = [
  { id: 'l1', ts: '2025-05-28T14:17:00Z', level: 'info',    source: 'Auth',   msg: 'User login successful',       detail: 'User: eva@acutecare.com.au' },
  { id: 'l2', ts: '2025-05-28T14:12:00Z', level: 'error',   source: 'DB',     msg: 'Database connection timeout', detail: 'Failed to connect after 30s' },
  { id: 'l3', ts: '2025-05-28T14:07:00Z', level: 'warning', source: 'API',    msg: 'Rate limit approaching',      detail: 'Usage at 85% of limit' },
  { id: 'l4', ts: '2025-05-28T14:02:00Z', level: 'info',    source: 'System', msg: 'Scheduled backup completed',  detail: '3.2 GB archived' },
  { id: 'l5', ts: '2025-05-28T13:55:00Z', level: 'error',   source: 'Auth',   msg: 'Failed login attempt',        detail: 'IP: 192.168.1.45 — 3 attempts' },
  { id: 'l6', ts: '2025-05-28T13:44:00Z', level: 'info',    source: 'EHR',    msg: 'Epic sync completed',         detail: '47 records updated' },
  { id: 'l7', ts: '2025-05-28T13:30:00Z', level: 'warning', source: 'DB',     msg: 'Slow query detected',         detail: 'Query took 4.2s' },
  { id: 'l8', ts: '2025-05-28T13:20:00Z', level: 'info',    source: 'System', msg: 'Module config updated',       detail: 'Admin: alice@acutecare.com.au' },
];

const SEED_MODULES = [
  { id: 'm1', name: 'Client Check-In',    enabled: true  },
  { id: 'm2', name: 'Resources',          enabled: true  },
  { id: 'm3', name: 'Admin Panel',        enabled: true  },
  { id: 'm4', name: 'Integrations',       enabled: true  },
  { id: 'm5', name: 'Client Management',  enabled: true  },
  { id: 'm6', name: 'Office Management',  enabled: true  },
  { id: 'm7', name: 'Reports',            enabled: false },
  { id: 'm8', name: 'Testing & QA',       enabled: true  },
];

function StatusPill({ status }) {
  const map = {
    active:   { bg: '#D1FAE5', color: '#065F46' },
    degraded: { bg: '#FEF3C7', color: '#92400E' },
    inactive: { bg: '#F3F4F6', color: '#6B7280' },
    info:     { bg: '#DBEAFE', color: '#1E40AF' },
    warning:  { bg: '#FEF3C7', color: '#92400E' },
    error:    { bg: '#FEE2E2', color: '#991B1B' },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function Overview({ users, integrations, logs }) {
  const activeUsers = users.filter(u => u.active).length;
  const activeConns = integrations.filter(i => i.status === 'active').length;
  const degraded    = integrations.filter(i => i.status === 'degraded').length;
  const errors      = logs.filter(l => l.level === 'error').length;
  const ok          = degraded === 0 && errors === 0;

  return (
    <div className="ac-stack">
      {/* System health banner */}
      <div style={{ padding: '16px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, background: ok ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${ok ? '#A7F3D0' : '#FDE68A'}` }}>
        <span style={{ fontSize: 28 }}>{ok ? '✅' : '⚠️'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: ok ? '#065F46' : '#92400E' }}>
            {ok ? 'All systems operational' : 'Some systems need attention'}
          </div>
          <div style={{ fontSize: 12, color: ok ? '#047857' : '#B45309', marginTop: 2 }}>Last checked: {fmt(new Date().toISOString())}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="ac-grid-4">
        {[
          { label: 'Active Users',        value: activeUsers, icon: '👤', color: '#3B82F6' },
          { label: 'Active Integrations', value: activeConns, icon: '🔗', color: '#10B981' },
          { label: 'Degraded Services',   value: degraded,    icon: '⚠️', color: degraded > 0 ? '#F59E0B' : '#94A3B8' },
          { label: 'Recent Errors',       value: errors,      icon: '🔴', color: errors > 0 ? '#EF4444' : '#94A3B8' },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Integration health */}
      <div style={{ background: 'var(--ac-surface)', borderRadius: 14, border: '1px solid var(--ac-border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14 }}>Integration Health</div>
        {integrations.map((intg, i) => (
          <div key={intg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < integrations.length - 1 ? '1px solid var(--ac-border)' : 'none', background: i % 2 === 0 ? 'var(--ac-surface)' : 'var(--ac-surface-soft)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{intg.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{intg.protocol}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{fmt(intg.lastSync)}</span>
              <StatusPill status={intg.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Users({ users, setUsers }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggleActive(id) { setUsers(p => p.map(u => u.id === id ? { ...u, active: !u.active } : u)); }
  function changeRole(id, role) { setUsers(p => p.map(u => u.id === id ? { ...u, role } : u)); setEditId(null); }

  return (
    <div className="ac-stack">
      <input className="ac-input" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.map(u => (
        <div key={u.id} className="ac-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{u.email}</div>
            </div>
            <StatusPill status={u.active ? 'active' : 'inactive'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {editId === u.id ? (
              <>
                {['staff', 'admin', 'sysadmin'].map(r => (
                  <button key={r} onClick={() => changeRole(u.id, r)}
                    style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1.5px solid', cursor: 'pointer',
                      borderColor: u.role === r ? 'var(--ac-primary)' : 'var(--ac-border)',
                      background: u.role === r ? 'var(--ac-primary)' : 'transparent',
                      color: u.role === r ? '#fff' : 'var(--ac-text-secondary)',
                    }}>{r}</button>
                ))}
                <button onClick={() => setEditId(null)} style={{ fontSize: 11, color: 'var(--ac-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--ac-surface-soft)', color: 'var(--ac-text-secondary)' }}>{u.role}</span>
                <button onClick={() => setEditId(u.id)} style={{ fontSize: 12, color: 'var(--ac-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit Role</button>
                <button onClick={() => toggleActive(u.id)} style={{ fontSize: 12, color: u.active ? 'var(--ac-danger)' : 'var(--ac-success)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {u.active ? 'Deactivate' : 'Activate'}
                </button>
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 6 }}>Last login: {fmt(u.lastLogin)}</div>
        </div>
      ))}
    </div>
  );
}

function Logs({ logs, setLogs }) {
  const [search, setSearch] = useState('');
  const [level,  setLevel]  = useState('all');
  const [source, setSource] = useState('all');
  const sources = ['all', ...new Set(logs.map(l => l.source))];
  const filtered = logs.filter(l =>
    (level  === 'all' || l.level  === level) &&
    (source === 'all' || l.source === source) &&
    (l.msg.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase()))
  );

  function exportCSV() {
    const csv = ['Timestamp,Level,Source,Message,Detail',
      ...filtered.map(l => `"${fmt(l.ts)}","${l.level}","${l.source}","${l.msg}","${l.detail}"`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const lc = { info: '#1D4ED8', warning: '#B45309', error: '#DC2626' };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={exportCSV} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>Export CSV</button>
        <button onClick={() => setLogs([])} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid var(--ac-danger)', background: 'transparent', color: 'var(--ac-danger)', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
      </div>
      <input className="ac-input" placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select className="ac-input" style={{ width: 'auto' }} value={level} onChange={e => setLevel(e.target.value)}>
          {['all', 'info', 'warning', 'error'].map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="ac-input" style={{ width: 'auto' }} value={source} onChange={e => setSource(e.target.value)}>
          {sources.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--ac-muted)', alignSelf: 'center' }}>{filtered.length} entries</span>
      </div>
      {filtered.map(l => (
        <div key={l.id} className="ac-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: lc[l.level] || '#64748B' }}>{l.level}</span>
            <span style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{fmt(l.ts)}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{l.msg}</div>
          <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{l.source} — {l.detail}</div>
        </div>
      ))}
      {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ac-muted)', fontSize: 13, padding: '24px 0' }}>No entries match.</p>}
    </div>
  );
}

function Modules({ modules, setModules }) {
  return (
    <div className="ac-stack">
      {modules.map(m => (
        <div key={m.id} className="ac-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>{m.enabled ? 'Enabled' : 'Disabled'}</div>
          </div>
          <button
            onClick={() => setModules(p => p.map(x => x.id === m.id ? { ...x, enabled: !x.enabled } : x))}
            style={{ position: 'relative', display: 'inline-flex', height: 24, width: 44, alignItems: 'center', borderRadius: 12, transition: 'background 0.2s', border: 'none', cursor: 'pointer', background: m.enabled ? 'var(--ac-primary)' : 'var(--ac-border)' }}
          >
            <span style={{ display: 'inline-block', height: 18, width: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: m.enabled ? 'translateX(22px)' : 'translateX(3px)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview',   icon: '🏠' },
  { id: 'users',    label: 'Users',      icon: '👥' },
  { id: 'logs',     label: 'Logs',       icon: '📋' },
  { id: 'modules',  label: 'Modules',    icon: '🧩' },
];

export function SysAdminDashboard() {
  const [tab,     setTab]     = useState('overview');
  const [users,   setUsers]   = useLocalStorage('ac_users',   SEED_USERS);
  const [intgs]               = useLocalStorage('ac_intgs',   SEED_INTEGRATIONS);
  const [logs,    setLogs]    = useLocalStorage('ac_logs',    SEED_LOGS);
  const [modules, setModules] = useLocalStorage('ac_modules', SEED_MODULES);

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>System Dashboard</h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>Live system control and configuration</div>
      </div>

      {/* Tabs */}
      <div className="ac-tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`ac-tab${tab === t.id ? ' ac-tab-active' : ''}`}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview users={users} integrations={intgs} logs={logs} />}
      {tab === 'users'    && <Users users={users} setUsers={setUsers} />}
      {tab === 'logs'     && <Logs  logs={logs}   setLogs={setLogs}   />}
      {tab === 'modules'  && <Modules modules={modules} setModules={setModules} />}
    </div>
  );
}

export default SysAdminDashboard;

// ─── Push Notifications Page ─────────────────────────────────────────────────
const NOTIF_TYPES = [
  { value: 'info',    label: '📢 General Announcement', color: '#3B82F6' },
  { value: 'alert',   label: '🚨 Urgent Alert',         color: '#EF4444' },
  { value: 'update',  label: '🔄 System Update',        color: '#8B5CF6' },
  { value: 'reminder',label: '🔔 Reminder',             color: '#F59E0B' },
  { value: 'welfare', label: '💚 Welfare Check',        color: '#10B981' },
];

export function PushNotificationsPage() {
  const [locations, setLocations]   = useState([]);
  const [sent, setSent]             = useState([]);
  const [sending, setSending]       = useState(false);
  const [toast, setToast]           = useState('');
  const [form, setForm]             = useState({
    target: 'all',
    location_ids: [],
    type: 'info',
    title: '',
    message: '',
    priority: 'normal',
  });

  useEffect(() => {
    supabase.from('care_centres_1777090000').select('id, name, active').order('name')
      .then(({ data }) => setLocations(data || []));
    supabase.from('push_notifications_1777090000').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setSent(data || []));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleLocation = (id) => {
    setForm(f => ({
      ...f,
      location_ids: f.location_ids.includes(id)
        ? f.location_ids.filter(x => x !== id)
        : [...f.location_ids, id],
    }));
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setToast('⚠️ Title and message are required'); return;
    }
    if (form.target === 'specific' && form.location_ids.length === 0) {
      setToast('⚠️ Select at least one location'); return;
    }
    setSending(true);
    const payload = {
      ...form,
      location_ids: form.target === 'all' ? null : form.location_ids,
      created_at: new Date().toISOString(),
      sent_by: 'sysadmin@acuteconnect.health',
      status: 'sent',
    };
    try {
      await supabase.from('push_notifications_1777090000').insert([payload]);
    } catch { /* graceful degradation */ }
    setSent(prev => [{ ...payload, id: Date.now() }, ...prev]);
    setForm({ target: 'all', location_ids: [], type: 'info', title: '', message: '', priority: 'normal' });
    setSending(false);
    setToast('✅ Notification sent successfully!');
    setTimeout(() => setToast(''), 4000);
  };

  const typeConfig = NOTIF_TYPES.find(t => t.value === form.type) || NOTIF_TYPES[0];

  return (
    <div style={{ padding: '0 0 48px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 76, right: 16, zIndex: 999, padding: '12px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, boxShadow: 'var(--ac-shadow-lg)', fontSize: 14, fontWeight: 600, animation: 'slideIn 0.3s ease' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <SafeIcon icon={FiBell} size={24} style={{ color: '#F59E0B' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Push Notifications</h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>Send targeted notifications to all locations or specific care centres</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Compose */}
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiSend} size={16} style={{ color: 'var(--ac-primary)' }} /> Compose Notification
          </div>
          <div className="ac-stack">
            {/* Target selection */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Send To</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: form.target === 'specific' ? 12 : 0 }}>
                {[
                  { id: 'all',      label: '🌐 All Locations', icon: FiGlobe },
                  { id: 'specific', label: '📍 Select Locations', icon: FiMapPin },
                ].map(opt => (
                  <button key={opt.id} onClick={() => set('target', opt.id)} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.target === opt.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.target === opt.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: 'var(--ac-text)', fontWeight: form.target === opt.id ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {form.target === 'specific' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                  {locations.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--ac-muted)', textAlign: 'center', padding: 12 }}>No locations found</div>
                  ) : locations.map(loc => (
                    <label key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: form.location_ids.includes(loc.id) ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', border: `1px solid ${form.location_ids.includes(loc.id) ? 'var(--ac-primary)' : 'var(--ac-border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={form.location_ids.includes(loc.id)} onChange={() => toggleLocation(loc.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <span style={{ fontSize: 14, fontWeight: form.location_ids.includes(loc.id) ? 600 : 400 }}>{loc.name}</span>
                      {loc.active && <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Notification Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {NOTIF_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)} style={{ padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${form.type === t.value ? t.color : 'var(--ac-border)'}`, background: form.type === t.value ? `${t.color}15` : 'var(--ac-bg)', color: form.type === t.value ? t.color : 'var(--ac-text-secondary)', fontSize: 12, fontWeight: form.type === t.value ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Priority</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'normal', label: 'Normal' }, { id: 'high', label: '🔺 High' }, { id: 'critical', label: '🚨 Critical' }].map(p => (
                  <button key={p.id} onClick={() => set('priority', p.id)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${form.priority === p.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.priority === p.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: form.priority === p.id ? 'var(--ac-primary)' : 'var(--ac-text-secondary)', fontSize: 12, fontWeight: form.priority === p.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Title *</label>
              <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Staff meeting at 3pm" maxLength={80} />
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textAlign: 'right', marginTop: 2 }}>{form.title.length}/80</div>
            </div>

            {/* Message */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Message *</label>
              <textarea style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Enter your notification message…" maxLength={500} />
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textAlign: 'right', marginTop: 2 }}>{form.message.length}/500</div>
            </div>

            {/* Preview */}
            {(form.title || form.message) && (
              <div style={{ background: 'var(--ac-bg)', border: `2px solid ${typeConfig.color}30`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${typeConfig.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                    {NOTIF_TYPES.find(t => t.value === form.type)?.label.split(' ')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: typeConfig.color }}>{form.title || 'Notification title'}</div>
                    <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{form.message || 'Message preview'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 6 }}>
                      → {form.target === 'all' ? 'All locations' : `${form.location_ids.length} location(s)`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button disabled={sending || !form.title || !form.message} onClick={handleSend} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: typeConfig.color, color: 'white', fontWeight: 700, fontSize: 15, cursor: !sending && form.title && form.message ? 'pointer' : 'not-allowed', opacity: !sending && form.title && form.message ? 1 : 0.5, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <SafeIcon icon={FiSend} size={16} /> {sending ? 'Sending…' : 'Send Notification'}
            </button>
          </div>
        </div>

        {/* Sent history */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiClock} size={16} style={{ color: 'var(--ac-muted)' }} /> Recent Notifications
          </div>
          {sent.length === 0 ? (
            <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: 32, textAlign: 'center', color: 'var(--ac-muted)' }}>
              <SafeIcon icon={FiBell} size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div style={{ fontSize: 14 }}>No notifications sent yet</div>
            </div>
          ) : sent.map((n, i) => {
            const tc = NOTIF_TYPES.find(t => t.value === n.type) || NOTIF_TYPES[0];
            return (
              <div key={n.id || i} style={{ background: 'var(--ac-surface)', border: `1px solid var(--ac-border)`, borderLeft: `4px solid ${tc.color}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: `${tc.color}15`, color: tc.color, fontWeight: 600 }}>{tc.label}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'var(--ac-surface-soft)', color: 'var(--ac-text-secondary)', fontWeight: 600 }}>
                    {n.target === 'all' ? '🌐 All locations' : `📍 ${Array.isArray(n.location_ids) ? n.location_ids.length : 1} location(s)`}
                  </span>
                  {n.priority !== 'normal' && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                      {n.priority === 'critical' ? '🚨 Critical' : '🔺 High'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

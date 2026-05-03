import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Field, Input, Textarea, Select } from '../../components/UI';

const {
  FiMessageSquare, FiRefreshCw, FiCheck, FiX,
  FiClock, FiAlertCircle, FiCheckCircle, FiPlus,
  FiUser, FiSend,
} = FiIcons;

const STATUS_COLORS = {
  open:        { bg: '#DBEAFE', text: '#1E40AF' },
  in_progress: { bg: '#FEF3C7', text: '#92400E' },
  resolved:    { bg: '#D1FAE5', text: '#065F46' },
  closed:      { bg: '#F3F4F6', text: '#374151' },
};

const PRIORITY_COLORS = {
  low:    { bg: '#F3F4F6', text: '#374151' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high:   { bg: '#FEE2E2', text: '#991B1B' },
};

const INITIAL_FEEDBACK_FORM = {
  subject: '', category: 'feedback', priority: 'medium',
  message: '', submitted_by: 'ops@acuteconnect.health',
};

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
      if (!error && data) setTickets(prev => [data, ...prev]);
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

  const counts = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiMessageSquare} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Feedback &amp; Tickets</h1>
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

      <div className="ac-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total',       value: counts.total,       icon: FiMessageSquare, color: 'var(--ac-primary)' },
          { label: 'Open',        value: counts.open,        icon: FiAlertCircle,   color: '#3B82F6' },
          { label: 'In Progress', value: counts.in_progress, icon: FiClock,         color: '#F59E0B' },
          { label: 'Resolved',    value: counts.resolved,    icon: FiCheckCircle,   color: '#10B981' },
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

export default FeedbackPage;

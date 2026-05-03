import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Field, Input, Textarea, Select } from '../../components/UI';

const {
  FiZap, FiRefreshCw, FiCheck, FiX,
  FiPlus, FiUser, FiClock, FiSend, FiThumbsUp,
} = FiIcons;

const FR_STATUS_COLORS = {
  under_review: { bg: '#DBEAFE', text: '#1E40AF' },
  planned:      { bg: '#D1FAE5', text: '#065F46' },
  in_progress:  { bg: '#FEF3C7', text: '#92400E' },
  completed:    { bg: '#F3F4F6', text: '#374151' },
  declined:     { bg: '#FEE2E2', text: '#991B1B' },
};

const PRIORITY_COLORS = {
  low:    { bg: '#F3F4F6', text: '#374151' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high:   { bg: '#FEE2E2', text: '#991B1B' },
};

const INITIAL_FEATURE_FORM = {
  title: '', description: '', category: 'general',
  priority: 'medium', submitted_by: 'ops@acuteconnect.health', requested_by: 'ops@acuteconnect.health',
};

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
        .insert([{ ...form, requested_by: form.submitted_by, status: 'under_review', votes: 0 }])
        .select()
        .single();
      if (!error && data) setRequests(prev => [data, ...prev]);
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
  const counts = {
    total: requests.length,
    under_review: requests.filter(r => r.status === 'under_review').length,
    planned: requests.filter(r => r.status === 'planned').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

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

      <div className="ac-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total',        value: counts.total,        color: 'var(--ac-primary)' },
          { label: 'Under Review', value: counts.under_review, color: '#3B82F6' },
          { label: 'Planned',      value: counts.planned,      color: '#10B981' },
          { label: 'Completed',    value: counts.completed,    color: '#6B7280' },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'under_review', 'planned', 'in_progress', 'completed', 'declined'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--ac-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterStatus === s ? 'var(--ac-primary)' : 'var(--ac-surface)', color: filterStatus === s ? '#fff' : 'var(--ac-text)', transition: 'all 0.15s' }}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => handleVote(r.id)}
                      style={{ width: 48, height: 48, borderRadius: 12, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac-primary)'; e.currentTarget.style.background = 'var(--ac-primary-soft)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ac-border)'; e.currentTarget.style.background = 'var(--ac-bg)'; }}>
                      <SafeIcon icon={FiThumbsUp} size={14} style={{ color: 'var(--ac-text-secondary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ac-text)' }}>{r.votes || 0}</span>
                    </button>
                  </div>
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

export default FeatureRequestPage;

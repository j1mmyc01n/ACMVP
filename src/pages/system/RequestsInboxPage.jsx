/**
 * RequestsInboxPage — Unified inbox for:
 *   • Integration & Org-Access Requests
 *   • Feedback & Bug Tickets
 *   • Feature Requests
 *
 * Layout inspired by Linear / Intercom: tabbed header, stat summary,
 * status-filter pills, card list with inline actions, new-request modal.
 */
import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Field, Input, Textarea, Select } from '../../components/UI';

const {
  FiInbox, FiZap, FiMessageSquare, FiStar, FiRefreshCw, FiPlus,
  FiCheck, FiX, FiClock, FiUser, FiSend, FiChevronRight,
  FiAlertCircle, FiCheckCircle, FiThumbsUp, FiFilter,
} = FiIcons;

// ─── Table names ────────────────────────────────────────────────────
const T_INTG  = 'location_integration_requests_1777090015';
const T_ORG   = 'org_access_requests_1777090000';
const T_FB    = 'feedback_tickets_1777090000';
const T_FEAT  = 'feature_requests_1777090000';

// ─── Helpers ────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffH = diffMs / 36e5;
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'Yesterday';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: diffH > 8760 ? 'numeric' : undefined });
};

const INTG_TYPE_LABELS = {
  ai_activation:       '🤖 AI Activation',
  email_platform:      '📧 Email Platform',
  crm_connection:      '🗄️ CRM Connection',
  calendar_connection: '📅 Calendar',
  field_agents_upgrade:'🚑 Field Agents Upgrade',
  field_agent_add:     '👤 Add Field Agent',
};

// ─── Status badge config ────────────────────────────────────────────
const STATUS_CFG = {
  pending:      { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', label: 'Pending' },
  active:       { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Active' },
  approved:     { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Approved' },
  rejected:     { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', label: 'Rejected' },
  open:         { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', label: 'Open' },
  in_progress:  { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', label: 'In Progress' },
  resolved:     { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Resolved' },
  closed:       { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Closed' },
  under_review: { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', label: 'Under Review' },
  planned:      { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Planned' },
  in_progress_fr:{ bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', label: 'In Progress' },
  completed:    { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Completed' },
  declined:     { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', label: 'Declined' },
};

// ─── Type pill config ───────────────────────────────────────────────
const TYPE_CFG = {
  integration: { bg: '#EDE9FE', color: '#5B21B6', label: '⚡ Integration', icon: FiZap },
  org_access:  { bg: '#DBEAFE', color: '#1D4ED8', label: '🏢 Org Access',  icon: FiUser },
  feedback:    { bg: '#FCE7F3', color: '#9D174D', label: '💬 Feedback',    icon: FiMessageSquare },
  feature:     { bg: '#D1FAE5', color: '#065F46', label: '🚀 Feature',     icon: FiStar },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const TypePill = ({ type }) => {
  const cfg = TYPE_CFG[type] || TYPE_CFG.feedback;
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

// ─── Normalise raw rows into a unified shape ────────────────────────
const normalise = {
  integration: (r) => ({
    _type: 'integration', _table: T_INTG,
    id: r.id,
    title: INTG_TYPE_LABELS[r.type] || r.type || 'Integration Request',
    subtitle: `Location ID: ${r.location_id || '—'}`,
    meta: r.payload
      ? Object.entries(r.payload).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')
      : null,
    submitter: r.payload?.requested_by || r.payload?.email || '—',
    status: r.status || 'pending',
    date: r.created_at,
    raw: r,
  }),
  org_access: (r) => ({
    _type: 'org_access', _table: T_ORG,
    id: r.id,
    title: r.org_name || 'Unknown Organisation',
    subtitle: [r.org_type?.replace(/_/g, ' '), r.selected_plan ? `Plan: ${r.selected_plan}` : null].filter(Boolean).join(' · '),
    meta: r.contact_name ? `${r.contact_name} · ${r.contact_email || ''}` : r.contact_email,
    submitter: r.contact_email || '—',
    status: r.status || 'pending',
    date: r.created_at,
    raw: r,
  }),
  feedback: (r) => ({
    _type: 'feedback', _table: T_FB,
    id: r.id,
    title: r.subject || 'Untitled Ticket',
    subtitle: r.message,
    meta: [r.category, r.priority ? `Priority: ${r.priority}` : null].filter(Boolean).join(' · '),
    submitter: r.submitted_by || '—',
    status: r.status || 'open',
    date: r.created_at,
    priority: r.priority,
    raw: r,
  }),
  feature: (r) => ({
    _type: 'feature', _table: T_FEAT,
    id: r.id,
    title: r.title || 'Untitled Request',
    subtitle: r.description,
    meta: [r.category, r.priority ? `Priority: ${r.priority}` : null].filter(Boolean).join(' · '),
    submitter: r.submitted_by || '—',
    status: r.status || 'under_review',
    date: r.created_at,
    votes: r.votes || 0,
    raw: r,
  }),
};

// ─── "Pending/action-needed" logic ─────────────────────────────────
const isActionable = (item) => {
  if (item._type === 'integration' || item._type === 'org_access')
    return item.status === 'pending';
  if (item._type === 'feedback')
    return item.status === 'open' || item.status === 'in_progress';
  if (item._type === 'feature')
    return item.status === 'under_review' || item.status === 'planned';
  return false;
};

// ─── New Request modal ──────────────────────────────────────────────
const NEW_TYPES = [
  { id: 'feedback', label: '💬 Feedback / Bug Ticket', desc: 'Report a bug or share feedback about the platform.' },
  { id: 'feature',  label: '🚀 Feature Request',        desc: 'Suggest a new feature or platform improvement.' },
];

const INITIAL_FB   = { subject: '', message: '', category: 'feedback', priority: 'medium', submitted_by: 'sysadmin@acuteconnect.health' };
const INITIAL_FEAT = { title: '', description: '', category: 'general', priority: 'medium', submitted_by: 'sysadmin@acuteconnect.health' };

const NewRequestModal = ({ onClose, onCreated }) => {
  const [step, setStep]           = useState('pick');   // 'pick' | 'form'
  const [picked, setPicked]       = useState(null);
  const [fbForm, setFbForm]       = useState({ ...INITIAL_FB });
  const [featForm, setFeatForm]   = useState({ ...INITIAL_FEAT });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (picked === 'feedback') {
        const { data } = await supabase.from(T_FB).insert([{ ...fbForm, status: 'open' }]).select().single();
        onCreated && onCreated('feedback', data);
      } else if (picked === 'feature') {
        const { data } = await supabase.from(T_FEAT).insert([{ ...featForm, status: 'under_review', votes: 0 }]).select().single();
        onCreated && onCreated('feature', data);
      }
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      console.error(e);
      setDone(true);
      setTimeout(onClose, 1800);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 'form' && (
              <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', padding: 4, marginRight: -4 }}>
                <SafeIcon icon={FiChevronRight} size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
            <SafeIcon icon={FiPlus} size={18} style={{ color: 'var(--ac-primary)' }} />
            <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>
              {step === 'pick' ? 'New Request' : picked === 'feedback' ? 'Submit Feedback' : 'Submit Feature Request'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiX} size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Request submitted!</div>
          </div>
        ) : step === 'pick' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--ac-muted)', margin: '0 0 8px' }}>What type of request would you like to submit?</p>
            {NEW_TYPES.map(t => (
              <button key={t.id} onClick={() => { setPicked(t.id); setStep('form'); }}
                style={{ textAlign: 'left', background: 'var(--ac-bg)', border: '1.5px solid var(--ac-border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ac-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--ac-border)'}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{t.desc}</div>
                </div>
                <SafeIcon icon={FiChevronRight} size={16} style={{ color: 'var(--ac-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        ) : picked === 'feedback' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Category">
                <Select value={fbForm.category} onChange={e => setFbForm({ ...fbForm, category: e.target.value })}
                  options={[{ value: 'feedback', label: '💬 Feedback' }, { value: 'bug', label: '🐛 Bug Report' }, { value: 'urgent', label: '🚨 Urgent' }]} />
              </Field>
              <Field label="Priority">
                <Select value={fbForm.priority} onChange={e => setFbForm({ ...fbForm, priority: e.target.value })}
                  options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
              </Field>
            </div>
            <Field label="Subject *">
              <Input value={fbForm.subject} onChange={e => setFbForm({ ...fbForm, subject: e.target.value })} placeholder="Brief summary…" />
            </Field>
            <Field label="Message *">
              <Textarea value={fbForm.message} onChange={e => setFbForm({ ...fbForm, message: e.target.value })} placeholder="Describe in detail…" style={{ minHeight: 90 }} />
            </Field>
            <Field label="Submitted By">
              <Input value={fbForm.submitted_by} onChange={e => setFbForm({ ...fbForm, submitted_by: e.target.value })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button icon={FiSend} onClick={handleSubmit} disabled={submitting || !fbForm.subject || !fbForm.message}>
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Category">
                <Select value={featForm.category} onChange={e => setFeatForm({ ...featForm, category: e.target.value })}
                  options={[{ value: 'general', label: 'General' }, { value: 'ui', label: '🎨 UI/UX' }, { value: 'reporting', label: '📊 Reporting' }, { value: 'automation', label: '⚡ Automation' }, { value: 'integration', label: '🔌 Integration' }, { value: 'security', label: '🔒 Security' }]} />
              </Field>
              <Field label="Priority">
                <Select value={featForm.priority} onChange={e => setFeatForm({ ...featForm, priority: e.target.value })}
                  options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
              </Field>
            </div>
            <Field label="Feature Title *">
              <Input value={featForm.title} onChange={e => setFeatForm({ ...featForm, title: e.target.value })} placeholder="Brief title…" />
            </Field>
            <Field label="Description *">
              <Textarea value={featForm.description} onChange={e => setFeatForm({ ...featForm, description: e.target.value })} placeholder="Describe the feature and why it helps…" style={{ minHeight: 90 }} />
            </Field>
            <Field label="Submitted By">
              <Input value={featForm.submitted_by} onChange={e => setFeatForm({ ...featForm, submitted_by: e.target.value })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button icon={FiSend} onClick={handleSubmit} disabled={submitting || !featForm.title || !featForm.description}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Inline action buttons per item type ────────────────────────────
const ItemActions = ({ item, onUpdate }) => {
  const { _type, status, id, votes } = item;

  if (_type === 'integration' || _type === 'org_access') {
    if (status !== 'pending') return null;
    return (
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onUpdate(item, 'approved')}
          style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#059669'; }}
        >
          <SafeIcon icon={FiCheck} size={12} /> Approve
        </button>
        <button
          onClick={() => onUpdate(item, 'rejected')}
          style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
        >
          <SafeIcon icon={FiX} size={12} /> Reject
        </button>
      </div>
    );
  }

  if (_type === 'feedback') {
    if (status === 'resolved' || status === 'closed') return null;
    return (
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {status === 'open' && (
          <button onClick={() => onUpdate(item, 'in_progress')}
            style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Start
          </button>
        )}
        <button onClick={() => onUpdate(item, 'resolved')}
          style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#059669'; }}
        >
          <SafeIcon icon={FiCheck} size={12} /> Resolve
        </button>
      </div>
    );
  }

  if (_type === 'feature') {
    if (status === 'completed' || status === 'declined') return null;
    return (
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {/* Vote counter */}
        <button onClick={() => onUpdate(item, '__vote')}
          style={{ height: 32, minWidth: 48, padding: '0 10px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac-primary)'; e.currentTarget.style.background = 'var(--ac-primary-soft)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ac-border)'; e.currentTarget.style.background = 'var(--ac-bg)'; }}
          title="Upvote">
          <SafeIcon icon={FiThumbsUp} size={12} style={{ color: 'var(--ac-text-secondary)' }} />
          <span style={{ color: 'var(--ac-text)' }}>{votes}</span>
        </button>
        {status === 'under_review' && (
          <button onClick={() => onUpdate(item, 'planned')}
            style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Plan
          </button>
        )}
        {status === 'planned' && (
          <button onClick={() => onUpdate(item, 'completed')}
            style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#059669'; }}
          >
            <SafeIcon icon={FiCheck} size={12} /> Complete
          </button>
        )}
        <button onClick={() => onUpdate(item, 'declined')}
          style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#DC2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--ac-bg)'; e.currentTarget.style.color = 'var(--ac-muted)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
          title="Decline">
          <SafeIcon icon={FiX} size={13} />
        </button>
      </div>
    );
  }
  return null;
};

// ─── Single inbox card ───────────────────────────────────────────────
const InboxCard = ({ item, onUpdate }) => (
  <div style={{
    background: 'var(--ac-surface)',
    border: `1px solid ${isActionable(item) ? 'var(--ac-border)' : 'var(--ac-border)'}`,
    borderLeft: `3px solid ${isActionable(item) ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    transition: 'box-shadow 0.15s',
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
  >
    {/* Main content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
        <TypePill type={item._type} />
        <StatusBadge status={item.status} />
        {item.priority && item.priority !== 'medium' && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: item.priority === 'high' ? '#FEE2E2' : '#F3F4F6', color: item.priority === 'high' ? '#991B1B' : '#6B7280' }}>
            {item.priority}
          </span>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ac-text)', marginBottom: 3, lineHeight: 1.35 }}>
        {item.title}
      </div>

      {item.subtitle && (
        <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginBottom: 4, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.subtitle}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--ac-muted)', flexWrap: 'wrap' }}>
        {item.meta && (
          <span style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 6, padding: '1px 7px', fontFamily: 'monospace', fontSize: 10 }}>
            {item.meta}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <SafeIcon icon={FiUser} size={10} />{item.submitter}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <SafeIcon icon={FiClock} size={10} />{fmtDate(item.date)}
        </span>
      </div>
    </div>

    {/* Actions — right side */}
    <ItemActions item={item} onUpdate={onUpdate} />
  </div>
);

// ─── Tabs config ─────────────────────────────────────────────────────
const TABS = [
  { id: 'all',         label: 'All',                  icon: FiInbox },
  { id: 'integration', label: 'Integration & Access', icon: FiZap },
  { id: 'feedback',    label: 'Feedback & Tickets',   icon: FiMessageSquare },
  { id: 'feature',     label: 'Feature Requests',     icon: FiStar },
];

// ─── Main component ──────────────────────────────────────────────────
export default function RequestsInboxPage() {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew,    setShowNew]    = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [intgRes, orgRes, fbRes, featRes] = await Promise.all([
        supabase.from(T_INTG).select('*').order('created_at', { ascending: false }),
        supabase.from(T_ORG).select('*').order('created_at', { ascending: false }),
        supabase.from(T_FB).select('*').order('created_at', { ascending: false }),
        supabase.from(T_FEAT).select('*').order('created_at', { ascending: false }),
      ]);
      const all = [
        ...(intgRes.data || []).map(normalise.integration),
        ...(orgRes.data  || []).map(normalise.org_access),
        ...(fbRes.data   || []).map(normalise.feedback),
        ...(featRes.data || []).map(normalise.feature),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      setItems(all);
    } catch (e) {
      console.error('RequestsInboxPage load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleUpdate = useCallback(async (item, newStatus) => {
    try {
      if (newStatus === '__vote') {
        const newVotes = (item.votes || 0) + 1;
        await supabase.from(T_FEAT).update({ votes: newVotes }).eq('id', item.id);
        setItems(prev => prev.map(i => i.id === item.id && i._type === 'feature' ? { ...i, votes: newVotes } : i));
        return;
      }

      // Map approved/active for integration tables
      const dbStatus = (item._type === 'integration' && newStatus === 'approved') ? 'active' : newStatus;
      await supabase.from(item._table).update({ status: dbStatus }).eq('id', item.id);
      setItems(prev => prev.map(i => i.id === item.id && i._type === item._type ? { ...i, status: newStatus } : i));
      showToast(`Updated to "${newStatus}"`);
    } catch (e) {
      showToast('Update failed: ' + e.message, true);
    }
  }, [showToast]);

  const handleCreated = useCallback((type, data) => {
    if (!data) { loadAll(); return; }
    const norm = type === 'feedback' ? normalise.feedback(data) : normalise.feature(data);
    setItems(prev => [norm, ...prev]);
    setShowNew(false);
    showToast('Request submitted successfully!');
  }, [loadAll, showToast]);

  // ── Derived counts for badges ──────────────────────────────────────
  const counts = {
    integration: items.filter(i => (i._type === 'integration' || i._type === 'org_access') && isActionable(i)).length,
    feedback:    items.filter(i => i._type === 'feedback'    && isActionable(i)).length,
    feature:     items.filter(i => i._type === 'feature'     && isActionable(i)).length,
  };
  counts.all = counts.integration + counts.feedback + counts.feature;

  // ── Filter visible items ───────────────────────────────────────────
  const tabFiltered = tab === 'all'
    ? items
    : tab === 'integration'
      ? items.filter(i => i._type === 'integration' || i._type === 'org_access')
      : items.filter(i => i._type === tab);

  const visible = statusFilter === 'all'
    ? tabFiltered
    : statusFilter === 'actionable'
      ? tabFiltered.filter(isActionable)
      : tabFiltered.filter(i => i.status === statusFilter);

  // ── Status filter options for current tab ─────────────────────────
  const tabStatuses = [...new Set(tabFiltered.map(i => i.status))].sort();

  // ── Summary stats ─────────────────────────────────────────────────
  const totalActionable = items.filter(isActionable).length;
  const totalItems      = items.length;

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 72, right: 16, zIndex: 999,
          padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
          borderLeft: `4px solid ${toast.err ? '#EF4444' : '#10B981'}`,
          fontSize: 14, fontWeight: 600, maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ac-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SafeIcon icon={FiInbox} size={18} style={{ color: 'var(--ac-primary)' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.4 }}>Requests Inbox</h1>
            {totalActionable > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>
                {totalActionable} need action
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginLeft: 46 }}>
            Integration approvals, feedback tickets, and feature requests — all in one place.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <SafeIcon icon={FiRefreshCw} size={14} />
          </button>
          <Button icon={FiPlus} onClick={() => setShowNew(true)}>New Request</Button>
        </div>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 22 }}>
        {[
          { label: 'Total',        value: totalItems,         color: 'var(--ac-text)',  icon: FiInbox },
          { label: 'Need Action',  value: totalActionable,    color: totalActionable > 0 ? '#F59E0B' : 'var(--ac-text)', icon: FiAlertCircle },
          { label: 'Integration',  value: items.filter(i => i._type === 'integration' || i._type === 'org_access').length, color: '#5B21B6', icon: FiZap },
          { label: 'Feedback',     value: items.filter(i => i._type === 'feedback').length,  color: '#9D174D', icon: FiMessageSquare },
          { label: 'Features',     value: items.filter(i => i._type === 'feature').length,   color: '#065F46', icon: FiStar },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ac-muted)' }}>{s.label}</span>
              <SafeIcon icon={s.icon} size={13} style={{ color: s.color, opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ac-border)', marginBottom: 16, overflowX: 'auto' }}>
        {TABS.map(t => {
          const badge = t.id === 'all' ? counts.all : t.id === 'integration' ? counts.integration : t.id === 'feedback' ? counts.feedback : t.id === 'feature' ? counts.feature : 0;
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setStatusFilter('all'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '11px 16px', background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--ac-primary)' : 'transparent'}`,
                color: isActive ? 'var(--ac-primary)' : 'var(--ac-text-secondary)',
                fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'color 0.15s',
                marginBottom: -1,
              }}>
              <SafeIcon icon={t.icon} size={13} />
              {t.label}
              {badge > 0 && (
                <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Status filter pills ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <SafeIcon icon={FiFilter} size={12} style={{ color: 'var(--ac-muted)' }} />
        {['all', 'actionable', ...tabStatuses].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              padding: '5px 13px', borderRadius: 20, border: '1px solid var(--ac-border)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              background: statusFilter === s ? 'var(--ac-primary)' : 'var(--ac-surface)',
              color: statusFilter === s ? '#fff' : 'var(--ac-text)',
            }}>
            {s === 'all' ? 'All' : s === 'actionable' ? '⚡ Needs Action' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* ── Item list ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 14 }}>
          <SafeIcon icon={FiRefreshCw} size={22} style={{ opacity: 0.3, marginBottom: 10 }} />
          <div>Loading inbox…</div>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>All clear!</div>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>
            {statusFilter === 'actionable' ? 'No items need action right now.' : 'No requests match the current filter.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(item => (
            <InboxCard key={`${item._type}-${item.id}`} item={item} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      {/* ── New Request modal ─────────────────────────────────────────── */}
      {showNew && (
        <NewRequestModal
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

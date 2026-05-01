import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Field, Input, Textarea, Select, Badge } from '../../components/UI';

const {
  FiZap, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiCheckCircle,
  FiSend, FiCalendar, FiDatabase, FiCpu, FiMail, FiPhone, FiKey,
  FiClock, FiUser, FiPlus,
} = FiIcons;

const INTEGRATION_REQUESTS_TABLE = 'location_integration_requests_1777090015';

const Toast = ({ msg, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', top: 76, right: 16, zIndex: 999,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', background: 'var(--ac-surface)',
    border: '1px solid var(--ac-border)',
    borderLeft: `4px solid ${type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)'}`,
    borderRadius: 10, boxShadow: 'var(--ac-shadow-lg)',
    fontSize: 14, fontWeight: 600, maxWidth: 320,
    animation: 'slideIn 0.3s ease',
  }}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle} style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', padding: 4 }}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

const STATUS_COLORS = {
  pending:  { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#D1FAE5', text: '#065F46' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
  active:   { bg: '#DBEAFE', text: '#1E40AF' },
};

const StatusPill = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.text }}>
      {status}
    </span>
  );
};

const TABS = [
  { id: 'ai',           label: 'AI Engine',     icon: FiCpu },
  { id: 'email',        label: 'Email',         icon: FiMail },
  { id: 'crm',          label: 'CRM',           icon: FiDatabase },
  { id: 'calendar',     label: 'Calendar',      icon: FiCalendar },
  { id: 'field_agents', label: 'Field Agents',  icon: FiUser },
  { id: 'requests',     label: 'My Requests',   icon: FiClock },
];

// ─── AI Activation Request ─────────────────────────────────────────────────
const AITab = ({ showToast, locationId }) => {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from(INTEGRATION_REQUESTS_TABLE)
        .select('*')
        .eq('type', 'ai_activation')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setStatus(data || null);
      setLoading(false);
    })();
  }, [locationId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'ai_activation',
        location_id: locationId,
        status: 'pending',
        payload: {},
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      showToast('AI activation request sent to SysAdmin for review.');
      setStatus({ status: 'pending', payload: {}, created_at: new Date().toISOString() });
    } catch (err) {
      showToast('Failed to submit request: ' + err.message, 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>;

  if (status) {
    return (
      <div className="ac-stack">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: status.status === 'active' ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={status.status === 'active' ? FiCheckCircle : FiClock} size={22} style={{ color: status.status === 'active' ? '#10B981' : '#F59E0B' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Engine — $150 / month</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusPill status={status.status} />
              <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                {new Date(status.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        {status.status === 'active' ? (
          <div>
            <div style={{ padding: '20px', background: '#D1FAE5', borderRadius: 14, border: '1px solid #A7F3D0', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SafeIcon icon={FiCheckCircle} size={18} style={{ color: '#10B981' }} />
                <span style={{ fontWeight: 700, color: '#065F46' }}>Jax AI is active for your location!</span>
              </div>
              <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
                AI capabilities are fully enabled at <strong>$150/month</strong>. Usage is monitored automatically and costs will be included in your invoice.
              </div>
            </div>
            {/* AI monitoring features */}
            <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiCpu} size={15} style={{ color: 'var(--ac-primary)' }} />
                AI Monitoring Features
              </div>
              {[
                { icon: '🚨', label: 'Crisis Monitoring', desc: 'AI monitors all active cases and alerts staff of escalating crisis events in real time.' },
                { icon: '📩', label: 'New Request Alerts', desc: 'Automatically notified when new platform access requests or intake forms are submitted.' },
                { icon: '📊', label: 'Platform Health Insights', desc: 'Weekly AI-generated summaries of platform activity, caseload trends, and anomalies.' },
                { icon: '🔔', label: 'Priority Escalation', desc: 'AI flags cases that have exceeded response time thresholds and suggests reassignments.' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--ac-border)' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : status.status === 'pending' ? (
          <div style={{ padding: '16px 20px', background: '#FEF3C7', borderRadius: 14, border: '1px solid #FCD34D', fontSize: 13, color: '#92400E' }}>
            ⏳ Your request is pending SysAdmin review. Once approved, AI capabilities will be activated at <strong>$150/month</strong>. Usage will be monitored automatically and included in your invoice.
          </div>
        ) : status.status === 'rejected' ? (
          <div style={{ padding: '16px 20px', background: '#FEE2E2', borderRadius: 14, border: '1px solid #FCA5A5', fontSize: 13, color: '#991B1B' }}>
            ❌ Request was not approved. Please contact your SysAdmin for details.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ac-stack">
      {/* Pricing banner */}
      <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', borderRadius: 14, border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#3730A3' }}>$150 <span style={{ fontSize: 14, fontWeight: 500 }}>/ month</span></div>
          <div style={{ fontSize: 13, color: '#4338CA', marginTop: 2 }}>Jax AI Engine — per location</div>
        </div>
        <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, background: '#fff', padding: '6px 14px', borderRadius: 20, border: '1px solid #C7D2FE' }}>
          Billed monthly · Cancel anytime
        </div>
      </div>

      {/* Features */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14 }}>What's included</div>
        {[
          { icon: '🚨', label: 'Crisis Monitoring', desc: 'Real-time AI monitoring of crisis cases with automatic staff alerts.' },
          { icon: '📩', label: 'New Request Alerts', desc: 'Instant notifications when new access requests or intakes are submitted.' },
          { icon: '📊', label: 'Platform Health Insights', desc: 'AI-generated weekly summaries of platform activity and caseload trends.' },
          { icon: '🔔', label: 'Priority Escalation', desc: 'Automatic flagging of overdue cases with reassignment suggestions.' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--ac-border)' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Activate AI for Your Location</div>
        <p style={{ fontSize: 14, color: 'var(--ac-text-secondary)', lineHeight: 1.6, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
          Submit a request to SysAdmin to activate the AI Engine. Once approved, AI monitoring, alerts, and insights will be enabled at <strong>$150/month</strong>, billed automatically.
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 12, border: 'none',
            background: 'var(--ac-primary)', color: 'white',
            fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          <SafeIcon icon={FiCpu} size={18} />
          {submitting ? 'Sending Request…' : 'Request AI — $150/mo'}
        </button>
      </div>
    </div>
  );
};

// ─── Email Platform Settings ───────────────────────────────────────────────
const EmailTab = ({ showToast, locationId }) => {
  const [form, setForm] = useState({ provider: 'smtp', smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '', from_name: '', from_email: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from(INTEGRATION_REQUESTS_TABLE)
        .select('*')
        .eq('type', 'email_platform')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data?.payload) setForm(f => ({ ...f, ...data.payload }));
      setLoading(false);
    })();
  }, [locationId]);

  const handleSave = async () => {
    if (!form.from_email) return showToast('From email is required', 'error');
    setSaving(true);
    try {
      const { error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'email_platform',
        location_id: locationId,
        status: 'active',
        payload: form,
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      showToast('Email platform settings saved.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'error');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>;

  return (
    <div className="ac-stack">
      <div style={{ padding: '16px 20px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <SafeIcon icon={FiMail} size={18} style={{ color: 'var(--ac-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Email Platform Settings</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
          Configure your location's email sending platform. Settings are saved directly and take effect immediately.
        </p>
      </div>
      <Field label="Email Provider">
        <Select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}
          options={[
            { value: 'smtp', label: 'Custom SMTP' },
            { value: 'sendgrid', label: 'SendGrid' },
            { value: 'mailgun', label: 'Mailgun' },
            { value: 'ses', label: 'Amazon SES' },
            { value: 'postmark', label: 'Postmark' },
            { value: 'office365', label: 'Microsoft 365' },
            { value: 'gmail', label: 'Gmail / Google Workspace' },
          ]} />
      </Field>
      {form.provider === 'smtp' && (
        <div className="ac-grid-2">
          <Field label="SMTP Host">
            <Input value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} placeholder="mail.yourorg.com.au" />
          </Field>
          <Field label="SMTP Port">
            <Input value={form.smtp_port} onChange={e => setForm({ ...form, smtp_port: e.target.value })} placeholder="587" />
          </Field>
          <Field label="SMTP Username">
            <Input value={form.smtp_user} onChange={e => setForm({ ...form, smtp_user: e.target.value })} placeholder="noreply@yourorg.com.au" />
          </Field>
          <Field label="SMTP Password" hint="Stored securely">
            <Input type="password" value={form.smtp_password} onChange={e => setForm({ ...form, smtp_password: e.target.value })} placeholder="••••••••" />
          </Field>
        </div>
      )}
      <div className="ac-grid-2">
        <Field label="From Name">
          <Input value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} placeholder="Your Org Name" />
        </Field>
        <Field label="From Email *">
          <Input type="email" value={form.from_email} onChange={e => setForm({ ...form, from_email: e.target.value })} placeholder="noreply@yourorg.com.au" />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional configuration notes…" style={{ minHeight: 60 }} />
      </Field>
      <Button icon={saved ? FiCheck : FiSend} onClick={handleSave} disabled={saving || !form.from_email}>
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Email Settings'}
      </Button>
    </div>
  );
};

// ─── CRM Connection Request ────────────────────────────────────────────────
const CRMTab = ({ showToast, locationId }) => {
  const [form, setForm] = useState({ crm_provider: 'salesforce', api_key: '', instance_url: '', contact_name: '', contact_email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from(INTEGRATION_REQUESTS_TABLE)
        .select('*')
        .eq('type', 'crm_connection')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });
      setRequests(data || []);
      setLoading(false);
    })();
  }, [locationId]);

  const handleSubmit = async () => {
    if (!form.contact_email) return showToast('Contact email is required', 'error');
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'crm_connection',
        location_id: locationId,
        status: 'pending',
        payload: form,
        created_at: new Date().toISOString(),
      }]).select().single();
      if (error) throw error;
      showToast('CRM connection request submitted — SysAdmin will configure the integration.');
      setRequests(prev => [data, ...prev]);
      setForm({ crm_provider: 'salesforce', api_key: '', instance_url: '', contact_name: '', contact_email: '', notes: '' });
    } catch (err) {
      showToast('Failed to submit: ' + err.message, 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="ac-stack">
      <div style={{ padding: '16px 20px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <SafeIcon icon={FiDatabase} size={18} style={{ color: 'var(--ac-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>CRM Integration Request</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
          Enter your CRM connection settings below. Your details are stored securely and SysAdmin will be notified to complete the integration setup.
        </p>
      </div>

      {loading ? null : requests.length > 0 && (
        <div className="ac-stack-sm">
          {requests.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.payload?.crm_provider || 'CRM'}</div>
                <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{new Date(r.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
      )}

      <Field label="CRM Provider *">
        <Select value={form.crm_provider} onChange={e => setForm({ ...form, crm_provider: e.target.value })}
          options={[
            { value: 'salesforce', label: 'Salesforce' },
            { value: 'hubspot', label: 'HubSpot' },
            { value: 'zoho', label: 'Zoho CRM' },
            { value: 'dynamics', label: 'Microsoft Dynamics' },
            { value: 'other', label: 'Other' },
          ]} />
      </Field>
      <div className="ac-grid-2">
        <Field label="Contact Name">
          <Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Your name" />
        </Field>
        <Field label="Contact Email *">
          <Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@yourorg.com" />
        </Field>
      </div>
      <Field label="Instance URL / Subdomain">
        <Input value={form.instance_url} onChange={e => setForm({ ...form, instance_url: e.target.value })} placeholder="https://yourcompany.salesforce.com" />
      </Field>
      <Field label="API Key / Token" hint="Stored securely — only visible to SysAdmin">
        <Input value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="Your CRM API key or access token" />
      </Field>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific fields to sync, mapping requirements, etc." style={{ minHeight: 80 }} />
      </Field>
      <Button icon={FiSend} onClick={handleSubmit} disabled={submitting || !form.contact_email}>
        {submitting ? 'Submitting…' : 'Submit CRM Request'}
      </Button>
    </div>
  );
};

// ─── Calendar Connection Request ───────────────────────────────────────────
const CalendarTab = ({ showToast, locationId }) => {
  const [form, setForm] = useState({ provider: 'google', calendar_email: '', contact_name: '', contact_email: '', webhooks: false, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from(INTEGRATION_REQUESTS_TABLE)
        .select('*')
        .eq('type', 'calendar_connection')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });
      setRequests(data || []);
      setLoading(false);
    })();
  }, [locationId]);

  const handleSubmit = async () => {
    if (!form.contact_email) return showToast('Contact email is required', 'error');
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'calendar_connection',
        location_id: locationId,
        status: 'pending',
        payload: form,
        created_at: new Date().toISOString(),
      }]).select().single();
      if (error) throw error;
      showToast('Calendar connection request submitted — SysAdmin will configure the integration.');
      setRequests(prev => [data, ...prev]);
      setForm({ provider: 'google', calendar_email: '', contact_name: '', contact_email: '', webhooks: false, notes: '' });
    } catch (err) {
      showToast('Failed to submit: ' + err.message, 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="ac-stack">
      <div style={{ padding: '16px 20px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <SafeIcon icon={FiCalendar} size={18} style={{ color: 'var(--ac-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Calendar Integration Request</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
          Connect your calendar system to sync appointments and schedules. SysAdmin will insert the OAuth credentials into your location profile.
        </p>
      </div>

      {loading ? null : requests.length > 0 && (
        <div className="ac-stack-sm">
          {requests.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.payload?.provider || 'Calendar'}</div>
                <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{new Date(r.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
      )}

      <Field label="Calendar Provider *">
        <Select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}
          options={[
            { value: 'google', label: 'Google Calendar' },
            { value: 'outlook', label: 'Outlook / Microsoft 365' },
            { value: 'calendly', label: 'Calendly' },
            { value: 'acuity', label: 'Acuity Scheduling' },
            { value: 'other', label: 'Other' },
          ]} />
      </Field>
      <div className="ac-grid-2">
        <Field label="Contact Name">
          <Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Your name" />
        </Field>
        <Field label="Contact Email *">
          <Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@yourorg.com" />
        </Field>
      </div>
      <Field label="Calendar Email / Account">
        <Input value={form.calendar_email} onChange={e => setForm({ ...form, calendar_email: e.target.value })} placeholder="calendar@yourorg.com" />
      </Field>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Specific calendars to sync, time zones, etc." style={{ minHeight: 80 }} />
      </Field>
      <Button icon={FiSend} onClick={handleSubmit} disabled={submitting || !form.contact_email}>
        {submitting ? 'Submitting…' : 'Submit Calendar Request'}
      </Button>
    </div>
  );
};

// ─── Field Agents Upgrade Tab ──────────────────────────────────────────────
const FieldAgentsTab = ({ showToast, locationId }) => {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from(INTEGRATION_REQUESTS_TABLE)
        .select('*')
        .eq('type', 'field_agents_upgrade')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setStatus(data || null);
      setLoading(false);
    })();
  }, [locationId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'field_agents_upgrade',
        location_id: locationId,
        status: 'pending',
        payload: {},
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      showToast('Field Agents upgrade request sent to SysAdmin for review.');
      setStatus({ status: 'pending', payload: {}, created_at: new Date().toISOString() });
    } catch (err) {
      showToast('Failed to submit request: ' + err.message, 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>;

  if (status) {
    return (
      <div className="ac-stack">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: status.status === 'active' ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={status.status === 'active' ? FiCheckCircle : FiClock} size={22} style={{ color: status.status === 'active' ? '#10B981' : '#F59E0B' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Field Agents — $100 / team / month</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusPill status={status.status} />
              <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                {new Date(status.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        {status.status === 'active' ? (
          <div>
            <div style={{ padding: '20px', background: '#D1FAE5', borderRadius: 14, border: '1px solid #A7F3D0', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SafeIcon icon={FiCheckCircle} size={18} style={{ color: '#10B981' }} />
                <span style={{ fontWeight: 700, color: '#065F46' }}>Field Agents is active for your location!</span>
              </div>
              <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
                Field agent logins are enabled at <strong>$100/team/month</strong>. Manage your field agents from the Staff Management page. Agents log in and see only their assigned cases sorted by priority.
              </div>
            </div>
            <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiUser} size={15} style={{ color: 'var(--ac-primary)' }} />
                Field Agent Capabilities
              </div>
              {[
                { icon: '📋', label: 'Assigned Case View', desc: 'Each field agent sees only their assigned patient cards, sorted by priority status.' },
                { icon: '⚡', label: 'Priority Sorting', desc: 'Cases are automatically sorted by severity — critical, high, medium, low.' },
                { icon: '🚨', label: 'Emergency Provider Requests', desc: 'Field agents can request emergency providers directly from a case card, or providers can request through the card.' },
                { icon: '📝', label: 'Case Notes & Updates', desc: 'Add notes, update case status, and log actions directly on each patient card.' },
                { icon: '👤', label: 'Admin Managed', desc: 'Field agents are assigned and managed by the base location admin user.' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--ac-border)' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : status.status === 'pending' ? (
          <div style={{ padding: '16px 20px', background: '#FEF3C7', borderRadius: 14, border: '1px solid #FCD34D', fontSize: 13, color: '#92400E' }}>
            ⏳ Your request is pending SysAdmin review. Once approved, field agent logins will be enabled at <strong>$100/team/month</strong>. You will be able to assign field agents from the Staff Management page.
          </div>
        ) : status.status === 'rejected' ? (
          <div style={{ padding: '16px 20px', background: '#FEE2E2', borderRadius: 14, border: '1px solid #FCA5A5', fontSize: 13, color: '#991B1B' }}>
            ❌ Request was not approved. Please contact your SysAdmin for details.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ac-stack">
      {/* Pricing banner */}
      <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', borderRadius: 14, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#15803D' }}>$100 <span style={{ fontSize: 14, fontWeight: 500 }}>/ team / month</span></div>
          <div style={{ fontSize: 13, color: '#16A34A', marginTop: 2 }}>Field Agents Upgrade — per location team</div>
        </div>
        <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600, background: '#fff', padding: '6px 14px', borderRadius: 20, border: '1px solid #BBF7D0' }}>
          Billed monthly · Cancel anytime
        </div>
      </div>

      {/* Features */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14 }}>What's included</div>
        {[
          { icon: '📋', label: 'Assigned Case View', desc: 'Field agents see only their assigned patient cards, sorted by priority.' },
          { icon: '⚡', label: 'Priority Sorting', desc: 'Automatic sorting: critical → high → medium → low.' },
          { icon: '🚨', label: 'Emergency Provider Requests', desc: 'Request or receive emergency providers directly from each case card.' },
          { icon: '📝', label: 'Case Notes & Updates', desc: 'Add notes and update case status directly on patient cards.' },
          { icon: '👤', label: 'Admin-Managed Agents', desc: 'Location admin assigns cases and manages field agent access.' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--ac-border)' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚑</div>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Upgrade to Field Agents</div>
        <p style={{ fontSize: 14, color: 'var(--ac-text-secondary)', lineHeight: 1.6, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
          Give your field team dedicated logins. Each agent sees only their assigned cases sorted by priority, can request emergency providers, and update case notes — all from their mobile device.
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 12, border: 'none',
            background: '#16A34A', color: 'white',
            fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          <SafeIcon icon={FiUser} size={18} />
          {submitting ? 'Sending Request…' : 'Request Field Agents — $100/mo'}
        </button>
      </div>
    </div>
  );
};

// ─── All Requests ──────────────────────────────────────────────────────────
const RequestsTab = ({ locationId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from(INTEGRATION_REQUESTS_TABLE)
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }, [locationId]);

  useEffect(() => { load(); }, [load]);

  const TYPE_LABELS = { ai_activation: '🤖 AI Engine', email_platform: '📧 Email Platform', crm_connection: '🗄️ CRM', calendar_connection: '📅 Calendar', field_agents_upgrade: '🚑 Field Agents' };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>All Integration Requests</div>
        <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', padding: 6 }}>
          <SafeIcon icon={FiRefreshCw} size={14} />
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 14 }}>Loading…</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <SafeIcon icon={FiZap} size={40} style={{ color: 'var(--ac-border)', marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>No requests yet</div>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Submit an integration request from the tabs above.</div>
        </div>
      ) : (
        requests.map(r => (
          <div key={r.id} style={{ padding: '16px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{TYPE_LABELS[r.type] || r.type}</div>
                <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                  {new Date(r.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                {r.sysadmin_notes && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--ac-bg)', borderRadius: 8, fontSize: 12, color: 'var(--ac-text-secondary)' }}>
                    <strong>SysAdmin note:</strong> {r.sysadmin_notes}
                  </div>
                )}
              </div>
              <StatusPill status={r.status} />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function LocationIntegrationsPage({ role }) {
  const [tab, setTab] = useState('ai');
  const [toast, setToast] = useState(null);
  // Use the location ID from the admin role context — for now use a stable identifier
  const locationId = role === 'sysadmin' ? 'sysadmin_central' : 'camperdown_main';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <SafeIcon icon={FiZap} size={22} style={{ color: 'var(--ac-primary)' }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Location Integrations</h1>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginBottom: 28 }}>
        Request AI activation, configure your email platform, set up CRM and calendar connections, or upgrade to Field Agents for your location.
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--ac-border)', marginBottom: 28, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px',
              border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--ac-primary)' : 'transparent'}`,
              background: 'transparent',
              color: tab === t.id ? 'var(--ac-primary)' : 'var(--ac-muted)',
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}>
            <SafeIcon icon={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 640 }}>
        {tab === 'ai'           && <AITab showToast={showToast} locationId={locationId} />}
        {tab === 'email'        && <EmailTab showToast={showToast} locationId={locationId} />}
        {tab === 'crm'          && <CRMTab showToast={showToast} locationId={locationId} />}
        {tab === 'calendar'     && <CalendarTab showToast={showToast} locationId={locationId} />}
        {tab === 'field_agents' && <FieldAgentsTab showToast={showToast} locationId={locationId} />}
        {tab === 'requests'     && <RequestsTab locationId={locationId} />}
      </div>
    </div>
  );
}

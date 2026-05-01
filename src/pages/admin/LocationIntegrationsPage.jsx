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
  { id: 'ai',       label: 'AI Engine',  icon: FiCpu },
  { id: 'crm',      label: 'CRM',        icon: FiDatabase },
  { id: 'calendar', label: 'Calendar',   icon: FiCalendar },
  { id: 'requests', label: 'My Requests', icon: FiClock },
];

// ─── AI Activation Request ─────────────────────────────────────────────────
const AITab = ({ showToast, locationId }) => {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ billing_contact: '', billing_email: '', monthly_budget: '100', notes: '' });
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
    if (!form.billing_email) return showToast('Billing email is required', 'error');
    setSubmitting(true);
    try {
      const { error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'ai_activation',
        location_id: locationId,
        status: 'pending',
        payload: form,
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      showToast('AI activation request submitted — SysAdmin will review and configure your API key.');
      setStatus({ status: 'pending', payload: form, created_at: new Date().toISOString() });
    } catch (err) {
      showToast('Failed to submit request: ' + err.message, 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>;

  if (status) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '16px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: status.status === 'active' ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={status.status === 'active' ? FiCheckCircle : FiClock} size={22} style={{ color: status.status === 'active' ? '#10B981' : '#F59E0B' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Activation Request</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusPill status={status.status} />
              <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                {new Date(status.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        {status.status === 'active' ? (
          <div style={{ padding: '20px', background: '#D1FAE5', borderRadius: 14, border: '1px solid #A7F3D0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <SafeIcon icon={FiCheckCircle} size={18} style={{ color: '#10B981' }} />
              <span style={{ fontWeight: 700, color: '#065F46' }}>Jax AI is active for your location!</span>
            </div>
            <div style={{ fontSize: 13, color: '#047857' }}>
              AI capabilities are fully enabled. Jax can now assist with patient management, crisis escalations, and clinical insights.
            </div>
          </div>
        ) : status.status === 'pending' ? (
          <div style={{ padding: '16px 20px', background: '#FEF3C7', borderRadius: 14, border: '1px solid #FCD34D', fontSize: 13, color: '#92400E' }}>
            ⏳ Your request is pending SysAdmin review. You'll be notified once the AI engine is activated for your location.
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
      <div style={{ padding: '16px 20px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <SafeIcon icon={FiCpu} size={18} style={{ color: 'var(--ac-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Request AI Activation</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
          Request access to the Jax AI engine for your location. SysAdmin will configure the API key, link billing, and activate the AI features for your team.
        </p>
      </div>
      <div className="ac-grid-2">
        <Field label="Billing Contact Name *">
          <Input value={form.billing_contact} onChange={e => setForm({ ...form, billing_contact: e.target.value })} placeholder="e.g. Jane Smith" />
        </Field>
        <Field label="Billing Email *">
          <Input type="email" value={form.billing_email} onChange={e => setForm({ ...form, billing_email: e.target.value })} placeholder="billing@yourorg.com.au" />
        </Field>
      </div>
      <Field label="Estimated Monthly Budget (AUD)">
        <Select value={form.monthly_budget} onChange={e => setForm({ ...form, monthly_budget: e.target.value })}
          options={[
            { value: '50', label: 'Under $50' },
            { value: '100', label: '$50 – $100' },
            { value: '250', label: '$100 – $250' },
            { value: '500', label: '$250 – $500' },
            { value: '1000', label: '$500+' },
          ]} />
      </Field>
      <Field label="Additional Notes">
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific requirements or use cases…" style={{ minHeight: 80 }} />
      </Field>
      <Button icon={FiSend} onClick={handleSubmit} disabled={submitting || !form.billing_email}>
        {submitting ? 'Submitting…' : 'Submit AI Activation Request'}
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
          Submit your CRM connection details. SysAdmin will configure the integration and update your location profile settings.
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

  const TYPE_LABELS = { ai_activation: '🤖 AI Engine', crm_connection: '🗄️ CRM', calendar_connection: '📅 Calendar' };

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
        Request AI activation, CRM connections, and calendar integrations for your location. All requests are reviewed and configured by SysAdmin.
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
        {tab === 'ai'       && <AITab showToast={showToast} locationId={locationId} />}
        {tab === 'crm'      && <CRMTab showToast={showToast} locationId={locationId} />}
        {tab === 'calendar' && <CalendarTab showToast={showToast} locationId={locationId} />}
        {tab === 'requests' && <RequestsTab locationId={locationId} />}
      </div>
    </div>
  );
}

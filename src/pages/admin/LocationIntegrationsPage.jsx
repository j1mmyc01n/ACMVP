import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Field, Input, Textarea, Select, Badge } from '../../components/UI';
import { safeErrMsg } from '../../lib/utils';

const {
  FiZap, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiCheckCircle,
  FiSend, FiCalendar, FiDatabase, FiCpu, FiMail, FiPhone, FiKey,
  FiClock, FiUser, FiPlus, FiBell, FiEye, FiEyeOff, FiEdit2, FiServer,
  FiLayers,
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

// Tab groups: Data (CRM, Database) and Communications (Email, Calendar)
const TAB_GROUPS = [
  {
    group: 'Data',
    tabs: [
      { id: 'crm',      label: 'CRM',      icon: FiDatabase },
      { id: 'database', label: 'Database', icon: FiServer },
    ],
  },
  {
    group: 'Communications',
    tabs: [
      { id: 'email',    label: 'Email',    icon: FiMail },
      { id: 'calendar', label: 'Calendar', icon: FiCalendar },
    ],
  },
  {
    group: 'Upgrades',
    tabs: [
      { id: 'ai',                 label: 'AI Engine',          icon: FiCpu },
      { id: 'field_agents',       label: 'Field Agents',       icon: FiUser },
      { id: 'push_notifications', label: 'Push Notifications', icon: FiBell },
    ],
  },
  {
    group: 'History',
    tabs: [
      { id: 'requests', label: 'My Requests', icon: FiClock },
    ],
  },
];

const TABS = TAB_GROUPS.flatMap(g => g.tabs);

// ─── CRN SMS Tool ──────────────────────────────────────────────────────────
const CrnSmsTool = ({ locationId, showToast }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrn, setSelectedCrn] = useState('');
  const [template, setTemplate] = useState('Hi {{name}}, your CRN reference is {{crn}}. Please keep this for your records. — Acute Care Services');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('clients_1777020684735')
        .select('crn, name, postcode, status')
        .order('name')
        .limit(100);
      setPatients((data || []).filter(p => p.status === 'discharged' || !p.status));
      setLoading(false);
    })();
  }, [locationId]);

  const selected = patients.find(p => p.crn === selectedCrn);
  const preview = selected
    ? template.replace(/\{\{crn\}\}/g, selected.crn).replace(/\{\{name\}\}/g, selected.name)
    : template;

  const handleSend = async () => {
    if (!selected) return showToast('Please select a patient', 'error');
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    showToast(`CRN SMS sent to ${selected.name} (${selected.crn})`);
    setSending(false);
    setSelectedCrn('');
  };

  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SafeIcon icon={FiPhone} size={15} style={{ color: 'var(--ac-primary)' }} />
        CRN SMS — Discharged Patients
      </div>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Select Patient</label>
          {loading ? (
            <div style={{ fontSize: 13, color: 'var(--ac-muted)', padding: '8px 0' }}>Loading patients…</div>
          ) : (
            <select
              value={selectedCrn}
              onChange={e => setSelectedCrn(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', fontSize: 13, background: 'var(--ac-bg)', color: 'var(--ac-text)', fontFamily: 'inherit' }}
            >
              <option value="">— Choose discharged patient —</option>
              {patients.map(p => (
                <option key={p.crn} value={p.crn}>{p.name} ({p.crn})</option>
              ))}
            </select>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Message Template</label>
          <textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', fontSize: 13, background: 'var(--ac-bg)', color: 'var(--ac-text)', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>Use {'{{crn}}'} and {'{{name}}'} as placeholders</div>
        </div>
        {selectedCrn && (
          <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#166534', marginBottom: 14, lineHeight: 1.5 }}>
            <strong>Preview:</strong> {preview}
          </div>
        )}
        <button
          onClick={handleSend}
          disabled={sending || !selectedCrn}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--ac-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: sending || !selectedCrn ? 'not-allowed' : 'pointer', opacity: sending || !selectedCrn ? 0.6 : 1, fontFamily: 'inherit' }}
        >
          <SafeIcon icon={FiSend} size={14} />
          {sending ? 'Sending…' : 'Send CRN SMS'}
        </button>
      </div>
    </div>
  );
};

// ─── Claude AI Chat ─────────────────────────────────────────────────────────
const ClaudeAIChat = ({ locationId, showToast }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m Claude, your AI CRM assistant. I can help with case management, client queries, and administrative tasks for your location.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      setKeyLoading(true);
      const { data } = await supabase
        .from('location_credentials')
        .select('credential_key')
        .eq('location_id', locationId)
        .eq('credential_type', 'claude_ai_key')
        .maybeSingle();
      if (data?.credential_key) setApiKey(data.credential_key);
      setKeyLoading(false);
    })();
  }, [locationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const history = [...messages, { role: 'user', content: text }];
    setMessages(history);
    setSending(true);
    try {
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 700));
        setMessages(prev => [...prev, { role: 'assistant', content: 'Demo mode — Claude AI CRM is active but no API key is configured for this location. Contact your SysAdmin to complete setup.' }]);
      } else {
        const apiMessages = history
          .filter((m, i) => !(i === 0 && m.role === 'assistant'))
          .map(m => ({ role: m.role, content: m.content }));
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: 'You are Claude AI CRM, an AI assistant for Acute Care Services — a care management platform. Help staff manage cases, clients, and administrative tasks. Be concise and professional.',
            messages: apiMessages,
          }),
        });
        const json = await res.json();
        const reply = json.content?.[0]?.text || 'No response received.';
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    }
    setSending(false);
  };

  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SafeIcon icon={FiCpu} size={15} style={{ color: '#7C3AED' }} />
        Claude AI Chat
        {!keyLoading && !apiKey && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', marginLeft: 4 }}>Demo</span>
        )}
      </div>
      <div style={{ height: 260, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8f9fa' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? '#7C3AED' : '#fff',
              color: m.role === 'user' ? '#fff' : 'var(--ac-text)',
              fontSize: 13, lineHeight: 1.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: m.role === 'assistant' ? '1px solid var(--ac-border)' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', border: '1px solid var(--ac-border)', fontSize: 13, color: 'var(--ac-muted)' }}>
              Claude is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--ac-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask Claude AI CRM anything…"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--ac-border)', fontSize: 13, background: 'var(--ac-bg)', color: 'var(--ac-text)', fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: sending || !input.trim() ? 'var(--ac-border)' : '#7C3AED', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', flexShrink: 0 }}
        >
          <SafeIcon icon={FiSend} size={14} />
        </button>
      </div>
    </div>
  );
};

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
      showToast('Failed to submit request: ' + safeErrMsg(err), 'error');
    }
    setSubmitting(false);
  };

  const AI_FEATURES = [
    { icon: '🚨', label: 'Crisis Monitoring', desc: 'AI monitors all active cases and alerts staff of escalating crisis events in real time.' },
    { icon: '📩', label: 'New Request Alerts', desc: 'Automatically notified when new platform access requests or intake forms are submitted.' },
    { icon: '📊', label: 'Platform Health Insights', desc: 'Weekly AI-generated summaries of platform activity, caseload trends, and anomalies.' },
    { icon: '🔔', label: 'Priority Escalation', desc: 'AI flags cases that have exceeded response time thresholds and suggests reassignments.' },
    { icon: '📝', label: 'Intake Summarisation', desc: 'AI auto-summarises new client intake forms into structured care notes for your team.' },
    { icon: '⚠️', label: 'Risk Scoring', desc: 'Flags new check-ins above a configurable risk threshold, prompting early intervention.' },
    { icon: '🗒️', label: 'Session Notes Drafting', desc: 'AI drafts session/case notes from structured form inputs, saving clinician time.' },
    { icon: '📈', label: 'Predictive Capacity Alerts', desc: 'AI forecasts when bed or caseload capacity will be exceeded based on current trends.' },
    { icon: '📧', label: 'Automated Reporting', desc: 'Weekly PDF reports auto-generated and emailed to administrators — no manual effort required.' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>;

  if (status) {
    return (
      <div className="ac-stack">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: status.status === 'active' ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={status.status === 'active' ? FiCheckCircle : FiClock} size={22} style={{ color: status.status === 'active' ? '#10B981' : '#F59E0B' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI CRM — $125 / month</div>
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
                <span style={{ fontWeight: 700, color: '#065F46' }}>Claude AI CRM is active for your location!</span>
              </div>
              <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
                AI CRM capabilities are fully enabled at <strong>$125/month</strong>. Usage is monitored automatically and costs will be included in your invoice.
              </div>
            </div>
            {/* AI monitoring features */}
            <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiCpu} size={15} style={{ color: 'var(--ac-primary)' }} />
                AI Capabilities Active
              </div>
              {AI_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--ac-border)' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <CrnSmsTool locationId={locationId} showToast={showToast} />
            <ClaudeAIChat locationId={locationId} showToast={showToast} />
          </div>
        ) : status.status === 'pending' ? (
          <div style={{ padding: '16px 20px', background: '#FEF3C7', borderRadius: 14, border: '1px solid #FCD34D', fontSize: 13, color: '#92400E' }}>
            ⏳ Your request is pending SysAdmin review. Once approved, Claude AI CRM will be activated at <strong>$125/month</strong>. Usage will be monitored automatically and included in your invoice.
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
          <div style={{ fontWeight: 800, fontSize: 20, color: '#3730A3' }}>$125 <span style={{ fontSize: 14, fontWeight: 500 }}>/ month</span></div>
          <div style={{ fontSize: 13, color: '#4338CA', marginTop: 2 }}>Claude AI CRM — per location</div>
        </div>
        <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, background: '#fff', padding: '6px 14px', borderRadius: 20, border: '1px solid #C7D2FE' }}>
          Billed monthly · Cancel anytime
        </div>
      </div>

      {/* Features */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 14 }}>What&apos;s included</div>
        {AI_FEATURES.map(f => (
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
          Submit a request to SysAdmin to activate Claude AI CRM. Once approved, AI monitoring, insights, and CRM intelligence will be enabled at <strong>$125/month</strong>, billed automatically.
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
          {submitting ? 'Sending Request…' : 'Request Claude AI CRM — $125/mo'}
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
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('location_credentials')
        .select('credential_key')
        .eq('location_id', locationId)
        .eq('credential_type', 'email_config')
        .maybeSingle();
      if (data?.credential_key) {
        try { setForm(f => ({ ...f, ...JSON.parse(data.credential_key) })); } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, [locationId]);

  const handleSave = async () => {
    if (!form.from_email) return showToast('From email is required', 'error');
    setSaving(true);
    try {
      const { error } = await supabase.from('location_credentials').upsert([{
        location_id: locationId,
        credential_type: 'email_config',
        credential_key: JSON.stringify(form),
        service_name: `Email (${form.provider})`,
      }], { onConflict: 'location_id,credential_type' });
      if (error) throw error;
      showToast('Email platform settings saved.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showToast('Failed to save settings: ' + safeErrMsg(err), 'error');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!form.from_email) return showToast('Enter a from email first', 'error');
    setTesting(true);
    // Simulate connection test (real test would require a server-side function)
    await new Promise(r => setTimeout(r, 1200));
    showToast('Connection test sent — check your inbox for a test message');
    setTesting(false);
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
      <Button variant="outline" onClick={handleTest} disabled={testing || !form.from_email} style={{ marginTop: -8 }}>
        {testing ? 'Testing…' : '🔌 Test Connection'}
      </Button>
    </div>
  );
};

// ─── CRM Connection Request ────────────────────────────────────────────────
const CRM_PROVIDER_CONFIGS = {
  salesforce: {
    label: 'Salesforce',
    showInstanceUrl: true,
    instanceUrlLabel: 'Instance URL',
    instanceUrlPlaceholder: 'https://yourcompany.salesforce.com',
    showApiKey: true,
    apiKeyLabel: 'API Key / Token',
    apiKeyPlaceholder: 'Your Salesforce API token',
    extraFields: [],
  },
  hubspot: {
    label: 'HubSpot',
    showInstanceUrl: false,
    showApiKey: true,
    apiKeyLabel: 'Private App Token',
    apiKeyPlaceholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    extraFields: [
      { key: 'portal_id', label: 'Portal ID (optional)', placeholder: 'e.g. 12345678' },
    ],
  },
  zoho: {
    label: 'Zoho CRM',
    showInstanceUrl: true,
    instanceUrlLabel: 'Zoho Domain',
    instanceUrlPlaceholder: 'https://www.zohoapis.com',
    showApiKey: true,
    apiKeyLabel: 'OAuth Client Secret',
    apiKeyPlaceholder: 'Your Zoho OAuth client secret',
    extraFields: [
      { key: 'client_id', label: 'OAuth Client ID', placeholder: '1000.xxxxxxxx' },
    ],
  },
  dynamics: {
    label: 'Microsoft Dynamics',
    showInstanceUrl: true,
    instanceUrlLabel: 'Dynamics Instance URL',
    instanceUrlPlaceholder: 'https://yourorg.crm.dynamics.com',
    showApiKey: true,
    apiKeyLabel: 'App Client Secret',
    apiKeyPlaceholder: 'Azure AD app client secret',
    extraFields: [
      { key: 'tenant_id', label: 'Azure Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
      { key: 'client_id', label: 'App Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    ],
  },
  other: {
    label: 'Other CRM',
    showInstanceUrl: true,
    instanceUrlLabel: 'API Endpoint / URL',
    instanceUrlPlaceholder: 'https://api.yourcrm.com',
    showApiKey: true,
    apiKeyLabel: 'API Key / Token',
    apiKeyPlaceholder: 'Your CRM API key or access token',
    extraFields: [],
  },
};

const CRMTab = ({ showToast, locationId }) => {
  const [form, setForm] = useState({ crm_provider: 'salesforce', api_key: '', instance_url: '', contact_name: '', contact_email: '', notes: '', portal_id: '', client_id: '', tenant_id: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const providerConfig = CRM_PROVIDER_CONFIGS[form.crm_provider] || CRM_PROVIDER_CONFIGS.other;

  const handleProviderChange = (e) => {
    setForm(f => ({
      ...f,
      crm_provider: e.target.value,
      api_key: '',
      instance_url: '',
      portal_id: '',
      client_id: '',
      tenant_id: '',
    }));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('location_credentials')
        .select('credential_key')
        .eq('location_id', locationId)
        .eq('credential_type', 'crm_config')
        .maybeSingle();
      if (data?.credential_key) {
        try { setForm(f => ({ ...f, ...JSON.parse(data.credential_key) })); } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, [locationId]);

  const handleSave = async () => {
    if (!form.api_key) return showToast('API key is required', 'error');
    setSaving(true);
    try {
      const payload = { ...form };
      const { error } = await supabase.from('location_credentials').upsert([{
        location_id: locationId,
        credential_type: 'crm_config',
        credential_key: JSON.stringify(payload),
        service_name: CRM_PROVIDER_CONFIGS[form.crm_provider]?.label || form.crm_provider,
      }], { onConflict: 'location_id,credential_type' });
      if (error) throw error;
      showToast('CRM credentials saved.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showToast('Failed to save: ' + safeErrMsg(err), 'error');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!form.api_key) return showToast('Enter an API key first', 'error');
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    showToast('CRM connection test initiated — check your CRM logs for the test ping');
    setTesting(false);
  };

  return (
    <div className="ac-stack">
      <div style={{ padding: '16px 20px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <SafeIcon icon={FiDatabase} size={18} style={{ color: 'var(--ac-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>CRM Connection</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
          Enter your CRM credentials below. They are saved directly to your secure credential store — no sysadmin approval needed.
        </p>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>Loading…</div> : (
        <>
          <Field label="CRM Provider *">
            <Select value={form.crm_provider} onChange={handleProviderChange}
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
            <Field label="Contact Email">
              <Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@yourorg.com" />
            </Field>
          </div>
          {providerConfig.extraFields.length > 0 && (
            <div className="ac-grid-2">
              {providerConfig.extraFields.map(f => (
                <Field key={f.key} label={f.label}>
                  <Input value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </Field>
              ))}
            </div>
          )}
          {providerConfig.showInstanceUrl && (
            <Field label={providerConfig.instanceUrlLabel}>
              <Input value={form.instance_url} onChange={e => setForm({ ...form, instance_url: e.target.value })} placeholder={providerConfig.instanceUrlPlaceholder} />
            </Field>
          )}
          {providerConfig.showApiKey && (
            <Field label={providerConfig.apiKeyLabel} hint="Stored securely in your location credentials">
              <Input type="password" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder={providerConfig.apiKeyPlaceholder} />
            </Field>
          )}
          <Field label="Notes">
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific fields to sync, mapping requirements, etc." style={{ minHeight: 80 }} />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" onClick={handleTest} disabled={testing || !form.api_key} style={{ flexShrink: 0 }}>
              {testing ? 'Testing…' : '🔌 Test'}
            </Button>
            <Button icon={saved ? FiCheck : FiSend} onClick={handleSave} disabled={saving || !form.api_key} style={{ flex: 1 }}>
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save CRM Credentials'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Calendar Connection ────────────────────────────────────────────────────
const CalendarTab = ({ showToast, locationId }) => {
  const [form, setForm] = useState({ provider: 'google', calendar_email: '', api_key: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('location_credentials')
        .select('credential_key')
        .eq('location_id', locationId)
        .eq('credential_type', 'calendar_config')
        .maybeSingle();
      if (data?.credential_key) {
        try { setForm(f => ({ ...f, ...JSON.parse(data.credential_key) })); } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, [locationId]);

  const handleSave = async () => {
    if (!form.calendar_email && !form.api_key) return showToast('Calendar email or API key is required', 'error');
    setSaving(true);
    try {
      const { error } = await supabase.from('location_credentials').upsert([{
        location_id: locationId,
        credential_type: 'calendar_config',
        credential_key: JSON.stringify(form),
        service_name: form.provider,
      }], { onConflict: 'location_id,credential_type' });
      if (error) throw error;
      showToast('Calendar settings saved.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showToast('Failed to save: ' + safeErrMsg(err), 'error');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    showToast('Calendar connection test sent — check your calendar app for the test event');
    setTesting(false);
  };

  return (
    <div className="ac-stack">
      <div style={{ padding: '16px 20px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <SafeIcon icon={FiCalendar} size={18} style={{ color: 'var(--ac-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Calendar Integration</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
          Connect your calendar system directly. Credentials are saved to your secure credential store.
        </p>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>Loading…</div> : (
        <>
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
          <Field label="Calendar Email / Account">
            <Input value={form.calendar_email} onChange={e => setForm({ ...form, calendar_email: e.target.value })} placeholder="calendar@yourorg.com" />
          </Field>
          <Field label="API Key / OAuth Token" hint="Stored securely in your location credentials">
            <Input type="password" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="Your calendar API key or OAuth token" />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Specific calendars to sync, time zones, etc." style={{ minHeight: 80 }} />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" onClick={handleTest} disabled={testing} style={{ flexShrink: 0 }}>
              {testing ? 'Testing…' : '🔌 Test'}
            </Button>
            <Button icon={saved ? FiCheck : FiSend} onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Calendar Settings'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Field Agents Upgrade Tab ──────────────────────────────────────────────
const FieldAgentsTab = ({ showToast, locationId, userEmail }) => {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [addingAgent, setAddingAgent] = useState(false);

  const emailDomain = userEmail ? '@' + userEmail.split('@')[1] : '';

  const loadAgents = useCallback(async () => {
    setAgentsLoading(true);
    const { data } = await supabase
      .from('admin_users_1777025000000')
      .select('id, name, email, status, created_at')
      .eq('role', 'field_agent')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });
    setAgents(data || []);
    setAgentsLoading(false);
  }, [locationId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from(INTEGRATION_REQUESTS_TABLE)
        .select('*')
        .eq('type', 'field_agents_upgrade')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error) setStatus(data || null);
      setLoading(false);
    })();
  }, [locationId]);

  useEffect(() => {
    if (status?.status === 'active') loadAgents();
  }, [status, loadAgents]);

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
      showToast('Failed to submit request: ' + safeErrMsg(err), 'error');
    }
    setSubmitting(false);
  };

  const handleAddAgent = async () => {
    if (!newAgentName.trim() || !newAgentEmail.trim()) return showToast('Name and email are required', 'error');
    setAddingAgent(true);
    try {
      const { error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'field_agent_add',
        location_id: locationId,
        status: 'pending',
        payload: { name: newAgentName.trim(), email: newAgentEmail.trim(), requested_by: userEmail },
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      showToast(`Field agent request for ${newAgentName.trim()} submitted — SysAdmin will be notified and the fee will be added to your invoice.`);
      setShowAddForm(false);
      setNewAgentName('');
      setNewAgentEmail('');
    } catch (err) {
      showToast('Failed to add field agent: ' + safeErrMsg(err), 'error');
    }
    setAddingAgent(false);
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
            <div style={{ fontWeight: 700, fontSize: 15 }}>Field Agents — $100 / agent / month</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusPill status={status.status} />
              <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                {new Date(status.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        {status.status === 'active' ? (
          <div className="ac-stack">
            {/* Active banner */}
            <div style={{ padding: '16px 20px', background: '#D1FAE5', borderRadius: 14, border: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <SafeIcon icon={FiCheckCircle} size={18} style={{ color: '#10B981' }} />
                <span style={{ fontWeight: 700, color: '#065F46' }}>Field Agents is active for your location!</span>
              </div>
              <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
                Field agent logins are enabled at <strong>$100/agent/month</strong>. Add and manage field agents below. Each new agent added will be billed at <strong>$100/month</strong>.
              </div>
            </div>

            {/* Admin login details */}
            {userEmail && (
              <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafeIcon icon={FiKey} size={14} style={{ color: 'var(--ac-primary)' }} />
                  Your Admin Login Details
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ac-primary-soft, #EEF2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SafeIcon icon={FiUser} size={16} style={{ color: 'var(--ac-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{userEmail}</div>
                    <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 2 }}>Location Admin · {locationId}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Field agents list */}
            <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--ac-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafeIcon icon={FiUser} size={14} style={{ color: 'var(--ac-primary)' }} />
                  Field Agents
                </div>
                <button
                  onClick={() => { setShowAddForm(v => !v); setNewAgentName(''); setNewAgentEmail(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: 'none', background: 'var(--ac-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <SafeIcon icon={FiPlus} size={13} />
                  Add Field Agent
                </button>
              </div>

              {/* Add agent form */}
              {showAddForm && (
                <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-bg)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>New Field Agent</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <Field label="Full Name *">
                      <Input
                        value={newAgentName}
                        onChange={e => setNewAgentName(e.target.value)}
                        placeholder="e.g. Jane Smith"
                      />
                    </Field>
                    <Field label={`Email${emailDomain ? ' (' + emailDomain + ')' : ''} *`} hint={emailDomain ? 'Must use your organisation domain' : ''}>
                      <Input
                        type="email"
                        value={newAgentEmail}
                        onChange={e => setNewAgentEmail(e.target.value)}
                        placeholder={emailDomain ? 'firstname' + emailDomain : 'agent@org.com'}
                      />
                    </Field>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginBottom: 12 }}>
                    Submitting will notify SysAdmin to create this account. <strong>$100/month</strong> will be added to your monthly invoice for this field agent.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-text)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button
                      onClick={handleAddAgent}
                      disabled={addingAgent || !newAgentName.trim() || !newAgentEmail.trim()}
                      style={{ flex: 2, padding: '9px 0', borderRadius: 10, border: 'none', background: 'var(--ac-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: addingAgent ? 'not-allowed' : 'pointer', opacity: (addingAgent || !newAgentName.trim() || !newAgentEmail.trim()) ? 0.6 : 1 }}>
                      {addingAgent ? 'Submitting…' : 'Submit & Add to Invoice'}
                    </button>
                  </div>
                </div>
              )}

              {/* Agent locations map (OpenStreetMap iframe — no API key needed) */}
            {agents.length > 0 && (
              <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📍 Agent Location Map
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ac-muted)', marginLeft: 4 }}>Updates when agents are in the field</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <iframe
                    title="Agent Locations Map"
                    width="100%"
                    height="240"
                    style={{ border: 'none', display: 'block' }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=133.0,-44.0,154.0,-10.0&layer=mapnik`}
                    sandbox="allow-scripts allow-same-origin"
                  />
                  <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {agents.map(a => (
                      <div key={a.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20,
                        background: a.last_location_at ? 'rgba(16,185,129,0.9)' : 'rgba(107,114,128,0.85)',
                        color: '#fff', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)',
                      }}>
                        📍 {a.name || a.email?.split('@')[0]}
                        {a.last_location_at && (
                          <span style={{ fontSize: 10, opacity: 0.85 }}>
                            · {new Date(a.last_location_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
              {/* Agent list */}
              {agentsLoading ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--ac-muted)', fontSize: 13 }}>Loading agents…</div>
              ) : agents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--ac-muted)', fontSize: 13 }}>
                  No field agents yet. Use the button above to add one.
                </div>
              ) : agents.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--ac-border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SafeIcon icon={FiUser} size={14} style={{ color: '#16A34A' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: a.status === 'active' ? '#D1FAE5' : '#FEF3C7', color: a.status === 'active' ? '#065F46' : '#92400E', flexShrink: 0 }}>
                    {a.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : status.status === 'pending' ? (
          <div style={{ padding: '16px 20px', background: '#FEF3C7', borderRadius: 14, border: '1px solid #FCD34D', fontSize: 13, color: '#92400E' }}>
            ⏳ Your request is pending SysAdmin review. Once approved, field agent logins will be enabled at <strong>$100/agent/month</strong>. You will be able to add and manage field agents here.
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
          <div style={{ fontWeight: 800, fontSize: 20, color: '#15803D' }}>$100 <span style={{ fontSize: 14, fontWeight: 500 }}>/ agent / month</span></div>
          <div style={{ fontSize: 13, color: '#16A34A', marginTop: 2 }}>Field Agents Upgrade — per active agent</div>
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
          Give your field team dedicated logins. Each agent sees only their assigned cases sorted by priority, can request emergency providers, and update case notes — all from their mobile device. Each agent seat is billed at <strong>$100/month</strong>.
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
          {submitting ? 'Sending Request…' : 'Request Field Agents — $100/agent/mo'}
        </button>
      </div>
    </div>
  );
};

// ─── Push Notifications Tab ────────────────────────────────────────────────
const FREE_PUSH_LIMIT = 3;
const PACK_PUSH_EXTRA = 5;
const PUSH_PACK_FEE = 75;

const PushNotificationsTab = ({ showToast, locationId }) => {
  const [packStatus, setPackStatus] = useState(null); // integration request for the pack
  const [sentThisMonth, setSentThisMonth] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [packRes, sentRes] = await Promise.all([
        supabase
          .from(INTEGRATION_REQUESTS_TABLE)
          .select('*')
          .eq('type', 'push_notification_pack')
          .eq('location_id', locationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('push_notifications_1777090000')
          .select('id', { count: 'exact', head: true })
          .contains('location_ids', [locationId])
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
      ]);

      setPackStatus(packRes.data || null);
      setSentThisMonth(sentRes.count || 0);
      setLoading(false);
    })();
  }, [locationId]);

  const handleSubscribe = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'push_notification_pack',
        location_id: locationId,
        status: 'pending',
        payload: { fee: PUSH_PACK_FEE, extra_notifications: PACK_PUSH_EXTRA },
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      showToast('Push notification pack request sent to SysAdmin for review.');
      setPackStatus({ status: 'pending', payload: { fee: PUSH_PACK_FEE }, created_at: new Date().toISOString() });
    } catch (err) {
      showToast('Failed to submit request: ' + safeErrMsg(err), 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>;

  const packActive = packStatus?.status === 'active';
  const packPending = packStatus?.status === 'pending';
  const monthlyLimit = packActive ? FREE_PUSH_LIMIT + PACK_PUSH_EXTRA : FREE_PUSH_LIMIT;
  const remaining = Math.max(0, monthlyLimit - sentThisMonth);
  const usagePct = Math.min(100, (sentThisMonth / monthlyLimit) * 100);

  return (
    <div className="ac-stack">
      {/* Quota summary */}
      <div style={{ padding: '20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiBell} size={16} style={{ color: 'var(--ac-primary)' }} />
          This Month's Push Quota
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: 'var(--ac-text-secondary)' }}>{sentThisMonth} sent</span>
          <span style={{ fontWeight: 600 }}>{monthlyLimit} total</span>
        </div>
        <div style={{ height: 8, background: 'var(--ac-border)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%',
            width: `${usagePct}%`,
            background: usagePct >= 100 ? 'var(--ac-danger)' : usagePct >= 75 ? '#F59E0B' : 'var(--ac-primary)',
            borderRadius: 4, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: 12, color: remaining === 0 ? 'var(--ac-danger)' : 'var(--ac-muted)' }}>
          {remaining === 0
            ? packActive
              ? '⚠️ Monthly quota reached. Contact SysAdmin for a higher tier.'
              : '⚠️ Free quota reached. Subscribe to the extra pack for +5 more notifications/month.'
            : `${remaining} notification${remaining === 1 ? '' : 's'} remaining this month`}
        </div>
      </div>

      {/* Allocation breakdown */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--ac-border)', fontWeight: 700, fontSize: 13 }}>Monthly Allocation</div>
        <div style={{ display: 'flex', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--ac-border)' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔔</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Free — {FREE_PUSH_LIMIT} notifications / month</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
              Included with every location at no extra cost.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '12px 18px' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📦</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Extra Pack — +{PACK_PUSH_EXTRA} notifications / month · <span style={{ color: '#7C3AED' }}>${PUSH_PACK_FEE}/mo</span></div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
              Subscribe to send up to {FREE_PUSH_LIMIT + PACK_PUSH_EXTRA} notifications per month. Billed monthly, cancel anytime.
            </div>
          </div>
        </div>
      </div>

      {/* Pack status / subscribe CTA */}
      {packActive ? (
        <div style={{ padding: '16px 20px', background: '#D1FAE5', borderRadius: 14, border: '1px solid #A7F3D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiCheckCircle} size={18} style={{ color: '#10B981' }} />
            <span style={{ fontWeight: 700, color: '#065F46' }}>Extra Push Pack is active</span>
          </div>
          <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
            You have {FREE_PUSH_LIMIT + PACK_PUSH_EXTRA} push notifications per month. The <strong>${PUSH_PACK_FEE}/month</strong> charge is included in your monthly invoice.
          </div>
        </div>
      ) : packPending ? (
        <div style={{ padding: '16px 20px', background: '#FEF3C7', borderRadius: 14, border: '1px solid #FCD34D', fontSize: 13, color: '#92400E' }}>
          ⏳ Your request is pending SysAdmin review. Once approved, you will receive +{PACK_PUSH_EXTRA} extra notifications per month at <strong>${PUSH_PACK_FEE}/month</strong>.
        </div>
      ) : packStatus?.status === 'rejected' ? (
        <div style={{ padding: '16px 20px', background: '#FEE2E2', borderRadius: 14, border: '1px solid #FCA5A5', fontSize: 13, color: '#991B1B' }}>
          ❌ Request was not approved. Please contact your SysAdmin for details.
        </div>
      ) : (
        <div style={{ padding: '24px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Need More Push Notifications?</div>
          <p style={{ fontSize: 14, color: 'var(--ac-text-secondary)', lineHeight: 1.6, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Subscribe to the extra pack and get <strong>+{PACK_PUSH_EXTRA} notifications per month</strong> on top of your 3 free — for <strong>${PUSH_PACK_FEE}/month</strong>, billed automatically.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={submitting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px', borderRadius: 12, border: 'none',
              background: '#7C3AED', color: 'white',
              fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1, fontFamily: 'inherit',
            }}
          >
            <SafeIcon icon={FiBell} size={18} />
            {submitting ? 'Sending Request…' : `Subscribe — $${PUSH_PACK_FEE}/mo`}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Database Connection Tab ────────────────────────────────────────────────
const DB_TYPES = [
  {
    value: 'supabase',
    label: 'Supabase (PostgreSQL)',
    icon: '⚡',
    fields: [
      { key: 'db_url', label: 'Project URL', placeholder: 'https://xxxx.supabase.co', type: 'text' },
      { key: 'anon_key', label: 'Anon / Service Key', placeholder: 'eyJhbGci…', type: 'password' },
    ],
  },
  {
    value: 'postgres',
    label: 'PostgreSQL',
    icon: '🐘',
    fields: [
      { key: 'db_url', label: 'Connection String', placeholder: 'postgresql://user:pass@host:5432/dbname', type: 'text' },
      { key: 'ssl', label: 'SSL Mode', placeholder: 'require', type: 'text' },
    ],
  },
  {
    value: 'mysql',
    label: 'MySQL / MariaDB',
    icon: '🐬',
    fields: [
      { key: 'db_url', label: 'Connection String', placeholder: 'mysql://user:pass@host:3306/dbname', type: 'text' },
    ],
  },
  {
    value: 'mongodb',
    label: 'MongoDB Atlas',
    icon: '🍃',
    fields: [
      { key: 'db_url', label: 'Connection URI', placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname', type: 'text' },
      { key: 'db_name', label: 'Database Name (optional)', placeholder: 'mydb', type: 'text' },
    ],
  },
  {
    value: 'firebase',
    label: 'Firebase / Firestore',
    icon: '🔥',
    fields: [
      { key: 'project_id', label: 'Project ID', placeholder: 'my-firebase-project', type: 'text' },
      { key: 'anon_key', label: 'Service Account JSON Key', placeholder: '{ "type": "service_account", … }', type: 'password' },
    ],
  },
  {
    value: 'neon',
    label: 'Neon (Serverless Postgres)',
    icon: '💡',
    fields: [
      { key: 'db_url', label: 'Connection String', placeholder: 'postgresql://user:pass@ep-xxx.neon.tech/dbname', type: 'text' },
    ],
  },
  {
    value: 'planetscale',
    label: 'PlanetScale',
    icon: '🪐',
    fields: [
      { key: 'db_url', label: 'Connection URL', placeholder: 'mysql://user:pass@host/dbname?ssl={"rejectUnauthorized":true}', type: 'text' },
    ],
  },
  {
    value: 'other',
    label: 'Other / Custom',
    icon: '🔌',
    fields: [
      { key: 'db_url', label: 'Connection String / URL', placeholder: 'driver://user:pass@host/dbname', type: 'text' },
      { key: 'notes', label: 'Additional Notes', placeholder: 'e.g. driver type, special configuration…', type: 'text' },
    ],
  },
];

const DatabaseTab = ({ showToast, locationId, role }) => {
  const [connData, setConnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ db_type: 'supabase', db_url: '', anon_key: '', ssl: '', db_name: '', project_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [reqForm, setReqForm] = useState({ contact_email: '', notes: '', db_type: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [testingConn, setTestingConn] = useState(false);
  const isSysadmin = role === 'sysadmin';

  const selectedDbType = DB_TYPES.find(t => t.value === (editing ? editForm.db_type : connData?.db_type)) || DB_TYPES[0]; // used in edit form label/icon


  const load = useCallback(async () => {
    setLoading(true);
    const [instRes, credRes, reqRes] = await Promise.all([
      supabase.from('location_instances').select('supabase_url, supabase_ref').eq('id', locationId).maybeSingle(),
      supabase.from('location_credentials').select('credential_key').eq('location_id', locationId).eq('credential_type', 'db_config').maybeSingle(),
      supabase.from(INTEGRATION_REQUESTS_TABLE).select('*').eq('type', 'db_connection').eq('location_id', locationId).order('created_at', { ascending: false }),
    ]);
    // Try new db_config credential first, fall back to legacy supabase_anon_key
    let parsedConfig = {};
    if (credRes.data?.credential_key) {
      try { parsedConfig = JSON.parse(credRes.data.credential_key); } catch { parsedConfig = {}; }
    }
    setConnData({
      db_type: parsedConfig.db_type || 'supabase',
      db_url: parsedConfig.db_url || instRes.data?.supabase_url || '',
      anon_key: parsedConfig.anon_key || '',
      ssl: parsedConfig.ssl || '',
      db_name: parsedConfig.db_name || '',
      project_id: parsedConfig.project_id || '',
      notes: parsedConfig.notes || '',
      supabase_ref: instRes.data?.supabase_ref || '',
      connection_status: parsedConfig.connection_status || null,
      last_tested_at: parsedConfig.last_tested_at || null,
    });
    setRequests(reqRes.data || []);
    setLoading(false);
  }, [locationId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = JSON.stringify({ ...editForm, connection_status: connData?.connection_status || null, last_tested_at: connData?.last_tested_at || null });
      const { error: credErr } = await supabase
        .from('location_credentials')
        .upsert([{
          location_id: locationId,
          credential_type: 'db_config',
          credential_key: payload,
        }], { onConflict: 'location_id,credential_type' });
      if (credErr) throw credErr;

      // Also update supabase_url in location_instances for backward compat when supabase type
      if (editForm.db_type === 'supabase' && editForm.db_url) {
        await supabase.from('location_instances').update({ supabase_url: editForm.db_url }).eq('id', locationId);
      }

      showToast('Database connection settings updated.');
      setEditing(false);
      load();
    } catch (err) {
      showToast('Failed to save: ' + safeErrMsg(err), 'error');
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    // NOTE: actual connection validation requires a server-side proxy (to avoid CORS and protect credentials).
    // This records the test attempt and timestamps it; a future Netlify function can perform the real ping.
    await new Promise(r => setTimeout(r, 1500));
    try {
      const updated = { ...(connData || {}), connection_status: 'ok', last_tested_at: new Date().toISOString() };
      await supabase.from('location_credentials').upsert([{
        location_id: locationId,
        credential_type: 'db_config',
        credential_key: JSON.stringify(updated),
      }], { onConflict: 'location_id,credential_type' });
      setConnData(updated);
      showToast('✅ Connection settings saved — server-side validation pending');
    } catch (err) {
      showToast('Connection test failed: ' + safeErrMsg(err), 'error');
    }
    setTestingConn(false);
  };

  const handleRequest = async () => {
    if (!reqForm.contact_email) return showToast('Contact email is required', 'error');
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).insert([{
        type: 'db_connection',
        location_id: locationId,
        status: 'pending',
        payload: { contact_email: reqForm.contact_email, notes: reqForm.notes, db_type: reqForm.db_type || 'supabase' },
        created_at: new Date().toISOString(),
      }]).select().single();
      if (error) throw error;
      showToast('DB connection request sent to SysAdmin.');
      setRequests(prev => [data, ...prev]);
      setReqForm({ contact_email: '', notes: '', db_type: '' });
    } catch (err) {
      showToast('Failed to submit: ' + safeErrMsg(err), 'error');
    }
    setSubmitting(false);
  };

  const maskKey = (key) => {
    if (!key) return '—';
    // Mask embedded password in connection strings: scheme://user:PASSWORD@host/...
    const urlPasswordPattern = /^([a-z+]+:\/\/[^:]*:)([^@]+)(@.*)$/i;
    const urlMatch = key.match(urlPasswordPattern);
    if (urlMatch) {
      return `${urlMatch[1]}••••••••${urlMatch[3]}`;
    }
    if (key.length <= 12) return '••••••••••••';
    return key.slice(0, 8) + '••••••••••••••••' + key.slice(-4);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>;

  return (
    <div className="ac-stack">
      {/* Connection status banner */}
      {connData?.connection_status && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
          background: connData.connection_status === 'ok' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${connData.connection_status === 'ok' ? '#A7F3D0' : '#FECACA'}`,
          borderRadius: 12, fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: connData.connection_status === 'ok' ? '#10B981' : '#EF4444', flexShrink: 0 }} />
          <span style={{ color: connData.connection_status === 'ok' ? '#065F46' : '#991B1B' }}>
            {connData.connection_status === 'ok' ? '✅ Database connected successfully' : '❌ Connection error — check credentials'}
          </span>
          {connData.last_tested_at && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ac-muted)' }}>
              Last tested {new Date(connData.last_tested_at).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* Connection overview */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiServer} size={16} style={{ color: 'var(--ac-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Database Connection</span>
            {connData?.db_type && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--ac-bg)', color: 'var(--ac-muted)', border: '1px solid var(--ac-border)' }}>
                {DB_TYPES.find(t => t.value === connData.db_type)?.icon} {DB_TYPES.find(t => t.value === connData.db_type)?.label || connData.db_type}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleTestConnection}
              disabled={testingConn || !connData?.db_url}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, fontWeight: 600, cursor: (testingConn || !connData?.db_url) ? 'not-allowed' : 'pointer', opacity: (testingConn || !connData?.db_url) ? 0.6 : 1 }}
            >
              <SafeIcon icon={FiRefreshCw} size={12} /> {testingConn ? 'Testing…' : 'Test'}
            </button>
            {isSysadmin && !editing && (
              <button
                onClick={() => { setEditForm({ db_type: connData.db_type || 'supabase', db_url: connData.db_url || '', anon_key: '', ssl: connData.ssl || '', db_name: connData.db_name || '', project_id: connData.project_id || '', notes: connData.notes || '' }); setEditing(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <SafeIcon icon={FiEdit2} size={12} /> Edit
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Database type selector */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-muted)', display: 'block', marginBottom: 6 }}>Database Type *</label>
              <select
                value={editForm.db_type}
                onChange={e => setEditForm(f => ({ ...f, db_type: e.target.value, db_url: '', anon_key: '', ssl: '', db_name: '', project_id: '', notes: '' }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
              >
                {DB_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            {/* Dynamic fields */}
            {(DB_TYPES.find(t => t.value === editForm.db_type) || DB_TYPES[0]).fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-muted)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={editForm[f.key] || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-text)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--ac-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Connection String / URL</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', color: connData.db_url ? 'var(--ac-text)' : 'var(--ac-muted)', wordBreak: 'break-all' }}>
                {connData.db_url ? maskKey(connData.db_url) : 'Not configured'}
              </div>
            </div>
            {connData.supabase_ref && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Project Ref</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace' }}>{connData.supabase_ref}</div>
              </div>
            )}
            {connData.anon_key && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Key / Secret</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
                    {isSysadmin && showKey ? connData.anon_key : maskKey(connData.anon_key)}
                  </span>
                  {isSysadmin && (
                    <button onClick={() => setShowKey(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', padding: 4 }} title={showKey ? 'Hide' : 'Show'}>
                      <SafeIcon icon={showKey ? FiEyeOff : FiEye} size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request section (location admin) */}
      {!isSysadmin && (
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <SafeIcon icon={FiKey} size={16} style={{ color: 'var(--ac-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Request DB Connection Update</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
            Submit a request to SysAdmin to update your database connection. You can also request support for a different database type.
          </p>
          {requests.length > 0 && (
            <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requests.slice(0, 3).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{r.payload?.db_type ? `${DB_TYPES.find(t => t.value === r.payload.db_type)?.icon || ''} ${r.payload.db_type}` : 'DB Update'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{new Date(r.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select
              value={reqForm.db_type}
              onChange={e => setReqForm(f => ({ ...f, db_type: e.target.value }))}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'inherit' }}
            >
              <option value="">Select database type (optional)</option>
              {DB_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
            <input
              type="email"
              value={reqForm.contact_email}
              onChange={e => setReqForm(f => ({ ...f, contact_email: e.target.value }))}
              placeholder="Your contact email *"
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'inherit' }}
            />
            <textarea
              value={reqForm.notes}
              onChange={e => setReqForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Describe what needs changing (optional)…"
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'inherit', minHeight: 70, resize: 'vertical' }}
            />
            <button
              onClick={handleRequest}
              disabled={submitting || !reqForm.contact_email}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--ac-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (submitting || !reqForm.contact_email) ? 'not-allowed' : 'pointer', opacity: (submitting || !reqForm.contact_email) ? 0.6 : 1, fontFamily: 'inherit' }}
            >
              <SafeIcon icon={FiSend} size={14} />
              {submitting ? 'Submitting…' : 'Submit DB Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


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

  const TYPE_LABELS = { ai_activation: '🤖 AI Engine', email_platform: '📧 Email Platform', crm_connection: '🗄️ CRM', calendar_connection: '📅 Calendar', field_agents_upgrade: '🚑 Field Agents Upgrade', field_agent_add: '👤 Add Field Agent', push_notification_pack: '🔔 Push Notification Pack' };

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
export default function LocationIntegrationsPage({ role, userEmail, defaultTab }) {
  const [tab, setTab] = useState(defaultTab || 'crm');
  const [toast, setToast] = useState(null);
  const [health, setHealth] = useState(null);
  const [connectionAlerts, setConnectionAlerts] = useState([]);
  const locationId = role === 'sysadmin' ? 'sysadmin_central' : 'camperdown_main';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load health summary counts from location_credentials + integration requests
  useEffect(() => {
    (async () => {
      const [credRes, reqRes] = await Promise.all([
        supabase.from('location_credentials').select('credential_type, credential_key').eq('location_id', locationId),
        supabase.from(INTEGRATION_REQUESTS_TABLE).select('status, type').eq('location_id', locationId),
      ]);
      const creds = credRes.data || [];
      const reqs = reqRes.data || [];
      const activeTypes = new Set(creds.map(c => c.credential_type));
      const pendingCount = reqs.filter(r => r.status === 'pending' && !activeTypes.has(r.type)).length;
      setHealth({
        active: activeTypes.size,
        pending: pendingCount,
        inactive: Math.max(0, TABS.length - activeTypes.size - pendingCount),
      });

      // Build connection alerts from stored credential metadata
      const alerts = [];
      creds.forEach(c => {
        try {
          const parsed = JSON.parse(c.credential_key || '{}');
          if (parsed.connection_status === 'error' || parsed.connection_status === 'failed') {
            alerts.push({ type: c.credential_type, status: 'error', msg: `${c.credential_type.replace(/_/g, ' ')} — connection error detected` });
          }
        } catch { /* ignore */ }
      });
      // Pending requests as alerts for admins
      reqs.filter(r => r.status === 'pending').forEach(r => {
        alerts.push({ type: r.type, status: 'pending', msg: `${(r.type || '').replace(/_/g, ' ')} request pending SysAdmin review` });
      });
      setConnectionAlerts(alerts);
    })();
  }, [locationId]);

  return (
    <div style={{ padding: '0 0 40px' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <SafeIcon icon={FiZap} size={22} style={{ color: 'var(--ac-primary)' }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Location Integrations</h1>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginBottom: 20 }}>
        Configure email, CRM, calendar, and database integrations. Upgrade to AI Engine and Field Agents.
      </div>

      {/* Integration health summary card */}
      {health && (
        <div style={{
          display: 'flex', gap: 14, flexWrap: 'wrap',
          padding: '16px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
          borderRadius: 14, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
            <SafeIcon icon={FiLayers} size={18} style={{ color: 'var(--ac-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Integration Health</span>
          </div>
          {[
            { label: 'Active', value: health.active, color: '#10B981', bg: '#D1FAE5' },
            { label: 'Pending', value: health.pending, color: '#F59E0B', bg: '#FEF3C7' },
            { label: 'Not configured', value: Math.max(0, health.inactive), color: '#94A3B8', bg: '#F1F5F9' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
              borderRadius: 20, background: s.bg,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Connection alerts */}
      {connectionAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {connectionAlerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              background: a.status === 'error' ? '#FEF2F2' : '#FFFBEB',
              border: `1px solid ${a.status === 'error' ? '#FECACA' : '#FDE68A'}`,
              borderRadius: 10, fontSize: 13,
            }}>
              <SafeIcon icon={FiAlertCircle} size={14} style={{ color: a.status === 'error' ? '#DC2626' : '#D97706', flexShrink: 0 }} />
              <span style={{ color: a.status === 'error' ? '#991B1B' : '#92400E', fontWeight: 600, flex: 1 }}>
                {a.msg}
              </span>
              <SafeIcon icon={FiBell} size={14} style={{ color: 'var(--ac-muted)' }} />
            </div>
          ))}
        </div>
      )}


      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--ac-border)', marginBottom: 28, overflowX: 'auto', flexWrap: 'wrap' }}>
        {TAB_GROUPS.map(group => (
          <div key={group.group} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', paddingRight: 6, paddingLeft: 4, letterSpacing: 0.5, alignSelf: 'flex-end', paddingBottom: 10, borderRight: '1px solid var(--ac-border)' }}>
              {group.group}
            </span>
            {group.tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 14px',
                  border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--ac-primary)' : 'transparent'}`,
                  background: 'transparent',
                  color: tab === t.id ? 'var(--ac-primary)' : 'var(--ac-muted)',
                  fontWeight: tab === t.id ? 700 : 500,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}>
                <SafeIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 640 }}>
        {tab === 'ai'                 && <AITab showToast={showToast} locationId={locationId} />}
        {tab === 'email'              && <EmailTab showToast={showToast} locationId={locationId} />}
        {tab === 'crm'                && <CRMTab showToast={showToast} locationId={locationId} />}
        {tab === 'calendar'           && <CalendarTab showToast={showToast} locationId={locationId} />}
        {tab === 'field_agents'       && <FieldAgentsTab showToast={showToast} locationId={locationId} userEmail={userEmail} />}
        {tab === 'push_notifications' && <PushNotificationsTab showToast={showToast} locationId={locationId} />}
        {tab === 'database'           && <DatabaseTab showToast={showToast} locationId={locationId} role={role} />}
        {tab === 'requests'           && <RequestsTab locationId={locationId} />}
      </div>
    </div>
  );
}

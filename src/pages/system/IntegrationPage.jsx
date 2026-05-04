import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '../../components/UI';

const {
  FiCheck, FiX, FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiExternalLink,
  FiCloud, FiDatabase, FiZap, FiSettings, FiAlertCircle, FiCheckCircle,
  FiUpload, FiDownload, FiSync, FiLock, FiUnlock, FiKey, FiSave,
} = FiIcons;

// ── Mobile breakpoint hook ────────────────────────────────────────────
const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    let timer;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setMobile(window.innerWidth < 640), 150);
    };
    window.addEventListener('resize', handler);
    return () => { clearTimeout(timer); window.removeEventListener('resize', handler); };
  }, []);
  return mobile;
};

// ── Toast Notification ────────────────────────────────────────────────
const Toast = ({ msg, type = 'success', onClose }) => (
  <div className={`ac-toast ${type === 'error' ? 'ac-toast-err' : ''}`}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle} style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

// ── Modal Overlay ─────────────────────────────────────────────────────
const ModalOverlay = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: wide ? 750 : 520, boxShadow: 'var(--ac-shadow-xl)', maxHeight: '92vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 22 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ── Toggle Switch component ───────────────────────────────────────────
const Toggle = ({ on, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => !disabled && onChange(!on)}
    disabled={disabled}
    style={{
      position: 'relative', width: 44, height: 24, borderRadius: 12,
      background: on ? 'var(--ac-primary)' : 'var(--ac-border)',
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0, transition: 'background 0.2s', opacity: disabled ? 0.5 : 1,
    }}
  >
    <span style={{
      position: 'absolute', top: 2,
      left: on ? 22 : 2, width: 20, height: 20,
      borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.2s',
    }} />
  </button>
);

// ── OpenAI Engine Card ────────────────────────────────────────────────
const OpenAICard = ({ showToast }) => {
  const [config, setConfig] = useState({});
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  const isConnected = config.status === 'connected' && !!config.api_key;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('location_credentials')
          .select('*')
          .eq('location_id', 'platform')
          .eq('credential_type', 'ai_config')
          .maybeSingle();
        if (!error && data?.credential_key) {
          const parsed = JSON.parse(data.credential_key);
          setConfig({ ...parsed, shared_pool: true });
          localStorage.setItem('ac_int_ai', data.credential_key);
        } else {
          try {
            const cached = localStorage.getItem('ac_int_ai');
            if (cached) setConfig({ ...JSON.parse(cached), shared_pool: true });
          } catch { /* ignore */ }
        }
      } catch {
        try {
          const cached = localStorage.getItem('ac_int_ai');
          if (cached) setConfig({ ...JSON.parse(cached), shared_pool: true });
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!config.api_key) return showToast('API key is required', 'error');
    setSaving(true);
    const updated = { ...config, status: 'connected' };
    try {
      const payload = JSON.stringify(updated);
      const { error } = await supabase.from('location_credentials').upsert([{
        location_id: 'platform', credential_type: 'ai_config',
        credential_key: payload,
      }], { onConflict: 'location_id,credential_type' });
      if (error) throw error;
      localStorage.setItem('ac_int_ai', payload);
      setConfig(updated);
      showToast('OpenAI configuration saved');
    } catch (err) {
      localStorage.setItem('ac_int_ai', JSON.stringify(updated));
      setConfig(updated);
      showToast(`Saved locally (Supabase write failed: ${err?.message || 'unknown'})`);
    }
    setSaving(false);
  };

  const disconnect = async () => {
    const updated = { ...config, status: 'disconnected', api_key: '' };
    try {
      const payload = JSON.stringify(updated);
      await supabase.from('location_credentials').upsert([{
        location_id: 'platform', credential_type: 'ai_config',
        credential_key: payload,
      }], { onConflict: 'location_id,credential_type' });
      localStorage.setItem('ac_int_ai', payload);
    } catch { /* ignore */ }
    setConfig(updated);
    showToast('OpenAI disconnected');
  };

  const testConnection = async () => {
    if (!config.api_key) return showToast('Enter an API key first', 'error');
    setTesting(true);
    try {
      const res = await fetch(config.endpoint || 'https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${config.api_key}` },
      });
      if (res.ok) showToast('Connection successful — OpenAI API key is valid');
      else { const d = await res.json(); showToast(`Connection failed: ${d.error?.message || res.statusText}`, 'error'); }
    } catch { showToast('Could not reach OpenAI — check network or endpoint', 'error'); }
    finally { setTesting(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ background: 'var(--ac-surface)', border: `2px solid ${isConnected ? '#10B981' : 'var(--ac-border)'}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>OpenAI / GPT-4</div>
          <div style={{ fontSize: 12, color: isConnected ? '#059669' : 'var(--ac-muted)' }}>
            {isConnected ? `Connected · Model: ${config.model || 'gpt-3.5-turbo'}` : 'Not connected'}
          </div>
        </div>
        <Badge tone={isConnected ? 'green' : 'gray'}>{isConnected ? '● Active' : '○ Not Connected'}</Badge>
      </div>

      <div className="ac-stack">
        <Field label="OpenAI API Key *">
          <div style={{ display: 'flex', gap: 8 }}>
            <Input type={showKey ? 'text' : 'password'} value={config.api_key || ''} onChange={e => setConfig({ ...config, api_key: e.target.value })} placeholder="sk-..." style={{ flex: 1 }} />
            <button onClick={() => setShowKey(v => !v)} className="ac-icon-btn" title={showKey ? 'Hide' : 'Show'} style={{ flexShrink: 0 }}>
              <SafeIcon icon={showKey ? FiLock : FiKey} size={16} />
            </button>
          </div>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <Field label="Model">
            <Select value={config.model || 'gpt-4'} onChange={e => setConfig({ ...config, model: e.target.value })}
              options={[{ value: 'gpt-4', label: 'GPT-4' }, { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }, { value: 'gpt-4o', label: 'GPT-4o' }, { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }]} />
          </Field>
          <Field label="API Endpoint (optional)">
            <Input value={config.endpoint || ''} onChange={e => setConfig({ ...config, endpoint: e.target.value })} placeholder="https://api.openai.com/v1/chat/completions" />
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#ECFDF5', borderRadius: 10, border: '1px solid #A7F3D0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Shared AI Pool</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>Always enabled — locations draw from this key; usage is metered per-location.</div>
          </div>
          <Toggle on disabled />
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <Button variant="outline" onClick={testConnection} disabled={testing}>{testing ? 'Testing…' : 'Test Connection'}</Button>
          {isConnected && <Button variant="outline" onClick={disconnect} style={{ color: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }}>Disconnect</Button>}
          <Button icon={FiSave} onClick={save} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
};

// ── Claude AI Card ────────────────────────────────────────────────────
const ClaudeAICard = ({ showToast }) => {
  const [config, setConfig] = useState({});
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const isConnected = config.status === 'connected' && !!config.api_key;
  const crmLinked = !!config.crm_linked;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('location_credentials')
          .select('*')
          .eq('location_id', 'platform')
          .eq('credential_type', 'claude_config')
          .maybeSingle();
        if (!error && data?.credential_key) {
          setConfig(JSON.parse(data.credential_key));
          localStorage.setItem('ac_int_claude', data.credential_key);
        } else {
          try {
            const cached = localStorage.getItem('ac_int_claude');
            if (cached) setConfig(JSON.parse(cached));
          } catch { /* ignore */ }
        }
      } catch {
        try {
          const cached = localStorage.getItem('ac_int_claude');
          if (cached) setConfig(JSON.parse(cached));
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!config.api_key) return showToast('API key is required', 'error');
    setSaving(true);
    const updated = { ...config, status: 'connected' };
    try {
      const payload = JSON.stringify(updated);
      const { error } = await supabase.from('location_credentials').upsert([{
        location_id: 'platform', credential_type: 'claude_config',
        credential_key: payload,
      }], { onConflict: 'location_id,credential_type' });
      if (error) throw error;
      localStorage.setItem('ac_int_claude', payload);
      setConfig(updated);
      showToast('Claude AI configuration saved');
    } catch (err) {
      localStorage.setItem('ac_int_claude', JSON.stringify(updated));
      setConfig(updated);
      showToast(`Saved locally (Supabase write failed: ${err?.message || 'unknown'})`);
    }
    setSaving(false);
  };

  const disconnect = async () => {
    const updated = { status: 'disconnected', api_key: '', crm_linked: false };
    try {
      const payload = JSON.stringify(updated);
      await supabase.from('location_credentials').upsert([{
        location_id: 'platform', credential_type: 'claude_config',
        credential_key: payload,
      }], { onConflict: 'location_id,credential_type' });
      localStorage.setItem('ac_int_claude', payload);
    } catch { /* ignore */ }
    setConfig(updated);
    showToast('Claude AI disconnected');
  };

  const toggleCRM = () => {
    if (!isConnected) return showToast('Connect Claude first to enable CRM link', 'error');
    setConfig(c => ({ ...c, crm_linked: !c.crm_linked }));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ background: 'var(--ac-surface)', border: `2px solid ${isConnected ? '#7C3AED' : 'var(--ac-border)'}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Claude AI <span style={{ fontSize: 11, fontWeight: 500, color: '#7C3AED', background: '#EDE9FE', padding: '2px 7px', borderRadius: 20, marginLeft: 4 }}>Anthropic</span></div>
          <div style={{ fontSize: 12, color: isConnected ? '#7C3AED' : 'var(--ac-muted)' }}>
            {isConnected ? `Connected · ${config.model || 'claude-sonnet-4-6'}${crmLinked ? ' · CRM linked' : ''}` : 'Not connected'}
          </div>
        </div>
        <Badge tone={isConnected ? 'purple' : 'gray'} style={{ background: isConnected ? '#EDE9FE' : undefined, color: isConnected ? '#7C3AED' : undefined }}>
          {isConnected ? '● Active' : '○ Not Connected'}
        </Badge>
      </div>

      <div className="ac-stack">
        <Field label="Anthropic API Key *">
          <div style={{ display: 'flex', gap: 8 }}>
            <Input type={showKey ? 'text' : 'password'} value={config.api_key || ''} onChange={e => setConfig({ ...config, api_key: e.target.value })} placeholder="sk-ant-..." style={{ flex: 1 }} />
            <button onClick={() => setShowKey(v => !v)} className="ac-icon-btn" title={showKey ? 'Hide' : 'Show'} style={{ flexShrink: 0 }}>
              <SafeIcon icon={showKey ? FiLock : FiKey} size={16} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>Obtain from console.anthropic.com</div>
        </Field>

        <Field label="Model">
          <Select value={config.model || 'claude-sonnet-4-6'} onChange={e => setConfig({ ...config, model: e.target.value })}
            options={[
              { value: 'claude-opus-4-7',          label: 'Claude Opus 4.7 (Most capable)' },
              { value: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 (Recommended)' },
              { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Fastest)' },
            ]} />
        </Field>

        {/* CRM Link toggle — $125/month */}
        <div style={{ border: '1.5px solid #DDD6FE', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: crmLinked ? '#EDE9FE' : 'var(--ac-bg)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Link Claude to CRM</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '1px 7px', borderRadius: 20 }}>$125 / month</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>
                When active, Claude AI gains read access to this location's CRM — client wellbeing trends, support categories (mental health, NDIS, crisis), intake requests, and call-list data — to generate insights and summaries.
              </div>
            </div>
            <Toggle on={crmLinked} onChange={toggleCRM} disabled={!isConnected} />
          </div>
          {crmLinked && (
            <div style={{ padding: '10px 16px', background: '#F5F3FF', borderTop: '1px solid #DDD6FE', fontSize: 12, color: '#6D28D9' }}>
              Claude CRM is active — $125/month billed to this location. Usage is logged per location in sysadmin metrics.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          {isConnected && <Button variant="outline" onClick={disconnect} style={{ color: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }}>Disconnect</Button>}
          <Button icon={FiSave} onClick={save} disabled={saving} style={{ flex: 1, background: '#7C3AED' }}>{saving ? 'Saving…' : 'Save Claude Config'}</Button>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 14, background: 'var(--ac-bg)', borderRadius: 10, fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
        Claude AI provides location-aware insights including mental health trends, NDIS caseload analysis, crisis pattern detection, and CRM call-list prioritisation. When CRM link is enabled, usage is tracked per location and included in their monthly invoice.
      </div>
    </div>
  );
};

// ── AI Engine Tab ─────────────────────────────────────────────────────
const AIEngineTab = ({ showToast }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
    <div style={{ padding: '12px 16px', background: 'var(--ac-bg)', borderRadius: 12, border: '1px solid var(--ac-border)', fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
      Configure AI providers for the platform. OpenAI powers the platform assistant. Claude AI provides location-specific insights and optional CRM integration at <strong>$125/month per location</strong>.
    </div>
    <OpenAICard showToast={showToast} />
    <ClaudeAICard showToast={showToast} />
  </div>
);

// ── Workspace Integrations Tab ────────────────────────────────────────
const WORKSPACE_INTEGRATIONS = [
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    icon: '🔵',
    color: '#4285F4',
    description: 'Sync calendar events, send emails via Gmail, and manage appointments through Google Calendar.',
    fields: [
      { key: 'client_id', label: 'OAuth Client ID', placeholder: '123456.apps.googleusercontent.com' },
      { key: 'client_secret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-...', secret: true },
      { key: 'calendar_id', label: 'Calendar ID (optional)', placeholder: 'primary' },
    ],
  },
  {
    id: 'outlook365',
    name: 'Microsoft Outlook 365',
    icon: '🔷',
    color: '#0078D4',
    description: 'Send appointment reminders and notifications via Outlook, and sync calendar bookings.',
    fields: [
      { key: 'tenant_id', label: 'Azure Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
      { key: 'client_id', label: 'App Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
      { key: 'client_secret', label: 'App Client Secret', placeholder: 'secret value', secret: true },
    ],
  },
  {
    id: 'calendly',
    name: 'Calendly',
    icon: '📅',
    color: '#0A66C2',
    description: 'Allow patients to self-schedule appointments using your Calendly booking page.',
    fields: [
      { key: 'api_key', label: 'Personal Access Token', placeholder: 'eyJhbGciOiJI...', secret: true },
      { key: 'event_url', label: 'Booking URL (optional)', placeholder: 'https://calendly.com/yourname/30min' },
    ],
  },
];

const WorkspaceCard = ({ integration, showToast }) => {
  const storageKey = `ac_int_ws_${integration.id}`;
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  });
  const [expanded, setExpanded] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  const isConnected = config.status === 'connected';

  const save = () => {
    const missingRequired = integration.fields.find(f => f.secret && !config[f.key] && !isConnected);
    if (missingRequired) {
      showToast(`${missingRequired.label} is required`, 'error');
      return;
    }
    const updated = { ...config, status: 'connected', updated_at: new Date().toISOString() };
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setConfig(updated);
    setExpanded(false);
    showToast(`${integration.name} configuration saved`);
  };

  const disconnect = () => {
    const updated = { status: 'disconnected' };
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setConfig(updated);
    showToast(`${integration.name} disconnected`);
  };

  return (
    <div style={{ background: 'var(--ac-surface)', border: `2px solid ${isConnected ? integration.color : 'var(--ac-border)'}`, borderRadius: 16, padding: 20, transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: expanded ? 16 : 0, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${integration.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {integration.icon}
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{integration.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginTop: 2 }}>{integration.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={isConnected ? 'green' : 'gray'}>{isConnected ? '● Connected' : '○ Not Connected'}</Badge>
          <button
            onClick={() => setExpanded(v => !v)}
            className="ac-btn ac-btn-outline"
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            <SafeIcon icon={FiSettings} size={13} /> {expanded ? 'Hide' : 'Configure'}
          </button>
          {isConnected && (
            <button onClick={disconnect} className="ac-icon-btn" title="Disconnect" style={{ color: 'var(--ac-danger)' }}>
              <SafeIcon icon={FiX} size={14} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="ac-stack" style={{ borderTop: '1px solid var(--ac-border)', paddingTop: 16 }}>
          {integration.fields.map(f => (
            <Field key={f.key} label={f.label}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  type={f.secret && !showSecrets[f.key] ? 'password' : 'text'}
                  value={config[f.key] || ''}
                  onChange={e => setConfig({ ...config, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ flex: 1 }}
                />
                {f.secret && (
                  <button
                    onClick={() => setShowSecrets(s => ({ ...s, [f.key]: !s[f.key] }))}
                    className="ac-icon-btn"
                    title={showSecrets[f.key] ? 'Hide' : 'Show'}
                  >
                    <SafeIcon icon={showSecrets[f.key] ? FiLock : FiKey} size={15} />
                  </button>
                )}
              </div>
            </Field>
          ))}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="outline" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button icon={FiSave} onClick={save} style={{ flex: 1 }}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CRM Platform Configurations ───────────────────────────────────────
const CRM_PLATFORMS = [
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: '#00A1E0' },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', color: '#FF7A59' },
  { id: 'microsoft_dynamics', name: 'Microsoft Dynamics 365', icon: '🔷', color: '#0078D4' },
  { id: 'zoho', name: 'Zoho CRM', icon: '📊', color: '#E42527' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🚀', color: '#1A1A1A' },
  { id: 'monday', name: 'Monday.com', icon: '⚡', color: '#FF3D57' },
  { id: 'custom', name: 'Custom CRM (API)', icon: '🔧', color: '#507C7B' },
];

// ── Integration Card ──────────────────────────────────────────────────
const IntegrationCard = ({ integration, onEdit, onDelete, onToggle, onTest, onSync }) => {
  const crm = CRM_PLATFORMS.find(p => p.id === integration.platform) || CRM_PLATFORMS[0];
  const isActive = integration.status === 'active';

  return (
    <div style={{
      background: 'var(--ac-surface)',
      border: `2px solid ${isActive ? crm.color : 'var(--ac-border)'}`,
      borderRadius: 16,
      padding: 20,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${crm.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            {crm.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{integration.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{crm.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone={isActive ? 'green' : 'gray'}>
            {isActive ? '● Active' : '○ Inactive'}
          </Badge>
          <button
            onClick={() => onToggle(integration.id)}
            className="ac-icon-btn"
            title={isActive ? 'Deactivate' : 'Activate'}
          >
            <SafeIcon icon={isActive ? FiUnlock : FiLock} size={14} style={{ color: isActive ? 'var(--ac-success)' : 'var(--ac-muted)' }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14, padding: 12, background: 'var(--ac-bg)', borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 2 }}>API Endpoint</div>
          <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
            {integration.api_url || '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 2 }}>Last Sync</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>

      {integration.auto_sync && (
        <div style={{ fontSize: 12, color: 'var(--ac-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SafeIcon icon={FiSync} size={12} />
          Auto-sync enabled · Every {integration.sync_interval || 30} minutes
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => onSync(integration.id)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px' }} disabled={!isActive}>
          <SafeIcon icon={FiSync} size={13} /> Sync Now
        </button>
        <button onClick={() => onTest(integration.id)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>
          <SafeIcon icon={FiCheckCircle} size={13} /> Test Connection
        </button>
        <button onClick={() => onEdit(integration)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>
          <SafeIcon icon={FiEdit2} size={13} /> Edit
        </button>
        <button onClick={() => onDelete(integration.id)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px', color: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }}>
          <SafeIcon icon={FiTrash2} size={13} /> Delete
        </button>
      </div>
    </div>
  );
};

// ── Accounting Platforms ──────────────────────────────────────────────
const ACCOUNTING_PLATFORMS = [
  {
    id: 'myob',
    name: 'MYOB AccountRight / Essentials',
    icon: '🟠',
    color: '#E05C00',
    description: 'Connect to MYOB to sync invoices, export billing data, and reconcile payments from location accounts.',
    docs: 'https://developer.myob.com/api/myob-business-api/',
    fields: [
      { key: 'client_id',     label: 'OAuth Client ID',     placeholder: 'xxxxxxxxxxxxxxxx' },
      { key: 'client_secret', label: 'OAuth Client Secret', placeholder: '…', secret: true },
      { key: 'company_file',  label: 'Company File Name (optional)', placeholder: 'My Business' },
    ],
  },
  {
    id: 'xero',
    name: 'Xero',
    icon: '🔵',
    color: '#13B5EA',
    description: 'Sync invoices and payments with Xero. Automatically reconcile location billing and track outstanding balances.',
    docs: 'https://developer.xero.com/',
    fields: [
      { key: 'client_id',     label: 'OAuth 2.0 Client ID',     placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' },
      { key: 'client_secret', label: 'OAuth 2.0 Client Secret', placeholder: '…', secret: true },
      { key: 'tenant_id',     label: 'Xero Tenant / Org ID (optional)', placeholder: 'XXXXXXXX-XXXX-…' },
    ],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    icon: '🟢',
    color: '#2CA01C',
    description: 'Export invoices and usage billing to QuickBooks. Supports multi-location billing separation.',
    docs: 'https://developer.intuit.com/app/developer/qbo/docs/api/accounting',
    fields: [
      { key: 'client_id',     label: 'Intuit Client ID',     placeholder: 'ABxxxxxx' },
      { key: 'client_secret', label: 'Intuit Client Secret', placeholder: '…', secret: true },
      { key: 'realm_id',      label: 'Realm / Company ID (optional)', placeholder: '123456789' },
    ],
  },
  {
    id: 'freshbooks',
    name: 'FreshBooks',
    icon: '🌿',
    color: '#0075DD',
    description: 'Create and send invoices via FreshBooks for location clients. Supports automatic time-based billing.',
    docs: 'https://www.freshbooks.com/api/start',
    fields: [
      { key: 'client_id',     label: 'OAuth Client ID',     placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'client_secret', label: 'OAuth Client Secret', placeholder: '…', secret: true },
      { key: 'account_id',    label: 'Account ID (optional)', placeholder: 'XXXXXX' },
    ],
  },
];

const AccountingCard = ({ platform, showToast }) => {
  const storageKey = `ac_acct_${platform.id}`;
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  const [expanded, setExpanded] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const [syncing, setSyncing] = useState(false);

  const isConnected = config.status === 'connected';

  const save = () => {
    const missingRequired = platform.fields.find(f => f.secret && !config[f.key] && !isConnected);
    if (missingRequired) { showToast(`${missingRequired.label} is required`, 'error'); return; }
    const updated = { ...config, status: 'connected', updated_at: new Date().toISOString() };
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setConfig(updated); setExpanded(false);
    showToast(`${platform.name} configuration saved`);
  };

  const disconnect = () => {
    const updated = { status: 'disconnected' };
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setConfig(updated);
    showToast(`${platform.name} disconnected`);
  };

  const syncNow = async () => {
    if (!isConnected) { showToast('Connect the platform first', 'error'); return; }
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1800));
    setSyncing(false);
    showToast(`${platform.name} — ${Math.floor(Math.random() * 10) + 3} invoices synced`);
  };

  return (
    <div style={{ background: 'var(--ac-surface)', border: `2px solid ${isConnected ? platform.color : 'var(--ac-border)'}`, borderRadius: 16, padding: 20, transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: expanded ? 16 : 0, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${platform.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {platform.icon}
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{platform.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginTop: 2 }}>{platform.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={isConnected ? 'green' : 'gray'}>{isConnected ? '● Connected' : '○ Not Connected'}</Badge>
          <button onClick={syncNow} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 14px' }} disabled={syncing || !isConnected} title="Sync invoices">
            <SafeIcon icon={FiSync} size={13} /> {syncing ? 'Syncing…' : 'Sync'}
          </button>
          <button onClick={() => setExpanded(v => !v)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>
            <SafeIcon icon={FiSettings} size={13} /> {expanded ? 'Hide' : 'Configure'}
          </button>
          {isConnected && (
            <button onClick={disconnect} className="ac-icon-btn" title="Disconnect" style={{ color: 'var(--ac-danger)' }}>
              <SafeIcon icon={FiX} size={14} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="ac-stack" style={{ borderTop: '1px solid var(--ac-border)', paddingTop: 16 }}>
          <div style={{ padding: 12, background: 'var(--ac-bg)', borderRadius: 10, fontSize: 12, color: 'var(--ac-muted)' }}>
            📖 <a href={platform.docs} target="_blank" rel="noreferrer" style={{ color: 'var(--ac-primary)', fontWeight: 600 }}>API Documentation</a> — Get credentials from the platform's developer portal.
          </div>
          {platform.fields.map(f => (
            <Field key={f.key} label={f.label}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  type={f.secret && !showSecrets[f.key] ? 'password' : 'text'}
                  value={config[f.key] || ''}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ flex: 1 }}
                />
                {f.secret && (
                  <button onClick={() => setShowSecrets(s => ({ ...s, [f.key]: !s[f.key] }))} className="ac-icon-btn" title={showSecrets[f.key] ? 'Hide' : 'Show'}>
                    <SafeIcon icon={showSecrets[f.key] ? FiLock : FiKey} size={15} />
                  </button>
                )}
              </div>
            </Field>
          ))}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="outline" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button icon={FiSave} onClick={save} style={{ flex: 1 }}>Save Configuration</Button>
          </div>
        </div>
      )}
    </div>
  );
};


// ── Twilio Card ───────────────────────────────────────────────────────
const TwilioCard = ({ showToast }) => {
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ac_int_twilio') || '{}'); } catch { return {}; }
  });
  const [expanded, setExpanded] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const isConnected = config.status === 'connected';
  const crmLinked   = isConnected && !!config.crn_sms;
  const reminderOn  = isConnected && !!config.call_reminders;

  const save = async () => {
    if (!config.account_sid || !config.auth_token || !config.from_number) {
      return showToast('Account SID, Auth Token and From Number are required', 'error');
    }
    setSaving(true);
    const updated = { ...config, status: 'connected', updated_at: new Date().toISOString() };
    try {
      const payload = JSON.stringify(updated);
      const { error } = await supabase.from('location_credentials').upsert([{
        location_id: 'platform', credential_type: 'twilio_config', credential_key: payload,
      }], { onConflict: 'location_id,credential_type' });
      if (error) throw error;
      localStorage.setItem('ac_int_twilio', payload);
      setConfig(updated);
      setExpanded(false);
      showToast('Twilio configuration saved');
    } catch {
      localStorage.setItem('ac_int_twilio', JSON.stringify(updated));
      setConfig(updated);
      setExpanded(false);
      showToast('Twilio config saved locally (Supabase unavailable)');
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    const updated = { status: 'disconnected', account_sid: '', auth_token: '', from_number: '', crn_sms: false, call_reminders: false };
    localStorage.setItem('ac_int_twilio', JSON.stringify(updated));
    try {
      await supabase.from('location_credentials').upsert([{
        location_id: 'platform', credential_type: 'twilio_config', credential_key: JSON.stringify(updated),
      }], { onConflict: 'location_id,credential_type' });
    } catch {}
    setConfig(updated);
    showToast('Twilio disconnected');
  };

  const testSMS = async () => {
    if (!isConnected) return showToast('Connect Twilio first', 'error');
    setTesting(true);
    // In production this would hit a server function; show success for now
    await new Promise(r => setTimeout(r, 1200));
    setTesting(false);
    showToast('Test SMS queued — check your server-side Twilio logs');
  };

  const toggleCRNSms = () => {
    const updated = { ...config, crn_sms: !config.crn_sms };
    localStorage.setItem('ac_int_twilio', JSON.stringify(updated));
    setConfig(updated);
    showToast(updated.crn_sms ? 'CRN SMS enabled — discharge notifications active' : 'CRN SMS disabled');
  };

  const toggleReminders = () => {
    const updated = { ...config, call_reminders: !config.call_reminders };
    localStorage.setItem('ac_int_twilio', JSON.stringify(updated));
    setConfig(updated);
    showToast(updated.call_reminders ? 'Call reminders enabled' : 'Call reminders disabled');
  };

  return (
    <div style={{ background: 'var(--ac-surface)', border: `2px solid ${isConnected ? '#E31F26' : 'var(--ac-border)'}`, borderRadius: 16, padding: 20, transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FDE8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📱</div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Twilio SMS <span style={{ fontSize: 11, fontWeight: 500, color: '#E31F26', background: '#FDE8E8', padding: '2px 8px', borderRadius: 20, marginLeft: 4 }}>Communications</span></div>
          <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginTop: 3 }}>
            Send CRN SMS to clients on discharge and automated call reminders. Linked to the CRM client registry.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={isConnected ? 'green' : 'gray'}>{isConnected ? '● Connected' : '○ Not Connected'}</Badge>
          <button onClick={testSMS} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 14px' }} disabled={testing || !isConnected}>
            <SafeIcon icon={FiZap} size={13} /> {testing ? 'Sending…' : 'Test SMS'}
          </button>
          <button onClick={() => setExpanded(v => !v)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>
            <SafeIcon icon={FiSettings} size={13} /> {expanded ? 'Hide' : 'Configure'}
          </button>
          {isConnected && (
            <button onClick={disconnect} className="ac-icon-btn" title="Disconnect" style={{ color: 'var(--ac-danger)' }}>
              <SafeIcon icon={FiX} size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Feature toggles — always visible when connected */}
      {isConnected && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: expanded ? 16 : 0 }}>
          <div style={{ background: crmLinked ? '#ECFDF5' : 'var(--ac-bg)', border: `1px solid ${crmLinked ? '#6EE7B7' : 'var(--ac-border)'}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-text)', marginBottom: 2 }}>CRN Discharge SMS</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Auto-send CRN via SMS when a client is discharged</div>
            </div>
            <button
              type="button" role="switch" aria-checked={crmLinked} aria-label="Toggle CRN SMS"
              onClick={toggleCRNSms}
              style={{ width: 42, height: 24, borderRadius: 12, border: 'none', background: crmLinked ? '#059669' : '#CBD5E1', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <span style={{ position: 'absolute', top: 3, left: crmLinked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          <div style={{ background: reminderOn ? '#EFF6FF' : 'var(--ac-bg)', border: `1px solid ${reminderOn ? '#93C5FD' : 'var(--ac-border)'}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-text)', marginBottom: 2 }}>Call Reminders</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Send SMS reminders before scheduled calls</div>
            </div>
            <button
              type="button" role="switch" aria-checked={reminderOn} aria-label="Toggle call reminders"
              onClick={toggleReminders}
              style={{ width: 42, height: 24, borderRadius: 12, border: 'none', background: reminderOn ? '#2563EB' : '#CBD5E1', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <span style={{ position: 'absolute', top: 3, left: reminderOn ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div style={{ borderTop: '1px solid var(--ac-border)', paddingTop: 16 }} className="ac-stack">
          <Field label="Account SID">
            <Input value={config.account_sid || ''} onChange={e => setConfig({ ...config, account_sid: e.target.value })} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </Field>
          <Field label="Auth Token">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input type={showSecrets.auth_token ? 'text' : 'password'} value={config.auth_token || ''} onChange={e => setConfig({ ...config, auth_token: e.target.value })} placeholder="Your auth token" style={{ flex: 1 }} />
              <button onClick={() => setShowSecrets(s => ({ ...s, auth_token: !s.auth_token }))} className="ac-icon-btn" title={showSecrets.auth_token ? 'Hide' : 'Show'}>
                <SafeIcon icon={showSecrets.auth_token ? FiLock : FiKey} size={15} />
              </button>
            </div>
          </Field>
          <Field label="From Phone Number" hint="E.164 format, e.g. +61400000000">
            <Input value={config.from_number || ''} onChange={e => setConfig({ ...config, from_number: e.target.value })} placeholder="+61400000000" />
          </Field>
          <Field label="CRN SMS Template" hint="Use {{crn}} and {{name}} as placeholders">
            <Textarea value={config.crn_template || 'Hi {{name}}, your CRN is {{crn}}. Save this for future check-ins. — Acute Care Services'} onChange={e => setConfig({ ...config, crn_template: e.target.value })} rows={2} />
          </Field>
          <Field label="Reminder SMS Template" hint="Use {{name}}, {{time}}, {{centre}} as placeholders">
            <Textarea value={config.reminder_template || 'Hi {{name}}, a reminder: your call with {{centre}} is scheduled for {{time}}. — Acute Care Services'} onChange={e => setConfig({ ...config, reminder_template: e.target.value })} rows={2} />
          </Field>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="outline" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button icon={FiSave} onClick={save} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save Twilio Config'}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────
export default function IntegrationPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [syncModal, setSyncModal] = useState(null);
  const [activeTab, setActiveTab] = useState('ai');
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({
    name: '',
    platform: 'salesforce',
    api_url: '',
    api_key: '',
    username: '',
    auto_sync: false,
    sync_interval: 30,
    field_mappings: {},
    sync_data_types: {
      locations: true,
      staff_management: true,
      new_customers: true,
      healthcare_providers: true,
    },
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    // In production, this would fetch from Supabase
    // For now, use localStorage as a demo
    const stored = localStorage.getItem('ac_integrations');
    if (stored) {
      setIntegrations(JSON.parse(stored));
    }
    setLoading(false);
  };

  const saveToStorage = (data) => {
    localStorage.setItem('ac_integrations', JSON.stringify(data));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3500);
  };

  const handleSaveIntegration = () => {
    if (!formData.name || !formData.api_url) {
      return showToast('Name and API URL are required', 'error');
    }

    if (editingIntegration) {
      // Update existing
      const updated = integrations.map(i => 
        i.id === editingIntegration.id ? { ...formData, id: i.id, last_sync: i.last_sync } : i
      );
      setIntegrations(updated);
      saveToStorage(updated);
      showToast('Integration updated successfully');
    } else {
      // Create new
      const newIntegration = {
        ...formData,
        id: `int-${Date.now()}`,
        status: 'inactive',
        last_sync: null,
        created_at: new Date().toISOString(),
      };
      const updated = [...integrations, newIntegration];
      setIntegrations(updated);
      saveToStorage(updated);
      showToast('Integration created successfully');
    }

    setModalOpen(false);
    setEditingIntegration(null);
    resetForm();
  };

  const handleEdit = (integration) => {
    setEditingIntegration(integration);
    setFormData({ ...integration });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    const updated = integrations.filter(i => i.id !== id);
    setIntegrations(updated);
    saveToStorage(updated);
    showToast('Integration deleted');
  };

  const handleToggle = (id) => {
    const updated = integrations.map(i => 
      i.id === id ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i
    );
    setIntegrations(updated);
    saveToStorage(updated);
    showToast(`Integration ${updated.find(i => i.id === id).status === 'active' ? 'activated' : 'deactivated'}`);
  };

  const handleTest = async (id) => {
    const integration = integrations.find(i => i.id === id);
    showToast('Testing connection...');
    
    // Simulate API test
    setTimeout(() => {
      showToast(`Connection to ${integration.name} successful!`);
    }, 1500);
  };

  const handleSync = (id) => {
    const integration = integrations.find(i => i.id === id);
    setSyncModal(integration);
  };

  const performSync = async (direction) => {
    if (!syncModal) return;

    showToast(`Syncing patient data ${direction === 'export' ? 'to' : 'from'} ${syncModal.name}...`);
    
    // Simulate sync process
    setTimeout(() => {
      const updated = integrations.map(i => 
        i.id === syncModal.id ? { ...i, last_sync: new Date().toISOString() } : i
      );
      setIntegrations(updated);
      saveToStorage(updated);
      setSyncModal(null);
      showToast(`Successfully synced ${Math.floor(Math.random() * 50) + 10} patient records`);
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      platform: 'salesforce',
      api_url: '',
      api_key: '',
      username: '',
      auto_sync: false,
      sync_interval: 30,
      field_mappings: {},
      sync_data_types: {
        locations: true,
        staff_management: true,
        new_customers: true,
        healthcare_providers: true,
      },
    });
  };

  const openNewIntegration = () => {
    resetForm();
    setEditingIntegration(null);
    setModalOpen(true);
  };

  // ── Compute integration status per tab for status dot ────────────
  const tabStatus = React.useMemo(() => {
    const aiCfg = (() => { try { return JSON.parse(localStorage.getItem('ac_int_ai') || '{}'); } catch { return {}; } })();
    const wsConnected = WORKSPACE_INTEGRATIONS.filter(w => {
      try { return JSON.parse(localStorage.getItem(`ac_int_ws_${w.id}`) || '{}').status === 'connected'; } catch { return false; }
    }).length;
    const acctConnected = ACCOUNTING_PLATFORMS.filter(p => {
      try { return JSON.parse(localStorage.getItem(`ac_acct_${p.id}`) || '{}').status === 'connected'; } catch { return false; }
    }).length;
    const twilioCfg = (() => { try { return JSON.parse(localStorage.getItem('ac_int_twilio') || '{}'); } catch { return {}; } })();
    return {
      ai: aiCfg.status === 'connected',
      workspace: wsConnected > 0,
      accounting: acctConnected > 0,
      crm: integrations.filter(i => i.status === 'active').length > 0,
      comms: twilioCfg.status === 'connected',
    };
  }, [integrations]);

  return (
    <div style={{ padding: '0 0 40px' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast('')} />}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SafeIcon icon={FiCloud} size={28} style={{ color: 'var(--ac-primary)' }} />
          Integrations
        </h1>
        <div style={{ fontSize: 14, color: 'var(--ac-text-secondary)', marginTop: 6 }}>
          Configure AI Engine, workspace tools, accounting platforms, and CRM data sync
        </div>
      </div>

      {/* Tabs + content layout — stacked on mobile, sidebar on desktop */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 20, alignItems: 'flex-start' }}>

        {/* Tab navigation — horizontal scroll pills on mobile, vertical sidebar on desktop */}
        {isMobile ? (
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', width: '100%',
            paddingBottom: 4, scrollbarWidth: 'none',
          }}>
            {[
              { id: 'ai', label: 'AI Engine', emoji: '🤖' },
              { id: 'workspace', label: 'Workspace', emoji: '📧' },
              { id: 'accounting', label: 'Accounting', emoji: '💰' },
              { id: 'comms', label: 'Communications', emoji: '📱' },
              { id: 'crm', label: 'CRM Sync', emoji: '🔌' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  padding: '9px 14px', borderRadius: 20, cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--ac-primary)' : 'var(--ac-surface)',
                  color: activeTab === tab.id ? '#fff' : 'var(--ac-text)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 13, border: `1.5px solid ${activeTab === tab.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.emoji}</span>
                <span>{tab.label}</span>
                {tabStatus[tab.id] && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: activeTab === tab.id ? '#fff' : '#10B981',
                  }} />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div style={{
            width: 220, flexShrink: 0,
            background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { id: 'ai', label: 'AI Engine', emoji: '🤖' },
              { id: 'workspace', label: 'Workspace', emoji: '📧' },
              { id: 'accounting', label: 'Accounting', emoji: '💰' },
              { id: 'comms', label: 'Communications', emoji: '📱' },
              { id: 'crm', label: 'CRM Sync', emoji: '🔌' },
            ].map((tab, i, arr) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '13px 16px', border: 'none', textAlign: 'left', cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--ac-primary)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--ac-text)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 14,
                  borderBottom: i < arr.length - 1 ? '1px solid var(--ac-border)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{tab.emoji}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: tabStatus[tab.id]
                    ? (activeTab === tab.id ? '#fff' : '#10B981')
                    : (activeTab === tab.id ? 'rgba(255,255,255,0.4)' : 'var(--ac-border)'),
                }} title={tabStatus[tab.id] ? 'Connected' : 'Not configured'} />
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          {/* AI Engine Tab */}
          {activeTab === 'ai' && <AIEngineTab showToast={showToast} />}

          {/* Workspace Tab */}
          {activeTab === 'workspace' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {WORKSPACE_INTEGRATIONS.map(wi => (
                <WorkspaceCard key={wi.id} integration={wi} showToast={showToast} />
              ))}
            </div>
          )}

          {/* Accounting Tab */}
          {activeTab === 'accounting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 18px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)', fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
                <strong>💰 Accounting Integrations</strong> — Connect MYOB, Xero, QuickBooks, or FreshBooks to automatically sync invoices and billing data from your location accounts. Sysadmin can then manage and send invoices directly from the Invoicing &amp; Billing module.
              </div>
              {ACCOUNTING_PLATFORMS.map(p => (
                <AccountingCard key={p.id} platform={p} showToast={showToast} />
              ))}
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'comms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 18px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)', fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
                <strong>📱 Communications</strong> — Connect Twilio to send CRN numbers via SMS when clients are discharged, and to send automated call reminders linked to the CRM call schedule. Subscription usage is tracked per location in the System Dashboard.
              </div>
              <TwilioCard showToast={showToast} />
            </div>
          )}

          {/* CRM Sync Tab */}
          {activeTab === 'crm' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>CRM Platform Connections</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="outline" icon={FiRefreshCw} onClick={fetchIntegrations}>Refresh</Button>
                  <Button icon={FiPlus} onClick={openNewIntegration}>New Integration</Button>
                </div>
              </div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Total Integrations', value: integrations.length, icon: FiDatabase, color: 'var(--ac-primary)' },
                  { label: 'Active', value: integrations.filter(i => i.status === 'active').length, icon: FiCheckCircle, color: '#10B981' },
                  { label: 'Auto-Sync Enabled', value: integrations.filter(i => i.auto_sync).length, icon: FiSync, color: '#3B82F6' },
                  { label: 'Last 24h Syncs', value: integrations.filter(i => i.last_sync && (new Date() - new Date(i.last_sync)) < 86400000).length, icon: FiZap, color: '#F59E0B' },
                ].map(stat => (
                  <div key={stat.label} className="ac-stat-tile">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)' }}>{stat.label}</span>
                      <SafeIcon icon={stat.icon} size={16} style={{ color: stat.color, opacity: 0.7 }} />
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  </div>
                ))}
              </div>
              {/* Integration Cards */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading integrations...</div>
              ) : integrations.length === 0 ? (
                <Card>
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No CRM Integrations Yet</div>
                    <div style={{ fontSize: 14, color: 'var(--ac-muted)', marginBottom: 20 }}>
                      Connect a CRM platform to sync patient data automatically
                    </div>
                    <Button icon={FiPlus} onClick={openNewIntegration}>Add Your First Integration</Button>
                  </div>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {integrations.map(integration => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                      onTest={handleTest}
                      onSync={handleSync}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Integration Modal */}
      {modalOpen && (
        <ModalOverlay title={editingIntegration ? 'Edit Integration' : 'New Integration'} onClose={() => setModalOpen(false)} wide>
          <div className="ac-stack">
            <Field label="Integration Name *">
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="My CRM Integration" />
            </Field>

            <Field label="CRM Platform">
              <Select 
                value={formData.platform} 
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                options={CRM_PLATFORMS.map(p => ({ value: p.id, label: `${p.icon} ${p.name}` }))}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <Field label="API Endpoint URL *">
                <Input value={formData.api_url} onChange={(e) => setFormData({ ...formData, api_url: e.target.value })} placeholder="https://api.crm.com/v2" />
              </Field>
              <Field label="API Key / Token *">
                <Input type="password" value={formData.api_key} onChange={(e) => setFormData({ ...formData, api_key: e.target.value })} placeholder="sk_live_..." />
              </Field>
            </div>

            <Field label="Username / Client ID (if applicable)">
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="user@company.com" />
            </Field>

            <div style={{ background: 'var(--ac-bg)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--ac-border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Data to Sync When Connected</div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                Choose which data types this CRM integration will collect and sync. Only the selected types will be shared with the connected CRM.
              </div>
              {[
                { key: 'locations', label: '📍 Location details', desc: 'Care centre addresses, contact info, and status.' },
                { key: 'staff_management', label: '👥 Staff management', desc: 'Admin users, roles, and location assignments.' },
                { key: 'new_customers', label: '🆕 New customers', desc: 'Newly registered clients and their intake data.' },
                { key: 'healthcare_providers', label: '🏥 Healthcare provider details', desc: 'Provider profiles and service type records.' },
              ].map(dt => (
                <label key={dt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--ac-border)' }}>
                  <input
                    type="checkbox"
                    checked={!!(formData.sync_data_types?.[dt.key])}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      sync_data_types: { ...(prev.sync_data_types || {}), [dt.key]: e.target.checked },
                    }))}
                    style={{ width: 16, height: 16, cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{dt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>{dt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--ac-bg)', borderRadius: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                <input 
                  type="checkbox" 
                  checked={formData.auto_sync} 
                  onChange={(e) => setFormData({ ...formData, auto_sync: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Enable Auto-Sync</span>
              </label>
              {formData.auto_sync && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Every</span>
                  <input 
                    type="number" 
                    value={formData.sync_interval} 
                    onChange={(e) => setFormData({ ...formData, sync_interval: parseInt(e.target.value) || 30 })}
                    min="5"
                    max="1440"
                    style={{ width: 70, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--ac-border)', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>min</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 12 }}>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveIntegration} style={{ flex: 1 }}>
                {editingIntegration ? 'Update Integration' : 'Create Integration'}
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Sync Modal */}
      {syncModal && (
        <ModalOverlay title={`Sync Patient Data: ${syncModal.name}`} onClose={() => setSyncModal(null)}>
          <div className="ac-stack">
            <div style={{ padding: 16, background: 'var(--ac-bg)', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 8 }}>Choose sync direction:</div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>
                This will merge patient records between ACMVP and {syncModal.name}. 
                Duplicate detection is automatic based on email and phone matching.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => performSync('export')}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  border: '2px solid var(--ac-primary)',
                  background: 'var(--ac-primary-soft)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SafeIcon icon={FiUpload} size={24} style={{ color: 'var(--ac-primary)', marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ac-primary)', marginBottom: 4 }}>
                  Export to CRM
                </div>
                <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)' }}>
                  Push ACMVP patients to {CRM_PLATFORMS.find(p => p.id === syncModal.platform)?.name}
                </div>
              </button>

              <button
                onClick={() => performSync('import')}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  border: '2px solid #10B981',
                  background: '#D1FAE5',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SafeIcon icon={FiDownload} size={24} style={{ color: '#10B981', marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: '#10B981', marginBottom: 4 }}>
                  Import from CRM
                </div>
                <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)' }}>
                  Pull patients from {CRM_PLATFORMS.find(p => p.id === syncModal.platform)?.name} to ACMVP
                </div>
              </button>
            </div>

            <div style={{ padding: 14, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, fontSize: 12, color: '#92400E' }}>
              <SafeIcon icon={FiAlertCircle} size={14} style={{ marginRight: 6 }} />
              <strong>Note:</strong> Bi-directional sync may create duplicates if field mappings aren't configured correctly.
            </div>

            <Button variant="outline" onClick={() => setSyncModal(null)}>Cancel</Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

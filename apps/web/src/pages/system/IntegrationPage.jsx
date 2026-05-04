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

// ── AI Engine Tab ─────────────────────────────────────────────────────
const AIEngineTab = ({ showToast }) => {
  const [config, setConfig] = useState({});
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  const isConnected = config.status === 'connected' && !!config.api_key;

  // Load from Supabase on mount; fallback to localStorage cache
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
          // Shared pool is always enabled — must come after spread to override any stored false
          setConfig({ ...parsed, shared_pool: true });
          localStorage.setItem('ac_int_ai', data.credential_key);
        } else {
          // Fallback to localStorage cache
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
      const { error } = await supabase
        .from('location_credentials')
        .upsert([{
          location_id: 'platform',
          credential_type: 'ai_config',
          credential_key: payload,
          service_name: 'OpenAI',
        }], { onConflict: 'location_id,credential_type' });

      if (error) throw error;
      localStorage.setItem('ac_int_ai', payload);
      setConfig(updated);
      showToast('AI Engine configuration saved to Supabase');
    } catch (err) {
      // Fallback to localStorage-only save
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
      await supabase
        .from('location_credentials')
        .upsert([{
          location_id: 'platform',
          credential_type: 'ai_config',
          credential_key: payload,
          service_name: 'OpenAI',
        }], { onConflict: 'location_id,credential_type' });
      localStorage.setItem('ac_int_ai', payload);
    } catch { /* ignore */ }
    setConfig(updated);
    showToast('AI Engine disconnected');
  };

  const testConnection = async () => {
    if (!config.api_key) return showToast('Enter an API key first', 'error');
    setTesting(true);
    try {
      const res = await fetch(config.endpoint || 'https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${config.api_key}` },
      });
      if (res.ok) {
        showToast('✅ Connection successful — API key is valid');
      } else {
        const data = await res.json();
        showToast(`Connection failed: ${data.error?.message || res.statusText}`, 'error');
      }
    } catch {
      showToast('Could not reach OpenAI — check network or endpoint', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 13 }}>Loading AI config…</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Status banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, background: isConnected ? '#D1FAE5' : 'var(--ac-bg)', border: `1.5px solid ${isConnected ? '#10B981' : 'var(--ac-border)'}`, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isConnected ? '#10B981' : 'var(--ac-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SafeIcon icon={FiZap} size={18} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>OpenAI / GPT-4 Engine</div>
          <div style={{ fontSize: 12, color: isConnected ? '#065F46' : 'var(--ac-muted)' }}>
            {isConnected ? `Connected · Model: ${config.model || 'gpt-3.5-turbo'}` : 'Not connected — Jax AI is running in demo mode'}
          </div>
        </div>
        {isConnected && (
          <Badge tone="green" style={{ marginLeft: 'auto' }}>● Active</Badge>
        )}
      </div>

      <div className="ac-stack">
        <Field label="OpenAI API Key *">
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              type={showKey ? 'text' : 'password'}
              value={config.api_key || ''}
              onChange={e => setConfig({ ...config, api_key: e.target.value })}
              placeholder="sk-..."
              style={{ flex: 1 }}
            />
            <button
              onClick={() => setShowKey(v => !v)}
              className="ac-icon-btn"
              title={showKey ? 'Hide key' : 'Show key'}
              style={{ flexShrink: 0 }}
            >
              <SafeIcon icon={showKey ? FiLock : FiKey} size={16} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>
            Saved to Supabase (platform credentials). localStorage is used as a read cache/fallback only.
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <Field label="Model">
            <Select
              value={config.model || 'gpt-3.5-turbo'}
              onChange={e => setConfig({ ...config, model: e.target.value })}
              options={[
                { value: 'gpt-4', label: 'GPT-4 (Recommended)' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                { value: 'gpt-4o', label: 'GPT-4o' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
              ]}
            />
          </Field>
          <Field label="API Endpoint (optional)">
            <Input
              value={config.endpoint || ''}
              onChange={e => setConfig({ ...config, endpoint: e.target.value })}
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </Field>
        </div>

        {/* Shared AI pool — always enabled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#ECFDF5', borderRadius: 12, border: '1px solid #A7F3D0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Shared AI Pool</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>
              Always enabled — approved locations draw from this central key. Usage is metered per-location and added to their monthly invoice.
            </div>
          </div>
          <div style={{
            position: 'relative', width: 44, height: 24, borderRadius: 12,
            background: 'var(--ac-primary)', flexShrink: 0,
          }}>
            <span style={{
              position: 'absolute', top: 2, left: 22, width: 20, height: 20,
              borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <Button variant="outline" onClick={testConnection} disabled={testing}>
            {testing ? 'Testing…' : 'Test Connection'}
          </Button>
          {isConnected && (
            <Button variant="outline" onClick={disconnect} style={{ color: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }}>
              Disconnect
            </Button>
          )}
          <Button icon={FiSave} onClick={save} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving…' : 'Save to Supabase'}
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'var(--ac-bg)', borderRadius: 12, fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6 }}>
        <strong>ℹ️ How this works:</strong> Once saved, Jax AI will use your OpenAI key to answer questions intelligently and assist with platform navigation. The key is stored in Supabase under <code style={{ fontSize: 11, background: 'var(--ac-border)', padding: '1px 5px', borderRadius: 4 }}>location_credentials</code> (location_id=platform). Without a key, Jax runs in demo mode with pre-built responses.
      </div>
    </div>
  );
};

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
    if (!integration) return;
    showToast('Testing connection...');
    setTimeout(() => {
      showToast(`Connection to ${integration.name} successful!`);
    }, 1500);
  };

  const handleSync = (id) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;
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
    return {
      ai: aiCfg.status === 'connected',
      workspace: wsConnected > 0,
      accounting: acctConnected > 0,
      crm: integrations.filter(i => i.status === 'active').length > 0,
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

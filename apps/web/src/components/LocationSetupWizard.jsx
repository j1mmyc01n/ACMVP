import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { Button, Input, Field, Select } from './UI';
import { supabase } from '../supabase/supabase';

const { FiMapPin, FiZap, FiUsers, FiBell, FiLink, FiCheck, FiChevronRight,
        FiChevronLeft, FiGlobe, FiDatabase, FiCpu, FiDollarSign, FiMail,
        FiPhone, FiAlertCircle, FiLoader, FiPackage, FiSliders } = FiIcons;

// ─── Constants ────────────────────────────────────────────────────────────────

const CARE_TYPES = [
  { value: 'mental_health',    label: 'Mental Health',       icon: '🧠', color: '#7C3AED' },
  { value: 'crisis_support',   label: 'Crisis Support',      icon: '🚨', color: '#DC2626' },
  { value: 'domestic_violence',label: 'Domestic Violence',   icon: '🛡️', color: '#D97706' },
  { value: 'substance_abuse',  label: 'Substance Abuse',     icon: '💊', color: '#059669' },
  { value: 'youth_services',   label: 'Youth Services',      icon: '🌱', color: '#0284C7' },
  { value: 'general_care',     label: 'General Care',        icon: '❤️', color: '#6B7280' },
];

const REGIONS = [
  { value: 'ap-southeast-2', label: 'Sydney (ap-southeast-2)' },
  { value: 'ap-southeast-1', label: 'Singapore (ap-southeast-1)' },
  { value: 'us-east-1',      label: 'US East (us-east-1)' },
  { value: 'eu-west-1',      label: 'Europe West (eu-west-1)' },
];

const MODULES = [
  {
    id: 'ai_engine',
    name: 'AI Engine',
    desc: 'Crisis monitoring, risk scoring, predictive alerts & session note drafting.',
    icon: FiCpu,
    price: 150,
    color: '#7C3AED',
  },
  {
    id: 'field_agents',
    name: 'Field Agents',
    desc: 'GPS-tracked agent assignments, mobile check-ins, and case sync.',
    icon: FiUsers,
    price: 100,
    color: '#0284C7',
    hasSeatCount: true,
  },
  {
    id: 'push_notifications',
    name: 'Push Notifications',
    desc: 'Targeted push delivery to clients and staff across devices.',
    icon: FiBell,
    price: 75,
    color: '#D97706',
  },
  {
    id: 'crm_integration',
    name: 'CRM Integration',
    desc: 'Bi-directional sync with Salesforce, HubSpot, Zoho and more.',
    icon: FiLink,
    price: 50,
    color: '#059669',
  },
];

const BASE_PRICE = 299;
const BRAND_COLORS = ['#7C3AED', '#0284C7', '#DC2626', '#D97706', '#059669', '#EC4899', '#0EA5E9', '#1E293B'];

const DB_PASS_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const genPassword = (len = 18) => {
  const max = 256 - (256 % DB_PASS_CHARS.length);
  const out = [];
  while (out.length < len) {
    const bytes = crypto.getRandomValues(new Uint8Array((len - out.length) * 2));
    for (const b of bytes) {
      if (b < max) { out.push(DB_PASS_CHARS[b % DB_PASS_CHARS.length]); if (out.length === len) break; }
    }
  }
  return out.join('');
};
const genApiKey = () => `ac_${genPassword(32).toLowerCase()}`;

// ─── Step components ──────────────────────────────────────────────────────────

const Step1_Details = ({ data, onChange, existingLocations }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div>
      <p style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 16 }}>
        Give this location a name and select the primary care type. The slug is auto-generated and used in URLs.
      </p>
    </div>

    <Field label="Location Name *">
      <Input
        value={data.name}
        onChange={e => onChange('name', e.target.value)}
        placeholder="e.g. Newtown Mental Health Centre"
      />
      {data.name && (
        <p style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>
          Slug: <code style={{ background: 'var(--ac-surface)', padding: '1px 6px', borderRadius: 4 }}>
            {data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
          </code>
        </p>
      )}
    </Field>

    <Field label="Admin Email *">
      <Input
        type="email"
        value={data.adminEmail}
        onChange={e => onChange('adminEmail', e.target.value)}
        placeholder="admin@yourorg.health"
      />
    </Field>

    <Field label="Care Type *">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
        {CARE_TYPES.map(ct => (
          <button
            key={ct.value}
            onClick={() => onChange('careType', ct.value)}
            style={{
              padding: '10px 8px', borderRadius: 10, border: `2px solid ${data.careType === ct.value ? ct.color : 'var(--ac-border)'}`,
              background: data.careType === ct.value ? `${ct.color}18` : 'var(--ac-surface)',
              cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{ct.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: data.careType === ct.value ? ct.color : 'var(--ac-text)' }}>{ct.label}</div>
          </button>
        ))}
      </div>
    </Field>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Field label="Capacity">
        <Input
          type="number"
          min={1}
          max={500}
          value={data.capacity}
          onChange={e => onChange('capacity', parseInt(e.target.value) || 20)}
        />
      </Field>
      <Field label="Region">
        <Select
          value={data.region}
          onChange={e => onChange('region', e.target.value)}
          options={REGIONS}
        />
      </Field>
    </div>

    {existingLocations?.length > 0 && (
      <Field label="Parent Location (optional)">
        <Select
          value={data.parentId}
          onChange={e => onChange('parentId', e.target.value)}
          options={[
            { value: '', label: '— None —' },
            ...existingLocations.map(l => ({ value: l.id, label: l.location_name || l.name || l.id })),
          ]}
        />
      </Field>
    )}
  </div>
);

const Step2_Modules = ({ data, onChange }) => {
  const monthly = BASE_PRICE + MODULES.reduce((sum, m) => {
    if (!data[m.id]) return sum;
    return sum + m.price * (m.hasSeatCount ? (data[`${m.id}_seats`] || 1) : 1);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--ac-muted)' }}>
        Choose the add-on modules to activate. Base platform fee is ${BASE_PRICE}/mo.
      </p>
      {MODULES.map(mod => {
        const enabled = !!data[mod.id];
        return (
          <div
            key={mod.id}
            style={{
              border: `2px solid ${enabled ? mod.color : 'var(--ac-border)'}`,
              borderRadius: 12, padding: 16,
              background: enabled ? `${mod.color}0d` : 'var(--ac-surface)',
              transition: 'all .15s', cursor: 'pointer',
            }}
            onClick={() => onChange(mod.id, !enabled)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                background: enabled ? mod.color : 'var(--ac-border)',
                color: '#fff',
              }}>
                <SafeIcon icon={mod.icon} size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: enabled ? mod.color : 'var(--ac-text)' }}>{mod.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-muted)' }}>
                    ${mod.price}/mo{mod.hasSeatCount ? ' per seat' : ''}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ac-muted)', margin: '4px 0 0' }}>{mod.desc}</p>
                {mod.hasSeatCount && enabled && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>Seats:</span>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={data[`${mod.id}_seats`] || 1}
                      onChange={e => onChange(`${mod.id}_seats`, parseInt(e.target.value) || 1)}
                      style={{ width: 70 }}
                    />
                  </div>
                )}
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                background: enabled ? mod.color : 'var(--ac-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {enabled && <SafeIcon icon={FiCheck} size={12} style={{ color: '#fff' }} />}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{
        background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
        borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Estimated monthly cost</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ac-accent)' }}>${monthly.toLocaleString()}/mo</span>
      </div>
    </div>
  );
};

const Step3_Branding = ({ data, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <p style={{ fontSize: 13, color: 'var(--ac-muted)' }}>
      Customise the look and contact details of this location's portal.
    </p>

    <Field label="Brand Color">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        {BRAND_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onChange('brandColor', c)}
            style={{
              width: 32, height: 32, borderRadius: 8, background: c, border: 'none',
              cursor: 'pointer', outline: data.brandColor === c ? `3px solid ${c}` : '3px solid transparent',
              outlineOffset: 2, transition: 'all .12s',
            }}
          />
        ))}
        <input
          type="color"
          value={data.brandColor}
          onChange={e => onChange('brandColor', e.target.value)}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--ac-border)', cursor: 'pointer', padding: 0 }}
          title="Custom color"
        />
      </div>
    </Field>

    <Field label="Logo URL (optional)">
      <Input
        value={data.logoUrl}
        onChange={e => onChange('logoUrl', e.target.value)}
        placeholder="https://cdn.example.com/logo.png"
      />
      {data.logoUrl && (
        <img src={data.logoUrl} alt="logo preview" style={{ height: 40, marginTop: 8, borderRadius: 6, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
      )}
    </Field>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Field label="Contact Phone">
        <Input value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+61 2 0000 0000" />
      </Field>
      <Field label="Timezone">
        <Select
          value={data.timezone}
          onChange={e => onChange('timezone', e.target.value)}
          options={['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Pacific/Auckland', 'Asia/Singapore', 'Europe/London', 'America/New_York']}
        />
      </Field>
    </div>

    <Field label="Address">
      <Input value={data.address} onChange={e => onChange('address', e.target.value)} placeholder="123 Example St, Sydney NSW 2000" />
    </Field>

    <Field label="Welcome Message (shown to clients)">
      <textarea
        value={data.welcome}
        onChange={e => onChange('welcome', e.target.value)}
        rows={3}
        placeholder="Welcome to our centre. We're here to support you."
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
      />
    </Field>
  </div>
);

const CopyBtn = ({ value }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34C759' : 'var(--ac-muted)', fontSize: 11, padding: '2px 6px' }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const CredRow = ({ label, value, sensitive }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--ac-border)' }}>
      <span style={{ width: 140, fontSize: 12, color: 'var(--ac-muted)', flexShrink: 0 }}>{label}</span>
      <code style={{ flex: 1, fontSize: 11, background: 'var(--ac-bg)', padding: '3px 8px', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {sensitive && !show ? '•'.repeat(Math.min(value.length, 24)) : value}
      </code>
      {sensitive && (
        <button onClick={() => setShow(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 11, padding: '2px 6px' }}>
          {show ? 'Hide' : 'Show'}
        </button>
      )}
      <CopyBtn value={value} />
    </div>
  );
};

const Step4_Technical = ({ creds }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <p style={{ fontSize: 13, color: 'var(--ac-muted)' }}>
      These credentials are auto-generated for this location. Copy and store them securely — they won't be shown again after deploy.
    </p>
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, padding: '0 16px' }}>
      <CredRow label="API Key"       value={creds.apiKey}   sensitive />
      <CredRow label="DB Password"   value={creds.dbPass}   sensitive />
      <CredRow label="Admin PIN"     value={creds.adminPin} sensitive />
      <CredRow label="Webhook Secret" value={creds.webhookSecret} sensitive />
    </div>

    <div style={{ background: '#FEF3C720', border: '1px solid #F59E0B', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <SafeIcon icon={FiAlertCircle} size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
        These values are stored in Supabase and shown in plain text only once. Copy them to a password manager before continuing — they cannot be recovered afterwards.
      </p>
    </div>
  </div>
);

const Step5_Review = ({ details, modules, branding, creds, existingLocations }) => {
  const ct = CARE_TYPES.find(c => c.value === details.careType);
  const monthly = BASE_PRICE + MODULES.reduce((sum, m) => {
    if (!modules[m.id]) return sum;
    return sum + m.price * (m.hasSeatCount ? (modules[`${m.id}_seats`] || 1) : 1);
  }, 0);
  const enabledModules = MODULES.filter(m => modules[m.id]);
  const parent = existingLocations?.find(l => l.id === details.parentId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Review everything before deploying. You can go back and edit any section.</p>

      {/* Location card */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: branding.brandColor || 'var(--ac-accent)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {branding.logoUrl && <img src={branding.logoUrl} alt="logo" style={{ height: 28, borderRadius: 4, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />}
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{details.name || 'Unnamed Location'}</span>
          <span style={{ fontSize: 18 }}>{ct?.icon}</span>
        </div>
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Care Type', ct?.label],
            ['Admin Email', details.adminEmail],
            ['Capacity', `${details.capacity} clients`],
            ['Region', details.region],
            ['Timezone', branding.timezone],
            ['Parent', parent?.name || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text)' }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Modules</div>
        {enabledModules.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--ac-muted)' }}>No add-on modules selected.</p>
          : enabledModules.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: m.color, fontWeight: 600 }}>✓ {m.name}{m.hasSeatCount ? ` (${modules[`${m.id}_seats`] || 1} seats)` : ''}</span>
              <span style={{ color: 'var(--ac-muted)' }}>${m.price * (m.hasSeatCount ? (modules[`${m.id}_seats`] || 1) : 1)}/mo</span>
            </div>
          ))
        }
        <div style={{ borderTop: '1px solid var(--ac-border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Base fee</span>
          <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>${BASE_PRICE}/mo</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ac-accent)' }}>${monthly.toLocaleString()}/mo</span>
        </div>
      </div>
    </div>
  );
};

// ─── Wizard shell ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'details',   label: 'Details',   icon: FiMapPin },
  { id: 'modules',   label: 'Modules',   icon: FiPackage },
  { id: 'branding',  label: 'Branding',  icon: FiSliders },
  { id: 'technical', label: 'Technical', icon: FiDatabase },
  { id: 'review',    label: 'Review',    icon: FiCheck },
];

const initialDetails  = { name: '', adminEmail: '', careType: 'mental_health', capacity: 20, region: 'ap-southeast-2', parentId: '' };
const initialModules  = { ai_engine: false, field_agents: false, field_agents_seats: 1, push_notifications: false, crm_integration: false };
const initialBranding = { brandColor: '#7C3AED', logoUrl: '', phone: '', address: '', timezone: 'Australia/Sydney', welcome: '' };
const genCreds = () => ({ apiKey: genApiKey(), dbPass: genPassword(), adminPin: genPassword(8), webhookSecret: genPassword(24) });

export default function LocationSetupWizard({ onSuccess, onCancel, existingLocations = [] }) {
  const [step, setStep] = useState(0);
  const [details, setDetails]   = useState(initialDetails);
  const [modules, setModules]   = useState(initialModules);
  const [branding, setBranding] = useState(initialBranding);
  const [creds] = useState(genCreds);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');

  const updDetails  = (k, v) => setDetails(d => ({ ...d, [k]: v }));
  const updModules  = (k, v) => setModules(m => ({ ...m, [k]: v }));
  const updBranding = (k, v) => setBranding(b => ({ ...b, [k]: v }));

  const validate = useCallback(() => {
    if (step === 0) {
      if (!details.name.trim()) return 'Location name is required.';
      if (!details.adminEmail.trim() || !/^\S+@\S+\.\S+$/.test(details.adminEmail)) return 'A valid admin email is required.';
    }
    return '';
  }, [step, details]);

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const deploy = async () => {
    setDeploying(true);
    setError('');
    try {
      const slug = details.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const rawSuffix = details.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'LOC';

      // Map wizard care-type values to the service IDs used by the rest of the platform
      const CARE_TYPE_MAP = {
        mental_health: 'mental_health',
        domestic_violence: 'domestic_violence',
        crisis_support: 'crisis',
        substance_abuse: 'substance_use',
        youth_services: 'youth',
        general_care: 'general',
      };
      const primaryService = CARE_TYPE_MAP[details.careType] || details.careType;

      // 1. Create care centre
      const { data: centre, error: centreErr } = await supabase
        .from('care_centres_1777090000')
        .insert([{
          name: details.name.trim(),
          suffix: rawSuffix,
          active: true,
          capacity: details.capacity,
          primary_service: primaryService,
        }])
        .select()
        .single();
      if (centreErr) throw centreErr;

      // 2. Create location instance
      const notesJson = JSON.stringify({
        brand_color: branding.brandColor,
        logo_url: branding.logoUrl || null,
        timezone: branding.timezone,
        address: branding.address || null,
        welcome_message: branding.welcome || null,
      });
      const { data: instance, error: instErr } = await supabase
        .from('location_instances')
        .insert([{
          location_name: details.name.trim(),
          slug,
          care_type: primaryService,
          status: 'active',
          plan_type: 'pro',
          monthly_credit_limit: 10000,
          primary_contact_email: details.adminEmail.trim(),
          primary_contact_phone: branding.phone || null,
          parent_location_id: details.parentId || null,
          ai_enabled: !!modules.ai_engine,
          field_agent_count: modules.field_agents ? (modules.field_agents_seats || 1) : 0,
          push_notification_pack: !!modules.push_notifications,
          notes: notesJson,
        }])
        .select()
        .single();
      if (instErr) throw instErr;

      // 3. Create admin user
      const { error: adminErr } = await supabase.from('admin_users_1777025000000').insert([{
        name: `${details.name.trim()} Admin`,
        email: details.adminEmail.trim(),
        role: 'admin',
        status: 'active',
        location: details.name.trim(),
        location_id: centre.id,
      }]);
      if (adminErr) console.error('Admin user creation failed:', adminErr.message);

      // 4. Persist credentials
      const { error: credErr } = await supabase.from('location_credentials').insert([
        { location_id: instance.id, credential_type: 'api_key',        credential_key: creds.apiKey },
        { location_id: instance.id, credential_type: 'webhook_secret', credential_key: creds.webhookSecret },
        { location_id: instance.id, credential_type: 'db_password',    credential_key: creds.dbPass },
        { location_id: instance.id, credential_type: 'admin_pin',      credential_key: creds.adminPin },
      ]);
      if (credErr) throw new Error(`Failed to save credentials: ${credErr.message}`);

      // 5. Audit log
      const enabledModules = MODULES.filter(m => modules[m.id]).map(m => m.id);
      await supabase.from('audit_logs_1777090020').insert([{
        source_type: 'sysadmin',
        actor_name: 'SysAdmin',
        actor_role: 'sysadmin',
        action: 'create',
        resource: `Location: ${details.name} (${rawSuffix})`,
        detail: `Wizard deploy — modules: ${enabledModules.join(', ') || 'none'}, admin: ${details.adminEmail}`,
        level: 'info',
      }]);

      onSuccess?.({ centre, instance, modules: enabledModules, adminEmail: details.adminEmail.trim() });
    } catch (err) {
      setError(err.message || 'Deployment failed. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  const current = STEPS[step];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%', maxWidth: 580, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          background: 'var(--ac-card)', border: '1px solid var(--ac-border)', borderRadius: 18,
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--ac-border)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Deploy New Location</h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ac-muted)' }}>Step {step + 1} of {STEPS.length} — {current.label}</p>
            </div>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--ac-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                onClick={() => i < step && setStep(i)}
                style={{
                  flex: 1, height: 4, borderRadius: 4, cursor: i < step ? 'pointer' : 'default',
                  background: i <= step ? (branding.brandColor || 'var(--ac-accent)') : 'var(--ac-border)',
                  transition: 'background .2s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'space-between' }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 10, color: i === step ? (branding.brandColor || 'var(--ac-accent)') : 'var(--ac-muted)', fontWeight: i === step ? 700 : 400, transition: 'color .2s' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              {step === 0 && <Step1_Details  data={details}  onChange={updDetails}  existingLocations={existingLocations} />}
              {step === 1 && <Step2_Modules  data={modules}  onChange={updModules} />}
              {step === 2 && <Step3_Branding data={branding} onChange={updBranding} />}
              {step === 3 && <Step4_Technical creds={creds} />}
              {step === 4 && <Step5_Review    details={details} modules={modules} branding={branding} creds={creds} existingLocations={existingLocations} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--ac-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>
              <SafeIcon icon={FiAlertCircle} size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#991B1B' }}>{error}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <Button variant="outline" onClick={prev} style={{ flex: 1 }}>
                <SafeIcon icon={FiChevronLeft} size={14} /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} style={{ flex: 1 }}>
                Next <SafeIcon icon={FiChevronRight} size={14} />
              </Button>
            ) : (
              <Button onClick={deploy} disabled={deploying} style={{ flex: 1, background: branding.brandColor || undefined }}>
                {deploying ? <><SafeIcon icon={FiLoader} size={14} /> Deploying…</> : '🚀 Deploy Location'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

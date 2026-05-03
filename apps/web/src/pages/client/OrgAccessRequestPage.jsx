import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button } from '../../components/UI';

const ORG_TYPES = [
  { value: 'mental_health',      label: '🧠 Mental Health Service' },
  { value: 'domestic_violence',  label: '🛡️ Domestic Violence Service' },
  { value: 'ndis',               label: '♿ NDIS Provider' },
  { value: 'crisis_support',     label: '🚨 Crisis Support Centre' },
  { value: 'substance_abuse',    label: '💊 Substance Abuse Service' },
  { value: 'youth_services',     label: '🌱 Youth Services' },
  { value: 'aged_care',          label: '👴 Aged Care' },
  { value: 'homelessness',       label: '🏠 Homelessness Support' },
  { value: 'other',              label: '📋 Other Care Organisation' },
];

const PLAN_TIERS = [
  { id: 'starter',     label: 'Starter',     price: '$299/mo',  setup: '$5,000 setup', billing: 'Billed quarterly', features: ['Up to 50 clients', '2 locations', 'Core modules', 'Email support', 'Additional locations available for fee'] },
  { id: 'professional',label: 'Professional',price: '$699/mo',  setup: '$5,000 setup', billing: 'Billed quarterly', features: ['Up to 250 clients', '5 locations', 'All modules', 'Priority support', 'Analytics', 'Additional locations available for fee'] },
  { id: 'enterprise',  label: 'Enterprise',  price: 'Custom',   setup: 'Custom setup', billing: 'Billed quarterly', features: ['Unlimited clients', 'Unlimited locations', 'Custom integrations', 'Dedicated support', 'SLA guarantee'] },
];

export const OrgAccessRequestPage = () => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    org_name: '',
    org_type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    num_clients: '',
    num_locations: '',
    state: '',
    description: '',
    selected_plan: 'professional',
    referral: '',
    abn: '',
    ndis_registered: false,
    dv_accredited: false,
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.org_name || !form.contact_email || !form.org_type) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { error: dbError } = await supabase.from('org_access_requests_1777090000').insert([{
        ...form,
        status: 'pending',
        created_at: new Date().toISOString(),
      }]);
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (err) {
      setError('Submission failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Request Received!</h2>
      <p style={{ color: 'var(--ac-text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
        Thank you, <strong>{form.contact_name || form.org_name}</strong>! Our team will review your application and get in touch within <strong>2 business days</strong> at <strong>{form.contact_email}</strong>.
      </p>
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>What happens next?</div>
        {['Our team reviews your application','We schedule a 30-min onboarding call','Your environment is provisioned','Training & go-live support provided'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ac-primary)', color: 'var(--ac-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 14 }}>{s}</span>
          </div>
        ))}
      </div>
      <Button onClick={() => setSubmitted(false)} variant="outline" style={{ width: '100%' }}>Submit another request</Button>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'var(--ac-primary)', marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>🏥</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Request Platform Access</h1>
        <p style={{ color: 'var(--ac-text-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          Acute Connect supports mental health, domestic violence, NDIS, crisis support, and more. Apply below for your organisation.
        </p>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {['Organisation', 'Contact', 'Plan'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
              background: step > i + 1 ? '#10B981' : step === i + 1 ? 'var(--ac-primary)' : 'var(--ac-surface)',
              color: step >= i + 1 ? 'var(--ac-bg)' : 'var(--ac-muted)',
              border: `2px solid ${step > i + 1 ? '#10B981' : step === i + 1 ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
            }}>{step > i + 1 ? '✓' : i + 1}</div>
            <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--ac-text)' : 'var(--ac-muted)' }}>{label}</span>
            {i < 2 && <div style={{ width: 24, height: 2, background: step > i + 1 ? '#10B981' : 'var(--ac-border)', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {/* Step 1: Organisation */}
      {step === 1 && (
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 17 }}>About Your Organisation</h3>
          <div className="ac-stack">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Organisation Name *</label>
                <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form.org_name} onChange={e => set('org_name', e.target.value)} placeholder="e.g. Sunrise Support Services" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>ABN</label>
                <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form.abn} onChange={e => set('abn', e.target.value)} placeholder="12 345 678 901" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 8 }}>Organisation Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                {ORG_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('org_type', t.value)} style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${form.org_type === t.value ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.org_type === t.value ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, fontWeight: form.org_type === t.value ? 700 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {(form.org_type === 'ndis' || form.org_type === 'domestic_violence') && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {form.org_type === 'ndis' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    <input type="checkbox" checked={form.ndis_registered} onChange={e => set('ndis_registered', e.target.checked)} style={{ width: 18, height: 18 }} />
                    NDIS Registered Provider
                  </label>
                )}
                {form.org_type === 'domestic_violence' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    <input type="checkbox" checked={form.dv_accredited} onChange={e => set('dv_accredited', e.target.checked)} style={{ width: 18, height: 18 }} />
                    DFV Sector Accredited
                  </label>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Approx. Clients</label>
                <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form.num_clients} onChange={e => set('num_clients', e.target.value)} placeholder="e.g. 150" type="number" min="1" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Number of Sites</label>
                <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form.num_locations} onChange={e => set('num_locations', e.target.value)} placeholder="e.g. 3" type="number" min="1" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>State / Territory</label>
                <select style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state…</option>
                  {['NSW','VIC','QLD','SA','WA','TAS','NT','ACT'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Brief Description</label>
              <textarea style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell us about the services you provide and the communities you support..." />
            </div>
            <button disabled={!form.org_name || !form.org_type} onClick={() => { setError(''); setStep(2); }} style={{ width: '100%', padding: '13px 20px', borderRadius: 12, border: 'none', background: 'var(--ac-primary)', color: 'var(--ac-bg)', fontWeight: 700, fontSize: 15, cursor: form.org_name && form.org_type ? 'pointer' : 'not-allowed', opacity: form.org_name && form.org_type ? 1 : 0.5, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Contact */}
      {step === 2 && (
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 17 }}>Contact Details</h3>
          <div className="ac-stack">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { key: 'contact_name',  label: 'Full Name *',        type: 'text',  placeholder: 'Jane Smith' },
                { key: 'contact_email', label: 'Work Email *',       type: 'email', placeholder: 'jane@example.com' },
                { key: 'contact_phone', label: 'Phone',              type: 'tel',   placeholder: '04XX XXX XXX' },
                { key: 'website',       label: 'Website',            type: 'url',   placeholder: 'https://yourorg.org.au' },
                { key: 'referral',      label: 'How did you hear?',  type: 'text',  placeholder: 'Conference, colleague…' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button disabled={!form.contact_name || !form.contact_email} onClick={() => { setError(''); setStep(3); }} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--ac-primary)', color: 'var(--ac-bg)', fontWeight: 700, cursor: form.contact_name && form.contact_email ? 'pointer' : 'not-allowed', opacity: form.contact_name && form.contact_email ? 1 : 0.5, fontFamily: 'inherit' }}>
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Plan selection */}
      {step === 3 && (
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 17 }}>Choose Your Plan</h3>
          <p style={{ color: 'var(--ac-text-secondary)', fontSize: 14, marginBottom: 20 }}>Monthly subscription, billed quarterly. One-time $5,000 setup fee applies from base tier. Your team will be in touch to confirm plan details.</p>
          <div className="ac-stack">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {PLAN_TIERS.map(plan => (
                <button key={plan.id} onClick={() => set('selected_plan', plan.id)} style={{ padding: '16px 14px', borderRadius: 14, border: `2px solid ${form.selected_plan === plan.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.selected_plan === plan.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{plan.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ac-primary)', marginBottom: 2 }}>{plan.price}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 2 }}>{plan.billing}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 10 }}>{plan.setup}</div>
                  {plan.features.map(f => (
                    <div key={f} style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--ac-surface-soft)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>📋 Review</div>
              <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.7 }}>
                <strong>{form.org_name}</strong> · {ORG_TYPES.find(t => t.value === form.org_type)?.label}<br />
                Contact: {form.contact_name} {'<'}{form.contact_email}{'>'}<br />
                Plan: {PLAN_TIERS.find(p => p.id === form.selected_plan)?.label} — {PLAN_TIERS.find(p => p.id === form.selected_plan)?.price}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button disabled={submitting} onClick={handleSubmit} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: '#10B981', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                {submitting ? 'Submitting…' : '🚀 Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
        {['🔒 Secure & Private', '🇦🇺 Australian Hosted', '📋 NDIS Compatible', '🛡️ DFV Sector Ready'].map(b => (
          <div key={b} style={{ fontSize: 12, color: 'var(--ac-muted)', fontWeight: 600 }}>{b}</div>
        ))}
      </div>
    </div>
  );
};

export default OrgAccessRequestPage;

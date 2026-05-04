/*
-- Run this in Supabase SQL editor:
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS provider_type text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS abn text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS abn_verified boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS abn_business_name text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ahpra_number text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ahpra_verified boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ndis_number text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ndis_verified boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS medicare_provider_number text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS insurance_expiry date;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS insurance_doc_url text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS practice_name text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS practice_address jsonb;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS service_areas text[];
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS services_offered text[];
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS telehealth boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS telehealth_platform text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS bulk_billing boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS wait_time text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_type text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_url text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_embed text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_phone text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS accepting_patients boolean DEFAULT true;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS accepts_ndis boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS accepts_medicare boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
*/

import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { ProgressBar, Card, Button, Field, Input, Textarea, Select, Toggle } from '../../components/UI';

const { FiCreditCard, FiLoader, FiExternalLink, FiX, FiPlus } = FiIcons;

const PROVIDER_TYPES = [
  'GP', 'Psychiatrist', 'Psychologist', 'Social Worker',
  'Occupational Therapist', 'Physiotherapist', 'Speech Pathologist',
  'Dietitian', 'Counsellor', 'NDIS Support Worker',
  'Mental Health Nurse', 'Community Health Worker', 'Other',
];

const TELEHEALTH_PLATFORMS = ['Zoom', 'Teams', 'Coviu', 'Phone only', 'Other'];

const LANGUAGE_OPTIONS = [
  'English', 'Mandarin', 'Cantonese', 'Arabic', 'Vietnamese',
  'Greek', 'Italian', 'Hindi', 'Tagalog', 'Spanish', 'Other',
];

const WAIT_TIME_OPTIONS = ['Same day', '1-3 days', '1 week', '2 weeks', '1 month+'];

const SERVICES_BY_GROUP = {
  'Mental Health': ['Counselling', 'Psychotherapy', 'CBT', 'DBT', 'EMDR', 'Mental Health Assessment', 'Medication Management'],
  'Physical Health': ['General Practice', 'Physiotherapy', 'Occupational Therapy', 'Nursing', 'Allied Health'],
  'NDIS Support': ['Support Coordination', 'Behaviour Support', 'Early Intervention', 'Plan Management'],
  'Allied Health': ['Dietetics', 'Speech Pathology', 'Exercise Physiology', 'Podiatry'],
  'Crisis Services': ['Crisis Counselling', 'Emergency Mental Health', 'Suicide Risk Assessment'],
};

const pill = { background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: '3px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 };

export const ProviderJoinPage = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Step 1 — Identity
  const [form, setForm] = useState({
    name: '', email: '', providerType: '',
    abn: '', abnVerified: false, abnBusinessName: '', abnStatus: null, abnLoading: false,
    ahpraNumber: '', ahpra_self_confirmed: false,
    ndisNumber: '', ndis_self_confirmed: false,
    medicareNumber: '',
    insuranceExpiry: '', insuranceFile: null,
    qualifications: '', bio: '',
    // Step 2
    practiceName: '', street: '', suburb: '', state: '', postcode: '',
    serviceAreas: [],
    serviceAreaInput: '',
    servicesOffered: [],
    telehealth: false, telehealthPlatform: '',
    bulkBilling: false,
    languages: ['English'],
    waitTime: '1 week',
    // Step 3
    bookingType: 'direct',
    bookingUrl: '', bookingUrlStatus: null,
    bookingEmbed: '',
    bookingPhone: '', bookingFax: '', useFax: false, contactHours: '',
    acceptingPatients: true, acceptsMedicare: false, acceptsNdis: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ABN Verify
  const verifyAbn = async () => {
    if (!form.abn) return;
    set('abnLoading', true);
    set('abnStatus', null);
    try {
      const res = await fetch('/.netlify/functions/abn-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abn: form.abn }),
      });
      const data = await res.json();
      if (data.status === 'valid') {
        setForm(f => ({ ...f, abnVerified: true, abnBusinessName: data.businessName, abnStatus: 'valid', abnLoading: false }));
      } else if (data.status === 'invalid') {
        setForm(f => ({ ...f, abnVerified: false, abnStatus: 'invalid', abnLoading: false }));
      } else {
        setForm(f => ({ ...f, abnVerified: false, abnStatus: 'manual', abnLoading: false }));
      }
    } catch {
      setForm(f => ({ ...f, abnVerified: false, abnStatus: 'manual', abnLoading: false }));
    }
  };

  // Booking URL validation — cross-origin HEAD requests will typically fail due to CORS;
  // we catch and show "could not verify" rather than a misleading green tick.
  const validateBookingUrl = async () => {
    if (!form.bookingUrl) return;
    set('bookingUrlStatus', 'checking');
    try {
      const res = await fetch(form.bookingUrl, { method: 'HEAD' });
      set('bookingUrlStatus', res.ok ? 'ok' : 'warn');
    } catch {
      set('bookingUrlStatus', 'warn');
    }
  };

  const detectPlatform = (url) => {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.includes('hotdoc')) return 'HotDoc';
    if (u.includes('healthengine')) return 'HealthEngine';
    if (u.includes('calendly')) return 'Calendly';
    if (u.includes('cliniko')) return 'Cliniko';
    if (u.includes('janeapp')) return 'Jane App';
    if (u.includes('nookal')) return 'Nookal';
    if (u.includes('halaxy')) return 'Halaxy';
    return 'External booking system';
  };

  const toggleService = (svc) => {
    setForm(f => ({
      ...f,
      servicesOffered: f.servicesOffered.includes(svc)
        ? f.servicesOffered.filter(s => s !== svc)
        : [...f.servicesOffered, svc],
    }));
  };

  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const addServiceArea = () => {
    const v = form.serviceAreaInput.trim();
    if (v && !form.serviceAreas.includes(v)) {
      setForm(f => ({ ...f, serviceAreas: [...f.serviceAreas, v], serviceAreaInput: '' }));
    }
  };

  const removeServiceArea = (area) => setForm(f => ({ ...f, serviceAreas: f.serviceAreas.filter(a => a !== area) }));

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('providers_1740395000').insert([{
        name: form.name,
        email: form.email,
        provider_type: form.providerType,
        abn: form.abn,
        abn_verified: form.abnVerified,
        abn_business_name: form.abnBusinessName,
        ahpra_number: form.ahpraNumber,
        ahpra_verified: form.ahpra_self_confirmed,
        ndis_number: form.ndisNumber,
        medicare_provider_number: form.medicareNumber,
        insurance_expiry: form.insuranceExpiry || null,
        practice_name: form.practiceName,
        practice_address: { street: form.street, suburb: form.suburb, state: form.state, postcode: form.postcode },
        service_areas: form.serviceAreas,
        services_offered: form.servicesOffered,
        telehealth: form.telehealth,
        telehealth_platform: form.telehealthPlatform,
        bulk_billing: form.bulkBilling,
        languages: form.languages,
        wait_time: form.waitTime,
        booking_type: form.bookingType,
        booking_url: form.bookingUrl,
        booking_embed: form.bookingEmbed,
        booking_phone: form.bookingPhone,
        accepting_patients: form.acceptingPatients,
        accepts_medicare: form.acceptsMedicare,
        accepts_ndis: form.acceptsNdis,
        qualification: form.qualifications,
        bio: form.bio,
        is_partner: true,
        status: 'pending',
        gender: 'Not specified',
        experience: 'Registered professional',
        rating: 0,
      }]);
      if (error) throw error;
      setSubmitted(true);
    } catch {
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="ac-stack" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 className="ac-h2">Application Submitted!</h2>
        <p className="ac-muted">Our team will review your credentials within 2-3 business days.</p>
      </div>
    );
  }

  return (
    <div className="ac-stack" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
        <h2 className="ac-h2">Join as a Service Provider</h2>
        <p className="ac-muted">Partner with Acute Connect and reach more patients.</p>
      </div>

      <ProgressBar value={(step / 4) * 100} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, margin: '8px 0 20px', color: 'var(--ac-muted)' }}>
        <span style={{ fontWeight: step === 1 ? 700 : 400, color: step === 1 ? 'var(--ac-primary)' : undefined }}>1. Identity</span>
        <span style={{ fontWeight: step === 2 ? 700 : 400, color: step === 2 ? 'var(--ac-primary)' : undefined }}>2. Practice</span>
        <span style={{ fontWeight: step === 3 ? 700 : 400, color: step === 3 ? 'var(--ac-primary)' : undefined }}>3. Booking</span>
        <span style={{ fontWeight: step === 4 ? 700 : 400, color: step === 4 ? 'var(--ac-primary)' : undefined }}>4. Subscription</span>
      </div>

      {/* ─── STEP 1: Identity & Credentials ─── */}
      {step === 1 && (
        <Card title="Provider Identity & Credentials" subtitle="Your professional details and verification.">
          <div className="ac-stack">
            <Field label="Full Professional Name">
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Jane Smith" />
            </Field>

            <Field label="Email Address">
              <Input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="jane@example.com" />
            </Field>

            <Field label="Provider Type">
              <Select
                value={form.providerType}
                onChange={e => set('providerType', e.target.value)}
                options={['', ...PROVIDER_TYPES]}
              />
            </Field>

            {/* ABN */}
            <Field label="ABN">
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={form.abn} onChange={e => set('abn', e.target.value)} placeholder="12 345 678 901" style={{ flex: 1 }} />
                <Button size="sm" onClick={verifyAbn} disabled={form.abnLoading || !form.abn}>
                  {form.abnLoading ? <SafeIcon icon={FiLoader} /> : 'Verify'}
                </Button>
              </div>
              {form.abnStatus === 'valid' && (
                <div style={{ marginTop: 6, fontSize: 13, color: '#059669' }}>✅ {form.abnBusinessName}</div>
              )}
              {form.abnStatus === 'invalid' && (
                <div style={{ marginTop: 6, fontSize: 13, color: '#DC2626' }}>❌ ABN not found</div>
              )}
              {form.abnStatus === 'manual' && (
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ac-muted)' }}>Will be verified manually</div>
              )}
            </Field>

            {/* AHPRA */}
            <Field label="AHPRA Registration Number">
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={form.ahpraNumber} onChange={e => set('ahpraNumber', e.target.value)} placeholder="MED0001234567" style={{ flex: 1 }} />
                <Button size="sm" variant="outline" onClick={() => window.open('https://www.ahpra.gov.au/Registration/Registers-of-Practitioners.aspx', '_blank')}>
                  <SafeIcon icon={FiExternalLink} size={14} /> Verify
                </Button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.ahpra_self_confirmed} onChange={e => set('ahpra_self_confirmed', e.target.checked)} />
                I confirm my AHPRA registration is current and valid
              </label>
              {form.ahpra_self_confirmed && (
                <span style={{ marginTop: 4, display: 'inline-block', background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>PENDING</span>
              )}
            </Field>

            {/* NDIS */}
            <Field label="NDIS Registration Number (optional)">
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={form.ndisNumber} onChange={e => set('ndisNumber', e.target.value)} placeholder="4050000001" style={{ flex: 1 }} />
                <Button size="sm" variant="outline" onClick={() => window.open('https://www.ndiscommission.gov.au/providers/registered-ndis-providers', '_blank')}>
                  <SafeIcon icon={FiExternalLink} size={14} /> Verify
                </Button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.ndis_self_confirmed} onChange={e => set('ndis_self_confirmed', e.target.checked)} />
                I confirm my NDIS registration is current and valid
              </label>
              {form.ndis_self_confirmed && (
                <span style={{ marginTop: 4, display: 'inline-block', background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>PENDING</span>
              )}
            </Field>

            {/* Medicare */}
            <Field label="Medicare Provider Number (optional)" hint="Will be verified by our admin team within 24 hours">
              <Input value={form.medicareNumber} onChange={e => set('medicareNumber', e.target.value)} placeholder="2123456A" />
            </Field>

            {/* Insurance */}
            <Field label="Professional Indemnity Insurance">
              <div className="ac-grid-2" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginBottom: 4 }}>Expiry Date</div>
                  <Input type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginBottom: 4 }}>Upload Document (PDF/image)</div>
                  <input type="file" accept=".pdf,image/*"
                    onChange={e => set('insuranceFile', e.target.files[0])}
                    style={{ fontSize: 12, color: 'var(--ac-text)' }} />
                  {form.insuranceFile && (
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>{form.insuranceFile.name}</div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>
                File will be stored at provider-docs/&#123;provider_id&#125;/insurance
              </div>
            </Field>

            <Field label="Qualifications / Credentials">
              <Textarea value={form.qualifications} onChange={e => set('qualifications', e.target.value)} placeholder="List your degrees, certifications..." />
            </Field>

            <Field label="Short Bio">
              <Textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="A brief description for your profile..." />
            </Field>

            <Button style={{ width: '100%' }} onClick={() => setStep(2)}>Next: Practice Details</Button>
          </div>
        </Card>
      )}

      {/* ─── STEP 2: Practice Details ─── */}
      {step === 2 && (
        <Card title="Practice Details" subtitle="Where and how you deliver services.">
          <div className="ac-stack">
            <Field label="Practice / Organisation Name">
              <Input value={form.practiceName} onChange={e => set('practiceName', e.target.value)} placeholder="HealthCentre Sydney" />
            </Field>

            <Field label="Practice Address">
              <div className="ac-grid-2" style={{ gap: 10 }}>
                <Input value={form.street} onChange={e => set('street', e.target.value)} placeholder="Street address" />
                <Input value={form.suburb} onChange={e => set('suburb', e.target.value)} placeholder="Suburb" />
                <Input value={form.state} onChange={e => set('state', e.target.value)} placeholder="State (e.g. NSW)" />
                <Input value={form.postcode} onChange={e => set('postcode', e.target.value)} placeholder="Postcode" />
              </div>
            </Field>

            <Field label="Service Areas Covered">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  value={form.serviceAreaInput}
                  onChange={e => set('serviceAreaInput', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addServiceArea()}
                  placeholder="e.g. Inner West Sydney"
                  style={{ flex: 1 }}
                />
                <Button size="sm" onClick={addServiceArea}><SafeIcon icon={FiPlus} size={14} /></Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.serviceAreas.map(area => (
                  <span key={area} style={pill}>
                    {area}
                    <button onClick={() => removeServiceArea(area)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', padding: 0, lineHeight: 1 }}>
                      <SafeIcon icon={FiX} size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </Field>

            <Field label="Services Offered">
              <div style={{ border: '1px solid var(--ac-border)', borderRadius: 10, padding: 12 }}>
                {Object.entries(SERVICES_BY_GROUP).map(([group, items]) => (
                  <div key={group} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{group}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {items.map(svc => (
                        <label key={svc} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.servicesOffered.includes(svc)} onChange={() => toggleService(svc)} />
                          {svc}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Field>

            <Field label="Telehealth Available">
              <Toggle value={form.telehealth} onChange={v => set('telehealth', v)} />
              {form.telehealth && (
                <div style={{ marginTop: 10 }}>
                  <Select
                    value={form.telehealthPlatform}
                    onChange={e => set('telehealthPlatform', e.target.value)}
                    options={['', ...TELEHEALTH_PLATFORMS]}
                    placeholder="Telehealth platform"
                  />
                </div>
              )}
            </Field>

            <Field label="Bulk Billing Available">
              <Toggle value={form.bulkBilling} onChange={v => set('bulkBilling', v)} />
            </Field>

            <Field label="Languages Spoken">
              <div style={{ border: '1px solid var(--ac-border)', borderRadius: 10, padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {LANGUAGE_OPTIONS.map(lang => (
                  <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.languages.includes(lang)} onChange={() => toggleLanguage(lang)} />
                    {lang}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Average Wait Time">
              <Select
                value={form.waitTime}
                onChange={e => set('waitTime', e.target.value)}
                options={WAIT_TIME_OPTIONS}
              />
            </Field>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
              <Button style={{ flex: 2 }} onClick={() => setStep(3)}>Next: Booking Setup</Button>
            </div>
          </div>
        </Card>
      )}

      {/* ─── STEP 3: Booking System Setup ─── */}
      {step === 3 && (
        <Card title="Booking System Setup" subtitle="How do patients book with you?">
          <div className="ac-stack">
            {/* Booking method selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { value: 'direct', label: 'A — Direct booking link (e.g. HotDoc, Calendly)' },
                { value: 'embed', label: 'B — Embedded booking widget' },
                { value: 'phone', label: 'C — No online booking (phone/referral only)' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer', padding: '12px 14px', border: `1.5px solid ${form.bookingType === opt.value ? 'var(--ac-primary)' : 'var(--ac-border)'}`, borderRadius: 10, background: form.bookingType === opt.value ? 'var(--ac-primary-soft, rgba(79,70,229,0.06))' : 'transparent' }}>
                  <input type="radio" name="bookingType" value={opt.value} checked={form.bookingType === opt.value} onChange={() => set('bookingType', opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>

            {form.bookingType === 'direct' && (
              <Field label="Booking URL">
                <Input
                  value={form.bookingUrl}
                  onChange={e => set('bookingUrl', e.target.value)}
                  onBlur={validateBookingUrl}
                  placeholder="https://www.hotdoc.com.au/..."
                />
                {form.bookingUrl && (
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {form.bookingUrlStatus === 'checking' && <span style={{ color: 'var(--ac-muted)' }}>Checking link…</span>}
                    {form.bookingUrlStatus === 'ok' && <span style={{ color: '#059669' }}>✅ Link verified</span>}
                    {form.bookingUrlStatus === 'warn' && <span style={{ color: '#D97706' }}>⚠️ Link could not be verified — we'll check it</span>}
                    {detectPlatform(form.bookingUrl) && (
                      <span style={{ marginLeft: 8, background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 12, padding: '2px 8px', fontSize: 11 }}>
                        {detectPlatform(form.bookingUrl)}
                      </span>
                    )}
                  </div>
                )}
              </Field>
            )}

            {form.bookingType === 'embed' && (
              <Field label="Embed Code">
                <Textarea
                  value={form.bookingEmbed}
                  onChange={e => set('bookingEmbed', e.target.value)}
                  placeholder='<iframe src="https://..." ...></iframe>'
                  style={{ minHeight: 100, fontFamily: 'monospace', fontSize: 12 }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: '#D97706' }}>
                  ⚠️ Only paste embed codes from trusted booking platforms
                </div>
                {form.bookingEmbed && (
                  <div style={{ marginTop: 10, border: '1px solid var(--ac-border)', borderRadius: 10, padding: 10, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Preview</div>
                    {/* Sandboxed iframe prevents JS execution from untrusted embed codes */}
                    <iframe
                      srcDoc={form.bookingEmbed}
                      sandbox=""
                      title="Booking widget preview"
                      style={{ width: '100%', minHeight: 200, border: 'none', borderRadius: 6 }}
                    />
                  </div>
                )}
              </Field>
            )}

            {form.bookingType === 'phone' && (
              <>
                <Field label="Phone Number">
                  <Input value={form.bookingPhone} onChange={e => set('bookingPhone', e.target.value)} placeholder="+61 2 XXXX XXXX" />
                </Field>
                <Field label="Preferred Contact Hours">
                  <Input value={form.contactHours} onChange={e => set('contactHours', e.target.value)} placeholder="Mon–Fri 9am–5pm" />
                </Field>
                <Field label="Accept referrals via fax?">
                  <Toggle value={form.useFax} onChange={v => set('useFax', v)} />
                  {form.useFax && (
                    <div style={{ marginTop: 8 }}>
                      <Input value={form.bookingFax} onChange={e => set('bookingFax', e.target.value)} placeholder="Fax number" />
                    </div>
                  )}
                </Field>
              </>
            )}

            <div style={{ borderTop: '1px solid var(--ac-border)', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--ac-text)' }}>Patient Acceptance</div>
              <div className="ac-stack" style={{ gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14 }}>Accepting new patients?</span>
                  <Toggle value={form.acceptingPatients} onChange={v => set('acceptingPatients', v)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14 }}>Medicare / Bulk Billing accepted?</span>
                  <Toggle value={form.acceptsMedicare} onChange={v => set('acceptsMedicare', v)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14 }}>NDIS participants accepted?</span>
                  <Toggle value={form.acceptsNdis} onChange={v => set('acceptsNdis', v)} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</Button>
              <Button style={{ flex: 2 }} onClick={() => setStep(4)}>Next: Subscription</Button>
            </div>
          </div>
        </Card>
      )}

      {/* ─── STEP 4: Subscription ─── */}
      {step === 4 && (
        <Card title="Partner Subscription" subtitle="Activate your uncapped lead generation.">
          <div className="ac-stack">
            <div style={{ background: 'var(--ac-primary-soft)', padding: 16, borderRadius: 12, textAlign: 'center', border: '1px solid var(--ac-primary)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase' }}>Monthly Plan</div>
              <div style={{ fontSize: 36, fontWeight: 800, margin: '8px 0' }}>$250<span style={{ fontSize: 16, fontWeight: 400 }}> / month</span></div>
              <div className="ac-muted ac-xs">Uncapped lead submissions · Profile listing · Priority support</div>
            </div>
            <Field label="Cardholder Name"><Input placeholder="Name on card" /></Field>
            <Field label="Card Number">
              <div style={{ position: 'relative' }}>
                <Input placeholder="0000 0000 0000 0000" style={{ paddingLeft: 40 }} />
                <SafeIcon icon={FiCreditCard} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
              </div>
            </Field>
            <div className="ac-grid-2">
              <Field label="Expiry"><Input placeholder="MM/YY" /></Field>
              <Field label="CVC"><Input placeholder="000" /></Field>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(3)}>Back</Button>
              <Button style={{ flex: 2 }} onClick={handleJoin} disabled={submitting}>
                {submitting ? 'Processing…' : 'Start Partnership'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProviderJoinPage;

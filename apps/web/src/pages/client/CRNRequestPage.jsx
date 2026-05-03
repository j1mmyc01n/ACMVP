import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { Card, Button, Field, Input, Select } from '../../components/UI';
import AgreementNotice from '../../legal/AgreementNotice';
import { recordAgreementAudit, AUDIT_ACTIONS } from '../../lib/audit';

const { FiMapPin, FiLoader, FiSend, FiCheckCircle, FiCheck, FiCopy } = FiIcons;

// Assistance types the user can pick from on the Get CRN form. The value
// is matched against `care_centres_1777090000.service_types`. Keep in sync
// with the seeds in 1777100012000-assistance-types.sql.
const ASSISTANCE_TYPE_OPTIONS = [
  { value: 'mental_health',    label: '🧠 Mental health support' },
  { value: 'crisis',           label: '🚨 Crisis support' },
  { value: 'substance_abuse',  label: '💊 Drug & alcohol support' },
  { value: 'domestic_violence',label: '🛡️ Domestic violence' },
  { value: 'youth',            label: '🌱 Youth services (under 25)' },
  { value: 'aged_care',        label: '👵 Aged care' },
  { value: 'housing',          label: '🏠 Housing & homelessness' },
  { value: 'ndis',             label: '♿ NDIS / disability' },
  { value: 'general',          label: '📋 General support' },
];
const ASSISTANCE_TYPE_LABEL = ASSISTANCE_TYPE_OPTIONS.reduce((acc, o) => {
  acc[o.value] = o.label.replace(/^[^\w]+\s*/, '');
  return acc;
}, {});

const requestApproxLocation = () =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null); return;
    }
    let done = false;
    const finish = (val) => { if (!done) { done = true; resolve(val); } };
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        () => finish(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 },
      );
      setTimeout(() => finish(null), 6500);
    } catch (_) { finish(null); }
  });

export const CRNRequestPage = ({ goto } = {}) => {
  const [form, setForm] = useState({ first_name: '', mobile: '', email: '', assistance_type: '' });
  const [submitted, setSubmitted] = useState(false);
  const [issuedCRN, setIssuedCRN] = useState('');
  const [careCentre, setCareCentre] = useState(null);
  const [assistanceType, setAssistanceType] = useState('');
  const [unmatchedType, setUnmatchedType] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCRN = () => {
    if (!issuedCRN) return;
    navigator.clipboard?.writeText(issuedCRN).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for browsers that don't support navigator.clipboard (deprecated API, intentional)
      try {
        const el = document.createElement('textarea');
        el.value = issuedCRN;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy'); // eslint-disable-line no-restricted-syntax
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // If all copy methods fail, show error feedback
        setCopied(false);
      }
    });
  };

  const handleSubmit = async () => {
    const first_name = form.first_name.trim();
    const mobile = form.mobile.trim();
    const email = form.email.trim();
    const assistance_type = form.assistance_type;
    if (!first_name) { setError('Please enter your first name.'); return; }
    if (!assistance_type) { setError('Please choose the type of assistance you need.'); return; }
    if (!mobile && !email) {
      setError('Please provide either a mobile number or an email so we can send your CRN.');
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    setError(''); setLoading(true);
    try {
      const device_info = typeof navigator !== 'undefined'
        ? { userAgent: navigator.userAgent, language: navigator.language, platform: navigator.platform }
        : {};
      const location = await requestApproxLocation();
      const res = await fetch('/api/crn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          mobile: mobile || undefined,
          email: email || undefined,
          assistance_type,
          location,
          device_info,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok || !payload?.crn) {
        throw new Error(payload?.error || `Server returned ${res.status}`);
      }
      // Best-effort legacy implied-consent record (server already wrote
      // the spine version). Failure here is non-fatal.
      try {
        await recordAgreementAudit({
          profileId: payload.legacy_client?.id || payload.profile?.id || null,
          crn: payload.crn,
          action: AUDIT_ACTIONS.CRN_CREATED,
        });
      } catch (_) { /* noop */ }
      setIssuedCRN(payload.crn);
      setCareCentre(payload.care_centre || null);
      setAssistanceType(payload.assistance_type || assistance_type);
      setUnmatchedType(!!payload.unmatched_assistance_type);
      setSubmitted(true);
    } catch (err) {
      console.error('CRN request failed:', err);
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const deliveryParts = [];
    if (form.email.trim()) deliveryParts.push(<strong key="e">{form.email.trim()}</strong>);
    if (form.mobile.trim()) deliveryParts.push(<strong key="m">{form.mobile.trim()}</strong>);
    const typeLabel = ASSISTANCE_TYPE_LABEL[assistanceType] || assistanceType;
    return (
      <div className="ac-stack">
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #34C759, #30d158)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(52,199,89,0.3)' }}>
              <SafeIcon icon={FiCheckCircle} size={36} style={{ color: '#fff' }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>CRN Issued!</div>
            <p style={{ color: 'var(--ac-muted)', fontSize: 14, marginBottom: 24 }}>
              Hi <strong>{form.first_name}</strong>
              {deliveryParts.length > 0 && (
                <>
                  , your CRN has been sent to {deliveryParts.reduce((acc, el, i) => acc.concat(i ? [' and ', el] : [el]), [])}.
                </>
              )}
            </p>
            <div style={{ background: 'var(--ac-primary-soft)', border: '2px solid var(--ac-primary)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase', marginBottom: 8 }}>Your CRN</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2, color: 'var(--ac-primary)' }}>{issuedCRN}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 8 }}>Save this number — you'll need it for check-in</div>
              <button
                onClick={handleCopyCRN}
                style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 10, border: '1.5px solid var(--ac-primary)',
                  background: copied ? 'var(--ac-primary)' : 'transparent',
                  color: copied ? '#fff' : 'var(--ac-primary)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <SafeIcon icon={copied ? FiCheck : FiCopy} size={14} />
                {copied ? 'Copied!' : 'Copy CRN'}
              </button>
            </div>
            {unmatchedType && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', borderRadius: 12, padding: 14, textAlign: 'left', fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>
                <strong>Heads up:</strong> we don't have a centre set up yet for <em>{typeLabel}</em> in your area. You've been routed to the closest support centre for now so you can start getting help, and the system administrator has been notified to set up dedicated coverage.
              </div>
            )}
            {careCentre && (
              <div style={{ background: 'var(--ac-bg)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', marginBottom: 20 }}>
                <SafeIcon icon={FiMapPin} size={20} style={{ color: 'var(--ac-primary)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {unmatchedType ? 'Closest support centre' : `Attached to ${careCentre.name}`}
                  </div>
                  {unmatchedType && (
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{careCentre.name}</div>
                  )}
                  {careCentre.address && (
                    <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 2 }}>{careCentre.address}</div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 4 }}>
                    {unmatchedType
                      ? 'You will be contacted from here while a specialist centre is being arranged.'
                      : `Closest care centre offering ${typeLabel} to your location${typeof careCentre.distance_km === 'number' ? ` · ~${careCentre.distance_km} km away` : ''}.`}
                  </div>
                </div>
              </div>
            )}
            <Button variant="outline" style={{ width: '100%' }} onClick={() => { setSubmitted(false); setForm({ first_name: '', mobile: '', email: '', assistance_type: '' }); setIssuedCRN(''); setCareCentre(null); setAssistanceType(''); setUnmatchedType(false); setCopied(false); }}>Register Another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="ac-stack">
      <Card title="Request Your CRN" subtitle="A first name, the type of help you need, and one contact detail are enough to start.">
        <div className="ac-stack">
          <p className="ac-muted ac-xs" style={{ padding: '10px 14px', background: 'var(--ac-bg)', borderRadius: 10, border: '1px solid var(--ac-border)' }}>
            📍 Your approximate location is used to attach you to the closest care centre offering the assistance you need. If no centre matches the type yet, you'll be routed to the closest support centre and our team will set up coverage.
          </p>
          {error && <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', padding: '10px 14px', borderRadius: 10, color: '#c62828', fontSize: 13 }}>{error}</div>}
          <Field label="First Name *"><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="e.g. John" /></Field>
          <Field label="Type of Assistance *" hint="We use this to route you to a centre that handles this kind of support.">
            <Select
              value={form.assistance_type}
              onChange={e => setForm({ ...form, assistance_type: e.target.value })}
              options={[{ value: '', label: 'Select the help you need…' }, ...ASSISTANCE_TYPE_OPTIONS]}
            />
          </Field>
          <Field label="Mobile Number" hint="Optional if you provide an email."><Input type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="+61 4XX XXX XXX" /></Field>
          <Field label="Email Address" hint="Optional if you provide a mobile number."><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
          <Button icon={loading ? FiLoader : FiSend} disabled={loading} onClick={handleSubmit} style={{ marginTop: 8 }}>{loading ? 'Registering...' : 'Request My CRN'}</Button>
          <AgreementNotice action="crn_request" />
        </div>
      </Card>
    </div>
  );
};

export default CRNRequestPage;

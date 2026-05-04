import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { ProgressBar, Card, Button, Field, Input, Textarea } from '../../components/UI';

const { FiCreditCard } = FiIcons;

export const ProviderJoinPage = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", qualifications: "", bio: "", gender: "Female", experience: "5 years" });

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('providers_1740395000').insert([{ name: form.name, qualification: form.qualifications.split(',')[0], gender: form.gender, experience: form.experience, is_partner: true, rating: 4.8 }]);
      if (error) throw error;
      alert("Subscription Activated! Your profile is now live.");
      setStep(1);
    } catch { alert("Failed to activate partnership. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="ac-stack" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
        <h2 className="ac-h2">Join as a Service Provider</h2>
        <p className="ac-muted">Partner with Acute Connect and reach more patients.</p>
      </div>
      <ProgressBar value={step === 1 ? 50 : 100} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, margin: '8px 0 20px', color: 'var(--ac-muted)' }}>
        <span>1. Credentials</span><span>2. Subscription</span>
      </div>
      {step === 1 ? (
        <Card title="Provider Details" subtitle="Tell us about your practice and qualifications.">
          <div className="ac-stack">
            <Field label="Full Professional Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Smith" /></Field>
            <Field label="Email Address"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="jane@example.com" /></Field>
            <Field label="Qualifications / Credentials"><Textarea value={form.qualifications} onChange={e => setForm({ ...form, qualifications: e.target.value })} placeholder="List your degrees, certifications..." /></Field>
            <Field label="Short Bio"><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="A brief description for your profile..." /></Field>
            <Button style={{ width: '100%' }} onClick={() => setStep(2)}>Next: Subscription</Button>
          </div>
        </Card>
      ) : (
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
              <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
              <Button style={{ flex: 2 }} onClick={handleJoin} disabled={submitting}>{submitting ? "Processing..." : "Start Partnership"}</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProviderJoinPage;

import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { generateCRN } from '../../lib/utils';

const { FiX, FiUser, FiPhone, FiMail, FiMapPin, FiHeart, FiCheckCircle, FiAlertCircle } = FiIcons;

const SUPPORT_CATS = [
  { value: 'crisis',          label: 'Crisis Support' },
  { value: 'mental_health',   label: 'Mental Health' },
  { value: 'substance_abuse', label: 'Substance Abuse' },
  { value: 'housing',         label: 'Housing Support' },
  { value: 'general',         label: 'General Support' },
];

const field = (style) => ({
  width: '100%', height: 38, border: '1.5px solid #E2E8F0', borderRadius: 9,
  padding: '0 12px', fontSize: 13, background: '#F8FAFC', color: '#0F172A',
  outline: 'none', boxSizing: 'border-box', ...style,
});

const label = { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.4 };

function Field({ label: lbl, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={label}>{lbl}</label>
      {children}
    </div>
  );
}

export default function IntakeDrawer({ onClose, onSuccess, careTeam }) {
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', location: '',
    support_category: 'general', stage: 'intake', notes: '',
    age: '', gender: '', emergency_contact: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErr('Full name is required.'); return; }
    setSaving(true);
    setErr('');
    try {
      const crn = generateCRN();
      const { data, error } = await supabase.from('clients_1777020684735').insert([{
        name: form.name.trim(),
        email: form.email.trim() || null,
        mobile: form.mobile.trim() || null,
        location: form.location.trim() || null,
        support_category: form.support_category,
        stage: form.stage,
        notes: form.notes.trim() || null,
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        crn: crn,
        care_team: careTeam || null,
        status: 'active',
        current_mood: 7,
      }]).select().single();

      if (error) throw error;
      onSuccess && onSuccess(data);
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to create patient.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 490, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 480,
        background: '#fff', zIndex: 491, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.16)',
      }}>
        {/* header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>New Patient Intake</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>A CRN will be auto-generated on save</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: '#F1F5F9', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <SafeIcon icon={FiX} size={15} />
          </button>
        </div>

        {/* form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Section: Identity */}
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -6 }}>Identity</div>

          <Field label="Full Name *">
            <input value={form.name} onChange={set('name')} placeholder="e.g. Jordan Smith" style={field()} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Age">
              <input value={form.age} onChange={set('age')} type="number" placeholder="28" style={field()} />
            </Field>
            <Field label="Gender">
              <input value={form.gender} onChange={set('gender')} placeholder="e.g. Female" style={field()} />
            </Field>
          </div>

          {/* Section: Contact */}
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -6, marginTop: 4 }}>Contact</div>

          <Field label="Email">
            <input value={form.email} onChange={set('email')} type="email" placeholder="jordan@example.com" style={field()} />
          </Field>

          <Field label="Mobile">
            <input value={form.mobile} onChange={set('mobile')} type="tel" placeholder="04xx xxx xxx" style={field()} />
          </Field>

          <Field label="Location / Suburb">
            <input value={form.location} onChange={set('location')} placeholder="e.g. Fitzroy, VIC" style={field()} />
          </Field>

          <Field label="Emergency Contact">
            <input value={form.emergency_contact} onChange={set('emergency_contact')} placeholder="Name & phone" style={field()} />
          </Field>

          {/* Section: Care */}
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -6, marginTop: 4 }}>Care</div>

          <Field label="Support Category">
            <select value={form.support_category} onChange={set('support_category')} style={field()}>
              {SUPPORT_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <Field label="Stage">
            <select value={form.stage} onChange={set('stage')} style={field()}>
              {['intake', 'assessment', 'active', 'monitoring', 'closure'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Initial Notes">
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Presenting concern, context, referral source…"
              style={{ ...field({ height: 'auto', padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }) }} />
          </Field>

          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#DC2626' }}>
              <SafeIcon icon={FiAlertCircle} size={14} style={{ flexShrink: 0 }} />{err}
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 40, border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#F8FAFC', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, height: 40, border: 'none', borderRadius: 10, background: saving ? '#94A3B8' : 'var(--ac-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            {saving ? 'Saving…' : <><SafeIcon icon={FiCheckCircle} size={14} />Create Patient</>}
          </button>
        </div>
      </div>
    </>
  );
}

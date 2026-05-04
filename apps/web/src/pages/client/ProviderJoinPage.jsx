/*
-- Run in Supabase SQL editor:
ALTER TABLE providers ADD COLUMN IF NOT EXISTS provider_type text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS abn text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS abn_verified boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS abn_business_name text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS ahpra_number text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS ahpra_verified boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS ndis_number text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS ndis_verified boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS medicare_provider_number text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS insurance_expiry date;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS insurance_doc_url text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS practice_name text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS practice_address jsonb;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS service_areas text[];
ALTER TABLE providers ADD COLUMN IF NOT EXISTS services_offered text[];
ALTER TABLE providers ADD COLUMN IF NOT EXISTS availability jsonb;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS telehealth boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS telehealth_platform text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS bulk_billing boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE providers ADD COLUMN IF NOT EXISTS wait_time text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS booking_type text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS booking_url text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS booking_embed text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS booking_phone text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS accepting_patients boolean DEFAULT true;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS accepts_ndis boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS accepts_medicare boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS onboarding_progress jsonb;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS resume_token text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS resume_token_expires timestamptz;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
*/

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/supabase';

const BRAND = '#3a7d7b';
const BRAND_SOFT = 'rgba(58,125,123,0.1)';
const STORAGE_KEY = 'acmvp_provider_onboarding';

const PROVIDER_TYPES = [
  { id: 'gp', label: 'GP', emoji: '\u{1FA7A}', desc: 'General practitioner accepting patients' },
  { id: 'psychiatrist', label: 'Psychiatrist', emoji: '\u{1F9E0}', desc: 'Medical specialist in mental health' },
  { id: 'psychologist', label: 'Psychologist', emoji: '\u{1F4AC}', desc: 'Registered psychological therapy' },
  { id: 'allied', label: 'Allied Health', emoji: '\u{1F91D}', desc: 'OT, Physio, Speech, Dietitian etc' },
  { id: 'ndis', label: 'NDIS Support Worker', emoji: '\u{1F499}', desc: 'Registered NDIS service provider' },
  { id: 'mhn', label: 'Mental Health Nurse', emoji: '\u{1F469}\u200D\u2695\uFE0F', desc: 'Credentialed mental health nursing' },
  { id: 'social', label: 'Social Worker', emoji: '\u{1F3D8}', desc: 'AASW registered social worker' },
  { id: 'community', label: 'Community Health', emoji: '\u{1F30F}', desc: 'Community and outreach services' },
  { id: 'other', label: 'Other', emoji: '\u2795', desc: 'Another healthcare or support role' },
];

const SERVICE_GROUPS = [
  { group: 'Mental Health', icon: '\u{1F9E0}', items: ['Anxiety & Depression', 'Trauma Counselling', 'PTSD Treatment', 'Eating Disorders', 'Addiction Support'] },
  { group: 'Physical Health', icon: '\u2764\uFE0F', items: ['Chronic Disease Management', 'Rehabilitation', 'Pain Management', 'Preventive Care'] },
  { group: 'NDIS Support', icon: '\u{1F499}', items: ['Daily Activities', 'Community Access', 'Capacity Building', 'Plan Management'] },
  { group: 'Allied Health', icon: '\u{1F91D}', items: ['Physiotherapy', 'Occupational Therapy', 'Speech Pathology', 'Dietetics'] },
  { group: 'Crisis Services', icon: '\u{1F6A8}', items: ['Mental Health Crisis', '24/7 Support Line', 'Emergency Referrals'] },
];

const AVAIL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AVAIL_SLOTS = ['Morning', 'Afternoon', 'Evening'];
const LANGUAGES = ['English', 'Mandarin', 'Arabic', 'Vietnamese', 'Tagalog', 'Cantonese', 'Italian', 'Greek', 'Hindi', 'Spanish', 'Korean'];
const WAIT_TIMES = ['Same day', '1-3 days', '1 week', '2 weeks', '1 month+'];
const TELEHEALTH_PLATFORMS = ['Zoom', 'Teams', 'Coviu', 'Phone only', 'Other'];

const EXAMPLE_BIOS = [
  'I am a compassionate practitioner with over 10 years of experience supporting individuals through mental health challenges. I specialise in evidence-based approaches tailored to each client\'s unique needs.',
  'Dedicated to providing accessible, high-quality care in a safe and non-judgmental environment. I work collaboratively with clients to build resilience and achieve meaningful goals.',
  'With a focus on holistic wellbeing, I integrate multiple therapeutic modalities to support adults and young people navigating life\'s complexities. Telehealth and in-person options available.',
];

const ANIM_STYLES = `
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes float {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes pulse {
  0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(58,125,123,0.4); }
  50% { transform: scale(1.04); box-shadow: 0 0 0 12px rgba(58,125,123,0); }
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slideInRight {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes drawCheck {
  from { stroke-dashoffset: 200; }
  to { stroke-dashoffset: 0; }
}
@keyframes confettiFall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes strengthGrow {
  from { width: 0; }
  to { width: var(--strength-w); }
}
@keyframes trustFill {
  from { width: 0; }
  to { width: var(--trust-w); }
}
@keyframes spinnerRing {
  to { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes timelinePulse {
  0%,100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}
`;

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#e53e3e', '#dd6b20', '#38a169', '#276749'];
  return { score, label: labels[score] || '', color: colors[score] || '#e53e3e', pct: score * 25 };
}

function getTrustScore(fd) {
  let s = 0;
  if (fd.abn) s += 20;
  if (fd.ahpra_number) s += 20;
  if (fd.qualifications) s += 20;
  if (fd.bio) s += 20;
  if (fd.insuranceFile) s += 20;
  return s;
}

function getTrustLabel(score) {
  if (score === 0) return { label: 'Unverified', color: '#718096' };
  if (score <= 25) return { label: 'Basic', color: '#e53e3e' };
  if (score <= 50) return { label: 'Registered', color: '#dd6b20' };
  if (score <= 75) return { label: 'Verified', color: '#3182ce' };
  return { label: 'Premium Partner \u2B50', color: '#38a169' };
}

function Spinner() {
  return React.createElement('span', {
    style: {
      display: 'inline-block', width: 16, height: 16,
      border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
      borderRadius: '50%', animation: 'spinnerRing 0.7s linear infinite',
      verticalAlign: 'middle', marginRight: 6,
    }
  });
}

function Toggle({ value, onChange }) {
  return React.createElement('div', {
    onClick: () => onChange(!value),
    style: {
      width: 48, height: 26, borderRadius: 13,
      background: value ? BRAND : '#e2e8f0',
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.2s', flexShrink: 0,
    }
  }, React.createElement('div', {
    style: {
      position: 'absolute', top: 3, left: value ? 25 : 3,
      width: 20, height: 20, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
    }
  }));
}

function PasswordField({ value, onChange, strength }) {
  const [show, setShow] = React.useState(false);
  return React.createElement('div', null,
    React.createElement('div', { style: { position: 'relative' } },
      React.createElement('input', {
        type: show ? 'text' : 'password',
        value,
        onChange: e => onChange(e.target.value),
        placeholder: 'Create a secure password',
        className: 'ac-input',
        style: { width: '100%', boxSizing: 'border-box', paddingRight: 48 },
      }),
      React.createElement('button', {
        onClick: () => setShow(!show),
        style: {
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: 16,
        }
      }, show ? '\u{1F648}' : '\u{1F441}')
    ),
    value && React.createElement('div', { style: { marginTop: 8 } },
      React.createElement('div', { style: { height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' } },
        React.createElement('div', { style: { height: '100%', background: strength.color, borderRadius: 2, width: `${strength.pct}%`, transition: 'width 0.3s, background 0.3s' } })
      ),
      React.createElement('div', { style: { fontSize: 12, color: strength.color, marginTop: 4, fontWeight: 600 } }, strength.label)
    )
  );
}

function CopyLinkButton({ url }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => { prompt('Copy this link:', url); });
    } else {
      prompt('Copy this link:', url);
    }
  };
  return (
    <button onClick={handleCopy} style={{ background: copied ? '#38a169' : BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' }}>
      {copied ? '\u2713 Copied!' : 'Copy Link'}
    </button>
  );
}

export const ProviderJoinPage = () => {
  const [screen, setScreen] = React.useState('landing');
  const [step, setStep] = React.useState(1);
  const [providerType, setProviderType] = React.useState(null);
  const [resumeBanner, setResumeBanner] = React.useState(false);
  const [showExampleBios, setShowExampleBios] = React.useState(false);
  const [showNdis, setShowNdis] = React.useState(false);
  const [showMedicare, setShowMedicare] = React.useState(false);
  const [abnStatus, setAbnStatus] = React.useState('idle');
  const [ahpraStatus, setAhpraStatus] = React.useState('idle');
  const [ahpraConfirmed, setAhpraConfirmed] = React.useState(false);
  const [insuranceDragOver, setInsuranceDragOver] = React.useState(false);
  const [insuranceUploadProgress, setInsuranceUploadProgress] = React.useState(0);
  const [insuranceUploaded, setInsuranceUploaded] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState(null);
  const [serviceAreaInput, setServiceAreaInput] = React.useState('');
  const [bookingUrl, setBookingUrl] = React.useState('');
  const [bookingUrlStatus, setBookingUrlStatus] = React.useState('idle');
  const [submitting, setSubmitting] = React.useState(false);
  const canvasRef = React.useRef(null);

  const [formData, setFormData] = React.useState({
    name: '', email: '', phone: '', password: '',
    abn: '', abn_business_name: '', ahpra_number: '',
    ndis_number: '', medicare_provider_number: '',
    qualifications: '', bio: '',
    insurance_expiry: '', insuranceFile: null,
    practice_name: '', sameAsName: false, practice_address: '',
    service_areas: [], services_offered: [], availability: {},
    telehealth: false, telehealth_platform: '', bulk_billing: false,
    languages: ['English'], wait_time: '',
    booking_type: '', booking_embed: '', booking_phone: '',
    accepting_patients: true, accepts_ndis: false, accepts_medicare: false,
    resume_token: '',
  });

  const fd = formData;
  const setFd = patch => setFormData(prev => ({ ...prev, ...patch }));

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setResumeBanner(true);
        setFormData(prev => ({ ...prev, ...parsed }));
        if (parsed._providerType) setProviderType(parsed._providerType);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    if (screen === 'celebration') return;
    try {
      let token = formData.resume_token;
      if (!token) token = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData, _providerType: providerType, resume_token: token }));
    } catch {}
  }, [formData, providerType, screen]);

  React.useEffect(() => {
    if (screen !== 'celebration') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const colors = ['#3a7d7b', '#f6ad55', '#fc8181', '#68d391', '#76e4f7', '#b794f4'];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      r: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 6, alive: true,
    }));
    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let any = false;
      particles.forEach(p => {
        if (!p.alive) return;
        p.y += p.vy; p.x += p.vx; p.rot += p.rotV;
        if (p.y > canvas.height + 20) { p.alive = false; return; }
        any = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
        ctx.restore();
      });
      if (any) rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [screen]);

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Revoke blob URL on unmount to prevent memory leaks
  React.useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  const handleAbnVerify = () => {
    setAbnStatus('loading');
    setTimeout(() => {
      if (fd.abn.trim().length >= 9) { setAbnStatus('success'); setFd({ abn_business_name: 'Verified Health Services Pty Ltd' }); }
      else setAbnStatus('error');
    }, 1500);
  };

  const handleAhpraVerify = () => {
    window.open('https://www.ahpra.gov.au/Registration/Registers-of-Practitioners.aspx', '_blank');
    setAhpraStatus('pending');
  };

  const handleInsuranceFile = file => {
    if (!file) return;
    setInsuranceUploadProgress(0); setInsuranceUploaded(false);
    setFd({ insuranceFile: file.name });
    let pct = 0;
    const iv = setInterval(() => {
      pct += 20; setInsuranceUploadProgress(pct);
      if (pct >= 100) { clearInterval(iv); setInsuranceUploaded(true); }
    }, 200);
  };

  const toggleAvailability = (day, slot) => {
    const key = `${day}_${slot}`;
    setFd({ availability: { ...fd.availability, [key]: !fd.availability[key] } });
  };

  const toggleService = item => {
    const s = fd.services_offered.includes(item)
      ? fd.services_offered.filter(x => x !== item)
      : [...fd.services_offered, item];
    setFd({ services_offered: s });
  };

  const toggleGroupAll = group => {
    const g = SERVICE_GROUPS.find(g => g.group === group);
    if (!g) return;
    const all = g.items.every(i => fd.services_offered.includes(i));
    if (all) setFd({ services_offered: fd.services_offered.filter(i => !g.items.includes(i)) });
    else setFd({ services_offered: [...new Set([...fd.services_offered, ...g.items])] });
  };

  const addServiceArea = e => {
    if (e.key === 'Enter' && serviceAreaInput.trim()) {
      if (!fd.service_areas.includes(serviceAreaInput.trim()))
        setFd({ service_areas: [...fd.service_areas, serviceAreaInput.trim()] });
      setServiceAreaInput('');
    }
  };

  const toggleLanguage = lang => {
    if (lang === 'English') return;
    const l = fd.languages.includes(lang) ? fd.languages.filter(x => x !== lang) : [...fd.languages, lang];
    setFd({ languages: l });
  };

  const checkBookingUrl = url => {
    setBookingUrl(url); setFd({ booking_url: url });
    if (!url) { setBookingUrlStatus('idle'); return; }
    try { new URL(url); setBookingUrlStatus('valid'); } catch { setBookingUrlStatus('invalid'); }
  };

  const [submitError, setSubmitError] = React.useState('');

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError('');
    try {
      const { error } = await supabase.from('providers').insert([{
        provider_type: providerType, ...fd,
        services_offered: fd.services_offered, service_areas: fd.service_areas,
        languages: fd.languages, availability: fd.availability,
        status: 'pending', onboarding_progress: { step: 4, completed: true },
        resume_token_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }]);
      if (error) throw error;
    } catch (err) {
      setSubmitError('Submission failed. Please check your details and try again.');
      setSubmitting(false); return;
    }
    setTimeout(() => { setSubmitting(false); setScreen('celebration'); localStorage.removeItem(STORAGE_KEY); }, 1200);
  };

  const trustScore = getTrustScore(fd);
  const trustInfo = getTrustLabel(trustScore);
  const pwStr = getPasswordStrength(fd.password);
  const ptInfo = PROVIDER_TYPES.find(p => p.id === providerType);

  // LANDING
  if (screen === 'landing') return (
    <>
      <style>{ANIM_STYLES}</style>
      {resumeBanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, background: '#2d3748', color: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, animation: 'slideUp 0.3s ease forwards' }}>
          <span>Welcome back! Continue where you left off?</span>
          <button onClick={() => { setScreen('step'); setResumeBanner(false); }} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>Resume</button>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setResumeBanner(false); }} style={{ background: 'transparent', color: '#ccc', border: '1px solid #555', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Start Over</button>
        </div>
      )}
      <div style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364, #3a7d7b, #507C7B)', backgroundSize: '300% 300%', animation: 'gradientShift 8s ease infinite', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#fff' }}>
        <div style={{ textAlign: 'center', maxWidth: 700 }}>
          <div style={{ display: 'inline-block', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 50, padding: '6px 18px', fontSize: 13, marginBottom: 24, backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.1)' }}>
            Trusted by 500+ Healthcare Providers
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, margin: '0 0 16px', textShadow: '0 2px 20px rgba(0,0,0,0.3)', lineHeight: 1.2 }}>Partner with Acute Connect</h1>
          <p style={{ fontSize: 18, opacity: 0.88, margin: '0 auto 40px', maxWidth: 540 }}>Join Australia's fastest-growing healthcare referral platform and connect with patients who need your care most.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 40 }}>
            {[
              { icon: '\uD83D\uDD0D', title: 'Get Discovered', desc: 'Reach thousands of patients actively searching for care in your area', delay: '0ms' },
              { icon: '\uD83D\uDCCB', title: 'Streamlined Referrals', desc: 'Receive and manage patient referrals directly through the platform', delay: '200ms' },
              { icon: '\u2705', title: 'Verified & Trusted', desc: 'Display your credentials with an official verification badge', delay: '400ms' },
            ].map(b => (
              <div key={b.title} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: 20, maxWidth: 200, textAlign: 'center', flex: '1 1 160px', animation: 'slideUp 0.5s ease forwards', animationDelay: b.delay, opacity: 0 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{b.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{b.title}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{b.desc}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen('type')} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 50, padding: '18px 48px', fontSize: 18, fontWeight: 700, cursor: 'pointer', animation: 'pulse 2s infinite', marginBottom: 16 }}>
            Start Your Application &rarr;
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ opacity: 0.75, fontSize: 14 }}>Takes about 5 minutes</div>
            <button onClick={() => setScreen('status')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
              Already applied? Check your status &rarr;
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 40, opacity: 0.75, fontSize: 13 }}>
            {['\uD83D\uDD12 Secure & Encrypted', '\uD83D\uDEE1 AHPRA Verified', '\u2B50 500+ Providers', '\uD83D\uDCB3 Subscription Plans Available'].map(t => <span key={t}>{t}</span>)}
          </div>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginTop: 16, fontSize: 13, textDecoration: 'underline' }}>View Pricing</button>
        </div>
      </div>
    </>
  );

  // TYPE SELECTOR
  if (screen === 'type') return (
    <>
      <style>{ANIM_STYLES}</style>
      <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <button onClick={() => setScreen('landing')} style={{ alignSelf: 'flex-start', marginLeft: 20, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: 14 }}>&larr; Back</button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#1a202c' }}>What best describes you?</h2>
          <p style={{ color: '#718096', fontSize: 15 }}>We'll customise your profile and verification requirements based on your role.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, maxWidth: 700, width: '100%' }}>
          {PROVIDER_TYPES.map(pt => {
            const sel = providerType === pt.id;
            return (
              <div key={pt.id} onClick={() => setProviderType(pt.id)} style={{ position: 'relative', border: `2px solid ${sel ? BRAND : 'transparent'}`, borderRadius: 16, padding: 20, cursor: 'pointer', background: sel ? BRAND : '#fff', color: sel ? '#fff' : '#1a202c', boxShadow: sel ? `0 4px 20px rgba(58,125,123,0.25)` : '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s', textAlign: 'center' }}>
                {sel && <span style={{ position: 'absolute', top: 8, right: 10, fontWeight: 700, fontSize: 14 }}>&check;</span>}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{pt.emoji}</div>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{pt.label}</div>
                <div style={{ fontSize: 12, opacity: sel ? 0.9 : 0.6 }}>{pt.desc}</div>
              </div>
            );
          })}
        </div>
        {providerType && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: 20, display: 'flex', justifyContent: 'center', animation: 'slideUp 0.3s ease forwards', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
            <button onClick={() => { setScreen('step'); setStep(1); }} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 50, padding: '16px 48px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Continue &rarr;
            </button>
          </div>
        )}
      </div>
    </>
  );

  // CELEBRATION
  if (screen === 'celebration') return (
    <>
      <style>{ANIM_STYLES}</style>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 999 }} />
      <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ marginBottom: 24 }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke={BRAND} strokeWidth="4" strokeDasharray="283" strokeDashoffset="283" style={{ animation: 'drawCheck 1s ease forwards', animationDelay: '0.2s' }} />
          <polyline points="28,52 44,68 72,36" fill="none" stroke={BRAND} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset="80" style={{ animation: 'drawCheck 0.6s ease forwards', animationDelay: '0.8s' }} />
        </svg>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1a202c', marginBottom: 12 }}>Application Submitted!</h1>
        <p style={{ color: '#718096', fontSize: 16, maxWidth: 480, margin: '0 auto 40px' }}>Thank you for joining Acute Connect. Our team will review your application and verify your credentials within 2 hours.</p>
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 40, textAlign: 'left', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 20, top: 24, bottom: 24, width: 2, background: '#e2e8f0' }} />
          {[
            { icon: '\u2705', label: 'Application Received', sub: 'Just now', color: '#38a169', pulse: false },
            { icon: '\u23F3', label: 'Credentials Verified', sub: 'est. 2 hours', color: '#dd6b20', pulse: true },
            { icon: '\u23F3', label: 'Profile Live', sub: 'est. 24 hours', color: '#a0aec0', pulse: false },
            { icon: '\uD83D\uDE80', label: 'First Referral', sub: 'Coming soon', color: '#a0aec0', pulse: false },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', position: 'relative' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `2px solid ${t.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, zIndex: 1, animation: t.pulse ? 'timelinePulse 2s infinite' : 'none' }}>{t.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: t.color }}>{t.label}</div>
                <div style={{ fontSize: 13, color: '#a0aec0' }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 32, maxWidth: 420, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: BRAND_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{ptInfo ? ptInfo.emoji : '\uD83D\uDC64'}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{fd.name || 'Your Name'}</div>
              <div style={{ color: '#718096', fontSize: 14 }}>{fd.email}</div>
              <div style={{ marginTop: 4 }}><span style={{ background: BRAND, color: '#fff', borderRadius: 50, padding: '2px 10px', fontSize: 12 }}>{ptInfo ? ptInfo.label : 'Provider'}</span></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 32, maxWidth: 700 }}>
          {[
            { icon: '\u270F\uFE0F', title: 'Complete Your Profile', desc: 'Add a photo and more details' },
            { icon: '\uD83D\uDC41', title: 'Preview Your Listing', desc: 'See how patients will find you' },
            { icon: '\uD83D\uDCE7', title: 'Invite a Colleague', desc: 'Earn referral credits' },
          ].map(a => (
            <div key={a.title} style={{ background: '#fff', borderRadius: 16, padding: 20, cursor: 'pointer', flex: '1 1 170px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#718096' }}>{a.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#718096' }}>Share your profile:</span>
          <CopyLinkButton url={`https://acuteconnect.com.au/providers/${fd.resume_token}`} />
        </div>
      </div>
    </>
  );

  // STATUS
  if (screen === 'status') return <ProviderStatusPage onBack={() => setScreen('landing')} />;

  // STEPS
  const stepLabels = ['Identity', 'Credentials', 'Practice', 'Booking'];

  const StepProgress = () => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {ptInfo && (
          <button onClick={() => setScreen('type')} style={{ background: BRAND_SOFT, border: 'none', borderRadius: 50, padding: '4px 12px', cursor: 'pointer', fontSize: 13, color: BRAND, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {ptInfo.emoji} {ptInfo.label} &nbsp;&#9998;
          </button>
        )}
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${step * 25}%`, background: BRAND, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {stepLabels.map((l, i) => (
          <button key={l} onClick={() => i + 1 < step && setStep(i + 1)} style={{ background: 'none', border: 'none', cursor: i + 1 < step ? 'pointer' : 'default', fontSize: 12, color: i + 1 <= step ? BRAND : '#a0aec0', fontWeight: i + 1 === step ? 700 : 400, padding: 0 }}>
            {i + 1 <= step ? '\u2713 ' : ''}{l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{ANIM_STYLES}</style>
      <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 120px' }}>
        <div style={{ width: '100%', maxWidth: 640, animation: 'slideInRight 0.3s ease forwards' }}>
          <StepProgress />

          {step === 1 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#1a202c' }}>Tell us about yourself</h2>
              <p style={{ color: '#718096', marginBottom: 28, fontSize: 14 }}>Your identity information stays private until you're verified.</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                <label style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: photoPreview ? `url(${photoPreview}) center/cover` : BRAND_SOFT, border: `3px dashed ${BRAND}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: BRAND, fontSize: 13, fontWeight: 600, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {!photoPreview && <><span style={{ fontSize: 28 }}>\uD83D\uDCF7</span><span>Add photo</span></>}
                  </div>
                </label>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 8 }}>Providers with photos get 3&times; more referrals</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>Full Professional Name</label>
                  <input autoFocus value={fd.name} onChange={e => setFd({ name: e.target.value })} placeholder="Dr. Jane Smith" className="ac-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input value={fd.email} onChange={e => setFd({ email: e.target.value })} type="email" placeholder="jane@example.com" className="ac-input" style={{ width: '100%', boxSizing: 'border-box', paddingRight: 40 }} />
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email) && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#38a169' }}>\u2705</span>}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>Phone Number</label>
                  <input value={fd.phone} onChange={e => setFd({ phone: e.target.value })} type="tel" placeholder="+61 4XX XXX XXX" className="ac-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>Password</label>
                  <PasswordField value={fd.password} onChange={pw => setFd({ password: pw })} strength={pwStr} />
                </div>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button onClick={() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData, _providerType: providerType })); } catch {} alert('Progress saved! You can return any time to continue.'); }} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Save &amp; Continue Later</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button onClick={() => setScreen('type')} style={{ flex: 1, background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 0', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Back</button>
                <button onClick={() => setStep(2)} style={{ flex: 2, background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>Next: Credentials &rarr;</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#1a202c' }}>Your Credentials</h2>
              <p style={{ color: '#718096', marginBottom: 16, fontSize: 14 }}>Verification boosts your visibility and patient trust.</p>
              <div style={{ background: '#f7fafc', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#4a5568' }}>Trust Score</span>
                  <span style={{ color: trustInfo.color, fontWeight: 700, fontSize: 13 }}>{trustInfo.label}</span>
                </div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${trustScore}%`, background: trustInfo.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 6 }}>{trustScore}% complete</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>ABN (Australian Business Number)</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input value={fd.abn} onChange={e => setFd({ abn: e.target.value })} placeholder="XX XXX XXX XXX" className="ac-input" style={{ flex: 1 }} />
                    <button onClick={handleAbnVerify} disabled={abnStatus === 'loading' || !fd.abn} style={{ background: abnStatus === 'success' ? '#38a169' : BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: !fd.abn ? 0.6 : 1, display: 'flex', alignItems: 'center' }}>
                      {abnStatus === 'loading' ? <><Spinner />Checking...</> : abnStatus === 'success' ? '\u2713 Verified' : 'Verify ABN'}
                    </button>
                  </div>
                  {abnStatus === 'error' && <div style={{ color: '#e53e3e', fontSize: 12, marginTop: 4 }}>ABN not found. Please check and try again.</div>}
                  {abnStatus === 'success' && fd.abn_business_name && <div style={{ color: '#718096', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>{fd.abn_business_name}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>AHPRA Registration Number</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input value={fd.ahpra_number} onChange={e => setFd({ ahpra_number: e.target.value })} placeholder="MED0001234567" className="ac-input" style={{ flex: 1 }} />
                    <button onClick={handleAhpraVerify} disabled={!fd.ahpra_number} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: !fd.ahpra_number ? 0.6 : 1 }}>
                      Check AHPRA &uarr;
                    </button>
                  </div>
                  {ahpraStatus === 'pending' && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={ahpraConfirmed} onChange={e => setAhpraConfirmed(e.target.checked)} />
                        I confirm my AHPRA registration is active
                      </label>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: '#fefcbf', color: '#744210', border: '1px solid #f6e05e', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>PENDING</span>
                        <span style={{ fontSize: 12, color: '#718096' }}>Verified by our team within 2 hours</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <button onClick={() => setShowNdis(!showNdis)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#4a5568', padding: 0, width: '100%', justifyContent: 'space-between' }}>
                    <span>NDIS Registration <span style={{ color: '#a0aec0', fontWeight: 400 }}>(optional)</span></span>
                    <span>{showNdis ? '\u25B2' : '\u25BC'}</span>
                  </button>
                  {showNdis && <input value={fd.ndis_number} onChange={e => setFd({ ndis_number: e.target.value })} placeholder="NDIS Registration Number" className="ac-input" style={{ width: '100%', boxSizing: 'border-box', marginTop: 10 }} />}
                </div>
                <div>
                  <button onClick={() => setShowMedicare(!showMedicare)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#4a5568', padding: 0, width: '100%', justifyContent: 'space-between' }}>
                    <span>Medicare Provider Number <span style={{ color: '#a0aec0', fontWeight: 400 }}>(optional)</span></span>
                    <span>{showMedicare ? '\u25B2' : '\u25BC'}</span>
                  </button>
                  {showMedicare && <input value={fd.medicare_provider_number} onChange={e => setFd({ medicare_provider_number: e.target.value })} placeholder="Medicare Provider Number" className="ac-input" style={{ width: '100%', boxSizing: 'border-box', marginTop: 10 }} />}
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>
                    <span>Qualifications / Credentials</span>
                    <span style={{ color: '#a0aec0', fontWeight: 400 }}>{fd.qualifications.length}/500</span>
                  </label>
                  <textarea value={fd.qualifications} onChange={e => setFd({ qualifications: e.target.value.slice(0, 500) })} placeholder="List your degrees, certifications, professional memberships..." className="ac-input" style={{ width: '100%', boxSizing: 'border-box', minHeight: 80, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>
                    <span>Short Bio</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button onClick={() => setShowExampleBios(!showExampleBios)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND, fontSize: 12, fontWeight: 600 }}>Need inspiration?</button>
                      <span style={{ color: '#a0aec0', fontWeight: 400 }}>{fd.bio.length}/300</span>
                    </div>
                  </label>
                  {showExampleBios && (
                    <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      {EXAMPLE_BIOS.map((b, i) => (
                        <div key={i} onClick={() => { setFd({ bio: b }); setShowExampleBios(false); }} style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#4a5568', marginBottom: 4, background: '#fff', border: '1px solid #e2e8f0' }}>{b}</div>
                      ))}
                    </div>
                  )}
                  <textarea value={fd.bio} onChange={e => setFd({ bio: e.target.value.slice(0, 300) })} placeholder="A brief description for your profile..." className="ac-input" style={{ width: '100%', boxSizing: 'border-box', minHeight: 80, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>Professional Indemnity Insurance <span style={{ color: '#a0aec0', fontWeight: 400 }}>(optional)</span></label>
                  <div onDragOver={e => { e.preventDefault(); setInsuranceDragOver(true); }} onDragLeave={() => setInsuranceDragOver(false)} onDrop={e => { e.preventDefault(); setInsuranceDragOver(false); handleInsuranceFile(e.dataTransfer.files[0]); }} style={{ border: `2px dashed ${insuranceDragOver ? BRAND : '#e2e8f0'}`, borderRadius: 12, padding: 24, textAlign: 'center', background: insuranceDragOver ? BRAND_SOFT : '#f7fafc', transition: 'all 0.2s' }}>
                    {insuranceUploaded ? (
                      <div style={{ color: '#38a169', fontWeight: 600 }}>\u2705 {fd.insuranceFile} uploaded</div>
                    ) : insuranceUploadProgress > 0 ? (
                      <div>
                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', margin: '8px 0' }}>
                          <div style={{ height: '100%', width: `${insuranceUploadProgress}%`, background: BRAND, transition: 'width 0.2s' }} />
                        </div>
                        <div style={{ fontSize: 13, color: '#718096' }}>{insuranceUploadProgress}%</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>\uD83D\uDCC4</div>
                        <div style={{ fontSize: 14, color: '#4a5568' }}>Drag &amp; drop or <label style={{ color: BRAND, cursor: 'pointer', fontWeight: 600 }}>browse<input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleInsuranceFile(e.target.files[0])} /></label></div>
                        <div style={{ fontSize: 12, color: '#a0aec0' }}>PDF, JPG or PNG</div>
                      </>
                    )}
                  </div>
                  {insuranceUploaded && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>Insurance Expiry Date</label>
                      <input type="date" value={fd.insurance_expiry} onChange={e => setFd({ insurance_expiry: e.target.value })} className="ac-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                      {fd.insurance_expiry && (() => {
                        const exp = new Date(fd.insurance_expiry);
                        const days = Math.ceil((exp - new Date()) / 86400000);
                        if (days < 0) return <div style={{ color: '#e53e3e', fontSize: 12, marginTop: 4 }}>Insurance has expired</div>;
                        if (days < 90) return <div style={{ color: '#dd6b20', fontSize: 12, marginTop: 4 }}>Expires in {days} days &mdash; renew soon</div>;
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 0', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>Next: Practice &rarr;</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#1a202c' }}>Your Practice</h2>
              <p style={{ color: '#718096', marginBottom: 24, fontSize: 14 }}>Help patients find and understand your services.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>
                    Practice Name
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 400, cursor: 'pointer' }}>
                      <input type="checkbox" checked={fd.sameAsName} onChange={e => setFd({ sameAsName: e.target.checked, practice_name: e.target.checked ? fd.name : fd.practice_name })} />
                      Same as my name
                    </label>
                  </label>
                  <input value={fd.practice_name} onChange={e => setFd({ practice_name: e.target.value })} placeholder="e.g. Smith Psychology Group" className="ac-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>Practice Address</label>
                  <input value={fd.practice_address} onChange={e => setFd({ practice_address: e.target.value })} placeholder="Start typing your address..." className="ac-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#4a5568' }}>
                    Service Areas {fd.service_areas.length > 0 && <span style={{ color: BRAND, fontWeight: 400 }}>&middot; {fd.service_areas.length} areas covered</span>}
                  </label>
                  <input value={serviceAreaInput} onChange={e => setServiceAreaInput(e.target.value)} onKeyDown={addServiceArea} placeholder="Type suburb + Enter" className="ac-input" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {fd.service_areas.map(area => (
                      <span key={area} style={{ background: BRAND_SOFT, color: BRAND, borderRadius: 50, padding: '4px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {area}
                        <button onClick={() => setFd({ service_areas: fd.service_areas.filter(a => a !== area) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND, fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#4a5568' }}>Services Offered</label>
                  {SERVICE_GROUPS.map(g => {
                    const allSel = g.items.every(i => fd.services_offered.includes(i));
                    return (
                      <div key={g.group} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: '#2d3748', fontSize: 14 }}>{g.icon} {g.group}</span>
                          <button onClick={() => toggleGroupAll(g.group)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND, fontSize: 12, fontWeight: 600 }}>{allSel ? 'Deselect all' : 'Select all'}</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {g.items.map(item => (
                            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: fd.services_offered.includes(item) ? BRAND_SOFT : '#f7fafc', border: `1px solid ${fd.services_offered.includes(item) ? BRAND : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                              <input type="checkbox" checked={fd.services_offered.includes(item)} onChange={() => toggleService(item)} style={{ accentColor: BRAND }} />
                              <span style={{ fontSize: 13, color: fd.services_offered.includes(item) ? BRAND : '#4a5568' }}>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568' }}>Weekly Availability</label>
                    <button onClick={() => { const av = {}; ['Mon','Tue','Wed','Thu','Fri'].forEach(d => AVAIL_SLOTS.forEach(s => { av[`${d}_${s}`] = true; })); setFd({ availability: av }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND, fontSize: 12, fontWeight: 600 }}>Select all weekdays</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 90, textAlign: 'left', color: '#a0aec0', fontWeight: 600, paddingBottom: 8 }} />
                          {AVAIL_DAYS.map(d => <th key={d} style={{ textAlign: 'center', color: '#4a5568', fontWeight: 600, paddingBottom: 8 }}>{d}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {AVAIL_SLOTS.map(slot => (
                          <tr key={slot}>
                            <td style={{ color: '#718096', fontSize: 12, paddingRight: 8, paddingBottom: 6 }}>{slot}</td>
                            {AVAIL_DAYS.map(day => {
                              const key = `${day}_${slot}`;
                              const sel = !!fd.availability[key];
                              return (
                                <td key={day} style={{ textAlign: 'center', paddingBottom: 6 }}>
                                  <div onClick={() => toggleAvailability(day, slot)} style={{ width: 32, height: 32, borderRadius: 8, margin: '0 auto', cursor: 'pointer', background: sel ? BRAND : '#f7fafc', border: `1px solid ${sel ? BRAND : '#e2e8f0'}`, transition: 'all 0.15s' }} />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: fd.telehealth ? 10 : 0 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568' }}>Telehealth Available</label>
                    <Toggle value={fd.telehealth} onChange={v => setFd({ telehealth: v })} />
                  </div>
                  {fd.telehealth && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {TELEHEALTH_PLATFORMS.map(p => (
                        <button key={p} onClick={() => setFd({ telehealth_platform: p })} style={{ border: `2px solid ${fd.telehealth_platform === p ? BRAND : '#e2e8f0'}`, background: fd.telehealth_platform === p ? BRAND_SOFT : '#fff', color: fd.telehealth_platform === p ? BRAND : '#4a5568', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{p}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568' }}>Bulk Billing Available</label>
                  <Toggle value={fd.bulk_billing} onChange={v => setFd({ bulk_billing: v })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#4a5568' }}>Languages Spoken</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {LANGUAGES.map(lang => (
                      <button key={lang} onClick={() => toggleLanguage(lang)} style={{ border: `2px solid ${fd.languages.includes(lang) ? BRAND : '#e2e8f0'}`, background: fd.languages.includes(lang) ? BRAND_SOFT : '#fff', color: fd.languages.includes(lang) ? BRAND : '#4a5568', borderRadius: 8, padding: '6px 14px', cursor: lang === 'English' ? 'default' : 'pointer', fontSize: 13, fontWeight: 600 }}>{lang}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#4a5568' }}>Average Wait Time</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {WAIT_TIMES.map(w => (
                      <button key={w} onClick={() => setFd({ wait_time: w })} style={{ border: `2px solid ${fd.wait_time === w ? BRAND : '#e2e8f0'}`, background: fd.wait_time === w ? BRAND : '#fff', color: fd.wait_time === w ? '#fff' : '#4a5568', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{w}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 0', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Back</button>
                <button onClick={() => setStep(4)} style={{ flex: 2, background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>Next: Booking &rarr;</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#1a202c' }}>Booking Setup</h2>
              <p style={{ color: '#718096', marginBottom: 24, fontSize: 14 }}>Choose how patients will book with you.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {[
                  { id: 'link', icon: '\uD83D\uDD17', title: 'Direct Link', desc: 'Send patients to your existing booking page' },
                  { id: 'embed', icon: '\uD83D\uDCF1', title: 'Embedded Widget', desc: 'Let patients book without leaving Acute Connect' },
                  { id: 'phone', icon: '\uD83D\uDCDE', title: 'Phone / Manual', desc: 'Patients call or email to book' },
                ].map(opt => {
                  const sel = fd.booking_type === opt.id;
                  return (
                    <div key={opt.id}>
                      <div onClick={() => setFd({ booking_type: opt.id })} style={{ border: `2px solid ${sel ? BRAND : '#e2e8f0'}`, borderRadius: 14, padding: 20, cursor: 'pointer', background: sel ? BRAND_SOFT : '#fff', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 32 }}>{opt.icon}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: sel ? BRAND : '#1a202c' }}>{opt.title}</div>
                          <div style={{ fontSize: 13, color: '#718096' }}>{opt.desc}</div>
                        </div>
                        {sel && <span style={{ marginLeft: 'auto', color: BRAND, fontSize: 18 }}>\u2713</span>}
                      </div>
                      {sel && opt.id === 'link' && (
                        <div style={{ marginTop: 12, padding: '0 4px' }}>
                          <div style={{ position: 'relative' }}>
                            <input value={bookingUrl} onChange={e => checkBookingUrl(e.target.value)} placeholder="https://your-booking-system.com.au" className="ac-input" style={{ width: '100%', boxSizing: 'border-box', paddingRight: 36 }} />
                            {bookingUrlStatus === 'valid' && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#38a169' }}>\u2705</span>}
                            {bookingUrlStatus === 'invalid' && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#dd6b20' }}>\u26A0\uFE0F</span>}
                          </div>
                        </div>
                      )}
                      {sel && opt.id === 'embed' && (
                        <div style={{ marginTop: 12, padding: '0 4px' }}>
                          <textarea value={fd.booking_embed} onChange={e => setFd({ booking_embed: e.target.value })} placeholder="Paste your booking widget embed code here..." className="ac-input" style={{ width: '100%', boxSizing: 'border-box', minHeight: 100, fontFamily: 'monospace', fontSize: 12 }} />
                        </div>
                      )}
                      {sel && opt.id === 'phone' && (
                        <div style={{ marginTop: 12, padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <input value={fd.booking_phone} onChange={e => setFd({ booking_phone: e.target.value })} placeholder="+61 3 XXXX XXXX" className="ac-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                          <input value={fd.booking_hours || ''} onChange={e => setFd({ booking_hours: e.target.value })} placeholder="Preferred booking hours (e.g. Mon-Fri 9am-5pm)" className="ac-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a202c', margin: 0 }}>Patient Acceptance Settings</h3>
                {[
                  { key: 'accepting_patients', icon: '\uD83D\uDC65', label: 'Accepting New Patients' },
                  { key: 'accepts_ndis', icon: '\uD83D\uDC99', label: 'NDIS Participants Welcome' },
                  { key: 'accepts_medicare', icon: '\uD83D\uDCB3', label: 'Bulk Billing / Medicare Available' },
                ].map(tog => (
                  <div key={tog.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 14, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 8 }}>{tog.icon} {tog.label}</label>
                    <Toggle value={!!fd[tog.key]} onChange={v => setFd({ [tog.key]: v })} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 0', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Back</button>
                <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, background: submitting ? '#a0aec0' : BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {submitting ? <><Spinner />Submitting...</> : 'Submit Application'}
                </button>
              </div>
              {submitError && <div style={{ marginTop: 12, background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, padding: 14, color: '#c53030', fontSize: 14 }}>{submitError}</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const ProviderStatusPage = ({ onBack }) => {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const handleLookup = async () => {
    if (!email) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { data, error: err } = await supabase.from('providers').select('status, name, provider_type, practice_name, admin_notes').eq('email', email).single();
      if (err || !data) setError('No application found for this email address.');
      else setResult(data);
    } catch { setError('Unable to look up your application. Please try again.'); }
    finally { setLoading(false); }
  };

  const statusConfig = {
    pending: { label: 'Under Review', color: '#dd6b20', icon: '\u23F3', desc: 'Our team is reviewing your credentials. This usually takes 2 hours.' },
    approved: { label: 'Approved', color: '#38a169', icon: '\u2705', desc: 'Your profile is live! Patients can now find and refer to you.' },
    needs_info: { label: 'Action Required', color: '#e53e3e', icon: '\u26A0\uFE0F', desc: 'We need additional information to complete your verification.' },
  };

  return (
    <>
      <style>{ANIM_STYLES}</style>
      <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        {onBack && <button onClick={onBack} style={{ alignSelf: 'flex-start', marginLeft: 20, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: 14 }}>&larr; Back</button>}
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 480, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>\uD83D\uDD0D</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#1a202c' }}>Check Application Status</h2>
            <p style={{ color: '#718096', fontSize: 14 }}>Enter the email address you used to apply.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLookup()} type="email" placeholder="your@email.com" className="ac-input" style={{ flex: 1 }} />
            <button onClick={handleLookup} disabled={loading || !email} style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', cursor: loading || !email ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: !email ? 0.6 : 1, display: 'flex', alignItems: 'center' }}>
              {loading ? <Spinner /> : 'Look Up'}
            </button>
          </div>
          {error && <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, padding: 14, color: '#c53030', fontSize: 14 }}>{error}</div>}
          {result && (() => {
            const cfg = statusConfig[result.status] || statusConfig.pending;
            return (
              <div style={{ animation: 'slideUp 0.3s ease forwards' }}>
                <div style={{ background: '#f7fafc', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid rgba(0,0,0,0.08)` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{cfg.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: cfg.color, fontSize: 16 }}>{cfg.label}</div>
                      <div style={{ fontSize: 13, color: '#718096' }}>{cfg.desc}</div>
                    </div>
                  </div>
                  {result.status === 'needs_info' && result.admin_notes && (
                    <div style={{ background: '#fff5f5', borderRadius: 8, padding: 12, fontSize: 13, color: '#c53030' }}>
                      <strong>Action needed:</strong> {result.admin_notes}
                    </div>
                  )}
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1a202c' }}>Application Details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#4a5568' }}>
                    {result.name && <span>\uD83D\uDC64 {result.name}</span>}
                    {result.provider_type && <span>\uD83C\uDFE5 {PROVIDER_TYPES.find(p => p.id === result.provider_type)?.label || result.provider_type}</span>}
                    {result.practice_name && <span>\uD83C\uDFE2 {result.practice_name}</span>}
                  </div>
                </div>
                {result.status === 'approved' && (
                  <button style={{ width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: 14, cursor: 'pointer', fontWeight: 700, fontSize: 15, marginTop: 16 }}>
                    View Your Listing &rarr;
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default ProviderJoinPage;

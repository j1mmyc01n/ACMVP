import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { cx } from '../../lib/utils';
import { supabase } from '../../supabase/supabase';
import { Tabs, Card, ProgressBar, Field, Input, Textarea, Button } from '../../components/UI';
import AgreementNotice from '../../legal/AgreementNotice';
import { recordAgreementAudit, AUDIT_ACTIONS } from '../../lib/audit';
import { CRNRequestPage } from './CRNRequestPage';
import { LocationInfoView, ResourcesView } from './ResourcesPage';

const { FiInfo, FiShield, FiMail } = FiIcons;

/* ─── UTILITY: Smart banner text colour from hex ───────────────── */
const getBannerTextColor = (hex) => {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#1a1a1a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
};

/* ─── COOKIE CONSENT BANNER (Consently-style) ──────────────────── */
const CookieConsentBanner = () => {
  const [accepted, setAccepted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ac_cookie_consent');
    if (stored === 'accepted') setAccepted(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ac_cookie_consent', 'accepted');
    localStorage.setItem('ac_cookie_timestamp', new Date().toISOString());
    setAccepted(true);
  };

  const handleReject = () => {
    localStorage.setItem('ac_cookie_consent', 'rejected');
    localStorage.setItem('ac_cookie_timestamp', new Date().toISOString());
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 0, right: 0,
      background: 'var(--ac-surface)', borderTop: '1px solid var(--ac-border)',
      padding: '16px 20px', zIndex: 150, boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      maxWidth: '100%'
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <SafeIcon icon={FiInfo} size={18} style={{ color: 'var(--ac-primary)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>We use cookies to improve your experience</div>
            <p style={{ fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.5, marginBottom: 10 }}>
              We use essential cookies to keep you secure and improve the platform. You can manage your preferences below.
            </p>
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{ fontSize: 12, color: 'var(--ac-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {showDetails ? 'Hide details' : 'Learn more about our cookies'}
            </button>
          </div>
          <button
            onClick={handleReject}
            style={{ background: 'none', border: 'none', color: 'var(--ac-muted)', cursor: 'pointer', padding: 4, fontSize: 16, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {showDetails && (
          <div style={{
            background: 'var(--ac-bg)', borderRadius: 10, padding: 12, marginBottom: 12,
            border: '1px solid var(--ac-border)', fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--ac-text)' }}>Cookie Categories:</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>🔒 Essential (Always enabled)</div>
              <div>Security, session management, CSRF protection</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>📊 Analytics (Optional)</div>
              <div>Usage patterns to improve the platform</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>🎯 Marketing (Optional)</div>
              <div>Sponsor content and platform improvements</div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ac-border)' }}>
              <a href="#privacy" style={{ color: 'var(--ac-primary)', textDecoration: 'none', fontWeight: 600, marginRight: 16 }}>Privacy Policy</a>
              <a href="#cookies" style={{ color: 'var(--ac-primary)', textDecoration: 'none', fontWeight: 600 }}>Cookie Policy</a>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={handleReject}
            style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--ac-bg)',
              border: '1px solid var(--ac-border)', cursor: 'pointer', fontSize: 12,
              fontWeight: 600, color: 'var(--ac-text)', transition: 'all 0.2s'
            }}
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--ac-primary)',
              border: 'none', cursor: 'pointer', fontSize: 12,
              fontWeight: 600, color: '#fff', transition: 'all 0.2s'
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── PROFILE COMPLETION CARD ───────────────────────────────────── */
const ProfileCompletionCard = () => {
  const [form, setForm] = useState({ crn: '', full_name: '', dob: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [completeness, setCompleteness] = useState(0);

  const lookup = async () => {
    const crn = form.crn.trim().toUpperCase();
    if (!crn) return;
    setError('');
    try {
      const { data: profile } = await supabase
        .from('profiles').select('full_name, dob, email, phone').eq('crn', crn).maybeSingle();
      if (profile) {
        setForm((f) => ({
          ...f,
          full_name: profile.full_name || f.full_name,
          dob: profile.dob || f.dob,
          email: profile.email || f.email,
          phone: profile.phone || f.phone,
        }));
      }
    } catch (_) { /* noop */ }
  };

  useEffect(() => {
    const present = ['full_name', 'dob', 'email', 'phone'].filter((k) => (form[k] || '').trim()).length;
    setCompleteness(Math.round((present / 4) * 100));
  }, [form]);

  const save = async () => {
    const crn = form.crn.trim().toUpperCase();
    if (!crn) { setError('Enter your CRN to attach these details to your record.'); return; }
    setError(''); setLoading(true); setSaved(false);
    try {
      const updates = {};
      if (form.full_name.trim()) updates.full_name = form.full_name.trim();
      if (form.dob) updates.dob = form.dob;
      if (form.email.trim()) updates.email = form.email.trim().toLowerCase();
      if (form.phone.trim()) updates.phone = form.phone.trim();
      if (!Object.keys(updates).length) {
        setError('Add at least one detail to update.'); setLoading(false); return;
      }
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('crn', crn).maybeSingle();
      if (existing?.id) {
        await supabase.from('profiles').update(updates).eq('id', existing.id);
      } else {
        await supabase.from('profiles').insert([{ crn, role: 'user', ...updates }]);
      }
      const legacyUpdate = {};
      if (updates.full_name) legacyUpdate.name = updates.full_name;
      if (updates.email) legacyUpdate.email = updates.email;
      if (updates.phone) legacyUpdate.phone = updates.phone;
      if (Object.keys(legacyUpdate).length) {
        await supabase.from('clients_1777020684735').update(legacyUpdate).eq('crn', crn);
      }
      try {
        await recordAgreementAudit({ crn, action: AUDIT_ACTIONS.PROFILE_UPDATED });
      } catch (_) { /* noop */ }
      setSaved(true);
    } catch (err) {
      setError(err?.message || 'Could not save your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Complete Your Verification Details" subtitle="Add details as you're comfortable. Every field strengthens identity verification when your clinician prepares a clinical report.">
      <div className="ac-stack">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--ac-bg)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${completeness}%`, height: '100%', background: 'var(--ac-primary)', transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-muted)' }}>{completeness}% complete</div>
        </div>
        <Field label="Your CRN *" hint="Required so we know which record to update.">
          <Input
            value={form.crn}
            onChange={e => setForm({ ...form, crn: e.target.value })}
            onBlur={lookup}
            placeholder="CRN-XXXX-XXXX"
            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
          />
        </Field>
        <Field label="Full Name"><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Given and family name" /></Field>
        <Field label="Date of Birth" hint="Used to verify your identity at clinical contact."><Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></Field>
        <Field label="Phone"><Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 4XX XXX XXX" /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
        {error && <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', padding: '8px 12px', borderRadius: 8, color: '#c62828', fontSize: 13 }}>{error}</div>}
        {saved && <div style={{ background: '#E8FAF0', border: '1px solid #B7E5C8', padding: '8px 12px', borderRadius: 8, color: '#1D8348', fontSize: 13 }}>Details saved against your record.</div>}
        <Button onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save Verification Details'}</Button>
      </div>
    </Card>
  );
};

/* ─── MY ACCOUNT TAB — magic link login for clients ─────────────── */
const MyAccountTab = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendLink = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (err) { setError(err.message); } else { setSent(true); }
  };

  if (sent) return (
    <Card>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Check your inbox</div>
        <div style={{ fontSize: 14, color: 'var(--ac-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          We sent a sign-in link to <strong>{email}</strong>.<br />
          Tap the link in the email to access your client portal.
        </div>
        <Button variant="outline" style={{ width: '100%' }} onClick={() => { setSent(false); setEmail(''); }}>
          Use a different email
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="ac-stack">
      <ProfileCompletionCard />
      <Card title="My Account" subtitle="Sign in to view your appointments, mood history, and resources.">
        <Field label="Email address">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={e => e.key === 'Enter' && handleSendLink()}
          />
        </Field>
        {error && (
          <div style={{ color: '#FF3B30', fontSize: 13, padding: '8px 12px', background: '#FFF0EE', borderRadius: 8 }}>{error}</div>
        )}
        <Button style={{ width: '100%' }} onClick={handleSendLink} disabled={loading}>
          {loading ? 'Sending…' : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <SafeIcon icon={FiMail} size={15} /> Send sign-in link
            </span>
          )}
        </Button>
        <p style={{ fontSize: 12, color: 'var(--ac-muted)', textAlign: 'center', marginTop: 4 }}>
          No password needed — we'll email you a magic link.
        </p>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <SafeIcon icon={FiShield} size={18} style={{ color: 'var(--ac-primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Your privacy is protected</div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.5 }}>
              Your sign-in link expires after one use. We never store passwords. Your health information is encrypted and only accessible by your care team.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CrisisDialog = ({ onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 300, padding: "0 0 20px" }}>
    <div style={{ background: "var(--ac-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px", width: "100%", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ width: 40, height: 4, background: "var(--ac-border)", borderRadius: 999, margin: "0 auto 20px" }} />
      <div style={{ fontSize: 24, textAlign: "center", marginBottom: 8 }}>💙</div>
      <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>Support is here for you</div>
      <p style={{ fontSize: 14, color: "var(--ac-muted)", textAlign: "center", marginBottom: 20 }}>You don't have to do this alone.</p>
      <a href="tel:131114" style={{ display: "block", background: "#007AFF", color: "#fff", padding: "14px", borderRadius: 12, textAlign: "center", textDecoration: "none", fontWeight: 700, marginBottom: 10 }}>Call Lifeline 13 11 14</a>
      <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", padding: "14px", cursor: "pointer", fontSize: 15, color: "var(--ac-muted)" }}>I'm okay for now</button>
    </div>
  </div>
);

/* ─── CHECK-IN PAGE WITH SPONSOR BANNER + COOKIE CONSENT ───────── */
export const CheckInPage = ({ goto, onLoginIntent }) => {
  const [tab, setTab] = useState("checkin");
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [form, setForm] = useState({ code: "", concerns: "", mood: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [sponsor, setSponsor] = useState(null);
  const [submittedCRN, setSubmittedCRN] = useState('');

  const days = ["Today", "Tomorrow", "Wed 25", "Thu 26", "Fri 27", "Sat 28", "Sun 29"];
  const windows = [{ label: "Morning", time: "9am – 12pm", icon: "☀️" }, { label: "Afternoon", time: "12pm – 5pm", icon: "🌤" }, { label: "Evening", time: "5pm – 8pm", icon: "🌙" }];

  useEffect(() => {
    supabase.from('sponsors_1777090009').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) setSponsor(data); })
      .catch(() => {});
  }, []);

  const bannerTextColor = sponsor ? getBannerTextColor(sponsor.color) : '#ffffff';
  const logoSrc = sponsor?.logo_data || sponsor?.logo_url || null;

  const handleConcerns = (val) => {
    setForm(f => ({ ...f, concerns: val }));
    if (/\b(kill|hurt)\s+(myself|me)\b|\bsuicid/i.test(val)) setCrisisOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code) { alert("Please enter your CRN."); return; }
    if (selectedWindow === null) { alert("Please select a time window."); return; }
    setSubmitting(true);
    try {
      const crn = form.code.trim().toUpperCase();
      const { data: crnData, error: crnError } = await supabase.from('crns_1740395000').select('*').eq('code', crn).eq('is_active', true).single();
      if (crnError || !crnData) { alert("Invalid or inactive CRN. Please verify with your clinic."); return; }
      const { error } = await supabase.from('check_ins_1740395000').insert([{ crn, concerns: form.concerns, mood: form.mood, scheduled_day: days[selectedDay], scheduled_window: windows[selectedWindow].label, status: 'pending' }]);
      if (error) throw error;
      const { data: clientRow } = await supabase.from('clients_1777020684735').select('id').eq('crn', crn).maybeSingle();
      const profileId = clientRow?.id || null;
      await recordAgreementAudit({ profileId, crn, action: AUDIT_ACTIONS.CHECK_IN_SUBMITTED });
      await recordAgreementAudit({ profileId, crn, action: AUDIT_ACTIONS.MOOD_SUBMITTED });
      if (form.concerns?.trim()) {
        await recordAgreementAudit({ profileId, crn, action: AUDIT_ACTIONS.CONCERN_SUBMITTED });
      }
      await recordAgreementAudit({ profileId, crn, action: AUDIT_ACTIONS.CALL_WINDOW_UPDATED });
      setSubmittedCRN(crn);
      setConfirmed(true);
    } catch { alert("Failed to submit check-in. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (confirmed) return (
    <div className="ac-stack">
      <Card>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 50, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You're all set</div>
          <div style={{ fontSize: 14, color: "var(--ac-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Your clinician will call on <strong>{days[selectedDay]}</strong>, during the <strong>{windows[selectedWindow]?.label}</strong> window ({windows[selectedWindow]?.time})
          </div>
          <div style={{ background: "var(--ac-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "var(--ac-muted)", marginBottom: 3 }}>Save this number in your contacts</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#007AFF" }}>(02) 9515 9000</div>
          </div>
          <Button variant="outline" style={{ width: "100%" }} onClick={() => { setConfirmed(false); setStep(1); }}>Change time</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="ac-stack" style={{ position: 'relative', overflow: 'hidden', paddingBottom: 120 }}>

      {/* ANIMATED SPONSOR RIBBON BANNER (Top Right) */}
      {sponsor && (
        <>
          <style>{`
            @keyframes sponsor-wave {
              0%, 100% { transform: rotate(45deg) translateY(0px); box-shadow: 0 4px 16px rgba(0,0,0,0.18); }
              50% { transform: rotate(45deg) translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
            }
            .ac-sponsor-ribbon {
              animation: sponsor-wave 3s ease-in-out infinite;
            }
          `}</style>
          <div className="ac-sponsor-ribbon" style={{
            position: 'absolute', top: 18, right: -52,
            background: sponsor.color, color: bannerTextColor,
            padding: '5px 64px', zIndex: 100,
            width: 220, transform: 'rotate(45deg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            pointerEvents: 'none', overflow: 'hidden'
          }}>
            {logoSrc && (
              <img src={logoSrc} alt="logo" style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 3, background: 'rgba(255,255,255,0.25)', padding: 1, flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
              <span style={{ fontSize: 7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, opacity: 0.85 }}>Supported by</span>
              <span style={{ fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' }}>{sponsor.company_name}</span>
            </div>
          </div>
        </>
      )}

      <div style={{ fontSize: 20, fontWeight: 700 }}>Client Check-In</div>
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "checkin", label: "Check-In" }, { id: "crn_request", label: "Get CRN" }, { id: "location", label: "Location" }, { id: "resources", label: "Resources" }, { id: "my_account", label: "My Account" }]} />

      {tab === "checkin" && (
        <div className="ac-stack">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Step {step} of 3</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{Math.round((step / 3) * 100)}%</span>
            </div>
            <ProgressBar value={(step / 3) * 100} />
          </div>

          {step === 1 && (
            <Card title="Client Verification">
              <Field label="Client Reference Number (CRN)" hint="Enter the unique code provided by your clinic.">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g., CRN-XXXX-XXXX" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </Field>
              <Field label="Is there anything you'd like to share right away?">
                <Textarea value={form.concerns} onChange={e => handleConcerns(e.target.value)} placeholder="Optional: Share any immediate concerns or updates" />
              </Field>
              <Button style={{ width: "100%", marginTop: 12 }} onClick={() => setStep(2)}>Continue</Button>
              <AgreementNotice action="continue" />
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ac-muted)', marginTop: 12 }}>
                Don't have a CRN? <button onClick={() => setTab('crn_request')} style={{ background: 'none', border: 'none', color: 'var(--ac-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Request one here →</button>
              </p>
            </Card>
          )}

          {step === 2 && (
            <Card title="How are you feeling today?" subtitle="Select the emoji that best describes your current state.">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, marginBottom: 12 }}>
                {["😔", "😟", "😐", "🙂", "😄"].map((e, i) => <span key={i}>{e}</span>)}
              </div>
              <input type="range" min={0} max={10} value={form.mood} onChange={e => setForm(f => ({ ...f, mood: +e.target.value }))} style={{ width: '100%', accentColor: 'var(--ac-primary)', height: '4px', margin: '12px 0' }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: form.mood <= 2 ? "#FF3B30" : form.mood <= 4 ? "#FF9500" : form.mood <= 6 ? "#FFCC00" : "#34C759" }}>{form.mood}</span>
                <span style={{ fontSize: 16, color: "var(--ac-muted)" }}> / 10</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
                <Button style={{ flex: 2 }} onClick={() => setStep(3)}>Continue</Button>
              </div>
              <AgreementNotice action="mood" />
            </Card>
          )}

          {step === 3 && (
            <div className="ac-stack">
              <div style={{ fontSize: 17, fontWeight: 700 }}>Pick a window that works for you</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                {days.map((d, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)} className={cx("ac-tab", selectedDay === i && "ac-tab-active")} style={{ flexShrink: 0, padding: "8px 14px", border: '1px solid var(--ac-border)' }}>{d}</button>
                ))}
              </div>
              <div className="ac-stack" style={{ gap: 10 }}>
                {windows.map((w, i) => (
                  <button key={i} onClick={() => setSelectedWindow(i)} style={{ padding: "16px", borderRadius: 14, border: selectedWindow === i ? "2px solid #007AFF" : "1px solid var(--ac-border)", background: selectedWindow === i ? "#EBF5FF" : "var(--ac-surface)", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 26 }}>{w.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{w.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ac-muted)" }}>{w.time}</div>
                    </div>
                    {selectedWindow === i && <span style={{ color: "#007AFF", fontSize: 20 }}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</Button>
                <Button disabled={selectedWindow === null || submitting} style={{ flex: 2 }} onClick={handleSubmit}>
                  {submitting ? "Submitting..." : "Confirm Window"}
                </Button>
              </div>
              <AgreementNotice action="check_in_submit" />
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid var(--ac-border)', margin: '20px 0' }} />
            <p className="ac-muted ac-xs" style={{ marginBottom: 12 }}>Authorized Personnel Access</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button variant="outline" size="sm" onClick={() => onLoginIntent('admin')}>Admin Login</Button>
              <Button variant="outline" size="sm" onClick={() => onLoginIntent('sysadmin')}>Sys Admin Login</Button>
            </div>
          </div>

          {/* SPONSOR FOOTER CARD (Below check-in) */}
          {sponsor && (
            <div style={{
              background: `linear-gradient(135deg, ${sponsor.color}18, ${sponsor.color}06)`,
              border: `1px solid ${sponsor.color}35`,
              borderLeft: `4px solid ${sponsor.color}`,
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              marginTop: 20
            }}>
              {logoSrc && (
                <img src={logoSrc} alt={sponsor.company_name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Platform Sponsor</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: sponsor.color }}>{sponsor.company_name}</div>
                <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Supporting mental health in our community</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "crn_request" && <CRNRequestPage goto={goto} />}
      {tab === "location" && <LocationInfoView />}
      {tab === "resources" && <ResourcesView />}
      {tab === "my_account" && <MyAccountTab />}

      <CookieConsentBanner />

      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--ac-surface)", borderTop: "1px solid var(--ac-border)", padding: "10px 16px 20px", textAlign: "center", fontSize: 13, color: "var(--ac-muted)", zIndex: 50 }}>
        Need help? <a href="tel:131114" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Lifeline 13 11 14</a> · <a href="tel:000" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Emergency 000</a>
      </footer>

      {crisisOpen && <CrisisDialog onClose={() => setCrisisOpen(false)} />}
    </div>
  );
};

export default CheckInPage;

import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { ProgressBar, Button, Field, Input } from '../../components/UI';

const { FiCreditCard, FiTrendingUp, FiUsers, FiGlobe, FiShield, FiZap, FiHeart, FiAward, FiCheck, FiArrowRight, FiStar, FiImage, FiUpload } = FiIcons;

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

/* ─── LOGO UPLOAD COMPONENT ─────────────────────────────────────── */
const LogoUploader = ({ value, onChange }) => {
  const inputRef = React.useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Logo must be under 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      <div
        onClick={() => inputRef.current.click()}
        style={{
          border: value ? '2px solid var(--ac-primary)' : '2px dashed var(--ac-border)',
          borderRadius: 12, padding: 16, cursor: 'pointer',
          textAlign: 'center', background: 'var(--ac-bg)',
          transition: 'all 0.2s', minHeight: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
        }}
      >
        {value ? (
          <>
            <img src={value} alt="logo preview" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ac-primary)' }}>Logo uploaded ✓</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Click to change</div>
            </div>
          </>
        ) : (
          <>
            <SafeIcon icon={FiUpload} size={22} style={{ color: 'var(--ac-muted)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Upload Company Logo</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>PNG, JPG, SVG · Max 500KB</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── SPONSOR JOIN PAGE (AppSumo-style landing) ─────────────────── */
export const SponsorJoinPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ company: "", email: "", color: "#007AFF", logoData: "" });

  const textColor = getBannerTextColor(form.color);

  const handleJoin = async () => {
    if (!form.company || !form.email) { alert('Please fill in company name and email.'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('sponsors_1777090009').insert([{
        company_name: form.company,
        email: form.email,
        color: form.color,
        logo_url: form.logoData || null,
        logo_data: form.logoData || null,
        is_active: true
      }]);
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      alert("Failed to activate sponsorship. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>You're Live!</h2>
      <p style={{ color: 'var(--ac-muted)', fontSize: 16, marginBottom: 32 }}>
        <strong>{form.company}</strong>'s banner is now active on the Acute Connect check-in platform.
      </p>
      <Button onClick={() => { setSuccess(false); setStep(1); setShowForm(false); setForm({ company: "", email: "", color: "#007AFF", logoData: "" }); }}>
        Done
      </Button>
    </div>
  );

  const FEATURES = [
    { icon: FiUsers, title: "500+ Monthly Active Patients", desc: "Direct exposure to people actively seeking mental health support." },
    { icon: FiGlobe, title: "Corner Banner Placement", desc: "Animated branded banner shown on every client check-in session." },
    { icon: FiTrendingUp, title: "Footer Brand Presence", desc: "Persistent logo and name in the platform footer across all views." },
    { icon: FiShield, title: "Trusted Health Context", desc: "Align your brand with trusted community mental health services." },
    { icon: FiZap, title: "Instant Activation", desc: "Your banner goes live immediately after payment confirmation." },
    { icon: FiHeart, title: "Community Impact", desc: "Support vulnerable Australians while growing your brand." },
  ];

  const TESTIMONIALS = [
    { name: "Mia Chen", role: "Marketing Director, WellnessFirst", text: "The exposure was incredible. Patients actually engaged with our brand in a meaningful context." },
    { name: "James Park", role: "CEO, ClearMind Health", text: "Best ROI of any digital health advertising we've done. Highly targeted, relevant audience." },
    { name: "Sarah O'Brien", role: "Partnerships Lead, MindBridge", text: "The animated banner is beautiful and the platform team made setup effortless." },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── HERO ── */}
      <div style={{ textAlign: 'center', padding: '40px 20px 32px', background: 'linear-gradient(135deg, var(--ac-primary-soft) 0%, var(--ac-bg) 100%)', borderRadius: 20, marginBottom: 32, border: '1px solid var(--ac-border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ac-primary)', color: '#fff', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
          <SafeIcon icon={FiAward} size={12} /> LIMITED SPONSOR SPOTS AVAILABLE
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>
          Reach <span style={{ color: 'var(--ac-primary)' }}>500+ Mental Health</span><br />Patients Every Month
        </h1>
        <p style={{ color: 'var(--ac-muted)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
          Become a platform sponsor on Acute Connect — the trusted digital check-in tool used by Camperdown Acute Care Services. Your brand, their recovery journey.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => setShowForm(true)} style={{ padding: '14px 28px', fontSize: 16 }}>
            Become a Sponsor — $15,000
          </Button>
          <Button variant="outline" style={{ padding: '14px 28px', fontSize: 16 }}>
            Learn More ↓
          </Button>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          {[['500+', 'Monthly Users'], ['2 Weeks', 'Placement'], ['100%', 'Brand Safe'], ['Live', 'Activation']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ac-primary)' }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHAT YOU GET ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>What's Included</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Everything you need to make an impact</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ac-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <SafeIcon icon={f.icon} size={18} style={{ color: 'var(--ac-primary)' }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BANNER PREVIEW ── */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Live Banner Preview</div>
        <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginBottom: 16 }}>This is how your brand will appear on the check-in screen.</div>
        <div style={{ position: 'relative', background: 'var(--ac-bg)', borderRadius: 12, padding: 20, overflow: 'hidden', minHeight: 80, border: '1px solid var(--ac-border)' }}>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Client Check-In</div>
          {/* Simulated banner ribbon */}
          <div style={{
            position: 'absolute', top: 10, right: -45, width: 180, padding: '5px 40px',
            background: form.color, color: textColor,
            transform: 'rotate(45deg)', fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', textTransform: 'uppercase', letterSpacing: 0.5
          }}>
            {form.logoData && <img src={form.logoData} alt="" style={{ width: 12, height: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.3)', borderRadius: 3, padding: 1 }} />}
            <span style={{ whiteSpace: 'nowrap' }}>{form.company || 'Your Brand'}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ac-muted)' }}>
            <span style={{ background: form.color + '20', color: form.color, padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
              Sponsored by {form.company || 'Your Company'}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Field label="Preview Colour">
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: 60, height: 36, padding: 2, borderRadius: 8, border: '1px solid var(--ac-border)', cursor: 'pointer' }} />
          </Field>
          <Field label="Preview Name">
            <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Your Company" style={{ maxWidth: 200 }} />
          </Field>
        </div>
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--ac-bg)', borderRadius: 8, fontSize: 11, color: 'var(--ac-muted)' }}>
          💡 <strong>Smart Contrast:</strong> Text colour auto-adjusts to <strong style={{ color: textColor === '#ffffff' ? 'var(--ac-primary)' : '#333' }}>{textColor === '#ffffff' ? 'white' : 'dark'}</strong> for maximum readability on your chosen background.
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Social Proof</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Sponsors love the results</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[...Array(5)].map((_, j) => <SafeIcon key={j} icon={FiStar} size={13} style={{ color: '#FFCC00' }} />)}
              </div>
              <p style={{ fontSize: 13, color: 'var(--ac-muted)', lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{t.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING CTA ── */}
      <div style={{ background: 'linear-gradient(135deg, var(--ac-primary), #5b5fc7)', borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 40, color: '#fff' }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>2-Week Sponsorship Package</div>
        <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 4 }}>$15,000</div>
        <div style={{ opacity: 0.85, fontSize: 14, marginBottom: 24 }}>One-time payment · Instant activation · Cancel anytime</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300, margin: '0 auto 24px' }}>
          {['Animated corner banner', 'Footer brand placement', 'Logo + company name', 'Smart contrast text', 'Instant live activation'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SafeIcon icon={FiCheck} size={11} style={{ color: '#fff' }} />
              </div>
              <span style={{ fontSize: 13 }}>{item}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: '#fff', color: 'var(--ac-primary)', border: 'none', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          Get Started Now <SafeIcon icon={FiArrowRight} size={16} />
        </button>
      </div>

      {/* ── SIGNUP MODAL ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 16 }}>
          <div style={{ background: 'var(--ac-surface)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Activate Sponsorship</div>
                <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>Step {step} of 2</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ac-muted)' }}>✕</button>
            </div>

            <ProgressBar value={step === 1 ? 50 : 100} />
            <div style={{ marginBottom: 20 }} />

            {step === 1 && (
              <div className="ac-stack">
                <Field label="Company Name *"><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" /></Field>
                <Field label="Contact Email *"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="contact@acme.com" /></Field>
                <Field label="Brand Colour">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: 52, height: 44, padding: 3, borderRadius: 8, border: '1px solid var(--ac-border)', cursor: 'pointer' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{form.color.toUpperCase()}</div>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>
                        Banner text will be <strong>{textColor === '#ffffff' ? 'white' : 'dark'}</strong> for best readability
                      </div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: textColor }}>Aa</div>
                  </div>
                </Field>
                <Field label="Company Logo *" hint="Required — shown on the banner alongside your name">
                  <LogoUploader value={form.logoData} onChange={v => setForm({ ...form, logoData: v })} />
                </Field>
                {/* Live mini preview */}
                {(form.company || form.logoData) && (
                  <div style={{ background: 'var(--ac-bg)', borderRadius: 10, padding: 12, border: '1px solid var(--ac-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 8 }}>Banner preview:</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: form.color, color: textColor, borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700 }}>
                      {form.logoData && <img src={form.logoData} alt="" style={{ width: 16, height: 16, objectFit: 'contain', background: 'rgba(255,255,255,0.2)', borderRadius: 3 }} />}
                      <span>{form.company || 'Your Brand'}</span>
                    </div>
                  </div>
                )}
                <Button style={{ width: '100%' }} onClick={() => { if (!form.company || !form.email) { alert('Please fill company name and email.'); return; } if (!form.logoData) { alert('Please upload your company logo.'); return; } setStep(2); }}>
                  Next: Payment →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="ac-stack">
                <div style={{ background: 'linear-gradient(135deg, var(--ac-primary-soft), var(--ac-bg))', border: '1px solid var(--ac-primary)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase', marginBottom: 4 }}>2-Week Sponsorship</div>
                  <div style={{ fontSize: 40, fontWeight: 900 }}>$15,000</div>
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 4 }}>Animated banner · Footer · Logo placement</div>
                  {form.logoData && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <img src={form.logoData} alt="" style={{ width: 28, height: 28, objectFit: 'contain', background: '#fff', borderRadius: 6, padding: 2 }} />
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{form.company}</span>
                    </div>
                  )}
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
                  <Button style={{ flex: 2 }} onClick={handleJoin} disabled={submitting}>{submitting ? "Processing..." : "Confirm & Go Live"}</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorJoinPage;

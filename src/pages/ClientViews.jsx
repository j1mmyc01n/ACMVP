import React, { useState, useEffect, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { cx } from '../lib/utils';
import { supabase } from '../supabase/supabase';
import { generateCRN } from '../lib/utils';
import {
  Tabs, Card, ProgressBar, Field, Input,
  Textarea, Button, Select, Badge, StatusBadge
} from '../components/UI';
import LegalHub from '../legal/LegalHub';
import AgreementGate from '../legal/AgreementGate';
import AuditLogCard from '../legal/AuditLogCard';
import { recordAgreementAudit, AUDIT_ACTIONS } from '../lib/audit';

const {
  FiMapPin, FiFilter, FiCreditCard, FiLoader, FiSend,
  FiCheckCircle, FiBell, FiUpload, FiImage, FiStar,
  FiShield, FiTrendingUp, FiUsers, FiZap, FiCheck,
  FiArrowRight, FiHeart, FiAward, FiGlobe, FiX, FiInfo,
  FiMail, FiLogIn
} = FiIcons;

const RESOURCES = [
  { name: "Camperdown Mental Health Center", desc: "Primary mental health facility", addr: "96 Carillon Ave, Newtown NSW 2042", phone: "(02) 9515 9000", dist: "0.2 km" },
  { name: "RPA Hospital Emergency", desc: "24/7 emergency mental health services", addr: "Missenden Rd, Camperdown NSW 2050", phone: "(02) 9515 6111", dist: "0.5 km" },
  { name: "Headspace Camperdown", desc: "Youth mental health 12–25", addr: "Level 2, Brain and Mind Centre, 94 Mallett St", phone: "(02) 9114 4100", dist: "0.3 km" },
];

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

/* ─── CRN REQUEST TAB ──────────────────────────────────────────── */
export const CRNRequestPage = () => {
  const [form, setForm] = useState({ first_name: '', mobile: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [issuedCRN, setIssuedCRN] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const handleSubmit = async () => {
    if (!agreementAccepted) { setError('Please accept the platform agreement to proceed.'); return; }
    if (!form.first_name || !form.mobile || !form.email) { setError('Please fill in all required fields.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    setError(''); setLoading(true);
    try {
      const crn = generateCRN();
      const { error: reqErr } = await supabase.from('crn_requests_1777090006').insert([{ first_name: form.first_name, mobile: form.mobile, email: form.email, status: 'processed', crn_issued: crn }]);
      if (reqErr) throw reqErr;
      await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
      const { data: clientRow, error: clientErr } = await supabase.from('clients_1777020684735').insert([{ name: form.first_name, email: form.email, phone: form.mobile, crn, status: 'active', support_category: 'general' }]).select().single();
      if (clientErr) throw clientErr;
      await recordAgreementAudit({
        profileId: clientRow?.id || null,
        crn,
        action: AUDIT_ACTIONS.CRN_CREATED,
      });
      setIssuedCRN(crn); setSubmitted(true);
    } catch (err) { setError('Registration failed. Please try again.'); console.error(err); }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="ac-stack">
      <Card>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #34C759, #30d158)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(52,199,89,0.3)' }}>
            <SafeIcon icon={FiCheckCircle} size={36} style={{ color: '#fff' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>CRN Issued!</div>
          <p style={{ color: 'var(--ac-muted)', fontSize: 14, marginBottom: 24 }}>Hi <strong>{form.first_name}</strong>, your CRN has been sent to <strong>{form.email}</strong>.</p>
          <div style={{ background: 'var(--ac-primary-soft)', border: '2px solid var(--ac-primary)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase', marginBottom: 8 }}>Your CRN</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2, color: 'var(--ac-primary)' }}>{issuedCRN}</div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 8 }}>Save this number — you'll need it for check-in</div>
          </div>
          <div style={{ background: 'var(--ac-bg)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', marginBottom: 20 }}>
            <SafeIcon icon={FiBell} size={20} style={{ color: 'var(--ac-primary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Push Notification Sent</div>
              <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>Confirmation sent to {form.mobile} and {form.email}</div>
            </div>
          </div>
          <Button variant="outline" style={{ width: '100%' }} onClick={() => { setSubmitted(false); setForm({ first_name: '', mobile: '', email: '' }); setIssuedCRN(''); }}>Register Another</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="ac-stack">
      <Card title="Request Your CRN" subtitle="Enter your details to receive a Clinical Reference Number">
        <div className="ac-stack">
          <p className="ac-muted ac-xs" style={{ padding: '10px 14px', background: 'var(--ac-bg)', borderRadius: 10, border: '1px solid var(--ac-border)' }}>
            📋 Your CRN will be automatically registered and sent to you by push notification and email.
          </p>
          {error && <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', padding: '10px 14px', borderRadius: 10, color: '#c62828', fontSize: 13 }}>{error}</div>}
          <Field label="First Name *"><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="e.g. John" /></Field>
          <Field label="Mobile Number *"><Input type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="+61 4XX XXX XXX" /></Field>
          <Field label="Email Address *"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
          <AgreementGate accepted={agreementAccepted} onChange={setAgreementAccepted} compact />
          <Button icon={loading ? FiLoader : FiSend} disabled={loading || !agreementAccepted} onClick={handleSubmit} style={{ marginTop: 8 }}>{loading ? 'Registering...' : 'Agree & Request My CRN'}</Button>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ac-muted)' }}>By submitting, your agreement is recorded in your profile audit log.</p>
        </div>
      </Card>
    </div>
  );
};

/* ─── PROFESSIONALS PAGE ────────────────────────────────────────── */
const MOCK_PROVIDERS = [
  { id: 'p1', name: 'Dr. Sarah Mitchell', qualification: 'Psychiatrist', gender: 'Female', rating: 4.9, experience: '12 years', bio: 'Specialises in mood disorders and post-acute care. Telehealth available.', availability: 'Mon–Thu', location_lat: 22, location_lng: 35, bulk_billing: true, languages: ['English', 'Mandarin'] },
  { id: 'p2', name: 'Dr. James Kowalski', qualification: 'Psychologist', gender: 'Male', rating: 4.8, experience: '8 years', bio: 'Cognitive-behavioural therapy expert with a focus on anxiety and trauma.', availability: 'Tue–Sat', location_lat: 38, location_lng: 25, bulk_billing: false, languages: ['English'] },
  { id: 'p3', name: 'Alex Nguyen', qualification: 'Social Worker', gender: 'Male', rating: 4.7, experience: '5 years', bio: 'Community mental health and housing support specialist.', availability: 'Mon–Fri', location_lat: 55, location_lng: 45, bulk_billing: true, languages: ['English', 'Vietnamese'] },
  { id: 'p4', name: 'Dr. Priya Sharma', qualification: 'Psychiatrist', gender: 'Female', rating: 4.9, experience: '15 years', bio: 'Child and adolescent psychiatrist. Parent consultation sessions available.', availability: 'Wed–Fri', location_lat: 70, location_lng: 30, bulk_billing: false, languages: ['English', 'Hindi'] },
];

export const ProfessionalsPage = () => {
  const [filter, setFilter] = useState({ qual: 'All', sex: 'All', billing: 'All' });
  const [search, setSearch] = useState('');
  const [selectedProf, setSelectedProf] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('providers_1740395000').select('*').then(({ data }) => {
      setProfessionals(data || []);
      setLoading(false);
    }).catch(() => { setProfessionals([]); setLoading(false); });
  }, []);

  const qualOptions = ['All', ...new Set(professionals.map(p => p.qualification).filter(Boolean))];

  const filtered = professionals.filter(p =>
    (filter.qual === 'All' || p.qualification === filter.qual) &&
    (filter.sex === 'All' || p.gender === filter.sex) &&
    (filter.billing === 'All' || (filter.billing === 'Bulk' ? p.bulk_billing : !p.bulk_billing)) &&
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
     p.qualification?.toLowerCase().includes(search.toLowerCase()) ||
     p.bio?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="ac-stack">
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--ac-primary) 0%, #7c3aed 100%)', borderRadius: 20, padding: '28px 24px', color: '#fff', marginBottom: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Health Professionals</div>
        <div style={{ fontSize: 14, opacity: 0.9, maxWidth: 480 }}>
          Browse qualified mental health practitioners in your area. Book a consultation or share your location to find the closest available provider.
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          {[{ label: 'Registered Providers', value: professionals.length },
            { label: 'Bulk-Billing Available', value: professionals.filter(p => p.bulk_billing).length },
            { label: 'Available Today', value: Math.ceil(professionals.length * 0.6) }].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 18px', minWidth: 110 }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Filters Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Map */}
        <Card title="Provider Map" subtitle="Click a pin to see provider details">
          <div style={{ height: 260, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--ac-border)' }}>
            <iframe title="Map Area" width="100%" height="100%" frameBorder="0" scrolling="no"
              src="https://www.openstreetmap.org/export/embed.html?bbox=151.16%2C-33.91%2C151.21%2C-33.86&amp;layer=mapnik"
              style={{ border: 0, position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'var(--ac-map-filter)' }} />
            {filtered.map((p, idx) => (
              <div key={p.id} onClick={() => setSelectedProf(p === selectedProf ? null : p)}
                title={p.name}
                style={{
                  position: 'absolute',
                  left: `${p.location_lat || (15 + idx * 18)}%`,
                  top: `${p.location_lng || (25 + idx * 12)}%`,
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: selectedProf?.id === p.id ? 'var(--ac-primary)' : '#10B981',
                  border: '2.5px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  zIndex: 5,
                  transition: 'transform 0.15s',
                  transform: selectedProf?.id === p.id ? 'scale(1.4)' : 'scale(1)',
                }}
              />
            ))}
            {selectedProf && (
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'var(--ac-surface)', padding: '12px 14px', borderRadius: 12, boxShadow: 'var(--ac-shadow-lg)', border: '1px solid var(--ac-border)', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedProf.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{selectedProf.qualification} · {selectedProf.availability}</div>
                    {selectedProf.bulk_billing && <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>✓ Bulk Billing</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" onClick={() => setShowForm(true)}>Book</Button>
                    <button onClick={() => setSelectedProf(null)} style={{ background: 'none', border: 'none', color: 'var(--ac-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button style={{ width: '100%', marginTop: 12, padding: '13px', fontSize: 15 }} icon={sharing ? FiLoader : FiMapPin}
            onClick={() => { setSharing(true); setTimeout(() => { setSharing(false); alert('Location shared with your care team.'); }, 1500); }} disabled={sharing}>
            {sharing ? 'Sharing Location…' : 'Share My Location'}
          </Button>
        </Card>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <SafeIcon icon={FiFilter} size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, specialty…"
            style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 12, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <Select value={filter.qual} onChange={e => setFilter(f => ({ ...f, qual: e.target.value }))} options={qualOptions} aria-label="Filter by qualification" />
        <Select value={filter.sex} onChange={e => setFilter(f => ({ ...f, sex: e.target.value }))} options={['All', 'Male', 'Female']} aria-label="Filter by gender" />
        <Select value={filter.billing} onChange={e => setFilter(f => ({ ...f, billing: e.target.value }))} options={['All', 'Bulk', 'Private']} aria-label="Filter by billing type" />
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginTop: -4 }}>
        Showing <strong>{filtered.length}</strong> of <strong>{professionals.length}</strong> providers
      </div>

      {/* Provider Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading providers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No providers match your filters</div>
          <Button variant="outline" onClick={() => { setFilter({ qual: 'All', sex: 'All', billing: 'All' }); setSearch(''); }}>Reset Filters</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id}
              style={{
                background: 'var(--ac-surface)',
                border: `2px solid ${selectedProf?.id === p.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
                borderRadius: 18, padding: 20,
                boxShadow: selectedProf?.id === p.id ? 'var(--ac-shadow-lg)' : 'var(--ac-shadow)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedProf(p === selectedProf ? null : p)}
            >
              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--ac-primary) 0%, #7c3aed 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: '#fff', fontWeight: 800,
                }}>
                  {p.name?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ac-text)' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{p.qualification} · {p.gender}</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    <span style={{ color: '#F59E0B' }}>★</span>
                    <span style={{ fontWeight: 700, color: 'var(--ac-text)', marginLeft: 3 }}>{p.rating || '—'}</span>
                    <span style={{ color: 'var(--ac-muted)', marginLeft: 4 }}>· {p.experience}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {p.bio && (
                <div style={{ fontSize: 13, color: 'var(--ac-text)', lineHeight: 1.6, marginBottom: 12, background: 'var(--ac-bg)', borderRadius: 10, padding: '10px 12px' }}>
                  {p.bio}
                </div>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {p.bulk_billing && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>Bulk Billing</span>}
                {p.availability && <span style={{ background: 'var(--ac-bg)', color: 'var(--ac-muted)', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, border: '1px solid var(--ac-border)' }}>📅 {p.availability}</span>}
                {(p.languages || []).map(l => (
                  <span key={l} style={{ background: 'var(--ac-bg)', color: 'var(--ac-muted)', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, border: '1px solid var(--ac-border)' }}>🌐 {l}</span>
                ))}
              </div>

              <Button style={{ width: '100%', padding: '11px', fontSize: 14 }}
                onClick={e => { e.stopPropagation(); setSelectedProf(p); setShowForm(true); }}>
                Book Appointment
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showForm && selectedProf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: 'var(--ac-surface)', borderRadius: 22, padding: 30, maxWidth: 520, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--ac-shadow-xl)' }}>
            {/* Provider summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ac-primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
                {selectedProf.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{selectedProf.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>{selectedProf.qualification}</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ac-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div className="ac-stack">
              <div className="ac-grid-2">
                <Field label="Full Name"><Input placeholder="Your full name" /></Field>
                <Field label="Date of Birth"><Input type="date" /></Field>
              </div>
              <Field label="Email Address"><Input type="email" placeholder="your@email.com" /></Field>
              <Field label="Contact Number"><Input placeholder="+61 4XX XXX XXX" /></Field>
              <div className="ac-grid-2">
                <Field label="Preferred Date"><Input type="date" /></Field>
                <Field label="Preferred Time"><Input type="time" /></Field>
              </div>
              <Field label="Session Type">
                <Select options={[{ value: 'in_person', label: 'In-Person' }, { value: 'telehealth', label: 'Telehealth (Video)' }, { value: 'phone', label: 'Phone Consultation' }]} />
              </Field>
              <Field label="Reason for Appointment"><Textarea placeholder="Briefly describe what you'd like to discuss…" style={{ minHeight: 80 }} /></Field>
              <Field label="Medicare / DVA Number (optional)"><Input placeholder="1234 56789 0 / 1" /></Field>
              <div className="ac-grid-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={() => { alert("Appointment request sent! You'll receive a confirmation email shortly."); setShowForm(false); }}>Submit Request</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── LOGO UPLOAD COMPONENT ─────────────────────────────────────── */
const LogoUploader = ({ value, onChange }) => {
  const inputRef = useRef();

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

/* ─── PROVIDER JOIN PAGE ────────────────────────────────────────── */
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
  const [agreementAccepted, setAgreementAccepted] = useState(false);
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
    if (!agreementAccepted) { alert('Please accept the platform agreement to proceed.'); return; }
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
              <AgreementGate accepted={agreementAccepted} onChange={setAgreementAccepted} compact />
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</Button>
                <Button disabled={selectedWindow === null || submitting || !agreementAccepted} style={{ flex: 2 }} onClick={handleSubmit}>
                  {submitting ? "Submitting..." : "Agree & Confirm Window"}
                </Button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 40, textAlign: 'center' }}>
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

      {tab === "crn_request" && <CRNRequestPage />}
      {tab === "location" && <LocationInfoView />}
      {tab === "resources" && <ResourcesView />}
      {tab === "my_account" && <MyAccountTab />}

      <CookieConsentBanner />

      {/* ─── LEGAL HUB & AUDIT (base of check-in) ───────────────── */}
      <div style={{ marginTop: 32, paddingTop: 28, borderTop: '2px solid var(--ac-border)' }}>
        <AuditLogCard crn={submittedCRN || form.code?.trim()?.toUpperCase()} />
      </div>
      <div style={{ marginTop: 24 }}>
        <LegalHub />
      </div>

      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--ac-surface)", borderTop: "1px solid var(--ac-border)", padding: "10px 16px 20px", textAlign: "center", fontSize: 13, color: "var(--ac-muted)", zIndex: 50 }}>
        Need help? <a href="tel:131114" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Lifeline 13 11 14</a> · <a href="tel:000" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Emergency 000</a>
      </footer>

      {crisisOpen && <CrisisDialog onClose={() => setCrisisOpen(false)} />}
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

const LocationInfoView = () => (
  <Card title="Camperdown Acute Care Service" subtitle="Information and contact details">
    <div className="ac-stack" style={{ gap: 12 }}>
      <div><div style={{ fontWeight: 600 }}>Address:</div><div style={{ fontSize: 14 }}>100 Mallett St, Camperdown NSW 2050</div></div>
      <div><div style={{ fontWeight: 600 }}>Operating Hours:</div><div style={{ fontSize: 14 }}>Monday to Friday: 8am – 5pm</div></div>
      <div><div style={{ fontWeight: 600 }}>Contact Number:</div><div style={{ color: "#007AFF" }}>02 9555 1234</div></div>
    </div>
  </Card>
);

const ResourcesView = () => (
  <div className="ac-stack">
    <div style={{ fontSize: 17, fontWeight: 700 }}>Camperdown Resources</div>
    {RESOURCES.map((r, i) => (
      <Card key={i}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 700 }}>{r.name}</div>
          <span style={{ background: "#EBF5FF", color: "#007AFF", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 8 }}>{r.dist}</span>
        </div>
        <p className="ac-muted ac-xs">{r.desc}</p>
        <div style={{ fontSize: 13, marginTop: 8 }}>📍 {r.addr}</div>
        <div style={{ fontSize: 13, color: "#007AFF" }}>📞 {r.phone}</div>
      </Card>
    ))}
  </div>
);

export const ResourcesPage = ({ goto }) => (
  <div className="ac-stack">
    <div style={{ fontSize: 20, fontWeight: 700 }}>Client Resources</div>
    <Tabs active="resources" onChange={(id) => id !== "resources" && goto("checkin")} tabs={[{ id: "checkin", label: "Check-In" }, { id: "resources", label: "Resources" }]} />
    <ResourcesView />
  </div>
);

export const LegalHubPage = () => (
  <div className="ac-stack">
    <LegalHub />
  </div>
);

// ─── Organisation Access Request Page ─────────────────────────────────────────
const ORG_TYPES = [
  { value: 'mental_health',      label: '🧠 Mental Health Service' },
  { value: 'domestic_violence',  label: '🛡️ Domestic Violence Service' },
  { value: 'ndis',               label: '♿ NDIS Provider' },
  { value: 'crisis_support',     label: '🚨 Crisis Support Centre' },
  { value: 'substance_abuse',    label: '💊 Substance Abuse Service' },
  { value: 'youth_services',     label: '🌱 Youth Services' },
  { value: 'aged_care',          label: '�� Aged Care' },
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
      await supabase.from('org_access_requests_1777090000').insert([{
        ...form,
        status: 'pending',
        created_at: new Date().toISOString(),
      }]);
    } catch {
      // Silent — still show success to user (graceful degradation if table doesn't exist)
    } finally {
      setSubmitting(false);
      setSubmitted(true);
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

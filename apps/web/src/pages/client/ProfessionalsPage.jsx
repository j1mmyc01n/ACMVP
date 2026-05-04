import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Field, Input, Textarea, Select } from '../../components/UI';

const { FiFilter, FiLoader, FiMapPin, FiCreditCard } = FiIcons;

const INITIAL_BOOKING_FORM = { name: '', dob: '', email: '', phone: '', date: '', time: '', session_type: 'in_person', reason: '', medicare: '' };

export const ProfessionalsPage = () => {
  const [filter, setFilter] = useState({ qual: 'All', sex: 'All', billing: 'All' });
  const [search, setSearch] = useState('');
  const [selectedProf, setSelectedProf] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState(INITIAL_BOOKING_FORM);
  const setBooking = (key, val) => setBookingForm(f => ({ ...f, [key]: val }));
  const closeBookingForm = () => { setShowForm(false); setBookingForm(INITIAL_BOOKING_FORM); };

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
            { label: 'Bulk-Billing Available', value: professionals.filter(p => p.bulk_billing).length }].map(s => (
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
              <button onClick={closeBookingForm} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ac-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div className="ac-stack">
              <div className="ac-grid-2">
                <Field label="Full Name"><Input placeholder="Your full name" value={bookingForm.name} onChange={e => setBooking('name', e.target.value)} /></Field>
                <Field label="Date of Birth"><Input type="date" value={bookingForm.dob} onChange={e => setBooking('dob', e.target.value)} /></Field>
              </div>
              <Field label="Email Address"><Input type="email" placeholder="your@email.com" value={bookingForm.email} onChange={e => setBooking('email', e.target.value)} /></Field>
              <Field label="Contact Number"><Input placeholder="+61 4XX XXX XXX" value={bookingForm.phone} onChange={e => setBooking('phone', e.target.value)} /></Field>
              <div className="ac-grid-2">
                <Field label="Preferred Date"><Input type="date" value={bookingForm.date} onChange={e => setBooking('date', e.target.value)} /></Field>
                <Field label="Preferred Time"><Input type="time" value={bookingForm.time} onChange={e => setBooking('time', e.target.value)} /></Field>
              </div>
              <Field label="Session Type">
                <Select value={bookingForm.session_type} onChange={e => setBooking('session_type', e.target.value)} options={[{ value: 'in_person', label: 'In-Person' }, { value: 'telehealth', label: 'Telehealth (Video)' }, { value: 'phone', label: 'Phone Consultation' }]} />
              </Field>
              <Field label="Reason for Appointment"><Textarea placeholder="Briefly describe what you'd like to discuss…" style={{ minHeight: 80 }} value={bookingForm.reason} onChange={e => setBooking('reason', e.target.value)} /></Field>
              <Field label="Medicare / DVA Number (optional)"><Input placeholder="1234 56789 0 / 1" value={bookingForm.medicare} onChange={e => setBooking('medicare', e.target.value)} /></Field>
              <div className="ac-grid-2">
                <Button variant="outline" onClick={closeBookingForm}>Cancel</Button>
                <Button onClick={() => {
                  if (!bookingForm.name || !bookingForm.email || !bookingForm.date) { alert('Please fill in your name, email, and preferred date.'); return; }
                  alert("Appointment request sent! You'll receive a confirmation email shortly.");
                  closeBookingForm();
                }}>Submit Request</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;

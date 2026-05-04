import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiVideo, FiDollarSign, FiShield, FiClock, FiCheckCircle } = FiIcons;

const badgeStyle = (color) => ({
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 20,
  ...color,
});

const pill = {
  background: 'var(--ac-bg)',
  border: '1px solid var(--ac-border)',
  borderRadius: 20,
  padding: '3px 9px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ac-muted)',
};

function InsuranceBadge({ expiry }) {
  if (!expiry) return <span style={badgeStyle({ background: '#F3F4F6', color: '#6B7280' })}>Insured (Pending)</span>;
  const today = new Date();
  const exp = new Date(expiry);
  const daysLeft = Math.floor((exp - today) / 86400000);
  if (daysLeft < 0) return <span style={badgeStyle({ background: '#FEE2E2', color: '#991B1B' })}>Insurance Expired</span>;
  if (daysLeft <= 30) return <span style={badgeStyle({ background: '#FEF3C7', color: '#92400E' })}>Insured (Exp. soon)</span>;
  return <span style={badgeStyle({ background: '#D1FAE5', color: '#065F46' })}>✓ Insured</span>;
}

function Stars({ rating }) {
  const n = Math.round(rating || 0);
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= n ? '#F59E0B' : '#D1D5DB', fontSize: 13 }}>★</span>
      ))}
    </span>
  );
}

const ProviderCard = ({ provider: p, userRole, onViewProfile, onBook, onRefer }) => {
  const isStaff = userRole === 'clinician' || userRole === 'admin' || userRole === 'sysadmin';

  const acceptingBadge = () => {
    if (p.accepting_patients && p.wait_time !== '1 month+') {
      return <span style={badgeStyle({ background: '#D1FAE5', color: '#065F46' })}>✓ Accepting New Patients</span>;
    }
    if (p.wait_time === '1 month+') {
      return <span style={badgeStyle({ background: '#FEF3C7', color: '#92400E' })}>Waitlist Only</span>;
    }
    return <span style={badgeStyle({ background: '#F3F4F6', color: '#6B7280' })}>Not Accepting</span>;
  };

  const services = p.services_offered || [];
  const shown = services.slice(0, 4);
  const extra = services.length - 4;

  const suburb = p.practice_address?.suburb || '';
  const state = p.practice_address?.state || '';
  const locationLine = [p.practice_name, [suburb, state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

  const langs = (p.languages || []).join(', ');

  const bookButton = () => {
    if (p.booking_url) {
      return (
        <a href={p.booking_url} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, textDecoration: 'none', display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'var(--ac-primary)', color: '#fff', fontWeight: 700, fontSize: 14 }}>
          Book Now
        </a>
      );
    }
    if (p.booking_embed) {
      return (
        <button onClick={() => onBook && onBook(p)}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--ac-primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          Book Now
        </button>
      );
    }
    if (p.booking_type === 'phone' && p.booking_phone) {
      return (
        <a href={`tel:${p.booking_phone}`}
          style={{ flex: 1, textDecoration: 'none', display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'var(--ac-primary)', color: '#fff', fontWeight: 700, fontSize: 14 }}>
          Call to Book
        </a>
      );
    }
    return (
      <button onClick={() => onBook && onBook(p)}
        style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--ac-primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
        Book Now
      </button>
    );
  };

  return (
    <div style={{
      background: 'var(--ac-surface)',
      border: '1.5px solid var(--ac-border)',
      borderRadius: 18,
      padding: 20,
      boxShadow: 'var(--ac-shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Top section */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--ac-primary) 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#fff', fontWeight: 800,
        }}>
          {p.photo_url
            ? <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ac-text)' }}>{p.name}</span>
            {(p.ahpra_verified || p.abn_verified) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#DBEAFE', borderRadius: 20, padding: '1px 7px' }}>
                <SafeIcon icon={FiCheckCircle} size={10} /> Verified
              </span>
            )}
          </div>
          {p.provider_type && (
            <span style={{ ...pill, display: 'inline-block', marginTop: 4 }}>{p.provider_type}</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Stars rating={p.rating} />
            <span style={{ fontWeight: 700, fontSize: 12 }}>{p.rating ? p.rating.toFixed(1) : '—'}</span>
            {p.review_count > 0 && <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>({p.review_count})</span>}
          </div>
          <div style={{ marginTop: 4 }}>{acceptingBadge()}</div>
        </div>
      </div>

      {/* Middle section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {locationLine && (
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>{locationLine}</div>
        )}

        {shown.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {shown.map(s => <span key={s} style={pill}>{s}</span>)}
            {extra > 0 && <span style={pill}>+{extra} more</span>}
          </div>
        )}

        {langs && (
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Speaks: {langs}</div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {p.telehealth && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#1D4ED8' }}>
              <SafeIcon icon={FiVideo} size={13} /> Telehealth Available
            </span>
          )}
          {p.bulk_billing && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#065F46' }}>
              <SafeIcon icon={FiDollarSign} size={13} /> Bulk Billing
            </span>
          )}
          {p.ndis_number && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5B21B6' }}>
              <SafeIcon icon={FiShield} size={13} /> NDIS Registered
            </span>
          )}
          {p.wait_time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ac-muted)' }}>
              <SafeIcon icon={FiClock} size={13} /> {p.wait_time}
            </span>
          )}
        </div>
      </div>

      {/* Credential badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, borderTop: '1px solid var(--ac-border)', paddingTop: 10 }}>
        {p.ahpra_number
          ? (p.ahpra_verified
            ? <span style={badgeStyle({ background: '#D1FAE5', color: '#065F46' })}>✓ AHPRA</span>
            : <span style={badgeStyle({ background: '#F3F4F6', color: '#6B7280' })}>AHPRA (Pending)</span>)
          : null}
        {p.abn
          ? (p.abn_verified
            ? <span style={badgeStyle({ background: '#D1FAE5', color: '#065F46' })}>✓ ABN</span>
            : <span style={badgeStyle({ background: '#F3F4F6', color: '#6B7280' })}>ABN (Pending)</span>)
          : null}
        {p.ndis_number && (
          <span style={badgeStyle({ background: '#EDE9FE', color: '#5B21B6' })}>✓ NDIS</span>
        )}
        {p.medicare_provider_number && (
          <span style={badgeStyle({ background: '#F3F4F6', color: '#6B7280' })}>Medicare (Pending)</span>
        )}
        <InsuranceBadge expiry={p.insurance_expiry} />
      </div>

      {/* Bottom action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {bookButton()}
        <button onClick={() => onViewProfile && onViewProfile(p)}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'transparent', color: 'var(--ac-primary)', fontWeight: 700, fontSize: 14, border: '1.5px solid var(--ac-primary)', cursor: 'pointer' }}>
          View Profile
        </button>
      </div>
      {isStaff && (
        <button onClick={() => onRefer && onRefer(p)}
          style={{ width: '100%', padding: '9px 0', borderRadius: 10, background: 'var(--ac-bg)', color: 'var(--ac-text)', fontWeight: 600, fontSize: 13, border: '1px solid var(--ac-border)', cursor: 'pointer' }}>
          Refer a Patient
        </button>
      )}
    </div>
  );
};

export default ProviderCard;

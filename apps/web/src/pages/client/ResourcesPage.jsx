import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { Tabs, Card } from '../../components/UI';
import { supabase } from '../../supabase/supabase';

const { FiMapPin } = FiIcons;

// Fallback static resources used when DB returns no results
const RESOURCES = [
  { name: "Camperdown Mental Health Center", desc: "Primary mental health facility", addr: "96 Carillon Ave, Newtown NSW 2042", phone: "(02) 9515 9000", dist: "0.2 km" },
  { name: "RPA Hospital Emergency", desc: "24/7 emergency mental health services", addr: "Missenden Rd, Camperdown NSW 2050", phone: "(02) 9515 6111", dist: "0.5 km" },
  { name: "Headspace Camperdown", desc: "Youth mental health 12–25", addr: "Level 2, Brain and Mind Centre, 94 Mallett St", phone: "(02) 9114 4100", dist: "0.3 km" },
];

/* ─── Helper: Haversine distance (km) ─────────────────────────── */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SERVICE_TYPE_OPTIONS = [
  { value: '', label: 'All services' },
  { value: 'mental_health', label: '🧠 Mental health' },
  { value: 'crisis', label: '🚨 Crisis support' },
  { value: 'substance_abuse', label: '💊 Drug & alcohol' },
  { value: 'domestic_violence', label: '🛡️ Domestic violence' },
  { value: 'youth', label: '🌱 Youth services' },
  { value: 'aged_care', label: '👵 Aged care' },
  { value: 'housing', label: '🏠 Housing & homelessness' },
  { value: 'ndis', label: '♿ NDIS / disability' },
  { value: 'general', label: '📋 General support' },
];

export const LocationInfoView = () => {
  const [centres, setCentres] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [locError, setLocError] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('');
  const [loadingCentres, setLoadingCentres] = useState(true);

  useEffect(() => {
    supabase.from('care_centres_1777090000').select('*')
      .then(({ data }) => { setCentres(data || []); setLoadingCentres(false); });
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported by your browser.'); return; }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoadingLoc(false); },
      () => { setLocError('Location access denied. Showing all centres.'); setLoadingLoc(false); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const filtered = centres
    .filter(c => !serviceFilter || (Array.isArray(c.service_types) ? c.service_types.includes(serviceFilter) : (c.service_types || '').includes(serviceFilter)))
    .map(c => ({
      ...c,
      distance_km: (userLoc && c.lat && c.lng) ? haversineKm(userLoc.lat, userLoc.lng, c.lat, c.lng) : null,
    }))
    .sort((a, b) => {
      if (a.distance_km != null && b.distance_km != null) return a.distance_km - b.distance_km;
      if (a.distance_km != null) return -1;
      if (b.distance_km != null) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="ac-stack">
      {/* Geolocation & service filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={requestLocation}
          disabled={loadingLoc}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: userLoc ? '#ECFDF5' : 'var(--ac-surface)', color: userLoc ? '#065F46' : 'var(--ac-text)', fontSize: 13, fontWeight: 600, cursor: loadingLoc ? 'wait' : 'pointer' }}
        >
          <SafeIcon icon={FiMapPin} size={14} />
          {loadingLoc ? 'Locating…' : userLoc ? '📍 Location found' : 'Use My Location'}
        </button>
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          style={{ flex: 1, minWidth: 160, padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'inherit' }}
        >
          {SERVICE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {locError && <div style={{ fontSize: 12, color: 'var(--ac-muted)', padding: '6px 10px', background: 'var(--ac-bg)', borderRadius: 8 }}>{locError}</div>}

      {loadingCentres ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)' }}>Loading locations…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📍</div>
            <div style={{ fontWeight: 600 }}>No care centres found</div>
            <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginTop: 6 }}>
              {serviceFilter ? 'Try a different service type or clear the filter.' : 'No active care centres are available right now.'}
            </div>
          </div>
        </Card>
      ) : filtered.map((c, i) => (
        <Card key={c.id || i} title={c.name} subtitle={c.description || 'Care centre'}>
          <div className="ac-stack" style={{ gap: 10 }}>
            {c.distance_km != null && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EBF5FF', color: '#007AFF', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                <SafeIcon icon={FiMapPin} size={12} /> {c.distance_km < 1 ? `${Math.round(c.distance_km * 1000)} m` : `${c.distance_km.toFixed(1)} km`} away
              </div>
            )}
            {c.address && <div><div style={{ fontWeight: 600, fontSize: 13 }}>Address:</div><div style={{ fontSize: 14 }}>{c.address}</div></div>}
            {c.operating_hours && <div><div style={{ fontWeight: 600, fontSize: 13 }}>Hours:</div><div style={{ fontSize: 14 }}>{c.operating_hours}</div></div>}
            {c.phone && (
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>Contact:</div>
                <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{ color: '#007AFF', fontSize: 14 }}>{c.phone}</a>
              </div>
            )}
            {Array.isArray(c.service_types) && c.service_types.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.service_types.map(s => (
                  <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: 'var(--ac-bg)', color: 'var(--ac-text-secondary)', border: '1px solid var(--ac-border)' }}>
                    {SERVICE_TYPE_OPTIONS.find(o => o.value === s)?.label.replace(/^[^\s]+\s/, '') || s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Fallback: show static entry if DB has no centres */}
      {!loadingCentres && centres.length === 0 && (
        <Card title="Camperdown Acute Care Service" subtitle="Information and contact details">
          <div className="ac-stack" style={{ gap: 12 }}>
            <div><div style={{ fontWeight: 600 }}>Address:</div><div style={{ fontSize: 14 }}>100 Mallett St, Camperdown NSW 2050</div></div>
            <div><div style={{ fontWeight: 600 }}>Operating Hours:</div><div style={{ fontSize: 14 }}>Monday to Friday: 8am – 5pm</div></div>
            <div><div style={{ fontWeight: 600 }}>Contact Number:</div><div style={{ color: '#007AFF' }}>02 9555 1234</div></div>
          </div>
        </Card>
      )}
    </div>
  );
};

export const ResourcesView = ({ serviceFilter: externalFilter } = {}) => {
  const [centres, setCentres] = useState([]);
  const [serviceFilter, setServiceFilter] = useState(externalFilter || '');
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('care_centres_1777090000').select('*')
      .then(({ data }) => { setCentres(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      // 5-min cache is acceptable here: resources list doesn't need sub-minute accuracy
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const filtered = centres
    .filter(c => !serviceFilter || (Array.isArray(c.service_types) ? c.service_types.includes(serviceFilter) : (c.service_types || '').includes(serviceFilter)))
    .map(c => ({
      ...c,
      distance_km: (userLoc && c.lat && c.lng) ? haversineKm(userLoc.lat, userLoc.lng, c.lat, c.lng) : null,
    }))
    .sort((a, b) => {
      if (a.distance_km != null && b.distance_km != null) return a.distance_km - b.distance_km;
      return 0;
    });

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Nearby Resources</div>
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'inherit' }}
        >
          {SERVICE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)' }}>Loading resources…</div>
      ) : filtered.length > 0 ? (
        filtered.map((c, i) => (
          <Card key={c.id || i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              {c.distance_km != null && (
                <span style={{ background: '#EBF5FF', color: '#007AFF', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 8 }}>
                  {c.distance_km < 1 ? `${Math.round(c.distance_km * 1000)} m` : `${c.distance_km.toFixed(1)} km`}
                </span>
              )}
            </div>
            {c.description && <p className="ac-muted ac-xs">{c.description}</p>}
            {c.address && <div style={{ fontSize: 13, marginTop: 8 }}>📍 {c.address}</div>}
            {c.phone && <div style={{ fontSize: 13, color: '#007AFF' }}>📞 {c.phone}</div>}
            {Array.isArray(c.service_types) && c.service_types.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {c.service_types.map(s => (
                  <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: 'var(--ac-bg)', color: 'var(--ac-text-secondary)', border: '1px solid var(--ac-border)' }}>
                    {SERVICE_TYPE_OPTIONS.find(o => o.value === s)?.label.replace(/^[^\s]+\s/, '') || s}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))
      ) : (
        RESOURCES.map((r, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <span style={{ background: '#EBF5FF', color: '#007AFF', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 8 }}>{r.dist}</span>
            </div>
            <p className="ac-muted ac-xs">{r.desc}</p>
            <div style={{ fontSize: 13, marginTop: 8 }}>📍 {r.addr}</div>
            <div style={{ fontSize: 13, color: '#007AFF' }}>📞 {r.phone}</div>
          </Card>
        ))
      )}
    </div>
  );
};

export const ResourcesPage = ({ goto }) => (
  <div className="ac-stack">
    <div style={{ fontSize: 20, fontWeight: 700 }}>Client Resources</div>
    <Tabs active="resources" onChange={(id) => id !== "resources" && goto("checkin")} tabs={[{ id: "checkin", label: "Check-In" }, { id: "resources", label: "Resources" }]} />
    <ResourcesView />
  </div>
);

export default ResourcesPage;

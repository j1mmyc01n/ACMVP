import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const { FiRefreshCw, FiTarget, FiUsers, FiGlobe, FiMapPin, FiUser } = FiIcons;

export const ProviderMetricsPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('providers_1740395000')
        .select('*')
        .order('name');
      setProviders(!error && data ? data : []);
    } catch {
      setProviders([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = providers.filter(p =>
    !search ||
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.qualification || '').toLowerCase().includes(search.toLowerCase())
  );

  const total     = providers.length;
  const partners  = providers.filter(p => p.is_partner).length;
  const avgRating = total > 0
    ? (providers.reduce((s, p) => s + (parseFloat(p.rating) || 0), 0) / total).toFixed(1)
    : '—';
  const quals = [...new Set(providers.map(p => p.qualification).filter(Boolean))];

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiTarget} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Provider Metrics</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            Registered service providers and performance data
          </div>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <SafeIcon icon={FiRefreshCw} size={14} />
        </button>
      </div>

      <div className="ac-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Providers', value: total,    color: 'var(--ac-primary)', icon: FiUsers },
          { label: 'Partners',        value: partners, color: '#10B981',           icon: FiGlobe },
          { label: 'Avg Rating',      value: avgRating, color: '#F59E0B',          icon: FiTarget },
          { label: 'Specialities',    value: quals.length, color: '#7C3AED',       icon: FiMapPin },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)' }}>{s.label}</span>
              <SafeIcon icon={s.icon} size={16} style={{ color: s.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <SafeIcon icon={FiUser} size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
        <input
          type="text"
          placeholder="Search by name or qualification…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', fontSize: 13, outline: 'none', color: 'var(--ac-text)', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 14 }}>Loading providers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No providers found</div>
          <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>
            {search ? 'No providers match your search.' : 'No providers have registered yet.'}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', padding: '10px 16px', background: 'var(--ac-surface-soft)', borderBottom: '1px solid var(--ac-border)', fontSize: 11, fontWeight: 700, color: 'var(--ac-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8 }}>
            <span>Name</span><span>Qualification</span><span>Experience</span><span>Rating</span><span>Partner</span>
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', padding: '12px 16px', gap: 8, borderBottom: i < filtered.length - 1 ? '1px solid var(--ac-border)' : 'none', background: i % 2 === 0 ? 'var(--ac-surface)' : 'var(--ac-surface-soft)', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ac-text)' }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{p.qualification || '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{p.experience || '—'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>
                {p.rating != null ? `⭐ ${parseFloat(p.rating).toFixed(1)}` : '—'}
              </div>
              <div>
                {p.is_partner
                  ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#D1FAE5', color: '#065F46' }}>Yes</span>
                  : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#6B7280' }}>No</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ac-muted)', padding: '4px' }}>
        Showing {filtered.length} of {total} providers
      </div>
    </div>
  );
};

export default ProviderMetricsPage;

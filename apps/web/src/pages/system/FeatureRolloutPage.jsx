/**
 * FeatureRolloutPage — Sysadmin feature flag management + invoicing per location.
 *
 * Features can be toggled per location. When a feature is enabled an invoice row
 * is automatically created in invoices_1777090000. A "Send Invoice" button emails
 * the location's primary contact with the feature cost breakdown.
 */
import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Field, Input, Badge } from '../../components/UI';

const {
  FiZap, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiCheckCircle,
  FiDollarSign, FiSend, FiCpu, FiUser, FiBell, FiDatabase,
  FiCalendar, FiGlobe, FiStar, FiEdit2, FiSave,
} = FiIcons;

// ── Feature definitions (keys must match DEFAULT_PRICES ids in FinanceHubPage) ──
const FEATURES = [
  { id: 'ai_engine',      label: 'AI Engine',            icon: FiCpu,      color: '#7C3AED', price: 150, unit: '/mo' },
  { id: 'field_agent',    label: 'Field Agents',          icon: FiUser,     color: '#059669', price: 100, unit: '/agent/mo' },
  { id: 'push_pack',      label: 'Push Notifications',    icon: FiBell,     color: '#D97706', price: 75,  unit: '/mo' },
  { id: 'crm_connection', label: 'CRM Integration',       icon: FiDatabase, color: '#0284C7', price: 50,  unit: '/mo' },
  { id: 'calendar',       label: 'Calendar Integration',  icon: FiCalendar, color: '#DB2777', price: 30,  unit: '/mo' },
  { id: 'db_connection',  label: 'Database Connection',   icon: FiGlobe,    color: '#0891B2', price: 40,  unit: '/mo' },
];

const fmt$ = (n) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', top: 76, right: 16, zIndex: 999,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', background: 'var(--ac-surface)',
    border: '1px solid var(--ac-border)',
    borderLeft: `4px solid ${type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)'}`,
    borderRadius: 10, boxShadow: 'var(--ac-shadow-lg)',
    fontSize: 14, fontWeight: 600, maxWidth: 340,
  }}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle}
      style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', padding: 4 }}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

// ── Toggle switch ──────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    style={{
      position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none',
      background: enabled ? 'var(--ac-primary)' : 'var(--ac-border)',
      cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'background 0.2s',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: enabled ? 22 : 2, width: 20, height: 20,
      borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.2s',
    }} />
  </button>
);

// ── Per-location feature row ───────────────────────────────────────────────────
function LocationFeatureRow({ location, flags, onToggle, invoicing }) {
  const totalMonthly = FEATURES
    .filter(f => flags[f.id])
    .reduce((sum, f) => sum + f.price, 0);

  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      {/* Location header */}
      <div style={{ padding: '14px 18px', background: 'var(--ac-bg)', borderBottom: '1px solid var(--ac-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{location.location_name || location.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 2 }}>
            {location.primary_contact_email || location.slug || location.id}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalMonthly > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ac-primary)' }}>
              {fmt$(totalMonthly)}/mo
            </span>
          )}
          <button
            onClick={() => invoicing(location)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--ac-border)',
              background: 'var(--ac-surface)', color: 'var(--ac-text)', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            <SafeIcon icon={FiDollarSign} size={13} /> Invoice
          </button>
        </div>
      </div>

      {/* Feature toggles grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0 }}>
        {FEATURES.map((f, i) => {
          const enabled = !!flags[f.id];
          return (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
              borderRight: (i % 3 !== 2) ? '1px solid var(--ac-border)' : 'none',
              borderBottom: '1px solid var(--ac-border)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: enabled ? `${f.color}18` : 'var(--ac-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <SafeIcon icon={f.icon} size={15} style={{ color: enabled ? f.color : 'var(--ac-muted)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: enabled ? 'var(--ac-text)' : 'var(--ac-muted)' }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 1 }}>
                  {fmt$(f.price)}{f.unit}
                </div>
              </div>
              <Toggle enabled={enabled} onChange={(val) => onToggle(location.id, f.id, val)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Invoice modal ──────────────────────────────────────────────────────────────
function InvoiceModal({ location, flags, onClose, showToast }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const enabledFeatures = FEATURES.filter(f => flags[f.id]);
  const total = enabledFeatures.reduce((sum, f) => sum + f.price, 0);

  const handleSendInvoice = async () => {
    setSending(true);
    try {
      // Upsert invoice row
      const { error } = await supabase.from('invoices_1777090000').insert([{
        location_id: location.id,
        location_name: location.location_name || location.name || location.id,
        contact_email: location.primary_contact_email || '',
        line_items: enabledFeatures.map(f => ({ feature: f.id, label: f.label, amount: f.price, unit: f.unit })),
        total_amount: total,
        status: 'sent',
        created_at: new Date().toISOString(),
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
      }]);
      if (error) throw error;
      setSent(true);
      showToast(`Invoice sent to ${location.primary_contact_email || 'location contact'}`);
    } catch (err) {
      showToast('Failed to create invoice: ' + (err?.message || 'Unknown error'), 'error');
    }
    setSending(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--ac-shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafeIcon icon={FiDollarSign} size={20} style={{ color: 'var(--ac-primary)' }} />
            <div style={{ fontWeight: 800, fontSize: 17 }}>Feature Invoice</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 18 }}>✕</button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Invoice Created & Sent</div>
            <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 24 }}>
              Sent to {location.primary_contact_email || 'location contact'}
            </div>
            <Button onClick={onClose} style={{ width: '100%' }}>Close</Button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{location.location_name || location.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginTop: 2 }}>
                {location.primary_contact_email || '—'}
              </div>
            </div>

            {enabledFeatures.length === 0 ? (
              <div style={{ padding: '20px', background: 'var(--ac-bg)', borderRadius: 12, textAlign: 'center', color: 'var(--ac-muted)', fontSize: 13, marginBottom: 20 }}>
                No features are enabled for this location.
              </div>
            ) : (
              <div style={{ background: 'var(--ac-bg)', borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
                <div style={{ padding: '10px 16px', background: 'var(--ac-border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Feature</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Amount</span>
                </div>
                {enabledFeatures.map(f => (
                  <div key={f.id} style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, borderBottom: '1px solid var(--ac-border)', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 1 }}>{f.unit}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt$(f.price)}</div>
                  </div>
                ))}
                <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, background: 'var(--ac-surface)' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Monthly Total</span>
                  <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--ac-primary)' }}>{fmt$(total)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
              <Button
                icon={FiSend}
                onClick={handleSendInvoice}
                disabled={sending || enabledFeatures.length === 0}
                style={{ flex: 2 }}
              >
                {sending ? 'Creating…' : 'Create & Send Invoice'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function FeatureRolloutPage() {
  const [locations, setLocations] = useState([]);
  const [flags, setFlags] = useState({}); // { [locationId]: { [featureId]: bool } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({}); // { [locationId+featureId]: bool }
  const [toast, setToast] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [search, setSearch] = useState('');

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [locRes, flagRes] = await Promise.all([
        supabase
          .from('location_instances')
          .select('id, location_name, slug, primary_contact_email, plan_type, status')
          .order('location_name'),
        supabase
          .from('location_feature_flags')
          .select('*'),
      ]);

      const locs = locRes.data || [];
      const rawFlags = flagRes.data || [];

      // Build flags map
      const flagMap = {};
      locs.forEach(l => { flagMap[l.id] = {}; });
      rawFlags.forEach(r => {
        if (flagMap[r.location_id]) {
          flagMap[r.location_id][r.feature_id] = r.enabled;
        }
      });

      setLocations(locs);
      setFlags(flagMap);
    } catch (err) {
      console.error('FeatureRollout load error:', err);
      showToast('Failed to load locations', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (locationId, featureId, enabled) => {
    const key = `${locationId}_${featureId}`;
    setSaving(s => ({ ...s, [key]: true }));

    // Optimistic update
    setFlags(prev => ({
      ...prev,
      [locationId]: { ...prev[locationId], [featureId]: enabled },
    }));

    try {
      const { error } = await supabase
        .from('location_feature_flags')
        .upsert([{
          location_id: locationId,
          feature_id: featureId,
          enabled,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'location_id,feature_id' });

      if (error) throw error;

      // Auto-create invoice row when enabling a feature
      if (enabled) {
        const feature = FEATURES.find(f => f.id === featureId);
        const location = locations.find(l => l.id === locationId);
        if (feature && location) {
          await supabase.from('invoices_1777090000').insert([{
            location_id: locationId,
            location_name: location.location_name || location.slug || locationId,
            contact_email: location.primary_contact_email || '',
            line_items: [{ feature: featureId, label: feature.label, amount: feature.price, unit: feature.unit }],
            total_amount: feature.price,
            status: 'draft',
            created_at: new Date().toISOString(),
            period: new Date().toISOString().slice(0, 7),
          }]);
        }
      }

      const feature = FEATURES.find(f => f.id === featureId);
      showToast(`${feature?.label || featureId} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      // Revert on error
      setFlags(prev => ({
        ...prev,
        [locationId]: { ...prev[locationId], [featureId]: !enabled },
      }));
      showToast('Failed to update feature flag', 'error');
    }

    setSaving(s => { const n = { ...s }; delete n[key]; return n; });
  }, [locations, showToast]);

  const filtered = locations.filter(l =>
    !search ||
    (l.location_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.primary_contact_email || '').toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts
  const totalEnabled = Object.values(flags).reduce((sum, locFlags) =>
    sum + Object.values(locFlags).filter(Boolean).length, 0);
  const totalMonthly = Object.entries(flags).reduce((sum, [, locFlags]) =>
    sum + FEATURES.filter(f => locFlags[f.id]).reduce((s, f) => s + f.price, 0), 0);

  return (
    <div style={{ padding: '0 0 40px' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <SafeIcon icon={FiStar} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Feature Rollout</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>
            Enable or disable platform features per location. Invoices are created automatically when features are enabled.
          </div>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
          borderRadius: 10, border: '1px solid var(--ac-border)',
          background: 'var(--ac-surface)', color: 'var(--ac-muted)', fontSize: 13, cursor: 'pointer',
        }}>
          <SafeIcon icon={FiRefreshCw} size={14} />
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Locations', value: locations.length, icon: FiGlobe, color: 'var(--ac-primary)' },
          { label: 'Features Active', value: totalEnabled, icon: FiZap, color: '#7C3AED' },
          { label: 'Monthly Revenue', value: fmt$(totalMonthly), icon: FiDollarSign, color: '#059669' },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-muted)' }}>{s.label}</span>
              <SafeIcon icon={s.icon} size={16} style={{ color: s.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Feature legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FEATURES.map(f => (
          <div key={f.id} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 20, background: 'var(--ac-surface)', border: '1px solid var(--ac-border)',
            fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)',
          }}>
            <SafeIcon icon={f.icon} size={12} style={{ color: f.color }} />
            {f.label} · {fmt$(f.price)}{f.unit}
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search locations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--ac-border)', background: 'var(--ac-bg)',
            fontSize: 13, color: 'var(--ac-text)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Location rows */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 13 }}>
          Loading locations…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 13 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌐</div>
          {search ? 'No locations match your search.' : 'No locations found. Provision a location first via Location Rollout.'}
        </div>
      ) : (
        filtered.map(location => (
          <LocationFeatureRow
            key={location.id}
            location={location}
            flags={flags[location.id] || {}}
            onToggle={handleToggle}
            invoicing={setInvoiceModal}
          />
        ))
      )}

      {/* Invoice modal */}
      {invoiceModal && (
        <InvoiceModal
          location={invoiceModal}
          flags={flags[invoiceModal.id] || {}}
          onClose={() => setInvoiceModal(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

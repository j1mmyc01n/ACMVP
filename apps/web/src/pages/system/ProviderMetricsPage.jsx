import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const { FiRefreshCw, FiTarget, FiUsers, FiGlobe, FiMapPin, FiUser, FiEdit2, FiTrash2, FiX, FiSave } = FiIcons;

const BLANK_FORM = {
  name: '',
  qualification: '',
  gender: '',
  experience: '',
  bio: '',
  availability: '',
  rating: '',
  bulk_billing: false,
  is_partner: false,
};

export const ProviderMetricsPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null); // provider being edited
  const [editForm, setEditForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // provider pending delete confirmation
  const [actionError, setActionError] = useState('');

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

  const openEdit = (p) => {
    setActionError('');
    setEditForm({
      name: p.name || '',
      qualification: p.qualification || '',
      gender: p.gender || '',
      experience: p.experience || '',
      bio: p.bio || '',
      availability: p.availability || '',
      rating: p.rating != null ? String(p.rating) : '',
      bulk_billing: !!p.bulk_billing,
      is_partner: !!p.is_partner,
    });
    setEditTarget(p);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      setActionError('Name is required.');
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      const updates = {
        name: editForm.name.trim(),
        qualification: editForm.qualification.trim() || null,
        gender: editForm.gender.trim() || null,
        experience: editForm.experience.trim() || null,
        bio: editForm.bio.trim() || null,
        availability: editForm.availability.trim() || null,
        rating: (() => {
          if (editForm.rating === '') return null;
          const parsed = parseFloat(editForm.rating);
          return Number.isNaN(parsed) ? null : parsed;
        })(),
        bulk_billing: editForm.bulk_billing,
        is_partner: editForm.is_partner,
      };
      const { error } = await supabase.from('providers_1740395000').update(updates).eq('id', editTarget.id);
      if (error) throw error;
      setProviders(prev => prev.map(p => p.id === editTarget.id ? { ...p, ...updates } : p));
      setEditTarget(null);
    } catch (err) {
      setActionError(err?.message || 'Update failed. Please try again.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    try {
      const { error } = await supabase.from('providers_1740395000').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setProviders(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err?.message || 'Delete failed. Please try again.');
      setDeleteTarget(null);
    }
  };

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

      {actionError && !editTarget && !deleteTarget && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{actionError}</div>
      )}

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
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 80px', padding: '10px 16px', background: 'var(--ac-surface-soft)', borderBottom: '1px solid var(--ac-border)', fontSize: 11, fontWeight: 700, color: 'var(--ac-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8 }}>
            <span>Name</span><span>Qualification</span><span>Experience</span><span>Rating</span><span>Partner</span><span>Actions</span>
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 80px', padding: '12px 16px', gap: 8, borderBottom: i < filtered.length - 1 ? '1px solid var(--ac-border)' : 'none', background: i % 2 === 0 ? 'var(--ac-surface)' : 'var(--ac-surface-soft)', alignItems: 'center' }}>
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
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(p)}
                  title="Edit provider"
                  style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <SafeIcon icon={FiEdit2} size={13} />
                </button>
                <button onClick={() => { setActionError(''); setDeleteTarget(p); }}
                  title="Remove provider"
                  style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <SafeIcon icon={FiTrash2} size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ac-muted)', padding: '4px' }}>
        Showing {filtered.length} of {total} providers
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
          <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: 'var(--ac-shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Edit Provider Profile</h2>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', alignItems: 'center' }}>
                <SafeIcon icon={FiX} size={18} />
              </button>
            </div>
            {actionError && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{actionError}</div>}
            <div className="ac-stack">
              <div className="ac-grid-2">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 5 }}>Full Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 5 }}>Qualification</label>
                  <input value={editForm.qualification} onChange={e => setEditForm(f => ({ ...f, qualification: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div className="ac-grid-2">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 5 }}>Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 5 }}>Experience</label>
                  <input value={editForm.experience} onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g. 5 years"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 5 }}>Bio</label>
                <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div className="ac-grid-2">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 5 }}>Availability</label>
                  <input value={editForm.availability} onChange={e => setEditForm(f => ({ ...f, availability: e.target.value }))} placeholder="e.g. Mon–Fri"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 5 }}>Rating (0–5)</label>
                  <input value={editForm.rating} onChange={e => setEditForm(f => ({ ...f, rating: e.target.value }))} type="number" min="0" max="5" step="0.1"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  <input type="checkbox" checked={editForm.bulk_billing} onChange={e => setEditForm(f => ({ ...f, bulk_billing: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  Bulk Billing
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  <input type="checkbox" checked={editForm.is_partner} onChange={e => setEditForm(f => ({ ...f, is_partner: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  Partner
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setEditTarget(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--ac-primary)', color: 'var(--ac-bg)', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <SafeIcon icon={FiSave} size={14} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
          <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: 'var(--ac-shadow-xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: '0 0 8px' }}>Remove Provider?</h2>
              <p style={{ color: 'var(--ac-text-secondary)', fontSize: 14, margin: 0 }}>
                Are you sure you want to remove <strong>{deleteTarget.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <SafeIcon icon={FiTrash2} size={14} />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderMetricsPage;

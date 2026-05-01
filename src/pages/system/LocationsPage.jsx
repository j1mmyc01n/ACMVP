import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Badge, Field, Input, Toggle } from '../../components/UI';

const {
  FiHome, FiPlus, FiEdit2, FiTrash2, FiX, FiMapPin,
  FiPhone, FiUsers, FiRefreshCw, FiCheck, FiActivity,
} = FiIcons;

const EMPTY_FORM = { name: '', suffix: '', address: '', phone: '', capacity: 20, active: true };

function occupancyColor(count, capacity) {
  const pct = capacity > 0 ? count / capacity : 0;
  if (pct >= 1) return '#EF4444';
  if (pct >= 0.8) return '#F59E0B';
  return '#10B981';
}

function CentreModal({ mode, centre, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(mode === 'edit' ? { ...centre } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.suffix.trim()) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setLoading(true);
    await onDelete(centre.id);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafeIcon icon={FiHome} size={20} style={{ color: 'var(--ac-primary)' }} />
            <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{mode === 'edit' ? 'Edit Care Centre' : 'New Care Centre'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 18, display: 'flex', alignItems: 'center' }}>
            <SafeIcon icon={FiX} size={18} />
          </button>
        </div>

        <div className="ac-stack">
          <div className="ac-grid-2">
            <Field label="Centre Name *">
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Camperdown Main" />
            </Field>
            <Field label="Suffix Code *" hint="3–4 chars used in CRN prefix">
              <Input value={form.suffix} onChange={e => setForm({ ...form, suffix: e.target.value.toUpperCase().slice(0, 4) })} placeholder="e.g. CMP" />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street, Suburb NSW XXXX" />
          </Field>
          <div className="ac-grid-2">
            <Field label="Phone">
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(02) XXXX XXXX" />
            </Field>
            <Field label="Max Capacity">
              <Input type="number" min={1} max={500} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} />
            </Field>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle on={form.active} onChange={v => setForm({ ...form, active: v })} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{form.active ? 'Active' : 'Inactive'}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            {mode === 'edit' && (
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--ac-danger)', background: confirmDelete ? 'var(--ac-danger)' : 'transparent', color: confirmDelete ? '#fff' : 'var(--ac-danger)', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {confirmDelete ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
            <div style={{ flex: 1 }} />
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.name.trim() || !form.suffix.trim()}>
              {loading ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Centre'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', centre?: {} }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('care_centres_1777090000')
        .select('*')
        .order('name');
      if (!error && data) {
        setCentres(data.map(c => ({ ...c, capacity: c.capacity || 20 })));
      } else {
        setCentres([]);
      }
    } catch {
      setCentres([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (modal.mode === 'create') {
      try {
        const { data, error } = await supabase
          .from('care_centres_1777090000')
          .insert([{ name: form.name, suffix: form.suffix, address: form.address, phone: form.phone, active: form.active, clients_count: 0 }])
          .select().single();
        if (!error && data) {
          setCentres(prev => [...prev, { ...data, capacity: form.capacity }]);
        } else {
          setCentres(prev => [...prev, { ...form, id: `mock-${Date.now()}`, clients_count: 0 }]);
        }
      } catch {
        setCentres(prev => [...prev, { ...form, id: `mock-${Date.now()}`, clients_count: 0 }]);
      }
    } else {
      try {
        await supabase.from('care_centres_1777090000').update({ name: form.name, suffix: form.suffix, address: form.address, phone: form.phone, active: form.active }).eq('id', form.id);
      } catch { /* no-op */ }
      setCentres(prev => prev.map(c => c.id === form.id ? { ...c, ...form } : c));
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    try {
      await supabase.from('care_centres_1777090000').delete().eq('id', id);
    } catch { /* no-op */ }
    setCentres(prev => prev.filter(c => c.id !== id));
    setModal(null);
  };

  const handleToggleActive = async (id, val) => {
    try {
      await supabase.from('care_centres_1777090000').update({ active: val }).eq('id', id);
    } catch { /* no-op */ }
    setCentres(prev => prev.map(c => c.id === id ? { ...c, active: val } : c));
  };

  const seedTestLocation = async () => {
    if (!window.confirm('Seed a TEST LOCATION with sample data? This will create a test care centre, sample patients, and sample check-ins for module testing.')) return;
    try {
      // 1. Create test care centre (deterministic UUID so upsert is idempotent)
      const TEST_CENTRE_ID = '10000000-0000-0000-0000-000000000001';
      const { data: cc, error: ccErr } = await supabase
        .from('care_centres_1777090000')
        .upsert([{
          id: TEST_CENTRE_ID,
          name: '⚗️ TEST LOCATION',
          suffix: 'TST',
          address: '1 Test Street, Testville NSW 2000',
          phone: '(02) 0000 0000',
          active: true,
          clients_count: 3,
          capacity: 10,
        }], { onConflict: 'id' })
        .select().single();

      // 2. Seed test patients
      const testPatients = [
        { crn: 'TST10000001', name: 'Test Patient Alpha', email: 'alpha@test.local', phone: '0400000001', care_centre: '⚗️ TEST LOCATION', category: 'mental_health', status: 'active', postcode: '2000', event_log: [] },
        { crn: 'TST10000002', name: 'Test Patient Beta',  email: 'beta@test.local',  phone: '0400000002', care_centre: '⚗️ TEST LOCATION', category: 'crisis',         status: 'active', postcode: '2000', event_log: [] },
        { crn: 'TST10000003', name: 'Test Patient Gamma', email: 'gamma@test.local', phone: '0400000003', care_centre: '⚗️ TEST LOCATION', category: 'general',        status: 'active', postcode: '2000', event_log: [] },
      ];
      for (const p of testPatients) {
        await supabase.from('clients_1777020684735').upsert([p], { onConflict: 'crn' });
      }

      // 3. Seed test check-ins
      const testCheckins = [
        { crn: 'TST10000001', name: 'Test Patient Alpha', mood_score: 2, status: 'urgent',  resolved: false, care_centre: '⚗️ TEST LOCATION', created_at: new Date(Date.now() - 3600000).toISOString() },
        { crn: 'TST10000002', name: 'Test Patient Beta',  mood_score: 5, status: 'pending', resolved: false, care_centre: '⚗️ TEST LOCATION', created_at: new Date(Date.now() - 7200000).toISOString() },
        { crn: 'TST10000003', name: 'Test Patient Gamma', mood_score: 8, status: 'pending', resolved: false, care_centre: '⚗️ TEST LOCATION', created_at: new Date(Date.now() - 10800000).toISOString() },
      ];
      for (const ci of testCheckins) {
        await supabase.from('check_ins_1740395000').insert([ci]);
      }

      await load();
      alert('✅ Test location seeded! Look for "⚗️ TEST LOCATION" in the care centres list.');
    } catch (err) {
      alert('Seeding failed: ' + err.message);
    }
  };
  const totalCentres  = centres.length;
  const activeCentres = centres.filter(c => c.active).length;
  const totalClients  = centres.reduce((s, c) => s + (c.clients_count || 0), 0);
  const totalCapacity = centres.reduce((s, c) => s + (c.capacity || 20), 0);
  const avgOccupancy  = totalCapacity > 0 ? Math.round((totalClients / totalCapacity) * 100) : 0;

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiHome} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Care Centres</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            Manage facility locations, capacity, and activation status
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <SafeIcon icon={FiRefreshCw} size={14} />
          </button>
          <button onClick={seedTestLocation} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #F59E0B', background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ⚗️ Seed Test Location
          </button>
          <Button icon={FiPlus} onClick={() => setModal({ mode: 'create' })}>New Centre</Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="ac-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Centres',   value: totalCentres,  sub: 'registered',         color: 'var(--ac-primary)', icon: FiHome },
          { label: 'Active Centres',  value: activeCentres, sub: `${totalCentres - activeCentres} inactive`, color: '#10B981', icon: FiCheck },
          { label: 'Total Clients',   value: totalClients,  sub: 'across all centres',  color: '#3B82F6', icon: FiUsers },
          { label: 'Avg Occupancy',   value: `${avgOccupancy}%`, sub: `of ${totalCapacity} capacity`, color: avgOccupancy >= 90 ? '#EF4444' : avgOccupancy >= 70 ? '#F59E0B' : '#10B981', icon: FiActivity },
        ].map(s => (
          <div key={s.label} className="ac-stat-tile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)' }}>{s.label}</span>
              <SafeIcon icon={s.icon} size={16} style={{ color: s.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Centres grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 14 }}>Loading care centres…</div>
      ) : centres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <SafeIcon icon={FiHome} size={48} style={{ color: 'var(--ac-border)', marginBottom: 16 }} />
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No care centres yet</div>
          <div style={{ color: 'var(--ac-muted)', marginBottom: 24, fontSize: 14 }}>Create your first care centre to get started.</div>
          <Button icon={FiPlus} onClick={() => setModal({ mode: 'create' })}>Create Care Centre</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {centres.map(c => {
            const pct = c.capacity > 0 ? Math.min(100, Math.round((c.clients_count || 0) / c.capacity * 100)) : 0;
            const barColor = occupancyColor(c.clients_count || 0, c.capacity || 20);
            return (
              <div key={c.id} className="ac-card" style={{ position: 'relative' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {c.name}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'var(--ac-primary-soft)', color: 'var(--ac-primary)' }}>{c.suffix}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.active ? '#10B981' : '#94A3B8', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: c.active ? '#10B981' : 'var(--ac-muted)', fontWeight: 600 }}>{c.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setModal({ mode: 'edit', centre: c })}
                    style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--ac-text-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <SafeIcon icon={FiEdit2} size={13} />
                  </button>
                </div>

                {/* Address + phone */}
                <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <SafeIcon icon={FiMapPin} size={12} style={{ marginTop: 1, flexShrink: 0, color: 'var(--ac-muted)' }} />
                  <span>{c.address || 'No address set'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SafeIcon icon={FiPhone} size={12} style={{ color: 'var(--ac-muted)' }} />
                  <span>{c.phone || '—'}</span>
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ac-text-secondary)' }}>
                      <SafeIcon icon={FiUsers} size={11} style={{ marginRight: 4 }} />
                      {c.clients_count || 0} / {c.capacity || 20} clients
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{pct}%</span>
                  </div>
                  <div className="ac-progress">
                    <div className="ac-progress-bar" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>

                {/* Toggle active */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--ac-border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>Centre active</span>
                  <Toggle on={c.active} onChange={v => handleToggleActive(c.id, v)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <CentreModal
          mode={modal.mode}
          centre={modal.centre}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Badge, Field, Input, Toggle } from '../../components/UI';
import { logActivity } from '../../lib/audit';

const {
  FiHome, FiPlus, FiEdit2, FiTrash2, FiX, FiMapPin,
  FiPhone, FiUsers, FiRefreshCw, FiCheck, FiActivity,
  FiUser, FiShield,
} = FiIcons;

// ─── Service definitions ──────────────────────────────────────────────────────
const ALL_SERVICES = [
  { id: 'mental_health',     label: 'Mental Health',       color: '#7C3AED', emoji: '🧠' },
  { id: 'domestic_violence', label: 'Domestic Violence',   color: '#DC2626', emoji: '🛡️' },
  { id: 'substance_use',     label: 'Substance Use',       color: '#D97706', emoji: '💊' },
  { id: 'housing',           label: 'Housing Support',     color: '#059669', emoji: '🏠' },
  { id: 'crisis',            label: 'Crisis Intervention', color: '#EF4444', emoji: '🚨' },
  { id: 'youth',             label: 'Youth Services',      color: '#0284C7', emoji: '🧒' },
  { id: 'disability',        label: 'Disability Support',  color: '#8B5CF6', emoji: '♿' },
  { id: 'general',           label: 'General Support',     color: '#64748B', emoji: '💙' },
];

function ServiceBadge({ id, small = false }) {
  const s = ALL_SERVICES.find(x => x.id === id);
  if (!s) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 20,
      background: `${s.color}18`,
      color: s.color,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {s.emoji} {s.label}
    </span>
  );
}

const EMPTY_FORM = { name: '', suffix: '', address: '', phone: '', capacity: 20, active: true, primary_service: 'general', secondary_services: [] };

function occupancyColor(count, capacity) {
  const pct = capacity > 0 ? count / capacity : 0;
  if (pct >= 1) return '#EF4444';
  if (pct >= 0.8) return '#F59E0B';
  return '#10B981';
}

function CentreModal({ mode, centre, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(mode === 'edit'
    ? { ...EMPTY_FORM, ...centre, secondary_services: centre.secondary_services || [] }
    : { ...EMPTY_FORM });
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

  const toggleSecondary = (id) => {
    setForm(f => ({
      ...f,
      secondary_services: f.secondary_services.includes(id)
        ? f.secondary_services.filter(x => x !== id)
        : [...f.secondary_services, id],
    }));
  };

  const availableSecondary = ALL_SERVICES.filter(s => s.id !== form.primary_service);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 540, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
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

          {/* Primary service */}
          <Field label="Primary Service">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
              {ALL_SERVICES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    primary_service: s.id,
                    // Remove from secondary if it was there
                    secondary_services: f.secondary_services.filter(x => x !== s.id),
                  }))}
                  style={{
                    padding: '7px 10px', borderRadius: 10, border: `2px solid ${form.primary_service === s.id ? s.color : 'var(--ac-border)'}`,
                    background: form.primary_service === s.id ? `${s.color}18` : 'var(--ac-bg)',
                    color: form.primary_service === s.id ? s.color : 'var(--ac-text-secondary)',
                    fontSize: 11, fontWeight: form.primary_service === s.id ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Secondary services */}
          <Field label="Secondary Services" hint="Select any additional services this centre provides">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 0' }}>
              {availableSecondary.map(s => {
                const checked = form.secondary_services.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSecondary(s.id)}
                    style={{
                      padding: '6px 10px', borderRadius: 20,
                      border: `1.5px solid ${checked ? s.color : 'var(--ac-border)'}`,
                      background: checked ? `${s.color}18` : 'var(--ac-bg)',
                      color: checked ? s.color : 'var(--ac-text-secondary)',
                      fontSize: 11, fontWeight: checked ? 700 : 400,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {checked && <SafeIcon icon={FiCheck} size={10} />}
                    {s.emoji} {s.label}
                  </button>
                );
              })}
            </div>
            {form.secondary_services.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>
                {form.secondary_services.length} secondary service{form.secondary_services.length > 1 ? 's' : ''} selected
              </div>
            )}
          </Field>

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

function CentreUsersModal({ centre, onClose }) {
  const [staff, setStaff] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('staff');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const isUuid = typeof centre.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(centre.id);
      const orFilter = isUuid
        ? `location.eq.${centre.name},location_id.eq.${centre.id}`
        : `location.eq.${centre.name}`;
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('admin_users_1777025000000')
          .select('id, name, email, role, status, location, location_id, last_login')
          .or(orFilter)
          .order('name'),
        supabase.from('clients_1777020684735')
          .select('id, name, crn, status, support_category, phone, email, created_at')
          .eq('care_centre', centre.name)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      setStaff(s || []);
      setPatients(p || []);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [centre.id, centre.name]);

  const activeStaff = staff.filter(u => u.status !== 'inactive').length;
  const activePatients = patients.filter(p => p.status === 'active').length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, width: '100%', maxWidth: 720, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ac-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <SafeIcon icon={FiHome} size={20} style={{ color: 'var(--ac-primary)' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{centre.name} — Users</h2>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
              {activeStaff} staff · {activePatients} active patient{activePatients === 1 ? '' : 's'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--ac-bg)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiX} size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--ac-border)' }}>
          {[
            { id: 'staff', label: `Staff (${staff.length})`, icon: FiShield },
            { id: 'patients', label: `Patients (${patients.length})`, icon: FiUser },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '12px 14px', border: 'none', cursor: 'pointer', background: 'transparent',
              borderBottom: tab === t.id ? '2px solid var(--ac-primary)' : '2px solid transparent',
              color: tab === t.id ? 'var(--ac-primary)' : 'var(--ac-muted)',
              fontWeight: tab === t.id ? 700 : 500, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <SafeIcon icon={t.icon} size={13} /> {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>Loading…</div>
          ) : tab === 'staff' ? (
            staff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)', fontSize: 13 }}>No staff assigned to this centre yet</div>
            ) : staff.map(u => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--ac-border)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name || u.email?.split('@')[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{u.email}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{u.location || centre.name}</div>
                <Badge tone={u.role === 'sysadmin' ? 'violet' : u.role === 'admin' ? 'blue' : u.role === 'field_agent' ? 'green' : 'gray'}>
                  {u.role || 'staff'}
                </Badge>
                <span style={{ fontSize: 11, fontWeight: 600, color: u.status === 'inactive' ? 'var(--ac-muted)' : '#10B981' }}>
                  {u.status === 'inactive' ? 'Inactive' : 'Active'}
                </span>
              </div>
            ))
          ) : (
            patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)', fontSize: 13 }}>No patients registered at this centre</div>
            ) : patients.map(p => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 1fr 100px', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--ac-border)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{p.email || p.phone || '—'}</div>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'var(--ac-bg)', padding: '2px 8px', borderRadius: 6, color: 'var(--ac-text-secondary)', justifySelf: 'start' }}>{p.crn}</span>
                <span style={{ fontSize: 12, color: 'var(--ac-text-secondary)', textTransform: 'capitalize' }}>
                  {(p.support_category || 'general').replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: p.status === 'active' ? '#10B981' : 'var(--ac-muted)', textTransform: 'capitalize' }}>
                  {p.status || 'active'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', centre?: {} }
  const [usersModal, setUsersModal] = useState(null);
  const [saveError, setSaveError] = useState(null);

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
    const dbFields = {
      name: form.name, suffix: form.suffix, address: form.address,
      phone: form.phone, active: form.active,
      primary_service: form.primary_service || 'general',
      secondary_services: form.secondary_services || [],
    };
    if (modal.mode === 'create') {
      try {
        const { data, error } = await supabase
          .from('care_centres_1777090000')
          .insert([{ ...dbFields, clients_count: 0 }])
          .select().single();
        if (!error && data) {
          setCentres(prev => [...prev, { ...data, capacity: form.capacity }]);
          await logActivity({
            action: 'create', resource: 'care_centre',
            detail: `Created care centre ${form.name} (${form.suffix})`,
            actor: 'sysadmin', actor_role: 'sysadmin', source_type: 'location',
            location: form.name,
          });
        } else {
          setSaveError(`Failed to create care centre: ${error?.message || 'Unknown error'}`);
          setModal(null);
          return;
        }
      } catch (err) {
        setSaveError(`Failed to create care centre: ${err?.message || 'Unknown error'}`);
        setModal(null);
        return;
      }
    } else {
      try {
        await supabase.from('care_centres_1777090000').update(dbFields).eq('id', form.id);
        await logActivity({
          action: 'update', resource: 'care_centre',
          detail: `Updated care centre ${form.name}`,
          actor: 'sysadmin', actor_role: 'sysadmin', source_type: 'location',
          location: form.name,
        });
      } catch { /* no-op */ }
      setCentres(prev => prev.map(c => c.id === form.id ? { ...c, ...form } : c));
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    const target = centres.find(c => c.id === id);
    try {
      await supabase.from('care_centres_1777090000').delete().eq('id', id);
      await logActivity({
        action: 'delete', resource: 'care_centre',
        detail: `Deleted care centre ${target?.name || id}`,
        actor: 'sysadmin', actor_role: 'sysadmin', source_type: 'location',
        location: target?.name || null, level: 'warning',
      });
    } catch { /* no-op */ }
    setCentres(prev => prev.filter(c => c.id !== id));
    setModal(null);
  };

  const handleToggleActive = async (id, val) => {
    const target = centres.find(c => c.id === id);
    try {
      await supabase.from('care_centres_1777090000').update({ active: val }).eq('id', id);
      await logActivity({
        action: 'update', resource: 'care_centre',
        detail: `Set ${target?.name || id} ${val ? 'active' : 'inactive'}`,
        actor: 'sysadmin', actor_role: 'sysadmin', source_type: 'location',
        location: target?.name || null,
      });
    } catch { /* no-op */ }
    setCentres(prev => prev.map(c => c.id === id ? { ...c, active: val } : c));
  };

  const seedTestLocation = async () => {
    if (!window.confirm('Seed a TEST LOCATION with sample data? This will create a test care centre, sample patients, and sample check-ins for module testing.')) return;
    try {
      // Seeding is performed server-side via a Netlify Function so the
      // service role key can bypass RLS — anonymous client inserts are
      // blocked by the RLS policies on care_centres / clients / check_ins.
      const res = await fetch('/api/seed-test-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch { body = { ok: false, error: text.slice(0, 200) }; }

      if (!res.ok || !body.ok) {
        const detail = body?.errors?.join('; ') || body?.error || `HTTP ${res.status}`;
        throw new Error(detail);
      }

      await load();
      const { care_centre = 0, patients = 0, check_ins = 0 } = body.summary || {};
      const partial = body.errors?.length ? `\n\nWarnings:\n- ${body.errors.join('\n- ')}` : '';
      alert(`✅ Test location seeded — ${care_centre} centre, ${patients} patients, ${check_ins} new check-ins.${partial}`);
    } catch (err) {
      alert('Seeding failed: ' + (err?.message || err));
    }
  };
  const totalCentres  = centres.length;
  const activeCentres = centres.filter(c => c.active).length;
  const totalClients  = centres.reduce((s, c) => s + (c.clients_count || 0), 0);
  const totalCapacity = centres.reduce((s, c) => s + (c.capacity || 20), 0);
  const avgOccupancy  = totalCapacity > 0 ? Math.round((totalClients / totalCapacity) * 100) : 0;

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Error banner */}
      {saveError && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 13, color: '#991B1B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}
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
                <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SafeIcon icon={FiPhone} size={12} style={{ color: 'var(--ac-muted)' }} />
                  <span>{c.phone || '—'}</span>
                </div>

                {/* Services */}
                {(c.primary_service || (c.secondary_services && c.secondary_services.length > 0)) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {c.primary_service && <ServiceBadge id={c.primary_service} small />}
                    {(c.secondary_services || []).map(s => <ServiceBadge key={s} id={s} small />)}
                  </div>
                )}

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

                <button
                  onClick={() => setUsersModal(c)}
                  style={{ marginTop: 10, width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <SafeIcon icon={FiUsers} size={12} /> View Staff & Patients
                </button>
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
      {usersModal && (
        <CentreUsersModal centre={usersModal} onClose={() => setUsersModal(null)} />
      )}
    </div>
  );
}

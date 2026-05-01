import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Badge, Field, Input, Select } from '../../components/UI';
import { logActivity } from '../../lib/audit';

const {
  FiUser, FiUsers, FiUserPlus, FiSearch, FiRefreshCw,
  FiEdit2, FiX, FiShield, FiCheck, FiClock,
} = FiIcons;



const EMPTY_FORM = { name: '', email: '', role: 'staff', status: 'active', location: '', location_id: '', sub_location: '' };

const roleBadge = (role) => {
  if (role === 'sysadmin')    return { tone: 'violet', label: 'SysAdmin' };
  if (role === 'admin')       return { tone: 'blue',   label: 'Admin' };
  if (role === 'field_agent') return { tone: 'green',  label: 'Field Agent' };
  return                             { tone: 'gray',   label: 'Staff' };
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StaffModal({ mode, staff, onClose, onSave, mainLocations = [] }) {
  const [form, setForm] = useState(mode === 'edit' ? { ...staff } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);

  // When main location changes, reset sub_location
  const handleMainLocationChange = (e) => {
    const loc = mainLocations.find(l => l.id === e.target.value);
    setForm(f => ({
      ...f,
      location_id: e.target.value,
      location: loc ? loc.name : '',
      sub_location: '',
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  // Sub-locations are other care centres to choose from (excludes the already-selected main location).
  // When a parent_id field is available in the DB schema, this can be filtered to l.parent_id === form.location_id.
  const subLocationOptions = form.location_id
    ? mainLocations.filter(l => l.id !== form.location_id)
    : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafeIcon icon={FiUserPlus} size={20} style={{ color: 'var(--ac-primary)' }} />
            <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{mode === 'edit' ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', alignItems: 'center' }}>
            <SafeIcon icon={FiX} size={18} />
          </button>
        </div>

        <div className="ac-stack">
          <Field label="Full Name *">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alice Nguyen" />
          </Field>
          <Field label="Email Address *">
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="staff@acutecare.com.au" />
          </Field>
          <div className="ac-grid-2">
            <Field label="Role">
              <Select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                options={[
                  { value: 'staff',       label: 'Staff' },
                  { value: 'admin',       label: 'Admin' },
                  { value: 'field_agent', label: 'Field Agent' },
                  { value: 'sysadmin',    label: 'SysAdmin' },
                ]}
              />
            </Field>
            <Field label="Main Account / Location" hint="Select the primary location">
              <Select
                value={form.location_id || ''}
                onChange={handleMainLocationChange}
                options={[
                  { value: '', label: '— Select main location —' },
                  ...mainLocations.map(l => ({ value: l.id, label: l.name })),
                ]}
              />
            </Field>
          </div>
          {form.location_id && (
            <Field label="Sub-Location" hint="Optional — leave blank if same as main">
              <Select
                value={form.sub_location || ''}
                onChange={e => setForm({ ...form, sub_location: e.target.value })}
                options={[
                  { value: '', label: `— Same as main (${form.location || 'selected'}) —` },
                  ...subLocationOptions.map(l => ({ value: l.id, label: l.name })),
                ]}
              />
            </Field>
          )}
          {!form.location_id && (
            <Field label="Location (manual)">
              <Input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Camperdown" />
            </Field>
          )}
          {mode === 'edit' && (
            <Field label="Status">
              <Select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                options={[
                  { value: 'active',   label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </Field>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.name.trim() || !form.email.trim()} style={{ flex: 1 }}>
              {loading ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modal, setModal]     = useState(null); // null | { mode: 'create'|'edit', staff?: {} }
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [careCentres, setCareCentres] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users_1777025000000')
        .select('*')
        .order('name');
      if (!error && data) {
        setStaff(data.map(u => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Unknown',
          email: u.email,
          role: u.role?.toLowerCase() || 'staff',
          status: u.status || 'active',
          lastLogin: u.last_login || u.updated_at || null,
          location: u.location || '',
          location_id: u.location_id || '',
        })));
      } else {
        setStaff([]);
      }
    } catch {
      setStaff([]);
    }
    setLoading(false);
  }, []);

  const loadCentres = useCallback(async () => {
    try {
      const { data } = await supabase.from('care_centres_1777090000').select('id, name, suffix').eq('active', true).order('name');
      setCareCentres(data || []);
    } catch { /* no-op */ }
  }, []);

  useEffect(() => { load(); loadCentres(); }, [load, loadCentres]);

  const filtered = staff.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.location || '').toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const handleSave = async (form) => {
    if (modal.mode === 'create') {
      try {
        const { data, error } = await supabase
          .from('admin_users_1777025000000')
          .insert([{ name: form.name, email: form.email, role: form.role, status: 'active', location: form.location, location_id: form.location_id || null }])
          .select().single();
        if (!error && data) {
          setStaff(prev => [...prev, { ...data, lastLogin: null }]);
          await logActivity({
            action: 'create', resource: 'staff',
            detail: `Created staff ${form.name} (${form.email}) as ${form.role}`,
            actor: 'sysadmin', actor_role: 'sysadmin',
            source_type: 'staff', location: form.location || null,
          });
        }
      } catch (err) { console.error('Create staff error:', err); }
    } else {
      try {
        await supabase.from('admin_users_1777025000000').update({ name: form.name, email: form.email, role: form.role, status: form.status, location: form.location, location_id: form.location_id || null }).eq('id', form.id);
        await logActivity({
          action: 'update', resource: 'staff',
          detail: `Updated staff ${form.name} (${form.email})`,
          actor: 'sysadmin', actor_role: 'sysadmin',
          source_type: 'staff', location: form.location || null,
        });
      } catch { /* no-op */ }
      setStaff(prev => prev.map(u => u.id === form.id ? { ...u, ...form } : u));
    }
    setModal(null);
  };

  const handleToggleStatus = async (id) => {
    const u = staff.find(s => s.id === id);
    if (!u) return;
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await supabase.from('admin_users_1777025000000').update({ status: newStatus }).eq('id', id);
      await logActivity({
        action: 'update', resource: 'staff',
        detail: `Set ${u.name} (${u.email}) to ${newStatus}`,
        actor: 'sysadmin', actor_role: 'sysadmin',
        source_type: 'staff', location: u.location || null,
        level: newStatus === 'inactive' ? 'warning' : 'info',
      });
    } catch { /* no-op */ }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleChangeRole = async (id, role) => {
    const u = staff.find(s => s.id === id);
    try {
      await supabase.from('admin_users_1777025000000').update({ role }).eq('id', id);
      await logActivity({
        action: 'update', resource: 'staff',
        detail: `Changed ${u?.name || id} role from ${u?.role || 'unknown'} to ${role}`,
        actor: 'sysadmin', actor_role: 'sysadmin',
        source_type: 'staff', location: u?.location || null,
        level: 'warning',
      });
    } catch { /* no-op */ }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, role } : s));
    setEditingRoleId(null);
  };

  const totalStaff    = staff.length;
  const activeStaff   = staff.filter(u => u.status === 'active').length;
  const adminCount    = staff.filter(u => u.role === 'admin').length;
  const fieldAgentCount = staff.filter(u => u.role === 'field_agent').length;
  const sysadminCount = staff.filter(u => u.role === 'sysadmin').length;

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiUsers} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Staff Management</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            Manage staff accounts, roles, and access permissions
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <SafeIcon icon={FiRefreshCw} size={14} />
          </button>
          <Button icon={FiUserPlus} onClick={() => setModal({ mode: 'create' })}>Add Staff Member</Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="ac-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Staff',    value: totalStaff,      sub: 'registered accounts', color: 'var(--ac-primary)', icon: FiUsers },
          { label: 'Active',         value: activeStaff,     sub: `${totalStaff - activeStaff} inactive`, color: '#10B981', icon: FiCheck },
          { label: 'Field Agents',   value: fieldAgentCount, sub: 'field agent role',     color: '#F59E0B', icon: FiUser },
          { label: 'SysAdmins',      value: sysadminCount,   sub: 'system access',        color: '#7C3AED', icon: FiShield },
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

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <SafeIcon icon={FiSearch} size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, email or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', fontSize: 13, outline: 'none', color: 'var(--ac-text)', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'staff', 'admin', 'field_agent', 'sysadmin'].map(r => {
            const labels = { all: 'All Roles', staff: 'Staff', admin: 'Admin', field_agent: 'Field Agent', sysadmin: 'SysAdmin' };
            return (
              <button key={r} onClick={() => setRoleFilter(r)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  borderColor: roleFilter === r ? 'var(--ac-primary)' : 'var(--ac-border)',
                  background: roleFilter === r ? 'var(--ac-primary)' : 'var(--ac-surface)',
                  color: roleFilter === r ? '#fff' : 'var(--ac-text-secondary)',
                }}>
                {labels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff table */}
      <div style={{ background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 160px 140px', padding: '10px 16px', background: 'var(--ac-surface-soft)', borderBottom: '1px solid var(--ac-border)', fontSize: 11, fontWeight: 700, color: 'var(--ac-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8 }}>
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last Login</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>Loading staff…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)', fontSize: 13 }}>No staff match your filters</div>
        ) : filtered.map((u, i) => {
          const rb = roleBadge(u.role);
          const isActive = u.status === 'active';
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 160px 140px', padding: '12px 16px', gap: 8, borderBottom: i < filtered.length - 1 ? '1px solid var(--ac-border)' : 'none', background: i % 2 === 0 ? 'var(--ac-surface)' : 'var(--ac-surface-soft)', alignItems: 'center' }}>
              {/* Name */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ac-text)' }}>{u.name}</div>
                {u.location && <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{u.location}</div>}
              </div>

              {/* Email */}
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>

              {/* Role — click to change */}
              <div>
                {editingRoleId === u.id ? (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['staff', 'admin', 'field_agent', 'sysadmin'].map(r => (
                      <button key={r} onClick={() => handleChangeRole(u.id, r)}
                        style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          borderColor: u.role === r ? 'var(--ac-primary)' : 'var(--ac-border)',
                          background: u.role === r ? 'var(--ac-primary)' : 'transparent',
                          color: u.role === r ? '#fff' : 'var(--ac-text-secondary)',
                        }}>
                        {r}
                      </button>
                    ))}
                    <button onClick={() => setEditingRoleId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 11 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingRoleId(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                    <Badge tone={rb.tone}>{rb.label}</Badge>
                  </button>
                )}
              </div>

              {/* Status */}
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: isActive ? '#D1FAE5' : '#F3F4F6',
                  color: isActive ? '#065F46' : '#6B7280',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#10B981' : '#9CA3AF' }} />
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Last login */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ac-muted)' }}>
                <SafeIcon icon={FiClock} size={11} />
                {fmt(u.lastLogin)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setModal({ mode: 'edit', staff: u })}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <SafeIcon icon={FiEdit2} size={11} /> Edit
                </button>
                <button onClick={() => handleToggleStatus(u.id)}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    borderColor: isActive ? 'var(--ac-danger)' : 'var(--ac-success)',
                    color: isActive ? 'var(--ac-danger)' : 'var(--ac-success)',
                    background: 'transparent',
                  }}>
                  {isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '8px 4px', fontSize: 12, color: 'var(--ac-muted)' }}>
        <span>Showing {filtered.length} of {staff.length} staff members</span>
      </div>

      {modal && (
        <StaffModal
          mode={modal.mode}
          staff={modal.staff}
          onClose={() => setModal(null)}
          onSave={handleSave}
          mainLocations={careCentres}
        />
      )}
    </div>
  );
}

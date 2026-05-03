import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase/supabase';
import { STRUCTURED_AUDIT_ACTIONS, LEGAL_VERSIONS } from '../../lib/audit';
import AuditLogTimeline from '../../components/audit/AuditLogTimeline.jsx';

const ACTION_OPTIONS = ['', ...Object.values(STRUCTURED_AUDIT_ACTIONS)];
const ENTITY_OPTIONS = ['', 'profiles', 'crn_records', 'check_ins', 'medical_events', 'consent_agreements'];
const VERSION_OPTIONS = ['', LEGAL_VERSIONS.legal_bundle];

export default function AdminAuditPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    userId: '', crn: '', action: '', entityType: '', agreementVersion: '',
    startDate: '', endDate: '',
  });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, user_id, full_name, crn, role')
      .order('updated_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        setUsers(data || []);
      });
    return () => { cancelled = true; };
  }, []);

  const userOptions = useMemo(() => users.map((u) => ({
    value: u.user_id || u.id,
    label: `${u.full_name || 'Unknown'}${u.crn ? ` · ${u.crn}` : ''}`,
  })), [users]);

  return (
    <div className="ac-stack" style={{ paddingBottom: 60 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Admin · Audit Dashboard</div>
        <p style={{ fontSize: 13, color: 'var(--ac-muted)', marginTop: 4 }}>
          Filter the immutable audit_logs trail by user, CRN, action type, agreement version, or date range. Every audit row carries the legal-bundle version that was in force at the time of the action.
        </p>
      </div>

      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <SelectField label="User" value={filters.userId} onChange={(v) => setFilters({ ...filters, userId: v })}
            options={[{ value: '', label: 'All users' }, ...userOptions]} />
          <TextField label="CRN" value={filters.crn} onChange={(v) => setFilters({ ...filters, crn: v.toUpperCase() })} placeholder="CRN-XXXX-XXXX" />
          <SelectField label="Action" value={filters.action} onChange={(v) => setFilters({ ...filters, action: v })}
            options={ACTION_OPTIONS.map((a) => ({ value: a, label: a || 'Any action' }))} />
          <SelectField label="Entity" value={filters.entityType} onChange={(v) => setFilters({ ...filters, entityType: v })}
            options={ENTITY_OPTIONS.map((a) => ({ value: a, label: a || 'Any entity' }))} />
          <SelectField label="Agreement" value={filters.agreementVersion} onChange={(v) => setFilters({ ...filters, agreementVersion: v })}
            options={VERSION_OPTIONS.map((a) => ({ value: a, label: a || 'Any version' }))} />
          <TextField label="Start date" type="date" value={filters.startDate} onChange={(v) => setFilters({ ...filters, startDate: v })} />
          <TextField label="End date" type="date" value={filters.endDate} onChange={(v) => setFilters({ ...filters, endDate: v })} />
        </div>
      </div>

      <AuditLogTimeline
        userId={filters.userId || undefined}
        crn={filters.crn || undefined}
        action={filters.action || undefined}
        entityType={filters.entityType || undefined}
        agreementVersion={filters.agreementVersion || undefined}
        startDate={filters.startDate ? `${filters.startDate}T00:00:00Z` : undefined}
        endDate={filters.endDate ? `${filters.endDate}T23:59:59Z` : undefined}
      />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--ac-muted)' }}>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13 }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--ac-muted)' }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

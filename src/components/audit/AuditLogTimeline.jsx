import React, { useEffect, useMemo, useState } from 'react';
import { fetchAuditLogs } from '../../lib/audit';

// Renders an immutable timeline of audit_logs rows for a user / CRN.
// Filters apply on the server where possible, locally otherwise.
export default function AuditLogTimeline({
  userId,
  crn,
  action,
  entityType,
  agreementVersion,
  startDate,
  endDate,
  limit = 100,
  title = 'Audit Timeline',
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await fetchAuditLogs({
        userId, crn, action, entityType, agreementVersion, startDate, endDate, limit,
      });
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId, crn, action, entityType, agreementVersion, startDate, endDate, limit]);

  const groups = useMemo(() => groupByDay(rows), [rows]);

  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h3 style={{ fontWeight: 800, fontSize: 15 }}>{title}</h3>
        <span style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{rows.length} entr{rows.length === 1 ? 'y' : 'ies'}</span>
      </div>

      {loading && <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>Loading audit history…</div>}

      {!loading && rows.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>No audit entries match the current filters.</div>
      )}

      {!loading && groups.map(({ day, items }) => (
        <div key={day} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{day}</div>
          {items.map((row) => (
            <div key={row.id} style={{ position: 'relative', paddingLeft: 18, paddingBottom: 12 }}>
              <span style={{ position: 'absolute', left: 4, top: 4, width: 8, height: 8, borderRadius: 4, background: 'var(--ac-primary)' }} />
              <div style={{ fontWeight: 700, fontSize: 13 }}>{row.action}</div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>
                {row.entity_type ? `${row.entity_type}` : 'system'}
                {row.entity_id ? ` · ${row.entity_id}` : ''}
                {row.agreement_version ? ` · agreement ${row.agreement_version}` : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{new Date(row.created_at).toLocaleString()}</div>
              {(row.previous_value || row.new_value) && (
                <details style={{ marginTop: 4 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--ac-primary)' }}>Diff</summary>
                  <pre style={{ marginTop: 4, fontSize: 10, lineHeight: 1.4, background: 'var(--ac-bg)', padding: 8, borderRadius: 6, overflow: 'auto' }}>
{JSON.stringify({ previous: row.previous_value, next: row.new_value }, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function groupByDay(rows) {
  const map = new Map();
  for (const row of rows) {
    const day = new Date(row.created_at).toLocaleDateString();
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(row);
  }
  return [...map.entries()].map(([day, items]) => ({ day, items }));
}

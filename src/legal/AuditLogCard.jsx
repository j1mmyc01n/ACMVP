import React, { useEffect, useState } from 'react';
import { fetchAuditLog } from '../lib/audit';

const ACTION_LABEL = {
  CRN_CREATED: 'CRN issued',
  CRN_REDEEMED: 'CRN redeemed',
  CHECK_IN_SUBMITTED: 'Check-in submitted',
  PROFILE_UPDATED: 'Profile updated',
  CALL_WINDOW_UPDATED: 'Call window changed',
  MOOD_SUBMITTED: 'Mood submitted',
  CONCERN_SUBMITTED: 'Concern submitted',
  AI_TRIAGE_USED: 'AI triage used',
};

// Renders the immutable agreement / audit log for a profile or CRN.
// Drop in to the bottom of the check-in page (and anywhere a "profile
// card" view exists) so the user can see the trail of agreements.
export default function AuditLogCard({ crn, profileId, title = 'Agreement & Audit Log' }) {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!crn && !profileId) {
      setLoading(false);
      return () => {};
    }
    fetchAuditLog({ crn, profileId, limit: 25 }).then((rows) => {
      if (!cancelled) {
        setAuditLog(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [crn, profileId]);

  return (
    <div className="rounded-xl border bg-white p-4" style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: 18 }}>
      <h3 className="font-bold" style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: 12, color: 'var(--ac-muted)', marginBottom: 12 }}>
        Each platform action you take is recorded here with the version of the legal bundle in force at that moment, for safety, governance and compliance.
      </p>

      {loading && <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>Loading…</div>}

      {!loading && !crn && !profileId && (
        <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
          Sign in or redeem a CRN to see your audit log.
        </div>
      )}

      {!loading && (crn || profileId) && auditLog.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
          No actions recorded yet.
        </div>
      )}

      {auditLog.map((log) => (
        <div key={log.id} className="border-t py-3 text-sm" style={{ borderTop: '1px solid var(--ac-border)', padding: '10px 0', fontSize: 13, color: 'var(--ac-text)' }}>
          <div><b>Action:</b> {ACTION_LABEL[log.action] || log.action}</div>
          <div><b>Status:</b> Agreement accepted</div>
          <div><b>Legal Bundle:</b> {log.legal_bundle_version}</div>
          <div><b>Timestamp:</b> {new Date(log.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabase';
import { fetchAuditLogs, LEGAL_VERSIONS } from '../../lib/audit';
import { fetchConsentHistory } from '../../lib/consent';
import { buildFHIRPatient } from '../../lib/fhir';

// Surfaces the FHIR-ready compliance state for a single user / CRN.
// Used on the profile page and the admin audit dashboard.
export default function ProfileComplianceCard({ profile, crn, userId }) {
  const [latestConsent, setLatestConsent] = useState(null);
  const [latestAudit, setLatestAudit] = useState(null);
  const [latestCheckIn, setLatestCheckIn] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileId = userId || profile?.user_id || profile?.id;
  const targetCRN = crn || profile?.crn;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const tasks = [];
      if (profileId) tasks.push(fetchConsentHistory({ userId: profileId, limit: 1 }));
      else tasks.push(Promise.resolve([]));

      tasks.push(fetchAuditLogs({ userId: profileId, crn: targetCRN, limit: 1 }));

      let checkInQuery = supabase.from('check_ins').select('*').order('created_at', { ascending: false }).limit(1);
      if (profileId) checkInQuery = checkInQuery.eq('user_id', profileId);
      else if (targetCRN) checkInQuery = checkInQuery.eq('crn', targetCRN);
      tasks.push(checkInQuery);

      const [consents, audits, checkInRes] = await Promise.all(tasks);
      if (cancelled) return;
      setLatestConsent(consents?.[0] || null);
      setLatestAudit(audits?.[0] || null);
      setLatestCheckIn(checkInRes?.data?.[0] || null);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [profileId, targetCRN]);

  const fhir = profile ? buildFHIRPatient({ ...profile, crn: targetCRN }) : null;
  const consentOK = !!latestConsent?.accepted;
  const riskTone = consentOK ? '#16a34a' : '#dc2626';

  return (
    <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{profile?.full_name || 'Unknown'}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: riskTone, textTransform: 'uppercase', letterSpacing: 1 }}>
          {consentOK ? 'Compliant' : 'Pending consent'}
        </span>
      </div>
      <Row label="CRN" value={targetCRN || '—'} mono />
      <Row label="Role" value={profile?.role || 'user'} />
      <Row label="Consent status" value={consentOK ? 'Accepted' : 'Not on file'} valueColor={riskTone} />
      <Row
        label="Last agreement"
        value={latestConsent?.accepted_at ? new Date(latestConsent.accepted_at).toLocaleString() : '—'}
        sub={latestConsent ? `${latestConsent.agreement_type} · ${latestConsent.agreement_version}` : null}
      />
      <Row
        label="Last check-in"
        value={latestCheckIn?.created_at ? new Date(latestCheckIn.created_at).toLocaleString() : '—'}
        sub={latestCheckIn?.status || null}
      />
      <Row
        label="Last profile update"
        value={profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : '—'}
      />
      <Row label="Legal bundle" value={LEGAL_VERSIONS.legal_bundle} mono />
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--ac-border)', fontSize: 12, color: 'var(--ac-muted)' }}>
        FHIR resourceType: <code>{fhir?.resourceType || 'Patient'}</code>
      </div>
      {loading && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ac-muted)' }}>Refreshing…</div>
      )}
      {latestAudit && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ac-muted)' }}>
          Last action: <strong>{latestAudit.action}</strong> ({new Date(latestAudit.created_at).toLocaleString()})
        </div>
      )}
    </div>
  );
}

function Row({ label, value, sub, mono, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px dashed var(--ac-border)', fontSize: 13 }}>
      <span style={{ color: 'var(--ac-muted)' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 600, fontFamily: mono ? 'monospace' : undefined, color: valueColor || 'var(--ac-text)' }}>
          {value}
        </span>
        {sub && <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{sub}</div>}
      </span>
    </div>
  );
}

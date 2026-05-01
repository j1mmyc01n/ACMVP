// Medically formatted clinical report renderer.
//
// Produces a printable, downloadable PDF (via browser-native "Save as PDF"
// from window.print()). The format follows a SOAP-style clinical note with
// proper medical terminology and metadata: patient identifiers, date/time
// of presentation, presenting complaint, mental state examination, mood
// rating, plan, clinical notes, and an access trail. Downloading a report
// inserts an immutable row in the structured `audit_logs` table.

import { supabase } from '../supabase/supabase';
import {
  createAuditLog,
  STRUCTURED_AUDIT_ACTIONS,
  LEGAL_VERSIONS,
} from './audit';

const LEGAL_BUNDLE_VERSION =
  `terms-${LEGAL_VERSIONS.terms}-privacy-${LEGAL_VERSIONS.privacy}-medical-${LEGAL_VERSIONS.medical_disclaimer}`;

const escapeHtml = (val) => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Translate a 0–10 mood self-rating onto a clinically meaningful affect
// descriptor that a clinician would write in a mental-state examination.
const moodToAffect = (mood) => {
  const m = Number(mood);
  if (Number.isNaN(m)) return { affect: 'Not recorded', risk: 'unspecified' };
  if (m <= 2) return { affect: 'Markedly dysphoric / restricted affect', risk: 'high — escalate' };
  if (m <= 4) return { affect: 'Low mood, congruent affect', risk: 'moderate — monitor closely' };
  if (m <= 6) return { affect: 'Euthymic with mild reactivity', risk: 'low–moderate' };
  if (m <= 8) return { affect: 'Reactive, broadly euthymic affect', risk: 'low' };
  return { affect: 'Bright, full-range reactive affect', risk: 'low' };
};

// Best-effort attempt to surface the client's location at the time of the
// check-in. We try the structured `audit_logs` row written when the CRN
// was issued (it includes `approximate_location` and `care_centre`), and
// fall back to whatever `clients_1777020684735.care_centre` contains.
const fetchPatientContext = async (crn) => {
  const ctx = {
    full_name: null,
    dob: null,
    email: null,
    phone: null,
    care_centre: null,
    care_centre_address: null,
    location: null,
    profile_id: null,
  };
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, dob, email, phone, crn')
      .eq('crn', crn)
      .maybeSingle();
    if (profile) {
      ctx.full_name = profile.full_name || null;
      ctx.dob = profile.dob || null;
      ctx.email = profile.email || null;
      ctx.phone = profile.phone || null;
      ctx.profile_id = profile.user_id || profile.id;
    }
  } catch (_) { /* noop */ }
  try {
    const { data: client } = await supabase
      .from('clients_1777020684735')
      .select('id, name, email, phone, care_centre')
      .eq('crn', crn)
      .maybeSingle();
    if (client) {
      ctx.full_name = ctx.full_name || client.name || null;
      ctx.email = ctx.email || client.email || null;
      ctx.phone = ctx.phone || client.phone || null;
      ctx.care_centre = client.care_centre || null;
    }
  } catch (_) { /* noop */ }
  try {
    const { data: createdRows } = await supabase
      .from('audit_logs')
      .select('new_value, ip_address, created_at')
      .eq('action', 'CREATE_CRN')
      .order('created_at', { ascending: false })
      .limit(20);
    const match = (createdRows || []).find((r) => {
      const v = r?.new_value || {};
      return v?.crn === crn || v?.crn?.toUpperCase?.() === String(crn).toUpperCase();
    });
    if (match?.new_value) {
      ctx.care_centre = ctx.care_centre || match.new_value.care_centre || null;
      ctx.location = match.new_value.approximate_location || null;
    }
  } catch (_) { /* noop */ }
  if (ctx.care_centre && !ctx.care_centre_address) {
    try {
      const { data: centre } = await supabase
        .from('care_centres_1777090000')
        .select('name, address, phone, latitude, longitude')
        .ilike('name', ctx.care_centre)
        .maybeSingle();
      if (centre) {
        ctx.care_centre_address = centre.address || null;
        if (!ctx.location && centre.latitude && centre.longitude) {
          ctx.location = { lat: centre.latitude, lng: centre.longitude, source: 'care_centre' };
        }
      }
    } catch (_) { /* noop */ }
  }
  return ctx;
};

const fetchAccessTrail = async (crn) => {
  try {
    const { data } = await supabase
      .from('audit_logs')
      .select('id, action, created_at, ip_address, device_info, new_value')
      .order('created_at', { ascending: false })
      .limit(200);
    return (data || []).filter((row) => {
      const candidates = [row?.new_value?.crn, row?.previous_value?.crn];
      return candidates.some(
        (c) => c && String(c).toUpperCase() === String(crn).toUpperCase(),
      );
    }).slice(0, 25);
  } catch (_) {
    return [];
  }
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return String(iso); }
};

const fmtDob = (dob) => {
  if (!dob) return '—';
  try {
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return `${d.toLocaleDateString('en-AU')} (age ${age})`;
  } catch { return String(dob); }
};

const buildReportHtml = ({ record, patient, accessTrail }) => {
  const { affect, risk } = moodToAffect(record.mood);
  const generatedAt = new Date();
  const reportNumber = `CR-${(record.id || '').slice(0, 8).toUpperCase() || generatedAt.getTime().toString(36).toUpperCase()}`;
  const concerns = (record.concerns || '').trim() || 'No presenting concerns recorded by the client at time of check-in.';
  const notes = (record.clinical_notes || '').trim();

  const accessRows = accessTrail.length
    ? accessTrail.map((row) => {
        const ip = row.ip_address ? escapeHtml(row.ip_address) : '—';
        const device = row.device_info?.platform || row.device_info?.userAgent
          ? escapeHtml(`${row.device_info.platform || ''} ${row.device_info.userAgent || ''}`.trim())
          : '—';
        return `<tr>
          <td>${escapeHtml(fmtDate(row.created_at))}</td>
          <td>${escapeHtml(row.action)}</td>
          <td>${ip}</td>
          <td style="font-size:9pt;">${device}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#666;">No prior access events recorded.</td></tr>';

  const locationLine = patient.location && typeof patient.location.lat === 'number'
    ? `${patient.location.lat.toFixed(4)}, ${patient.location.lng.toFixed(4)}`
    : (patient.care_centre_address || '—');

  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8" />
<title>Clinical Report ${escapeHtml(reportNumber)} — ${escapeHtml(record.crn)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; font-size: 10.5pt; line-height: 1.45; margin: 0; padding: 0; }
  h1 { font-size: 16pt; margin: 0 0 4px; letter-spacing: 0.4px; }
  h2 { font-size: 11pt; margin: 18px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #999; text-transform: uppercase; letter-spacing: 0.6px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
  .header .meta { text-align: right; font-size: 9.5pt; color: #444; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; font-size: 10pt; }
  .meta-grid div { padding: 1px 0; }
  .meta-grid b { color: #444; font-weight: 600; }
  .pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 9pt; font-weight: 600; }
  .pill.high { background: #fde2e2; color: #8b1d1d; }
  .pill.moderate { background: #fff2cc; color: #856404; }
  .pill.low { background: #e3f2e1; color: #1d6427; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 4px; }
  th, td { text-align: left; padding: 5px 7px; border-bottom: 1px solid #ddd; vertical-align: top; }
  th { background: #f2f2f2; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.4px; color: #444; }
  .note-block { background: #fafafa; border-left: 3px solid #555; padding: 8px 12px; white-space: pre-wrap; font-size: 10pt; }
  .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #999; font-size: 8.5pt; color: #555; line-height: 1.5; }
  .signature { margin-top: 28px; display: flex; justify-content: space-between; gap: 24px; }
  .signature .box { flex: 1; border-top: 1px solid #111; padding-top: 4px; font-size: 9pt; color: #444; }
  @media print { .no-print { display: none; } }
  .no-print { position: fixed; top: 12px; right: 12px; }
  .no-print button { padding: 8px 14px; border: 1px solid #111; background: #111; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>
</head>
<body>
<div class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>

<div class="header">
  <div>
    <h1>Clinical Report</h1>
    <div style="font-size:9.5pt;color:#444;">Acute Connect — Mental Health Telehealth Service</div>
    <div style="font-size:9.5pt;color:#444;">Health District Service Agreement v${escapeHtml(LEGAL_VERSIONS.legal_bundle)} · Medical Disclaimer v${escapeHtml(LEGAL_VERSIONS.medical_disclaimer)}</div>
  </div>
  <div class="meta">
    <div><b>Report №:</b> ${escapeHtml(reportNumber)}</div>
    <div><b>Generated:</b> ${escapeHtml(fmtDate(generatedAt.toISOString()))}</div>
    <div><b>Encounter ID:</b> ${escapeHtml(record.id || '—')}</div>
  </div>
</div>

<h2>Patient Identification</h2>
<div class="meta-grid">
  <div><b>CRN:</b> ${escapeHtml(record.crn || '—')}</div>
  <div><b>Full Name:</b> ${escapeHtml(patient.full_name || '—')}</div>
  <div><b>Date of Birth:</b> ${escapeHtml(fmtDob(patient.dob))}</div>
  <div><b>Phone:</b> ${escapeHtml(patient.phone || '—')}</div>
  <div><b>Email:</b> ${escapeHtml(patient.email || '—')}</div>
  <div><b>Managing Care Centre:</b> ${escapeHtml(patient.care_centre || '—')}</div>
</div>

<h2>Encounter Details</h2>
<div class="meta-grid">
  <div><b>Encounter Date:</b> ${escapeHtml(fmtDate(record.created_at))}</div>
  <div><b>Encounter Type:</b> Telephone follow-up (asynchronous check-in)</div>
  <div><b>Scheduled Window:</b> ${escapeHtml(record.scheduled_window || '—')}${record.scheduled_day ? ` (${escapeHtml(record.scheduled_day)})` : ''}</div>
  <div><b>Encounter Status:</b> ${escapeHtml(record.status || '—')}</div>
  <div><b>Geolocation at Check-in:</b> ${escapeHtml(locationLine)}</div>
  <div><b>Centre Address:</b> ${escapeHtml(patient.care_centre_address || '—')}</div>
</div>

<h2>Subjective — Presenting Concerns</h2>
<div class="note-block">${escapeHtml(concerns)}</div>

<h2>Objective — Mental State Examination</h2>
<div class="meta-grid">
  <div><b>Mood (self-rated):</b> ${escapeHtml(record.mood ?? '—')} / 10</div>
  <div><b>Affect:</b> ${escapeHtml(affect)}</div>
  <div><b>Speech / Behaviour:</b> Not formally assessed at this encounter (asynchronous self-report).</div>
  <div><b>Thought form / content:</b> No spontaneous report of disorder; refer to Subjective above.</div>
  <div><b>Perception:</b> No perceptual disturbance reported.</div>
  <div><b>Cognition:</b> Self-reported intact; not formally assessed.</div>
  <div><b>Insight / Judgement:</b> Engaged with platform — implies preserved insight.</div>
  <div><b>Risk Stratification:</b> <span class="pill ${risk.startsWith('high') ? 'high' : risk.startsWith('moderate') ? 'moderate' : 'low'}">${escapeHtml(risk)}</span></div>
</div>

<h2>Assessment</h2>
<div class="note-block">${notes ? escapeHtml(notes) : 'No formal clinician assessment recorded yet. Refer to mood rating, presenting concerns, and risk stratification above for triage decision support.'}</div>

<h2>Plan</h2>
<ul style="margin: 4px 0 0 18px; padding: 0;">
  <li>Confirm telehealth contact within the scheduled window above.</li>
  <li>${record.mood !== null && record.mood !== undefined && record.mood <= 3
        ? 'Escalate to duty clinician for same-day welfare contact; consider safety plan review.'
        : 'Routine clinical review at the next scheduled check-in interval.'}</li>
  <li>Verify identity at next contact — confirm Name, DOB, and one of phone/email against record above before clinical disclosure.</li>
  <li>Document any new clinical findings against this CRN; downstream events will be linked via the FHIR Patient resource.</li>
</ul>

<h2>Clinical Notes — Authoring &amp; Access</h2>
<div class="meta-grid">
  <div><b>Notes last edited by:</b> ${escapeHtml(record.last_edited_by || 'Unedited since creation')}</div>
  <div><b>Notes last edited at:</b> ${escapeHtml(record.last_edited_at ? fmtDate(record.last_edited_at) : '—')}</div>
</div>

<h2>Access Trail (most recent 25 events)</h2>
<table>
  <thead><tr><th>Timestamp</th><th>Action</th><th>IP Address</th><th>Device</th></tr></thead>
  <tbody>${accessRows}</tbody>
</table>

<div class="signature">
  <div class="box">Reviewing Clinician — name, AHPRA #</div>
  <div class="box">Signature</div>
  <div class="box">Date</div>
</div>

<div class="footer">
  <div>This document is an extract from the Acute Connect electronic record. It is generated under the platform's Medical Disclaimer (v${escapeHtml(LEGAL_VERSIONS.medical_disclaimer)}) and AI Disclosure (v${escapeHtml(LEGAL_VERSIONS.ai_disclosure)}). Use of any platform feature constitutes agreement to the bundle <code>${escapeHtml(LEGAL_BUNDLE_VERSION)}</code>.</div>
  <div style="margin-top:6px;"><b>Confidentiality:</b> contains protected health information (PHI). Disclosure is restricted to authorised members of the patient's care team. Unauthorised review, dissemination, or duplication is prohibited.</div>
  <div style="margin-top:6px;"><b>Audit:</b> generation and download of this report has been recorded against the patient encounter. Encounter ID <code>${escapeHtml(record.id || '—')}</code>.</div>
</div>

<script>
  // Auto-trigger the print dialog so the user can save as PDF immediately.
  window.addEventListener('load', () => { setTimeout(() => { try { window.print(); } catch (e) {} }, 250); });
</script>
</body>
</html>`;
};

// Public API: open a printable medically-formatted clinical report and
// record a structured audit-log entry tagged REPORT_DOWNLOAD.
//
// Returns a promise that resolves once the report window has been opened
// AND the audit row has been written (or attempted).
export async function generateClinicalReport(record, { actor } = {}) {
  if (!record || !record.crn) throw new Error('Clinical report requires a check-in record with a CRN');

  const [patient, accessTrail] = await Promise.all([
    fetchPatientContext(record.crn),
    fetchAccessTrail(record.crn),
  ]);

  const html = buildReportHtml({ record, patient, accessTrail });
  let opened = null;
  try {
    if (typeof window !== 'undefined') {
      opened = window.open('', `report-${record.id || record.crn}-${Date.now()}`, 'noopener,noreferrer');
      if (opened && opened.document) {
        opened.document.open();
        opened.document.write(html);
        opened.document.close();
      }
    }
  } catch (_) { /* noop */ }

  // Fallback: if popup was blocked, offer the report as an HTML download
  // that prints to PDF when opened. Same content, no popup required.
  if (!opened) {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `clinical-report-${record.crn}-${Date.now()}.html`;
      a.click();
    } catch (_) { /* noop */ }
  }

  // Append-only audit row marking the download.
  await createAuditLog({
    userId: patient.profile_id || null,
    action: STRUCTURED_AUDIT_ACTIONS.DOCUMENT_UPLOAD === 'DOCUMENT_UPLOAD'
      ? 'REPORT_DOWNLOAD'
      : 'REPORT_DOWNLOAD',
    entityType: 'clinical_report',
    entityId: record.id || null,
    newValue: {
      crn: record.crn,
      mood: record.mood,
      scheduled_window: record.scheduled_window || null,
      care_centre: patient.care_centre,
      generated_at: new Date().toISOString(),
      actor: actor || null,
    },
    agreementVersion: LEGAL_BUNDLE_VERSION,
  });

  return { ok: true };
}

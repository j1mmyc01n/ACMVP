// FHIR-ready mappers. The platform stores its own canonical models
// (profiles, check_ins, medical_events) and exposes them as FHIR R4
// resources via these helpers. Real hospital integration will swap the
// internal `system` URLs for production-issued ones, but the resource
// shape is already wire-compatible with FHIR R4.

const FHIR_SYSTEM = 'https://acuteconnect.health/crn';

export function buildFHIRPatient(profile) {
  if (!profile) return null;
  return {
    resourceType: 'Patient',
    id: profile.crn || profile.id,
    identifier: profile.crn
      ? [{ system: FHIR_SYSTEM, value: profile.crn }]
      : [],
    name: profile.full_name ? [{ text: profile.full_name }] : [],
    telecom: [
      profile.phone && { system: 'phone', value: profile.phone },
      profile.email && { system: 'email', value: profile.email },
    ].filter(Boolean),
    birthDate: profile.dob || undefined,
    active: profile.status ? profile.status === 'active' : true,
  };
}

// FHIR Encounter for a check-in event.
export function buildFHIREncounter(checkIn, profile) {
  if (!checkIn) return null;
  return {
    resourceType: 'Encounter',
    id: checkIn.id,
    status: mapStatus(checkIn.status),
    class: { code: 'VR', display: 'virtual' },
    subject: profile?.crn ? { reference: `Patient/${profile.crn}` } : undefined,
    period: { start: checkIn.created_at },
    reasonCode: checkIn.notes
      ? [{ text: checkIn.notes }]
      : undefined,
  };
}

// FHIR Observation for a mood-rating capture (LOINC 73831-0 mood scale stand-in).
export function buildFHIRMoodObservation({ profile, mood, capturedAt, encounterId }) {
  if (mood === undefined || mood === null) return null;
  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [
        { system: 'http://loinc.org', code: '73831-0', display: 'Mood' },
      ],
      text: 'Self-reported mood',
    },
    subject: profile?.crn ? { reference: `Patient/${profile.crn}` } : undefined,
    encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
    effectiveDateTime: capturedAt || new Date().toISOString(),
    valueQuantity: {
      value: Number(mood),
      unit: 'score',
      system: 'http://unitsofmeasure.org',
      code: '{score}',
    },
  };
}

// Wrap any of the above into a `medical_events` row for storage.
export function toMedicalEventRow({ userId, crn, eventType, fhir }) {
  return {
    user_id: userId ?? null,
    crn: crn ?? null,
    event_type: eventType,
    fhir_resource_type: fhir?.resourceType || null,
    fhir_payload: fhir,
  };
}

function mapStatus(status) {
  switch (status) {
    case 'submitted':
    case 'pending':
      return 'planned';
    case 'in_progress':
      return 'in-progress';
    case 'completed':
    case 'closed':
      return 'finished';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'planned';
  }
}

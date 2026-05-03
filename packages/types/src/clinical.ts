// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditLog {
  id?: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  agreement_version?: string;
  ip_address?: string;
  device_info?: Record<string, unknown>;
  created_at?: string;
}

// ─── Profile Audit ───────────────────────────────────────────────────────────

export interface ProfileAuditLog {
  id?: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  device_info?: Record<string, unknown>;
  legal_bundle_version: string;
  agreement_accepted: boolean;
  created_at?: string;
}

// ─── Medical ─────────────────────────────────────────────────────────────────

export interface MedicalEvent {
  id?: string;
  user_id?: string;
  crn?: string;
  event_type: string;
  fhir_resource_type?: string;
  fhir_payload: Record<string, unknown>;
  created_at?: string;
}

export const MEDICAL_EVENT_TYPES = Object.freeze([
  'patient_created',
  'check_in',
  'mood_observation',
  'note_added',
  'document_uploaded',
  'medication_change',
  'lab_result',
] as const);

export type MedicalEventType = (typeof MEDICAL_EVENT_TYPES)[number];

export const FHIR_RESOURCE_TYPES = Object.freeze([
  'Patient',
  'Encounter',
  'Observation',
  'Condition',
  'MedicationStatement',
  'DocumentReference',
  'CarePlan',
  'AllergyIntolerance',
  'Immunization',
] as const);

export type FhirResourceType = (typeof FHIR_RESOURCE_TYPES)[number];

// ─── Consent ─────────────────────────────────────────────────────────────────

export interface ConsentAgreement {
  id?: string;
  user_id?: string;
  agreement_type: string;
  agreement_version: string;
  accepted: boolean;
  accepted_at?: string;
  ip_address?: string;
  device_info?: Record<string, unknown>;
  source_action?: string;
}

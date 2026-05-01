import { supabase } from '../supabase/supabase';
import { collectDeviceInfo, createAuditLog, STRUCTURED_AUDIT_ACTIONS } from './audit';
import { recordConsent, CONSENT_TYPES, COMBINED_AGREEMENT_VERSION } from './consent';
import { buildFHIRPatient, toMedicalEventRow } from './fhir';

// Spec-shaped CRN creation flow. Records consent, inserts a crn_records
// row, audits the action, and emits a FHIR Patient medical_event.
export async function createCRN({
  client = supabase,
  userId = null,
  crn,
  profile,
  ipAddress = null,
  deviceInfo,
} = {}) {
  if (!crn) throw new Error('createCRN: crn is required');
  const device = deviceInfo ?? collectDeviceInfo();

  await recordConsent({
    client,
    userId,
    agreementType: CONSENT_TYPES.PLATFORM_USE_AND_MEDICAL_DISCLAIMER,
    agreementVersion: COMBINED_AGREEMENT_VERSION,
    sourceAction: 'create_crn',
    ipAddress,
    deviceInfo: device,
  });

  const { data: record, error } = await client
    .from('crn_records')
    .insert({
      user_id: userId,
      crn,
      status: 'active',
      created_by: userId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  await createAuditLog({
    client,
    userId,
    action: STRUCTURED_AUDIT_ACTIONS.CREATE_CRN,
    entityType: 'crn_records',
    entityId: record.id,
    previousValue: null,
    newValue: record,
    agreementVersion: COMBINED_AGREEMENT_VERSION,
    ipAddress,
    deviceInfo: device,
  });

  if (profile) {
    const fhir = buildFHIRPatient({ ...profile, crn });
    if (fhir) {
      await client.from('medical_events').insert(
        toMedicalEventRow({ userId, crn, eventType: 'patient_created', fhir }),
      );
    }
  }

  return record;
}

/**
 * @typedef {Object} MedicalEvent
 * @property {string=} id
 * @property {string=} user_id
 * @property {string=} crn
 * @property {string} event_type
 * @property {string=} fhir_resource_type
 * @property {object} fhir_payload
 * @property {string=} created_at
 */

export const MEDICAL_EVENT_TYPES = Object.freeze([
  'patient_created',
  'check_in',
  'mood_observation',
  'note_added',
  'document_uploaded',
  'medication_change',
  'lab_result',
]);

export const FHIR_RESOURCE_TYPES = Object.freeze([
  'Patient', 'Encounter', 'Observation', 'Condition', 'MedicationStatement',
  'DocumentReference', 'CarePlan', 'AllergyIntolerance', 'Immunization',
]);

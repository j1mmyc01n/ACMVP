// Lightweight runtime validators. Mirrors the shape of `/schemas/*` so
// callers can validate without pulling Zod into the bundle.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CRN_RE = /^CRN-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const VALID_ROLES = new Set(['user', 'staff', 'admin', 'super_admin', 'sysadmin', 'field_agent', 'client']);

function fail(field, msg) {
  return { ok: false, field, message: msg };
}

export function validateEmail(value) {
  if (!value) return fail('email', 'Email is required');
  if (!EMAIL_RE.test(String(value).trim())) return fail('email', 'Please enter a valid email');
  return { ok: true };
}

export function validateCRN(value) {
  if (!value) return fail('crn', 'CRN is required');
  if (!CRN_RE.test(String(value).trim().toUpperCase())) {
    return fail('crn', 'CRN must look like CRN-XXXX-XXXX');
  }
  return { ok: true };
}

export function validateProfile(input) {
  if (!input || typeof input !== 'object') return fail('profile', 'Profile is required');
  if (!input.full_name || String(input.full_name).trim().length < 2) {
    return fail('full_name', 'Full name is required');
  }
  if (input.email) {
    const r = validateEmail(input.email);
    if (!r.ok) return r;
  }
  if (input.dob && !ISO_DATE_RE.test(input.dob)) {
    return fail('dob', 'Date of birth must be YYYY-MM-DD');
  }
  if (input.role && !VALID_ROLES.has(input.role)) {
    return fail('role', `Role must be one of: ${[...VALID_ROLES].join(', ')}`);
  }
  return { ok: true };
}

export function validateCheckIn(input) {
  if (!input || typeof input !== 'object') return fail('check_in', 'Check-in payload required');
  if (!input.user_id && !input.crn) {
    return fail('check_in', 'Either user_id or crn must be supplied');
  }
  return { ok: true };
}

export function validateMedicalEvent(input) {
  if (!input || typeof input !== 'object') return fail('medical_event', 'Medical event payload required');
  if (!input.event_type) return fail('event_type', 'event_type is required');
  if (!input.fhir_payload || typeof input.fhir_payload !== 'object') {
    return fail('fhir_payload', 'fhir_payload object is required');
  }
  return { ok: true };
}

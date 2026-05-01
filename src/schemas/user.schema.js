// Canonical user / profile shape — mirrors the `profiles` table.
// Field types are documented as JSDoc so editors can autocomplete and
// `validateProfile` (in lib/validation.js) can enforce them at runtime.

/**
 * @typedef {Object} UserProfile
 * @property {string=} id
 * @property {string=} user_id
 * @property {string} full_name
 * @property {string=} dob               ISO date YYYY-MM-DD
 * @property {string=} phone
 * @property {string=} email
 * @property {('user'|'staff'|'admin'|'super_admin'|'sysadmin'|'field_agent'|'client')=} role
 * @property {string=} crn
 * @property {string=} created_at
 * @property {string=} updated_at
 */

export const USER_ROLES = Object.freeze([
  'user', 'staff', 'admin', 'super_admin', 'sysadmin', 'field_agent', 'client',
]);

export const USER_FIELDS = Object.freeze([
  'id', 'user_id', 'full_name', 'dob', 'phone', 'email', 'role', 'crn',
  'created_at', 'updated_at',
]);

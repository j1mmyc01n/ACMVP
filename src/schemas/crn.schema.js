/**
 * @typedef {Object} CRNRecord
 * @property {string=} id
 * @property {string} crn
 * @property {string=} user_id
 * @property {('active'|'inactive'|'revoked')} status
 * @property {string=} created_by
 * @property {string=} created_at
 */

export const CRN_STATUSES = Object.freeze(['active', 'inactive', 'revoked']);
export const CRN_FIELDS = Object.freeze([
  'id', 'crn', 'user_id', 'status', 'created_by', 'created_at',
]);

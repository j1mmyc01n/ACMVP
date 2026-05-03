/**
 * @typedef {Object} AuditLog
 * @property {string=} id
 * @property {string=} user_id
 * @property {string} action
 * @property {string=} entity_type
 * @property {string=} entity_id
 * @property {object=} previous_value
 * @property {object=} new_value
 * @property {string=} agreement_version
 * @property {string=} ip_address
 * @property {object=} device_info
 * @property {string=} created_at
 */

export const AUDIT_FIELDS = Object.freeze([
  'id', 'user_id', 'action', 'entity_type', 'entity_id', 'previous_value',
  'new_value', 'agreement_version', 'ip_address', 'device_info', 'created_at',
]);

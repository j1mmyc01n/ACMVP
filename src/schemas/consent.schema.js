/**
 * @typedef {Object} ConsentAgreement
 * @property {string=} id
 * @property {string=} user_id
 * @property {string} agreement_type
 * @property {string} agreement_version
 * @property {boolean} accepted
 * @property {string=} accepted_at
 * @property {string=} ip_address
 * @property {object=} device_info
 * @property {string=} source_action
 */

export const CONSENT_FIELDS = Object.freeze([
  'id', 'user_id', 'agreement_type', 'agreement_version', 'accepted',
  'accepted_at', 'ip_address', 'device_info', 'source_action',
]);

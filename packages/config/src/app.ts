// ─── Staff Login Config ───────────────────────────────────────────────────────
// TODO: Replace with Supabase Auth (magic link / email+password) once the
//       auth package is fully integrated. This map is only used for the
//       MVP OTP flow as a temporary measure.

export const VALID_STAFF: Record<string, string> = {
  'ops@acuteconnect.health': 'admin',
  'sysadmin@acuteconnect.health': 'sysadmin',
  'agent@acuteconnect.health': 'field_agent',
};

// Pages that are publicly accessible without authentication.
export const PUBLIC_PAGES = new Set([
  'checkin',
  'resources',
  'professionals',
  'join_provider',
  'join_sponsor',
  'request_access',
  'legal',
]);

// ─── App Config ───────────────────────────────────────────────────────────────

export const APP_CONFIG = Object.freeze({
  appName: 'Acute Connect',
  appShortName: 'Acute Connect',
  appDescription: 'Professional mental health support and acute care management platform',
  defaultCentre: 'Camperdown',
  supportEmail: 'support@acuteconnect.health',
  themeColor: '#4F46E5',
});

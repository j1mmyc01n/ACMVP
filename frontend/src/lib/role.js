/**
 * Mocked role gate. Real auth (per-staff logins) will replace this in a
 * future iteration. For now we keep the chosen role in localStorage so the
 * sysadmin can flip between views during configuration.
 */
const KEY = "patientcrm.role";

export function getRole() {
  if (typeof window === "undefined") return "sysadmin";
  return localStorage.getItem(KEY) || "sysadmin";
}

export function setRole(role) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, role);
  window.dispatchEvent(new CustomEvent("role-change", { detail: role }));
}

export const ROLE_OPTIONS = [
  { value: "sysadmin", label: "Sysadmin", desc: "Full access · creates locations, care centres, staff logins." },
  { value: "staff", label: "Staff", desc: "Patient-facing screens only · cannot edit configuration." },
];

export function isSysadmin() {
  return getRole() === "sysadmin";
}

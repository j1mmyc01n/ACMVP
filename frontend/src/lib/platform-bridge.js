/**
 * Platform bridge — when the CRM is embedded in a parent platform iframe,
 * the parent posts the authenticated user's identity, the CRM adopts it,
 * and the backend records the handshake for audit. Falls back to the mock
 * role pill when no parent message arrives (standalone dev / testing).
 *
 * Parent integration (one-line):
 *   const iframe = document.querySelector('#crm-iframe');
 *   iframe.contentWindow.postMessage({
 *     type: 'patientcrm:auth',
 *     role: 'sysadmin',           // 'sysadmin' | 'staff'
 *     name: 'Dr. Harlowe',
 *     email: 'harlowe@org.com',
 *     location_id: 'loc-uuid',    // optional — pre-selects the centre
 *   }, 'https://crm.your-platform.com');
 *
 * The CRM also broadcasts `patientcrm:ready` upward when it boots — the
 * parent can listen for that event and reply once the user is signed in.
 */
import { setRole } from "@/lib/role";

const TYPE = "patientcrm:auth";
const READY_TYPE = "patientcrm:ready";
const EMBEDDED_KEY = "patientcrm.embedded";
const NAME_KEY = "patientcrm.platform-name";
const LOC_KEY = "patientcrm.platform-location";

const API = process.env.REACT_APP_BACKEND_URL;

let installed = false;

async function recordHandshake(payload, origin) {
  try {
    await fetch(`${API}/api/handshake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, parent_origin: origin || null }),
    });
  } catch {
    /* best-effort, never blocks UI */
  }
}

export function installPlatformBridge() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const handler = (event) => {
    const { data } = event;
    if (!data || typeof data !== "object" || data.type !== TYPE) return;

    // Mark embedded mode so the UI can show a hint
    try {
      sessionStorage.setItem(EMBEDDED_KEY, "1");
    } catch {}

    if (data.role && (data.role === "sysadmin" || data.role === "staff")) {
      setRole(data.role);
    }
    if (data.location_id) {
      try {
        localStorage.setItem(LOC_KEY, data.location_id);
        window.dispatchEvent(
          new CustomEvent("platform-location", { detail: data.location_id }),
        );
      } catch {}
    }
    if (data.name) {
      try {
        localStorage.setItem(NAME_KEY, data.name);
        window.dispatchEvent(
          new CustomEvent("platform-name", { detail: data.name }),
        );
      } catch {}
    }
    window.dispatchEvent(
      new CustomEvent("platform-embedded", { detail: { embedded: true } }),
    );

    recordHandshake(
      {
        role: data.role || null,
        name: data.name || null,
        email: data.email || null,
        location_id: data.location_id || null,
      },
      event.origin,
    );
  };

  window.addEventListener("message", handler);

  // Tell the parent we're ready to receive identity. The parent should
  // listen for patientcrm:ready and reply with patientcrm:auth.
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: READY_TYPE }, "*");
    } catch {}
  }
}

export function getPlatformName() {
  try {
    return localStorage.getItem(NAME_KEY) || null;
  } catch {
    return null;
  }
}

export function isEmbedded() {
  try {
    return sessionStorage.getItem(EMBEDDED_KEY) === "1";
  } catch {
    return false;
  }
}

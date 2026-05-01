import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * PWAUpdatePrompt
 *
 * Shows a persistent bottom banner whenever a new service-worker version is
 * waiting to be activated.  Works on all platforms but is especially important
 * for iOS/Safari PWAs added to the Home Screen, where the browser never
 * auto-reloads the page after the SW updates.
 *
 * How it works:
 *  1. `useRegisterSW` (vite-plugin-pwa virtual module) registers the SW and
 *     exposes `needRefresh` — true when a new SW has installed and is waiting.
 *  2. `onRegistered` kicks off a 60-second polling interval so iOS sees updates
 *     within one minute of opening the app instead of waiting for a full restart.
 *  3. When the user taps "Update Now", `updateServiceWorker(true)` tells the
 *     waiting SW to skip-wait, claim all clients, then reloads the page.
 */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      // Poll for updates every 60 s — essential for long-lived iOS PWA sessions.
      const id = setInterval(() => registration.update(), 60 * 1000);
      // Clean up if the module is ever hot-replaced in dev.
      if (import.meta.hot) {
        import.meta.hot.dispose(() => clearInterval(id));
      }
    },
    onRegisterError(err) {
      console.error('[PWA] Service-worker registration failed:', err);
    },
  });

  // When the SW controller changes (new SW has taken over) reload automatically.
  // This covers the case where the user tapped "Update Now" and skipWaiting
  // fired — the controllerchange event is the signal that it is safe to reload.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () =>
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  }, []);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        background: 'var(--ac-surface, #fff)',
        border: '1px solid var(--ac-border, #e2e8f0)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'var(--ac-primary, #4F46E5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 18,
        }}
      >
        🔄
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--ac-text, #0f172a)',
            marginBottom: 2,
          }}
        >
          Update available
        </div>
        <div style={{ fontSize: 11, color: 'var(--ac-muted, #64748b)', lineHeight: 1.4 }}>
          A new version of Acute Connect is ready.
        </div>
      </div>

      {/* Update button */}
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          flexShrink: 0,
          height: 34,
          padding: '0 14px',
          border: 'none',
          borderRadius: 9,
          background: 'var(--ac-primary, #4F46E5)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Update Now
      </button>

      {/* Dismiss */}
      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss update prompt"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          border: 'none',
          background: 'var(--ac-bg, #f8fafc)',
          borderRadius: 7,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ac-muted, #94a3b8)',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        ✕
      </button>
    </div>
  );
}

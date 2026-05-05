import { useEffect, useRef, useState } from "react";
import { Bell, Inbox, AlertCircle, Megaphone, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

const KEY = "patientcrm.device-id";
const KIND_META = {
  crn_routed: { icon: Inbox, c: "#2563eb", bg: "#eff6ff", label: "CRN routed" },
  escalation: { icon: AlertCircle, c: "#dc2626", bg: "#fef2f2", label: "Escalation" },
  announcement: { icon: Megaphone, c: "#a16207", bg: "#fef3c7", label: "Announcement" },
  care_reminder: { icon: Sparkles, c: "#7c3aed", bg: "#f5f3ff", label: "Care Pulse" },
  test: { icon: Bell, c: "#525252", bg: "#f5f5f2", label: "Test" },
};

function relTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / (60 * 24))}d`;
}

async function ensureDevice(role, locationId) {
  let id = localStorage.getItem(KEY);
  if (id) return id;
  const label =
    role === "sysadmin"
      ? "Sysadmin · this browser"
      : `${navigator.userAgentData?.platform || "Browser"} · ${new Date().toLocaleDateString()}`;
  try {
    const d = await api.registerDevice({
      label,
      role: role || "staff",
      location_id: locationId || null,
      user_agent: navigator.userAgent,
    });
    localStorage.setItem(KEY, d.id);
    return d.id;
  } catch {
    return null;
  }
}

export default function NotificationBell({ role, locationId }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [deviceId, setDeviceId] = useState(null);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const lastSeenRef = useRef("1970-01-01T00:00:00Z");
  const dropdownRef = useRef(null);

  // Register device once we know role + location
  useEffect(() => {
    (async () => {
      const id = await ensureDevice(role, locationId);
      setDeviceId(id);
    })();
  }, [role, locationId]);

  const refresh = async () => {
    if (!deviceId) return;
    try {
      const j = await api.notifications(deviceId);
      setItems(j.items || []);
      setUnread(j.unread || 0);
      // OS-level toast for new items
      if (
        permission === "granted" &&
        j.last_seen &&
        j.last_seen > lastSeenRef.current
      ) {
        // do nothing — last_seen advanced
      } else if (permission === "granted" && j.unread > 0) {
        const fresh = (j.items || []).find(
          (i) => (i.created_at || "") > lastSeenRef.current,
        );
        if (fresh) {
          try {
            new Notification(fresh.title || "Patient CRM", {
              body: fresh.body || "",
              tag: fresh.id,
            });
          } catch {}
        }
      }
      lastSeenRef.current = j.last_seen || lastSeenRef.current;
    } catch {}
  };

  useEffect(() => {
    if (!deviceId) return;
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermission(p);
  };

  const markSeen = async () => {
    if (!deviceId) return;
    await api.markNotificationsSeen(deviceId);
    setUnread(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-[10px] border border-paper-rule bg-white flex items-center justify-center hover:border-ink"
        data-testid="bell-btn"
        aria-label="Notifications"
      >
        <Bell size={15} strokeWidth={1.8} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#dc2626] text-white text-[10px] font-mono leading-none flex items-center justify-center font-bold"
            data-testid="bell-unread"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-[360px] max-h-[520px] bg-white border border-paper-rule rounded-[14px] shadow-lg z-50 flex flex-col overflow-hidden"
          data-testid="bell-dropdown"
        >
          <div className="px-4 py-3 border-b border-paper-rule flex items-center justify-between gap-2">
            <div>
              <div className="label-micro">Notifications</div>
              <div className="text-[12px] text-ink-muted">
                {items.length === 0 ? "Nothing yet" : `${unread} new of ${items.length}`}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {permission !== "granted" && (
                <button
                  onClick={requestPermission}
                  className="btn-ghost text-[11.5px] !py-1 !px-2"
                  data-testid="bell-permit"
                >
                  Enable on this device
                </button>
              )}
              {unread > 0 && (
                <button
                  onClick={markSeen}
                  className="btn-ghost text-[11.5px] !py-1 !px-2 flex items-center gap-1"
                  data-testid="bell-mark-seen"
                >
                  <Check size={11} strokeWidth={2} />
                  Mark read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto scrollbar-thin">
            {items.length === 0 ? (
              <div className="text-[12.5px] text-ink-muted py-10 text-center">
                You&apos;re all caught up.
              </div>
            ) : (
              items.map((n) => {
                const meta = KIND_META[n.kind] || KIND_META.test;
                const Icon = meta.icon;
                const fresh = (n.created_at || "") > lastSeenRef.current;
                const Inner = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 border-b border-paper-rule/60 hover:bg-paper-rail transition-colors ${fresh ? "bg-paper-rail/40" : ""}`}
                    data-testid={`bell-item-${n.id}`}
                  >
                    <div
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                      style={{ background: meta.bg, color: meta.c }}
                    >
                      <Icon size={13} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: meta.c }}>
                        {meta.label}
                        {fresh && <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.c }} />}
                      </div>
                      <div className="text-[13px] font-medium text-ink leading-snug truncate">{n.title}</div>
                      <div className="text-[11.5px] text-ink-muted leading-snug line-clamp-2">{n.body}</div>
                    </div>
                    <div className="text-[10px] font-mono text-ink-faint shrink-0">{relTime(n.created_at)}</div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} to={n.link} onClick={() => setOpen(false)} className="block">
                    {Inner}
                  </Link>
                ) : (
                  <div key={n.id}>{Inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

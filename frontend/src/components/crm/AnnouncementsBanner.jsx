import { useEffect, useState } from "react";
import { Megaphone, X, ExternalLink, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { api } from "@/lib/api";

const KIND_STYLES = {
  info: { bg: "#eff6ff", border: "#bfdbfe", c: "#1d4ed8", icon: Info },
  success: { bg: "#ecfdf5", border: "#a7f3d0", c: "#047857", icon: CheckCircle2 },
  warning: { bg: "#fffbeb", border: "#fde68a", c: "#a16207", icon: AlertTriangle },
  alert: { bg: "#fef2f2", border: "#fecaca", c: "#b91c1c", icon: AlertTriangle },
};

const DISMISSED_KEY = "patientcrm.dismissed-announcements";

function readDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
}

export default function AnnouncementsBanner() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(readDismissed());

  useEffect(() => {
    api.activeAnnouncements().then(setItems).catch(() => {});
  }, []);

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const dismiss = (id) => {
    const next = new Set(dismissed);
    next.add(id);
    saveDismissed(next);
    setDismissed(next);
  };

  return (
    <div className="flex flex-col gap-2 mb-4" data-testid="announcements">
      {visible.map((a) => {
        const s = KIND_STYLES[a.kind] || KIND_STYLES.info;
        const Icon = s.icon;
        return (
          <div
            key={a.id}
            className="rounded-[14px] border px-4 py-3 flex items-start gap-3 animate-fade-up"
            style={{ background: s.bg, borderColor: s.border, color: s.c }}
            data-testid={`announcement-${a.id}`}
          >
            <div className="shrink-0 mt-0.5">
              <Icon size={15} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.16em] uppercase opacity-80">
                <Megaphone size={10} />
                Announcement
              </div>
              <div className="mt-0.5 text-[13.5px] leading-snug text-ink">{a.body}</div>
              {a.cta_url && (
                <a
                  href={a.cta_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium underline-offset-2 hover:underline"
                  style={{ color: s.c }}
                  data-testid={`announcement-cta-${a.id}`}
                >
                  {a.cta_label || "Learn more"}
                  <ExternalLink size={11} strokeWidth={2} />
                </a>
              )}
            </div>
            {a.dismissible && (
              <button
                onClick={() => dismiss(a.id)}
                className="opacity-60 hover:opacity-100 mt-0.5"
                aria-label="Dismiss"
                data-testid={`announcement-dismiss-${a.id}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

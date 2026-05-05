import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Inbox, MapPin, ChevronRight, X, Phone, Mail, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";

function relTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / (60 * 24))}d ago`;
}

export default function CrnRequestInbox({ locations, onCreated }) {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const refresh = async () => {
    try {
      const list = await api.listCrnRequests("pending");
      setItems(list);
    } catch {}
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  const assign = async (req, locId) => {
    if (!locId) return;
    setBusyId(req.id);
    try {
      const out = await api.assignCrnRequest(req.id, locId);
      toast.success(`Profile created · ${out.crn}`);
      refresh();
      onCreated?.();
    } catch {
      toast.error("Could not assign request");
    } finally {
      setBusyId(null);
    }
  };

  const dismiss = async (req) => {
    setBusyId(req.id);
    try {
      await api.dismissCrnRequest(req.id);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5"
      data-testid="crn-inbox"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-[10px] bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
            <Inbox size={16} strokeWidth={1.8} />
          </div>
          <div>
            <div className="label-micro">CRN intake</div>
            <h2 className="font-display text-[22px] tracking-[-0.01em] mt-0.5">
              Pending CRN requests
            </h2>
          </div>
        </div>
        <span
          className="chip"
          style={{
            background: items.length ? "#fef2f2" : "#ecfdf5",
            color: items.length ? "#dc2626" : "#10b981",
          }}
          data-testid="crn-inbox-count"
        >
          {items.length} {items.length === 1 ? "request" : "requests"}
        </span>
      </div>
      <div className="text-[12px] text-ink-muted mb-4 leading-snug">
        New patient enquiries arrive here. Pick a care centre to convert the request
        into a profile — the centre's CRN format is applied automatically.
      </div>

      {items.length === 0 ? (
        <div className="text-[13px] text-ink-muted py-10 text-center border border-dashed border-paper-rule rounded-[14px]">
          No pending requests.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((req) => (
            <div
              key={req.id}
              className="border border-paper-rule rounded-[14px] p-4 flex flex-col md:flex-row md:items-center md:gap-4 gap-3"
              data-testid={`crn-req-${req.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-display text-[16px] tracking-[-0.01em] truncate">
                  {req.first_name} {req.last_name}
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11.5px] text-ink-muted flex-wrap">
                  {req.phone && (
                    <span className="inline-flex items-center gap-1 font-mono ticker">
                      <Phone size={10} /> {req.phone}
                    </span>
                  )}
                  {req.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={10} /> {req.email}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-ink-faint">{relTime(req.created_at)}</span>
                </div>
                {req.concern && (
                  <div className="mt-1.5 text-[12.5px] text-ink flex items-start gap-1.5">
                    <MessageCircle size={11} strokeWidth={1.8} className="mt-0.5 text-ink-faint shrink-0" />
                    {req.concern}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <select
                    onChange={(e) => assign(req, e.target.value)}
                    disabled={busyId === req.id || locations.length === 0}
                    defaultValue=""
                    className="h-9 pl-7 pr-7 border border-paper-rule bg-white rounded-[10px] text-[12.5px] cursor-pointer hover:border-ink"
                    data-testid={`crn-req-assign-${req.id}`}
                  >
                    <option value="" disabled>
                      {locations.length === 0 ? "Add a centre first" : "Pass to centre…"}
                    </option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <MapPin size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                  <ChevronRight size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none rotate-90" />
                </div>
                <button
                  onClick={() => dismiss(req)}
                  disabled={busyId === req.id}
                  className="icon-btn"
                  aria-label="Dismiss"
                  data-testid={`crn-req-dismiss-${req.id}`}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

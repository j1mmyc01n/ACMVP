import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import { Phone, Mail, MessageSquare, Linkedin, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANES = {
  stable: { c: "#10b981", bg: "#ecfdf5", l: "Stable" },
  monitoring: { c: "#f59e0b", bg: "#fffbeb", l: "Monitoring" },
  elevated: { c: "#f97316", bg: "#fff7ed", l: "Elevated" },
  highrisk: { c: "#ef4444", bg: "#fef2f2", l: "High risk" },
  critical: { c: "#dc2626", bg: "#fee2e2", l: "Critical" },
};
const laneOf = (s) => (s <= 20 ? "stable" : s <= 45 ? "monitoring" : s <= 65 ? "elevated" : s <= 84 ? "highrisk" : "critical");

const PROVIDERS = [
  { key: "google", label: "Google" },
  { key: "outlook", label: "Outlook" },
  { key: "ios", label: "iOS" },
  { key: "calendly", label: "Calendly" },
];

export default function CallQueuePage() {
  const { refreshKey, openPatient, bump, activeLocation } = useShell();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    api.listQueue().then((q) => {
      const sorted = [...q].sort((a, b) => {
        const tA = `${a.requested_day || "ZZZ"} ${a.requested_time || "23:59"}`;
        const tB = `${b.requested_day || "ZZZ"} ${b.requested_time || "23:59"}`;
        return tA.localeCompare(tB);
      });
      const scoped =
        activeLocation === "all"
          ? sorted
          : sorted.filter((it) => it.patient?.location_id === activeLocation);
      setQueue(scoped);
    });
  }, [refreshKey, activeLocation]);

  const call = async (p) => {
    await api.twilioCall(p.id);
    toast.success(`Dialing ${p.first_name} via Twilio (mock)`);
    bump();
  };

  const schedule = async (p, provider) => {
    const when = new Date();
    when.setDate(when.getDate() + 1);
    await api.schedule({ patient_id: p.id, provider, when_iso: when.toISOString() });
    toast.success(`Scheduled on ${provider}`);
    bump();
  };

  return (
    <div className="p-8 pb-14" data-testid="callqueue-page">
      <div className="mb-6">
        <div className="label-micro mb-2">Call queue</div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em]">
          Outbound queue
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          {queue.length} patients waiting for contact. Twilio — mocked. Calendar — mocked.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {queue.map((item) => {
          const p = item.patient;
          if (!p) return null;
          const lane = LANES[laneOf(p.escalation_score || 0)];
          return (
            <div
              key={item.id}
              className="bg-white border border-paper-rule rounded-[16px] p-5 card-shadow relative overflow-hidden"
              data-testid={`queue-card-${p.id}`}
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: lane.c }} />
              <div className="flex items-start gap-3 mb-4">
                <img src={p.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-paper-rule" />
                <button onClick={() => openPatient(p)} className="flex-1 text-left min-w-0">
                  <div className="font-display text-[19px] leading-tight truncate tracking-[-0.01em]">
                    {p.first_name} {p.last_name}
                  </div>
                  <div className="text-[11.5px] text-ink-muted truncate mt-0.5">
                    {p.concern} · {p.crn}
                  </div>
                </button>
                <span className="chip" style={{ background: lane.bg, color: lane.c }}>
                  {lane.l}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 bg-paper-rail rounded-[10px] p-3">
                <div>
                  <div className="label-micro">Day</div>
                  <div className="font-mono text-[13px] ticker font-semibold">{item.requested_day}</div>
                </div>
                <div>
                  <div className="label-micro">Time</div>
                  <div className="font-mono text-[13px] ticker font-semibold">{item.requested_time}</div>
                </div>
                <div>
                  <div className="label-micro">Status</div>
                  <div className="text-[12px] capitalize font-medium">{item.status}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => call(p)} className="btn-primary flex-1 flex items-center justify-center gap-2" data-testid={`call-btn-${p.id}`}>
                  <Phone size={12} strokeWidth={2} />
                  Call via Twilio
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="btn-ghost flex items-center gap-2"
                      data-testid={`schedule-trigger-${p.id}`}
                      aria-label="Schedule"
                    >
                      <Calendar size={12} strokeWidth={1.8} />
                      Schedule
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-[10px] border-paper-rule">
                    {PROVIDERS.map((c) => (
                      <DropdownMenuItem
                        key={c.key}
                        onClick={() => schedule(p, c.key)}
                        data-testid={`schedule-${c.key}-${p.id}`}
                        className="text-[12.5px] cursor-pointer"
                      >
                        {c.label} Calendar
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex items-center gap-1">
                <button className="icon-btn" title="SMS" data-testid={`sms-${p.id}`} aria-label="SMS">
                  <MessageSquare size={13} strokeWidth={1.6} />
                </button>
                <button className="icon-btn" title="Email" data-testid={`email-${p.id}`} aria-label="Email">
                  <Mail size={13} strokeWidth={1.6} />
                </button>
                <button className="icon-btn" title="LinkedIn" data-testid={`linkedin-${p.id}`} aria-label="LinkedIn">
                  <Linkedin size={13} strokeWidth={1.6} />
                </button>
              </div>
            </div>
          );
        })}
        {queue.length === 0 && (
          <div className="col-span-full text-center py-14 text-[13px] text-ink-muted">
            Queue is clear.
          </div>
        )}
      </div>
    </div>
  );
}

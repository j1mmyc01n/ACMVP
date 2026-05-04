import { Phone, Mail, MessageSquare, Calendar, Linkedin, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CALENDAR_PROVIDERS = [
  { key: "google", label: "Google Calendar" },
  { key: "outlook", label: "Outlook" },
  { key: "ios", label: "iOS Calendar" },
  { key: "calendly", label: "Calendly" },
];

function laneOf(score) {
  if (score <= 20) return { c: "#10b981", bg: "#ecfdf5", label: "Stable" };
  if (score <= 45) return { c: "#f59e0b", bg: "#fffbeb", label: "Monitoring" };
  if (score <= 65) return { c: "#f97316", bg: "#fff7ed", label: "Elevated" };
  if (score <= 84) return { c: "#ef4444", bg: "#fef2f2", label: "High risk" };
  return { c: "#dc2626", bg: "#fee2e2", label: "Critical" };
}

function Card({ item, onCall, onSchedule, onOpen }) {
  const p = item.patient;
  if (!p) return null;
  const lane = laneOf(p.escalation_score || 0);
  return (
    <div
      className="bg-white border border-paper-rule rounded-[16px] p-4 relative overflow-hidden card-shadow"
      data-testid={`queue-card-${p.id}`}
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: lane.c }} />

      <div className="flex items-start justify-between mb-3">
        <span
          className="chip"
          style={{ background: lane.bg, color: lane.c }}
        >
          Boarding · {item.status}
        </span>
        <span className="label-micro">{p.escalation_score || 0}</span>
      </div>

      <button
        onClick={() => onOpen(p)}
        className="flex items-center gap-3 mb-3 text-left w-full"
        data-testid={`queue-open-${p.id}`}
      >
        <img
          src={p.avatar_url}
          alt=""
          className="w-11 h-11 rounded-full object-cover border border-paper-rule"
        />
        <div className="min-w-0">
          <div className="font-display text-[19px] leading-tight truncate">
            {p.first_name} {p.last_name}
          </div>
          <div className="text-[12px] text-ink-muted truncate">{p.concern || "—"}</div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 mb-3 bg-paper-rail rounded-[10px] p-2.5">
        <div>
          <div className="label-micro">Day</div>
          <div className="font-mono text-[13px] ticker font-semibold">{item.requested_day}</div>
        </div>
        <div>
          <div className="label-micro">Time</div>
          <div className="font-mono text-[13px] ticker font-semibold">{item.requested_time}</div>
        </div>
      </div>

      <button
        onClick={() => onCall(p)}
        className="btn-primary w-full flex items-center justify-center gap-2 mb-2"
        data-testid={`call-btn-${p.id}`}
      >
        <Phone size={12} strokeWidth={2} />
        Call via Twilio
      </button>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="btn-ghost flex items-center gap-1.5 !py-1.5 !px-2.5"
              data-testid={`schedule-trigger-${p.id}`}
              title="Schedule"
              aria-label="Schedule"
            >
              <Calendar size={12} strokeWidth={1.8} />
              <span className="text-[11px]">Schedule</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-[10px] border-paper-rule">
            {CALENDAR_PROVIDERS.map((c) => (
              <DropdownMenuItem
                key={c.key}
                onClick={() => onSchedule(p, c.key)}
                data-testid={`schedule-${c.key}-${p.id}`}
                className="text-[12.5px] cursor-pointer"
              >
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function CallQueueRail({ items, onCall, onSchedule, onOpen, onClose }) {
  const pending = items.filter((i) => i.status !== "done");
  return (
    <aside
      className="w-[340px] shrink-0 bg-paper-rail border-l border-paper-rule flex flex-col"
      data-testid="call-queue"
    >
      <div className="px-5 py-5 flex items-center justify-between border-b border-paper-rule bg-white">
        <div>
          <div className="label-micro">Call queue</div>
          <div className="font-display text-[24px] leading-none mt-1 tracking-[-0.01em]">
            {pending.length} in line
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip" style={{ background: "#ecfdf5", color: "#10b981" }}>
            Live
          </span>
          {onClose && (
            <button className="icon-btn" onClick={onClose} data-testid="close-queue" aria-label="Close">
              <X size={13} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
        {pending.map((item) => (
          <Card key={item.id} item={item} onCall={onCall} onSchedule={onSchedule} onOpen={onOpen} />
        ))}
        {pending.length === 0 && (
          <div className="text-[12px] text-ink-muted font-sans text-center py-10">Queue is clear.</div>
        )}
      </div>
    </aside>
  );
}

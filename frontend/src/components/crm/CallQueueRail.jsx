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

function Card({ item, onCall, onSchedule, onOpen }) {
  const p = item.patient;
  if (!p) return null;
  const pct = Math.round((p.ai_probability || 0) * 100);
  return (
    <div
      className="boarding-pass p-4 animate-fade-up"
      data-testid={`queue-card-${p.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="label-micro">
          Boarding · {item.status}
        </div>
        <div className="label-micro text-brand">{pct}%</div>
      </div>
      <button
        onClick={() => onOpen(p)}
        className="flex items-center gap-3 mb-3 text-left w-full"
        data-testid={`queue-open-${p.id}`}
      >
        <img
          src={p.avatar_url}
          alt=""
          className="w-11 h-11 object-cover border border-paper-rule"
        />
        <div className="min-w-0">
          <div className="font-heading text-[19px] leading-tight truncate">
            {p.first_name} {p.last_name}
          </div>
          <div className="text-[12px] text-ink-muted truncate">{p.concern || "—"}</div>
        </div>
      </button>

      <div className="dashed-divider my-3" />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="label-micro">Day</div>
          <div className="font-mono text-[13px] ticker">{item.requested_day}</div>
        </div>
        <div>
          <div className="label-micro">Time</div>
          <div className="font-mono text-[13px] ticker">{item.requested_time}</div>
        </div>
      </div>

      <button
        onClick={() => onCall(p)}
        className="btn-primary w-full flex items-center justify-center gap-2 mb-2"
        data-testid={`call-btn-${p.id}`}
      >
        <Phone size={12} strokeWidth={1.8} />
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
              className="icon-btn px-2"
              data-testid={`schedule-trigger-${p.id}`}
              title="Schedule"
              aria-label="Schedule on calendar"
            >
              <Calendar size={13} strokeWidth={1.6} />
              <span className="ml-1 font-mono text-[10px] uppercase tracking-wider">Sched</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-paper-rule">
            {CALENDAR_PROVIDERS.map((c) => (
              <DropdownMenuItem
                key={c.key}
                onClick={() => onSchedule(p, c.key)}
                data-testid={`schedule-${c.key}-${p.id}`}
                className="font-mono text-[11px] uppercase tracking-wider rounded-none cursor-pointer"
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
      className="w-[320px] shrink-0 bg-paper-rail border-l border-paper-rule flex flex-col"
      data-testid="call-queue"
    >
      <div className="h-[64px] px-5 flex items-center justify-between border-b border-paper-rule bg-white">
        <div>
          <div className="label-micro">Call queue</div>
          <div className="font-heading text-[20px] leading-none tracking-tight mt-1">
            {pending.length} in line
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="pill-tag">Live</div>
          {onClose && (
            <button
              className="icon-btn"
              onClick={onClose}
              data-testid="close-queue"
              aria-label="Close queue"
            >
              <X size={12} strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-4">
        {pending.map((item) => (
          <Card
            key={item.id}
            item={item}
            onCall={onCall}
            onSchedule={onSchedule}
            onOpen={onOpen}
          />
        ))}
        {pending.length === 0 && (
          <div className="text-[12px] text-ink-muted font-body text-center py-10">
            Queue is clear.
          </div>
        )}
      </div>
    </aside>
  );
}

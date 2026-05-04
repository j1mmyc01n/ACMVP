import { AlertCircle, IdCard, Stethoscope, Clock, CalendarClock } from "lucide-react";

function ScoreRing({ score, color }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, score) / 100) * c;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <circle cx="20" cy="20" r={r} stroke="#F3F3EF" strokeWidth="3" fill="none" />
      <circle
        cx="20"
        cy="20"
        r={r}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray={`${filled} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text
        x="20"
        y="23"
        textAnchor="middle"
        fontFamily="Geist, sans-serif"
        fontSize="11"
        fontWeight="600"
        fill="#111"
      >
        {score}
      </text>
    </svg>
  );
}

function formatLastUpdated(patient) {
  // Build a friendly absolute + relative string
  const ts = patient.created_at ? new Date(patient.created_at) : null;
  const hours = patient.last_updated_hours;
  let when = null;
  if (ts) {
    when = ts;
    if (hours && hours > 0) {
      when = new Date(ts.getTime() + hours * 3600 * 1000);
    }
  }
  if (!when) return "—";
  const dateLabel = when.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
  const timeLabel = when.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  // relative
  const diffMs = Date.now() - when.getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  let rel;
  if (mins < 60) rel = `${mins}m ago`;
  else if (mins < 60 * 24) rel = `${Math.round(mins / 60)}h ago`;
  else rel = `${Math.round(mins / (60 * 24))}d ago`;
  return { dateLabel, timeLabel, rel };
}

function MetaRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-7 h-7 rounded-[8px] bg-paper-rail border border-paper-rule flex items-center justify-center shrink-0 text-ink-muted">
        <Icon size={12} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9.5px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          {label}
        </div>
        <div className={`text-[12.5px] leading-tight truncate ${highlight ? "font-semibold text-ink" : "text-ink"}`}>
          {value || <span className="text-ink-faint">—</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * KanbanCard
 * @param {object} props
 * @param {object} props.patient
 * @param {object} props.stage  { key, label, color }
 * @param {function} props.onOpen
 * @param {boolean} props.overdue
 * @param {"kanban"|"profile"} props.variant - profile hides the AI/stage chip
 */
export default function KanbanCard({ patient, stage, onOpen, overdue, variant = "kanban" }) {
  const accent = stage?.color || "#64748b";
  const stageLabel = stage?.label || patient.stage || "—";
  const showStageChip = variant !== "profile";
  const updated = formatLastUpdated(patient);
  const hasTime = typeof updated === "object";

  return (
    <button
      onClick={() => onOpen?.(patient)}
      className="w-full text-left bg-white border border-paper-rule rounded-[16px] p-4 card-shadow transition-all hover:-translate-y-0.5 relative overflow-hidden"
      data-testid={`kanban-card-${patient.id}`}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: accent }}
      />

      {/* Header: avatar + full name + ring */}
      <div className="flex items-start gap-3">
        {patient.avatar_url ? (
          <img
            src={patient.avatar_url}
            alt=""
            className="w-11 h-11 rounded-full object-cover border border-paper-rule shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-paper-rail border border-paper-rule flex items-center justify-center shrink-0 font-mono text-[12px] text-ink-muted">
            {(patient.first_name?.[0] || "") + (patient.last_name?.[0] || "")}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-display text-[18px] leading-tight text-ink tracking-[-0.01em] break-words">
            {patient.first_name} {patient.last_name}
          </div>
          {showStageChip && (
            <span
              className="mt-1.5 inline-block chip"
              style={{ background: `${accent}1a`, color: accent }}
              data-testid={`card-stage-${patient.id}`}
            >
              {stageLabel}
            </span>
          )}
        </div>
        <ScoreRing score={patient.escalation_score || 0} color={accent} />
      </div>

      {/* Labelled meta rows: CRN / Doctor / Last update */}
      <div className="mt-3 pt-3 border-t border-paper-rule/80 flex flex-col divide-y divide-paper-rule/60">
        <div data-testid={`card-crn-${patient.id}`}>
          <MetaRow icon={IdCard} label="CRN" value={patient.crn || "Not assigned"} highlight />
        </div>
        <div data-testid={`card-doctor-${patient.id}`}>
          <MetaRow
            icon={Stethoscope}
            label="Assigned Doctor"
            value={patient.assigned_doctor || "Unassigned"}
          />
        </div>
        <div data-testid={`card-updated-${patient.id}`}>
          <MetaRow
            icon={Clock}
            label="Last update"
            value={
              hasTime
                ? `${updated.dateLabel} · ${updated.timeLabel} (${updated.rel})`
                : updated
            }
          />
        </div>
        {patient.next_appt && (
          <div className={`flex items-center gap-2 py-1.5 ${overdue ? "text-[var(--highrisk)]" : "text-ink-muted"}`}>
            <div className="w-7 h-7 rounded-[8px] bg-paper-rail border border-paper-rule flex items-center justify-center shrink-0">
              {overdue ? (
                <AlertCircle size={12} strokeWidth={2} />
              ) : (
                <CalendarClock size={12} strokeWidth={1.8} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9.5px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
                Next appointment
              </div>
              <div className={`text-[12.5px] leading-tight truncate font-mono ticker ${overdue ? "font-semibold" : ""}`}>
                {patient.next_appt}
                {overdue && " · overdue"}
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

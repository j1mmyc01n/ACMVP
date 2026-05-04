import { AlertCircle, IdCard, Stethoscope, Clock, CalendarClock, Activity } from "lucide-react";

const RISK_BANDS = [
  { max: 25, label: "Stable", color: "#10b981", bg: "#ecfdf5" },
  { max: 50, label: "Monitoring", color: "#f59e0b", bg: "#fffbeb" },
  { max: 75, label: "Elevated", color: "#f97316", bg: "#fff7ed" },
  { max: 100, label: "Critical", color: "#dc2626", bg: "#fef2f2" },
];

function escalationBand(score = 0) {
  for (const b of RISK_BANDS) if (score <= b.max) return b;
  return RISK_BANDS[RISK_BANDS.length - 1];
}

function ScoreRing({ score, color }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, score) / 100) * c;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" className="shrink-0">
      <circle cx="23" cy="23" r={r} stroke="#F3F3EF" strokeWidth="3" fill="none" />
      <circle
        cx="23"
        cy="23"
        r={r}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray={`${filled} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 23 23)"
      />
      <text
        x="23"
        y="26"
        textAnchor="middle"
        fontFamily="Geist, sans-serif"
        fontSize="12"
        fontWeight="700"
        fill="#111"
      >
        {score}
      </text>
    </svg>
  );
}

function formatLastUpdated(patient) {
  const ts = patient.created_at ? new Date(patient.created_at) : null;
  const hours = patient.last_updated_hours;
  let when = null;
  if (ts) {
    when = ts;
    if (hours && hours > 0) when = new Date(ts.getTime() + hours * 3600 * 1000);
  }
  if (!when) return null;
  const dateLabel = when.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  const timeLabel = when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const diffMs = Date.now() - when.getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  let rel;
  if (mins < 60) rel = `${mins}m ago`;
  else if (mins < 60 * 24) rel = `${Math.round(mins / 60)}h ago`;
  else rel = `${Math.round(mins / (60 * 24))}d ago`;
  return { dateLabel, timeLabel, rel };
}

function MetaRow({ icon: Icon, label, value, accent, highlight }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: `${accent}1a`, color: accent }}
      >
        <Icon size={12} strokeWidth={1.9} />
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
 * Patient profile card.
 * - Colour-coded by escalation band: a coloured top stripe + coloured score ring +
 *   coloured icon chips communicate risk at a glance.
 * - The AI / stage label chip is intentionally NOT shown on profile cards.
 */
export default function KanbanCard({ patient, onOpen, overdue }) {
  const band = escalationBand(patient.escalation_score || 0);
  const accent = band.color;
  const updated = formatLastUpdated(patient);

  return (
    <button
      onClick={() => onOpen?.(patient)}
      className="group w-full text-left bg-white border border-paper-rule rounded-[18px] overflow-hidden card-shadow transition-all hover:-translate-y-0.5 hover:shadow-md relative"
      data-testid={`kanban-card-${patient.id}`}
    >
      {/* Coloured top stripe — bias of escalation */}
      <div
        className="h-[5px] w-full"
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, ${accent}cc 60%, ${accent}66 100%)`,
        }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {patient.avatar_url ? (
              <img
                src={patient.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-paper-rule"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-paper-rail border border-paper-rule flex items-center justify-center font-mono text-[12px] text-ink-muted">
                {(patient.first_name?.[0] || "") + (patient.last_name?.[0] || "")}
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ background: accent }}
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[18px] leading-tight text-ink tracking-[-0.01em] break-words">
              {patient.first_name} {patient.last_name}
            </div>
            <div
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full"
              style={{ background: band.bg, color: accent }}
              data-testid={`card-band-${patient.id}`}
            >
              <Activity size={10} strokeWidth={2.4} />
              {band.label}
            </div>
          </div>
          <ScoreRing score={patient.escalation_score || 0} color={accent} />
        </div>

        {/* Labelled meta rows */}
        <div className="mt-3 pt-3 border-t border-paper-rule/80 flex flex-col divide-y divide-paper-rule/60">
          <div data-testid={`card-crn-${patient.id}`}>
            <MetaRow icon={IdCard} label="CRN" value={patient.crn || "Not assigned"} accent={accent} highlight />
          </div>
          <div data-testid={`card-doctor-${patient.id}`}>
            <MetaRow
              icon={Stethoscope}
              label="Assigned Doctor"
              value={patient.assigned_doctor || "Unassigned"}
              accent={accent}
            />
          </div>
          <div data-testid={`card-updated-${patient.id}`}>
            <MetaRow
              icon={Clock}
              label="Last update"
              value={
                updated
                  ? `${updated.dateLabel} · ${updated.timeLabel} (${updated.rel})`
                  : "—"
              }
              accent={accent}
            />
          </div>
          {patient.next_appt && (
            <div className={`flex items-center gap-2 py-1.5 ${overdue ? "text-[var(--highrisk)]" : "text-ink-muted"}`}>
              <div
                className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                style={{
                  background: overdue ? "#fef2f2" : `${accent}1a`,
                  color: overdue ? "#dc2626" : accent,
                }}
              >
                {overdue ? (
                  <AlertCircle size={12} strokeWidth={2} />
                ) : (
                  <CalendarClock size={12} strokeWidth={1.9} />
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
      </div>
    </button>
  );
}

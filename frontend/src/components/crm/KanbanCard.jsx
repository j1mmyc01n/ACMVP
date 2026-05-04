import { FileText, AlertCircle, Heart, Activity, Droplet, IdCard, Clock } from "lucide-react";

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

function Vital({ icon: Icon, label, value, unit }) {
  return (
    <div className="flex-1 min-w-0 bg-paper-rail border border-paper-rule rounded-[10px] px-3 py-2">
      <div className="flex items-center gap-1 text-ink-faint text-[9.5px] font-medium tracking-[0.14em] uppercase">
        <Icon size={10} strokeWidth={1.8} />
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-[14px] ticker font-semibold text-ink">{value}</span>
        {unit && <span className="font-mono text-[10px] text-ink-muted">{unit}</span>}
      </div>
    </div>
  );
}

function formatLastUpdated(patient) {
  // Prefer last_updated_hours if explicitly set, else compute from created_at
  if (patient.last_updated_hours && patient.last_updated_hours > 0) {
    const h = patient.last_updated_hours;
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  }
  if (patient.created_at) {
    const ms = Date.now() - new Date(patient.created_at).getTime();
    const mins = Math.max(1, Math.round(ms / 60000));
    if (mins < 60) return `${mins}m ago`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  }
  return "just now";
}

/**
 * KanbanCard
 * @param {object} props
 * @param {object} props.patient
 * @param {object} props.stage - { key, label, color }
 * @param {function} props.onOpen
 * @param {boolean} props.overdue
 * @param {"kanban"|"profile"} props.variant - profile hides AI lane chip
 */
export default function KanbanCard({ patient, stage, onOpen, overdue, variant = "kanban" }) {
  const accent = stage?.color || "#64748b";
  const stageLabel = stage?.label || patient.stage || "—";
  const vitals = patient.vitals || {};
  const showAiChip = variant !== "profile";
  return (
    <button
      onClick={() => onOpen?.(patient)}
      className="w-full text-left bg-white border border-paper-rule rounded-[16px] p-4 card-shadow transition-all hover:-translate-y-0.5 relative overflow-hidden"
      data-testid={`kanban-card-${patient.id}`}
    >
      {/* left accent */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: accent }}
      />

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
          <div
            className="mt-1 inline-flex items-center gap-1 font-mono text-[10.5px] text-ink-muted bg-paper-rail border border-paper-rule px-1.5 py-0.5 rounded-md max-w-full"
            data-testid={`card-crn-${patient.id}`}
          >
            <IdCard size={10} strokeWidth={1.8} className="shrink-0" />
            <span className="truncate">{patient.crn || "—"}</span>
          </div>
        </div>
        <ScoreRing score={patient.escalation_score || 0} color={accent} />
      </div>

      {showAiChip && (
        <div className="mt-2.5">
          <span
            className="chip"
            style={{ background: `${accent}1a`, color: accent }}
            data-testid={`card-stage-${patient.id}`}
          >
            {stageLabel}
          </span>
        </div>
      )}

      {(vitals.hr || vitals.bp || vitals.spo2) && (
        <div className="mt-3 flex gap-2">
          <Vital icon={Heart} label="HR" value={vitals.hr || "—"} unit="bpm" />
          <Vital icon={Activity} label="BP" value={vitals.bp || "—"} unit="mmHg" />
          <Vital icon={Droplet} label="SPO₂" value={vitals.spo2 || "—"} unit="%" />
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-paper-rule/80 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-paper-rail flex items-center justify-center text-ink-muted shrink-0">
          <span className="font-mono text-[10px]">
            {(patient.assigned_doctor || "DR").replace("Dr. ", "").split(" ").map((s) => s[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div
          className="text-[12px] text-ink-muted truncate flex-1"
          data-testid={`card-doctor-${patient.id}`}
        >
          {patient.assigned_doctor || "Unassigned"}
        </div>
        <div className={`flex items-center gap-1 font-mono text-[11px] ticker ${overdue ? "text-[var(--highrisk)] font-semibold" : "text-ink-muted"}`}>
          {overdue ? <AlertCircle size={11} strokeWidth={2} /> : <FileText size={11} strokeWidth={1.8} />}
          {patient.next_appt || "—"}
        </div>
      </div>

      <div
        className="mt-2 flex items-center gap-1 text-[9.5px] font-medium tracking-[0.14em] uppercase text-ink-faint"
        data-testid={`card-updated-${patient.id}`}
      >
        <Clock size={9} strokeWidth={2} />
        Updated {formatLastUpdated(patient)}
      </div>
    </button>
  );
}

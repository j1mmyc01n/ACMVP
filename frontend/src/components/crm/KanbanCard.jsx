import { FileText, AlertCircle, Heart, Activity, Droplet } from "lucide-react";

const LANE_STYLES = {
  stable: { color: "#10b981", bg: "#ecfdf5", label: "Stable" },
  monitoring: { color: "#f59e0b", bg: "#fffbeb", label: "Monitoring" },
  elevated: { color: "#f97316", bg: "#fff7ed", label: "Elevated" },
  highrisk: { color: "#ef4444", bg: "#fef2f2", label: "High risk" },
  critical: { color: "#dc2626", bg: "#fee2e2", label: "Critical" },
};

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

export default function KanbanCard({ patient, lane, onOpen, overdue }) {
  const style = LANE_STYLES[lane] || LANE_STYLES.monitoring;
  const vitals = patient.vitals || {};
  return (
    <button
      onClick={() => onOpen?.(patient)}
      className="w-full text-left bg-white border border-paper-rule rounded-[16px] p-4 card-shadow transition-all hover:-translate-y-0.5 relative overflow-hidden"
      data-testid={`kanban-card-${patient.id}`}
    >
      {/* left accent */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: style.color }}
      />

      <div className="flex items-start gap-3">
        <img
          src={patient.avatar_url}
          alt=""
          className="w-11 h-11 rounded-full object-cover border border-paper-rule shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="font-display text-[19px] leading-tight text-ink truncate tracking-[-0.01em]">
            {patient.first_name} {patient.last_name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-ink-muted">
            <span className="truncate">{patient.crn}</span>
            <span className="w-0.5 h-0.5 bg-ink-faint rounded-full shrink-0" />
            <span>{patient.age} yrs</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="chip"
            style={{ background: style.bg, color: style.color }}
            data-testid={`card-lane-${patient.id}`}
          >
            {style.label}
          </span>
          <ScoreRing score={patient.escalation_score || 0} color={style.color} />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Vital icon={Heart} label="HR" value={vitals.hr || "—"} unit="bpm" />
        <Vital icon={Activity} label="BP" value={vitals.bp || "—"} unit="mmHg" />
        <Vital icon={Droplet} label="SPO₂" value={vitals.spo2 || "—"} unit="%" />
      </div>

      <div className="mt-3 pt-3 border-t border-paper-rule/80 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-paper-rail flex items-center justify-center text-ink-muted shrink-0">
          <span className="font-mono text-[10px]">
            {(patient.assigned_doctor || "DR").replace("Dr. ", "").split(" ").map((s) => s[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div className="text-[12px] text-ink-muted truncate flex-1">{patient.assigned_doctor || "Unassigned"}</div>
        <div className={`flex items-center gap-1 font-mono text-[11px] ticker ${overdue ? "text-[var(--highrisk)] font-semibold" : "text-ink-muted"}`}>
          {overdue ? <AlertCircle size={11} strokeWidth={2} /> : <FileText size={11} strokeWidth={1.8} />}
          {patient.next_appt}
        </div>
      </div>

      <div className="mt-2 text-[9.5px] font-medium tracking-[0.14em] uppercase text-ink-faint">
        Updated {patient.last_updated_hours || 1}h ago
      </div>
    </button>
  );
}

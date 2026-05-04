import { Draggable } from "@hello-pangea/dnd";
import { User, StickyNote, CalendarClock, MoreVertical, AlertTriangle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LEVEL_BY_ID, formatRelative, isOverdue } from "@/lib/kanbanConstants";
import VitalsStrip from "./VitalsStrip";

function RiskDial({ score, accent }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div
      className="relative flex items-center gap-2"
      data-testid="risk-dial"
      title={`Risk score ${pct}`}
    >
      <div className="relative h-9 w-9">
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold text-slate-200">
          {pct}
        </div>
      </div>
    </div>
  );
}

export default function PatientCard({ patient, index, onOpen, isPulsing }) {
  const level = LEVEL_BY_ID[patient.crisis_level] || LEVEL_BY_ID.stable;
  const overdue = isOverdue(patient.review_date);
  const hasNotes = (patient.notes || "").trim().length > 0;

  return (
    <Draggable draggableId={patient.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid={`patient-card-${patient.id}`}
          onClick={() => onOpen?.(patient)}
          className={`group relative rounded-lg cursor-grab active:cursor-grabbing overflow-hidden border transition-all duration-200 ${
            snapshot.isDragging
              ? "scale-[0.98] rotate-[1.2deg] shadow-2xl border-slate-600"
              : "border-slate-800 hover:border-slate-600 hover:-translate-y-[2px]"
          } ${isPulsing ? "ring-2" : ""}`}
          style={{
            background:
              "linear-gradient(180deg, rgba(19,29,43,0.95) 0%, rgba(15,23,35,0.98) 100%)",
            boxShadow: snapshot.isDragging
              ? `0 20px 50px rgba(0,0,0,0.45), 0 0 0 1px ${level.ringHex}`
              : undefined,
            // severity ring pulse
            ...(isPulsing ? { boxShadow: `0 0 0 2px ${level.ringHex}` } : {}),
            ...provided.draggableProps.style,
          }}
        >
          {/* Severity left border + gradient overlay */}
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: level.accent }}
          />
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: level.gradient }}
          />

          <div className="relative p-3.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-9 w-9 border border-slate-700">
                  <AvatarImage src={patient.avatar_url} alt={patient.name} />
                  <AvatarFallback className="bg-slate-800 text-slate-200 text-xs">
                    {patient.name
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-[Manrope] font-bold text-[13.5px] text-slate-100 truncate leading-tight">
                    {patient.name}
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">
                    <span className="font-mono">{patient.crn}</span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <span>{patient.age} yrs</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`text-[9.5px] uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded-md border ${level.badgeBg} ${level.badgeBorder} ${level.text}`}
                  data-testid={`card-severity-${patient.id}`}
                >
                  {level.short}
                </div>
                <RiskDial score={patient.risk_score} accent={level.accent} />
              </div>
            </div>

            {/* Vitals */}
            <VitalsStrip vitals={patient.vitals} />

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/70">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="h-5 w-5 border border-slate-700">
                  <AvatarImage
                    src={patient.clinician_avatar}
                    alt={patient.assigned_clinician}
                  />
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-[9px]">
                    <User className="h-2.5 w-2.5" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10.5px] text-slate-300 truncate max-w-[110px]">
                  {patient.assigned_clinician}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasNotes && (
                  <span
                    title="Has clinical notes"
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <StickyNote className="h-3 w-3" />
                  </span>
                )}
                <div
                  className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                    overdue ? "text-rose-400" : "text-slate-400"
                  }`}
                  title={`Review: ${patient.review_date}`}
                >
                  {overdue ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <CalendarClock className="h-3 w-3" />
                  )}
                  {patient.review_date}
                </div>
              </div>
            </div>

            {/* Last updated */}
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                Updated {formatRelative(patient.last_update)}
              </span>
              <MoreVertical className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

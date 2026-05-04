import { Droppable } from "@hello-pangea/dnd";
import PatientCard from "./PatientCard";
import { isOverdue } from "@/lib/kanbanConstants";

export default function KanbanColumn({ level, patients, onOpenPatient, pulsingIds }) {
  const overdueCount = patients.filter((p) => isOverdue(p.review_date)).length;

  return (
    <div
      className="flex flex-col min-w-[288px]"
      data-testid={`column-${level.id}`}
    >
      {/* Column Header */}
      <div className="relative mb-3">
        <div
          aria-hidden
          className={`absolute left-0 right-0 top-0 h-[2px] rounded-full bg-gradient-to-r ${level.columnAccent}`}
        />
        <div className="pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: level.accent, boxShadow: `0 0 10px ${level.accent}` }}
            />
            <h3 className="font-[Manrope] font-bold text-[13px] tracking-wide uppercase text-slate-100">
              {level.name}
            </h3>
            <span className="text-[10px] font-mono text-slate-500">{level.range}</span>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span
                className="text-[9px] uppercase tracking-[0.14em] font-bold text-rose-400"
                data-testid={`column-${level.id}-overdue`}
              >
                {overdueCount} overdue
              </span>
            )}
            <span
              className="h-5 min-w-[22px] inline-flex items-center justify-center px-1.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-200"
              data-testid={`column-${level.id}-count`}
            >
              {patients.length}
            </span>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <Droppable droppableId={level.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[420px] rounded-xl transition-colors p-2 space-y-2.5 ${
              snapshot.isDraggingOver
                ? "bg-slate-800/30 ring-1 ring-dashed"
                : "bg-slate-900/30"
            }`}
            style={
              snapshot.isDraggingOver
                ? { boxShadow: `inset 0 0 0 1px ${level.ringHex}` }
                : undefined
            }
          >
            {patients.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[180px] text-center">
                <div
                  className="h-9 w-9 rounded-full mb-2 flex items-center justify-center"
                  style={{ background: `${level.accent}18`, color: level.accent }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: level.accent }} />
                </div>
                <div className="text-[11px] text-slate-500 max-w-[180px]">
                  No patients in {level.name.toLowerCase()}. Drag cards here.
                </div>
              </div>
            )}

            {patients.map((p, idx) => (
              <PatientCard
                key={p.id}
                patient={p}
                index={idx}
                onOpen={onOpenPatient}
                isPulsing={pulsingIds.has(p.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

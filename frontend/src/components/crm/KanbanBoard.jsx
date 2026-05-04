import KanbanCard from "@/components/crm/KanbanCard";

const FALLBACK_STAGES = [
  { key: "intake", label: "Intake", color: "#3b82f6" },
  { key: "triage", label: "Triage", color: "#f59e0b" },
  { key: "active", label: "Active", color: "#10b981" },
  { key: "follow_up", label: "Follow-up", color: "#8b5cf6" },
  { key: "discharged", label: "Discharged", color: "#64748b" },
];

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function KanbanBoard({ patients, onOpen, stages }) {
  const lanes = stages && stages.length ? stages : FALLBACK_STAGES;
  const grouped = {};
  const overflow = [];
  lanes.forEach((l) => (grouped[l.key] = []));
  patients.forEach((p) => {
    const k = p.stage;
    if (k && grouped[k]) {
      grouped[k].push(p);
    } else {
      overflow.push(p);
    }
  });

  // Append overflow (legacy stages) into the first lane so nothing disappears
  if (overflow.length && lanes[0]) {
    grouped[lanes[0].key] = [...grouped[lanes[0].key], ...overflow];
  }

  // Adapt grid columns to the number of stages
  const cols = Math.min(Math.max(lanes.length, 1), 6);
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <div className="px-10 pb-14" data-testid="kanban-board">
      <div className="grid gap-5 min-h-[400px]" style={gridStyle}>
        {lanes.map((lane) => {
          const rows = grouped[lane.key] || [];
          const overdueCount = rows.filter((p) => isOverdue(p.next_appt)).length;
          return (
            <div key={lane.key} className="flex flex-col" data-testid={`lane-${lane.key}`}>
              <div
                className="h-[3px] w-full rounded-full mb-4"
                style={{ background: lane.color }}
              />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: lane.color }}
                  />
                  <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-ink truncate">
                    {lane.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {overdueCount > 0 && (
                    <span className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-[var(--highrisk)]">
                      {overdueCount} overdue
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-ink-muted bg-paper-rail border border-paper-rule px-2 py-0.5 rounded-md ticker">
                    {rows.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {rows.map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <KanbanCard
                      patient={p}
                      stage={lane}
                      onOpen={onOpen}
                      overdue={isOverdue(p.next_appt)}
                      variant="kanban"
                    />
                  </div>
                ))}
                {rows.length === 0 && (
                  <div className="text-[12px] text-ink-faint py-6 text-center border border-dashed border-paper-rule rounded-[14px]">
                    No patients
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

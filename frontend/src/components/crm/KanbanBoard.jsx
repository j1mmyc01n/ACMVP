import KanbanCard from "@/components/crm/KanbanCard";

const LANES = [
  { key: "stable", label: "Stable", color: "#10b981", range: "0 – 20" },
  { key: "monitoring", label: "Monitoring", color: "#f59e0b", range: "21 – 45" },
  { key: "elevated", label: "Elevated", color: "#f97316", range: "46 – 65" },
  { key: "highrisk", label: "High risk", color: "#ef4444", range: "66 – 84" },
  { key: "critical", label: "Critical", color: "#dc2626", range: "85 – 100" },
];

function laneOf(score) {
  if (score <= 20) return "stable";
  if (score <= 45) return "monitoring";
  if (score <= 65) return "elevated";
  if (score <= 84) return "highrisk";
  return "critical";
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function KanbanBoard({ patients, onOpen }) {
  const grouped = {};
  LANES.forEach((l) => (grouped[l.key] = []));
  patients.forEach((p) => {
    const k = laneOf(p.escalation_score || 0);
    grouped[k].push(p);
  });

  return (
    <div className="px-10 pb-14" data-testid="kanban-board">
      <div className="grid grid-cols-5 gap-5 min-h-[400px]">
        {LANES.map((lane) => {
          const rows = grouped[lane.key];
          const overdueCount = rows.filter((p) => isOverdue(p.next_appt)).length;
          return (
            <div key={lane.key} className="flex flex-col" data-testid={`lane-${lane.key}`}>
              <div
                className="h-[3px] w-full rounded-full mb-4"
                style={{ background: lane.color }}
              />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: lane.color }}
                  />
                  <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-ink">
                    {lane.label}
                  </span>
                  <span className="text-[10.5px] font-mono text-ink-faint ticker">
                    {lane.range}
                  </span>
                </div>
                <div className="flex items-center gap-2">
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
                      lane={lane.key}
                      onOpen={onOpen}
                      overdue={isOverdue(p.next_appt)}
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

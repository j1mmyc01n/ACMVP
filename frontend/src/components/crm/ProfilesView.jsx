import KanbanCard from "@/components/crm/KanbanCard";

function laneOf(score) {
  if (score <= 20) return "stable";
  if (score <= 45) return "monitoring";
  if (score <= 65) return "elevated";
  if (score <= 84) return "highrisk";
  return "critical";
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function ProfilesView({ patients, onOpen }) {
  return (
    <div className="px-10 pb-14" data-testid="profiles-view">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {patients.map((p, i) => (
          <div
            key={p.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <KanbanCard
              patient={p}
              lane={laneOf(p.escalation_score || 0)}
              onOpen={onOpen}
              overdue={isOverdue(p.next_appt)}
            />
          </div>
        ))}
        {patients.length === 0 && (
          <div className="col-span-full text-center py-14 text-ink-muted text-[13px]">
            No patients match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

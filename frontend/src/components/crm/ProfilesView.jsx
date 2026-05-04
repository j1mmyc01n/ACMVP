import KanbanCard from "@/components/crm/KanbanCard";

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function ProfilesView({ patients, onOpen }) {
  return (
    <div className="px-6 lg:px-10 pb-14" data-testid="profiles-view">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {patients.map((p, i) => (
          <div
            key={p.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <KanbanCard
              patient={p}
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

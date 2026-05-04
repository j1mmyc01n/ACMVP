import KanbanView from "@/components/kanban/KanbanView";

/**
 * Standalone full-screen Kanban view for second-display use.
 * Opened via window.open() from the Crisis Dashboard "Pop out" button.
 */
export default function KanbanPopout() {
  return (
    <div className="min-h-screen p-4">
      <KanbanView variant="popout" onClose={() => window.close()} />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ProfilesView from "@/components/crm/ProfilesView";
import { Users, Columns, Wifi } from "lucide-react";

export default function KanbanPage({ defaultView = "kanban" }) {
  const { search, refreshKey, openPatient, activeLocation, locations } = useShell();
  const [patients, setPatients] = useState([]);
  const [view, setView] = useState(defaultView);

  useEffect(() => {
    const params = activeLocation !== "all" ? { location_id: activeLocation } : {};
    api.listPatients(params).then(setPatients).catch(console.error);
  }, [refreshKey, activeLocation]);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const s = search.toLowerCase();
    return patients.filter(
      (p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) ||
        (p.crn || "").toLowerCase().includes(s) ||
        (p.patient_id || "").toLowerCase().includes(s) ||
        (p.concern || "").toLowerCase().includes(s),
    );
  }, [patients, search]);

  return (
    <div data-testid="kanban-page">
      <div className="px-6 lg:px-10 pt-8 pb-5">
        <div className="label-micro mb-2">Pipeline</div>
        <h1 className="font-display text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.02em] text-ink">
          {activeLocation === "all"
            ? "Patient pipeline"
            : `Pipeline — ${locations.find((l) => l.id === activeLocation)?.name}`}
        </h1>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div
            className="inline-flex items-center gap-1 p-1 bg-paper-rail rounded-[14px] border border-paper-rule"
            data-testid="view-toggle"
          >
            <button
              className="seg-btn"
              data-active={view === "profiles"}
              onClick={() => setView("profiles")}
              data-testid="view-profiles"
            >
              <Users size={14} strokeWidth={1.8} />
              Patient profiles
            </button>
            <button
              className="seg-btn"
              data-active={view === "kanban"}
              onClick={() => setView("kanban")}
              data-testid="view-kanban"
            >
              <Columns size={14} strokeWidth={1.8} />
              Kanban
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-[var(--stable-bg)] text-[var(--stable)] px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wider uppercase">
              <Wifi size={11} strokeWidth={2} />
              Realtime
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.14em] uppercase text-ink-muted">
          <span>5 Lanes</span>
          <span className="w-1 h-1 rounded-full bg-ink-faint" />
          <span>{filtered.length} Patients</span>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard patients={filtered} onOpen={openPatient} />
      ) : (
        <ProfilesView patients={filtered} onOpen={openPatient} />
      )}
    </div>
  );
}

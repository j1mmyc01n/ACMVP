import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import BrandHeader from "@/components/crm/BrandHeader";
import BoardToolbar from "@/components/crm/BoardToolbar";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ProfilesView from "@/components/crm/ProfilesView";
import CallQueueRail from "@/components/crm/CallQueueRail";
import IntakeDrawer from "@/components/crm/IntakeDrawer";
import PatientDetailDrawer from "@/components/crm/PatientDetailDrawer";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("kanban");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [detailPatient, setDetailPatient] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const refreshAll = async () => {
    try {
      const [p, l, q] = await Promise.all([
        api.listPatients(),
        api.listLocations(),
        api.listQueue(),
      ]);
      setPatients(p);
      setLocations(l);
      setQueue(q);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

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

  const onMaximize = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col bg-paper text-ink"
      data-testid="crm-root"
    >
      <BrandHeader
        onOpenIntake={() => setIntakeOpen(true)}
        onMaximize={onMaximize}
        onOpenQueue={() => setQueueOpen(true)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      {!collapsed && (
        <BoardToolbar
          view={view}
          onViewChange={setView}
          search={search}
          onSearch={setSearch}
          patientCount={filtered.length}
          laneCount={5}
        />
      )}

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {view === "kanban" ? (
            <KanbanBoard patients={filtered} onOpen={setDetailPatient} />
          ) : (
            <ProfilesView patients={filtered} onOpen={setDetailPatient} />
          )}
        </main>

        {queueOpen && (
          <CallQueueRail
            items={queue}
            onCall={async (p) => {
              await api.twilioCall(p.id);
              toast.success(`Dialing ${p.first_name} via Twilio (mock)`);
            }}
            onSchedule={async (p, provider) => {
              const when = new Date();
              when.setDate(when.getDate() + 1);
              await api.schedule({
                patient_id: p.id,
                provider,
                when_iso: when.toISOString(),
              });
              toast.success(`Scheduled on ${provider}`);
              refreshAll();
            }}
            onOpen={(p) => setDetailPatient(p)}
            onClose={() => setQueueOpen(false)}
          />
        )}
      </div>

      <IntakeDrawer
        open={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        locations={locations}
        onCreated={async (p) => {
          toast.success(`Patient ${p.first_name} ${p.last_name} added`);
          setIntakeOpen(false);
          refreshAll();
        }}
      />
      <PatientDetailDrawer
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
        onChanged={refreshAll}
      />
    </div>
  );
}

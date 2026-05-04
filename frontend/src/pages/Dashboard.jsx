import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Sidebar from "@/components/crm/Sidebar";
import TopBar from "@/components/crm/TopBar";
import GapToPlan from "@/components/crm/cards/GapToPlan";
import ForecastCategories from "@/components/crm/cards/ForecastCategories";
import ByLocation from "@/components/crm/cards/ByLocation";
import TopOpportunities from "@/components/crm/cards/TopOpportunities";
import EscalationsCard from "@/components/crm/cards/EscalationsCard";
import JimmyAiForecast from "@/components/crm/cards/JimmyAiForecast";
import CallQueueRail from "@/components/crm/CallQueueRail";
import IntakeDrawer from "@/components/crm/IntakeDrawer";
import PatientDetailDrawer from "@/components/crm/PatientDetailDrawer";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [categories, setCategories] = useState(null);
  const [byLoc, setByLoc] = useState([]);
  const [topOps, setTopOps] = useState([]);
  const [trend, setTrend] = useState([]);
  const [insights, setInsights] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [detailPatient, setDetailPatient] = useState(null);
  const [queueOpen, setQueueOpen] = useState(true);

  const refreshAll = async () => {
    try {
      const [p, l, q, m, cats, loc, ops, t, ins, esc] = await Promise.all([
        api.listPatients(),
        api.listLocations(),
        api.listQueue(),
        api.dashboard(),
        api.forecastCategories(),
        api.byLocation(),
        api.topOpportunities(),
        api.forecastTrend(),
        api.insights(),
        api.escalations(),
      ]);
      setPatients(p);
      setLocations(l);
      setQueue(q);
      setMetrics(m);
      setCategories(cats);
      setByLoc(loc);
      setTopOps(ops);
      setTrend(t);
      setInsights(ins);
      setEscalations(esc);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const filteredQueue = useMemo(() => {
    if (locationFilter === "all") return queue;
    return queue.filter((q) => q.patient && q.patient.location_id === locationFilter);
  }, [queue, locationFilter]);

  const filteredTopOps = useMemo(() => {
    if (!search.trim()) return topOps;
    const s = search.toLowerCase();
    return topOps.filter(
      (o) => o.name.toLowerCase().includes(s) || (o.concern || "").toLowerCase().includes(s),
    );
  }, [topOps, search]);

  const openByPatientId = (pid) => {
    const p = patients.find((x) => x.id === pid);
    if (p) setDetailPatient(p);
  };

  const onMaximize = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div
      className="relative h-screen w-full flex bg-paper overflow-hidden text-ink"
      data-testid="crm-root"
    >
      <Sidebar
        locations={locations}
        activeLocation={locationFilter}
        onSelectLocation={setLocationFilter}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          search={search}
          onSearch={setSearch}
          onOpenIntake={() => setIntakeOpen(true)}
          onMaximize={onMaximize}
          onToggleQueue={() => setQueueOpen((v) => !v)}
          queueOpen={queueOpen}
        />

        <div className="flex-1 flex min-h-0">
          <main className="flex-1 overflow-y-auto scrollbar-thin p-5">
            <div className="grid grid-cols-12 gap-4 min-h-full">
              {/* Left/main column (8) */}
              <div className="col-span-12 xl:col-span-8 flex flex-col gap-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-5 animate-fade-up">
                    <GapToPlan data={categories} />
                  </div>
                  <div className="col-span-12 md:col-span-7 animate-fade-up stagger-1">
                    <ForecastCategories data={categories} lastUpdated={categories?.last_updated} />
                  </div>
                </div>

                <div className="animate-fade-up stagger-2">
                  <ByLocation rows={byLoc} />
                </div>

                <div className="animate-fade-up stagger-3">
                  <TopOpportunities rows={filteredTopOps} onOpen={openByPatientId} />
                </div>
              </div>

              {/* Right data column (4) — JimmyAi forecast + Escalations stacked */}
              <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
                <div className="animate-fade-up stagger-1 flex-none">
                  <EscalationsCard items={escalations} onOpen={openByPatientId} />
                </div>
                <div className="animate-fade-up stagger-2 flex-1 min-h-[520px]">
                  <JimmyAiForecast
                    metrics={metrics}
                    trend={trend}
                    insights={insights}
                    onRefresh={async () => {
                      const i = await api.insights(true);
                      setInsights(i);
                      toast.success("JimmyAi insights refreshed");
                    }}
                  />
                </div>
              </div>
            </div>
          </main>

          {queueOpen && (
            <CallQueueRail
              items={filteredQueue}
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

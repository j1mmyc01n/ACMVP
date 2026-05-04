import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Sidebar from "@/components/crm/Sidebar";
import TopBar from "@/components/crm/TopBar";
import KPIStrip from "@/components/crm/KPIStrip";
import ForecastChart from "@/components/crm/ForecastChart";
import PatientsTable from "@/components/crm/PatientsTable";
import PatientsToEscalate from "@/components/crm/PatientsToEscalate";
import AIContributor from "@/components/crm/AIContributor";
import CallQueueRail from "@/components/crm/CallQueueRail";
import IntakeDrawer from "@/components/crm/IntakeDrawer";
import PatientDetailDrawer from "@/components/crm/PatientDetailDrawer";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [trend, setTrend] = useState([]);
  const [insights, setInsights] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [detailPatient, setDetailPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAll = async () => {
    try {
      const [p, l, q, m, t, ins, esc] = await Promise.all([
        api.listPatients(),
        api.listLocations(),
        api.listQueue(),
        api.dashboard(),
        api.forecastTrend(),
        api.insights(),
        api.escalations(),
      ]);
      setPatients(p);
      setLocations(l);
      setQueue(q);
      setMetrics(m);
      setTrend(t);
      setInsights(ins);
      setEscalations(esc);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const filtered = useMemo(() => {
    let list = patients;
    if (locationFilter !== "all") {
      list = list.filter((p) => p.location_id === locationFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) ||
          (p.crn || "").toLowerCase().includes(s) ||
          (p.patient_id || "").toLowerCase().includes(s) ||
          (p.concern || "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [patients, search, locationFilter]);

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
          locationCount={locations.length}
        />
        <div className="flex-1 flex min-h-0">
          <main className="flex-1 overflow-y-auto scrollbar-thin border-r border-paper-rule">
            <KPIStrip metrics={metrics} loading={loading} />
            <div className="grid grid-cols-12 gap-0 border-b border-paper-rule">
              <div className="col-span-12 xl:col-span-8 border-r border-paper-rule p-8">
                <ForecastChart data={trend} metrics={metrics} />
              </div>
              <div className="col-span-12 xl:col-span-4 p-8">
                <AIContributor insights={insights} onRefresh={async () => {
                  const i = await api.insights(true);
                  setInsights(i);
                  toast.success("AI insights refreshed");
                }} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-0">
              <div className="col-span-12 xl:col-span-8 border-r border-paper-rule p-8">
                <PatientsTable
                  patients={filtered}
                  locations={locations}
                  onOpen={(p) => setDetailPatient(p)}
                />
              </div>
              <div className="col-span-12 xl:col-span-4 p-8">
                <PatientsToEscalate
                  items={escalations}
                  onOpen={(id) => {
                    const p = patients.find((x) => x.id === id);
                    if (p) setDetailPatient(p);
                  }}
                />
              </div>
            </div>
          </main>
          <CallQueueRail
            items={queue}
            onCall={async (patient) => {
              try {
                await api.twilioCall(patient.id);
                toast.success(`Dialing ${patient.first_name} via Twilio (mock)`);
              } catch (e) {
                toast.error("Call failed");
              }
            }}
            onSchedule={async (patient, provider) => {
              const when = new Date();
              when.setDate(when.getDate() + 1);
              try {
                await api.schedule({
                  patient_id: patient.id,
                  provider,
                  when_iso: when.toISOString(),
                });
                toast.success(`Scheduled on ${provider}`);
                refreshAll();
              } catch (e) {
                toast.error("Schedule failed");
              }
            }}
            onOpen={(p) => setDetailPatient(p)}
          />
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

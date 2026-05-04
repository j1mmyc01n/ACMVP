import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus, Search, RefreshCw, Activity as ActivityIcon, Filter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import KpiStrip from "@/components/kanban/KpiStrip";
import KanbanColumn from "@/components/kanban/KanbanColumn";
import PatientDrawer from "@/components/kanban/PatientDrawer";
import AddPatientDialog from "@/components/kanban/AddPatientDialog";
import LiveIndicator from "@/components/kanban/LiveIndicator";

import { CRISIS_LEVELS, groupByLevel } from "@/lib/kanbanConstants";
import { useKanbanWebSocket } from "@/hooks/useKanbanWebSocket";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function KanbanBoard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clinicianFilter, setClinicianFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pulsingIds, setPulsingIds] = useState(new Set());
  const pulseTimers = useRef({});

  // Trigger a temporary visual pulse on a card (used for websocket-driven updates)
  const triggerPulse = useCallback((id) => {
    setPulsingIds((prev) => new Set(prev).add(id));
    clearTimeout(pulseTimers.current[id]);
    pulseTimers.current[id] = setTimeout(() => {
      setPulsingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  }, []);

  // ---- Data fetch ----
  const loadPatients = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/patients`);
      setPatients(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // ---- WebSocket ----
  const onWsEvent = useCallback(
    (ev) => {
      if (!ev || !ev.type) return;
      if (ev.type === "snapshot" && Array.isArray(ev.patients)) {
        setPatients(ev.patients);
        return;
      }
      if (ev.type === "patient.created" && ev.patient) {
        setPatients((prev) =>
          prev.some((p) => p.id === ev.patient.id) ? prev : [...prev, ev.patient]
        );
        triggerPulse(ev.patient.id);
        return;
      }
      if (ev.type === "patient.updated" && ev.patient) {
        setPatients((prev) => prev.map((p) => (p.id === ev.patient.id ? ev.patient : p)));
        triggerPulse(ev.patient.id);
        return;
      }
      if (ev.type === "patient.moved" && ev.patient) {
        setPatients((prev) => prev.map((p) => (p.id === ev.patient.id ? ev.patient : p)));
        triggerPulse(ev.patient.id);
        return;
      }
      if (ev.type === "patient.deleted" && ev.id) {
        setPatients((prev) => prev.filter((p) => p.id !== ev.id));
        return;
      }
      if (ev.type === "patients.seeded") {
        loadPatients();
        return;
      }
    },
    [triggerPulse, loadPatients]
  );

  const { connected } = useKanbanWebSocket(BACKEND_URL, onWsEvent);

  // ---- Filters ----
  const clinicians = useMemo(() => {
    const set = new Set(patients.map((p) => p.assigned_clinician).filter(Boolean));
    return Array.from(set).sort();
  }, [patients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      if (clinicianFilter !== "all" && p.assigned_clinician !== clinicianFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.crn || "").toLowerCase().includes(q) ||
        (p.assigned_clinician || "").toLowerCase().includes(q)
      );
    });
  }, [patients, search, clinicianFilter]);

  const grouped = useMemo(() => groupByLevel(filtered), [filtered]);

  // ---- Drag & drop ----
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const toLevel = destination.droppableId;
    // Optimistic reorder
    setPatients((prev) => {
      // Grab the dragged patient
      const moving = prev.find((p) => p.id === draggableId);
      if (!moving) return prev;
      const updated = { ...moving, crisis_level: toLevel };
      const others = prev.filter((p) => p.id !== draggableId);

      // Insert at destination position inside destination column
      const destColumn = others
        .filter((p) => p.crisis_level === toLevel)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      destColumn.splice(destination.index, 0, updated);
      destColumn.forEach((p, i) => (p.order = i));

      // Re-number source column too
      const srcColumn = others
        .filter((p) => p.crisis_level === source.droppableId && p.crisis_level !== toLevel)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      srcColumn.forEach((p, i) => (p.order = i));

      return [
        ...others.filter(
          (p) => p.crisis_level !== toLevel && p.crisis_level !== source.droppableId
        ),
        ...srcColumn,
        ...destColumn,
      ];
    });

    try {
      await axios.patch(`${API}/patients/${draggableId}/move`, {
        crisis_level: toLevel,
        order: destination.index,
      });
      if (source.droppableId !== destination.droppableId) {
        toast.success(
          `Moved to ${CRISIS_LEVELS.find((l) => l.id === toLevel)?.name}`
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to move patient");
      loadPatients();
    }
  };

  // ---- Actions ----
  const onSavePatient = async (form) => {
    try {
      const res = await axios.patch(`${API}/patients/${form.id}`, {
        name: form.name,
        age: form.age,
        avatar_url: form.avatar_url,
        crisis_level: form.crisis_level,
        risk_score: form.risk_score,
        assigned_clinician: form.assigned_clinician,
        clinician_avatar: form.clinician_avatar,
        vitals: form.vitals,
        notes: form.notes,
        review_date: form.review_date,
      });
      setPatients((prev) => prev.map((p) => (p.id === res.data.id ? res.data : p)));
      setSelectedPatient(res.data);
      toast.success("Patient updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update patient");
    }
  };

  const onDeletePatient = async (id) => {
    try {
      await axios.delete(`${API}/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setDrawerOpen(false);
      toast.success("Patient removed");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete");
    }
  };

  const onCreatePatient = async (form) => {
    try {
      const res = await axios.post(`${API}/patients`, form);
      // Dedupe: WS broadcast may have already added this patient
      setPatients((prev) =>
        prev.some((p) => p.id === res.data.id) ? prev : [...prev, res.data]
      );
      setAddOpen(false);
      toast.success("Patient created");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create patient");
    }
  };

  const onReseed = async () => {
    try {
      await axios.post(`${API}/patients/seed?reset=true`);
      await loadPatients();
      toast.success("Demo data reseeded");
    } catch (e) {
      toast.error("Failed to reseed");
    }
  };

  // ---- UI ----
  return (
    <div
      className="min-h-screen text-slate-100 relative"
      style={{
        background:
          "radial-gradient(1200px circle at 10% -10%, rgba(16,185,129,0.07), transparent 50%), radial-gradient(900px circle at 100% 10%, rgba(225,29,72,0.08), transparent 50%), #090E17",
      }}
      data-testid="kanban-page"
    >
      {/* Grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Top bar */}
      <div className="relative px-6 md:px-8 lg:px-10 pt-7 pb-5 border-b border-slate-900">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-400 font-semibold">
              <ActivityIcon className="h-3 w-3 text-emerald-400" />
              Acute Connect · Crisis Operations
            </div>
            <h1 className="mt-2 font-[Manrope] text-[32px] md:text-[38px] font-extrabold tracking-tight leading-tight text-slate-50">
              Crisis Patient{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                Kanban
              </span>
            </h1>
            <p className="mt-1 text-[13px] text-slate-400 max-w-xl">
              Drag patients between severity lanes. Cards sync live across every
              clinician screen over secure WebSocket.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LiveIndicator connected={connected} />
            <Button
              data-testid="btn-reseed"
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800"
              onClick={onReseed}
              title="Reload demo data"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Reseed
            </Button>
            <Button
              data-testid="btn-add-patient"
              className="bg-emerald-500/90 hover:bg-emerald-500 text-emerald-950 font-bold"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> New patient
            </Button>
          </div>
        </div>

        {/* KPI + filters */}
        <div className="mt-6 space-y-4">
          <KpiStrip patients={patients} />

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                data-testid="filter-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, CRN or clinician..."
                className="pl-9 bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={clinicianFilter} onValueChange={setClinicianFilter}>
                <SelectTrigger
                  data-testid="filter-clinician"
                  className="w-[220px] bg-slate-900/60 border-slate-800 text-slate-100"
                >
                  <SelectValue placeholder="All clinicians" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectItem value="all">All clinicians</SelectItem>
                  {clinicians.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="relative px-4 md:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="h-[50vh] flex items-center justify-center text-slate-500">
            Loading clinical board...
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div
              className="grid gap-4 overflow-x-auto pb-10"
              style={{
                gridTemplateColumns:
                  "repeat(5, minmax(288px, 1fr))",
              }}
              data-testid="kanban-grid"
            >
              {CRISIS_LEVELS.map((lvl) => (
                <KanbanColumn
                  key={lvl.id}
                  level={lvl}
                  patients={grouped[lvl.id] || []}
                  pulsingIds={pulsingIds}
                  onOpenPatient={(p) => {
                    setSelectedPatient(p);
                    setDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Drawer + Add dialog */}
      <PatientDrawer
        patient={selectedPatient}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={onSavePatient}
        onDelete={onDeletePatient}
      />
      <AddPatientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={onCreatePatient}
      />
    </div>
  );
}

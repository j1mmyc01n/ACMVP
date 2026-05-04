import { DragDropContext } from "@hello-pangea/dnd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Maximize2, Minimize2 } from "lucide-react";

import KanbanColumn from "@/components/kanban/KanbanColumn";
import LiveIndicator from "@/components/kanban/LiveIndicator";
import { CRISIS_LEVELS, groupByLevel } from "@/lib/kanbanConstants";
import { useKanbanWebSocket } from "@/hooks/useKanbanWebSocket";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Bare Kanban view: just the 5 columns of cards.
 * - No KPI strip, no filters, no add/reseed buttons.
 * - Reads patients from /api/patients and reflects realtime mutations from /api/ws.
 * - Drag-and-drop is supported (the dashboard owner may turn this off later).
 *
 * Props
 *   variant:    "embed" (default, inside the dashboard tab) | "popout" (own window, max'd)
 *   onPopout:   () => void   — only used when variant === "embed"
 *   onClose:    () => void   — only used when variant === "popout"
 */
export default function KanbanView({ variant = "embed", onPopout, onClose }) {
  const [patients, setPatients] = useState([]);
  const [pulsingIds, setPulsingIds] = useState(new Set());
  const pulseTimers = useRef({});

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

  const loadPatients = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/patients`);
      setPatients(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const onWsEvent = useCallback(
    (ev) => {
      if (!ev?.type) return;
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
  const grouped = useMemo(() => groupByLevel(patients), [patients]);

  // Drag & drop still updates crisis level & order so the move propagates back to
  // the patient profile / crisis dashboard via the same DB write.
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const toLevel = destination.droppableId;
    setPatients((prev) => {
      const moving = prev.find((p) => p.id === draggableId);
      if (!moving) return prev;
      const updated = { ...moving, crisis_level: toLevel };
      const others = prev.filter((p) => p.id !== draggableId);
      const destColumn = others
        .filter((p) => p.crisis_level === toLevel)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      destColumn.splice(destination.index, 0, updated);
      destColumn.forEach((p, i) => (p.order = i));
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
    } catch (e) {
      console.error(e);
      loadPatients();
    }
  };

  const isPopout = variant === "popout";

  return (
    <div
      data-testid={isPopout ? "kanban-popout" : "kanban-tab"}
      className={`relative ${isPopout ? "min-h-screen bg-white" : ""}`}
    >
      {/* Compact toolbar — only the live dot + maximize (per request: minimal chrome) */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
          <span className="hidden sm:inline">5 lanes</span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span>{patients.length} patients</span>
        </div>
        <div className="flex items-center gap-2">
          <LiveIndicator connected={connected} />
          {!isPopout ? (
            <button
              data-testid="kanban-popout-btn"
              onClick={onPopout}
              title="Pop out to another display"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold px-2.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm transition"
            >
              <Maximize2 className="h-3 w-3" /> Pop out
            </button>
          ) : (
            <button
              data-testid="kanban-popout-close"
              onClick={onClose}
              title="Close popout"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold px-2.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm transition"
            >
              <Minimize2 className="h-3 w-3" /> Close
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className={`grid gap-4 overflow-x-auto pb-6 ${isPopout ? "px-6 pt-2" : ""}`}
          style={{ gridTemplateColumns: "repeat(5, minmax(288px, 1fr))" }}
          data-testid="kanban-grid"
        >
          {CRISIS_LEVELS.map((lvl) => (
            <KanbanColumn
              key={lvl.id}
              level={lvl}
              patients={grouped[lvl.id] || []}
              pulsingIds={pulsingIds}
              onOpenPatient={() => {}}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

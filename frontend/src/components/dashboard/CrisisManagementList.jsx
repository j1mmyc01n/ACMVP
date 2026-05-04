import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Pencil, Save, X, AlertTriangle, Users } from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { CRISIS_LEVELS, LEVEL_BY_ID, formatRelative, isOverdue } from "@/lib/kanbanConstants";
import { useKanbanWebSocket } from "@/hooks/useKanbanWebSocket";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Crisis Management Dashboard / Patient Profile list — the SOURCE OF TRUTH.
 * Editing a patient here writes to the DB and broadcasts on websocket; the
 * Kanban tab and any popped-out kanban window auto-update accordingly.
 */
export default function CrisisManagementList() {
  const [patients, setPatients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/patients`);
      setPatients(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep this list in sync with WS too (so editing in another tab also reflects here)
  const onWsEvent = useCallback(
    (ev) => {
      if (!ev?.type) return;
      if (ev.type === "snapshot" && Array.isArray(ev.patients)) setPatients(ev.patients);
      if (ev.type === "patient.created" && ev.patient)
        setPatients((p) =>
          p.some((x) => x.id === ev.patient.id) ? p : [...p, ev.patient]
        );
      if ((ev.type === "patient.updated" || ev.type === "patient.moved") && ev.patient)
        setPatients((p) => p.map((x) => (x.id === ev.patient.id ? ev.patient : x)));
      if (ev.type === "patient.deleted" && ev.id)
        setPatients((p) => p.filter((x) => x.id !== ev.id));
      if (ev.type === "patients.seeded") load();
    },
    [load]
  );
  useKanbanWebSocket(BACKEND_URL, onWsEvent);

  const startEdit = (p) => {
    setEditingId(p.id);
    setDraft({ ...p, vitals: { ...p.vitals } });
  };
  const cancel = () => {
    setEditingId(null);
    setDraft(null);
  };
  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setVital = (k, v) =>
    setDraft((d) => ({ ...d, vitals: { ...d.vitals, [k]: Number(v) || 0 } }));

  const save = async () => {
    try {
      const res = await axios.patch(`${API}/patients/${draft.id}`, {
        name: draft.name,
        age: draft.age,
        crisis_level: draft.crisis_level,
        risk_score: draft.risk_score,
        assigned_clinician: draft.assigned_clinician,
        vitals: draft.vitals,
        notes: draft.notes,
        review_date: draft.review_date,
      });
      setPatients((p) => p.map((x) => (x.id === res.data.id ? res.data : x)));
      toast.success("Patient profile updated · synced to Kanban");
      cancel();
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    }
  };

  const counts = useMemo(() => {
    const c = Object.fromEntries(CRISIS_LEVELS.map((l) => [l.id, 0]));
    patients.forEach((p) => (c[p.crisis_level] = (c[p.crisis_level] || 0) + 1));
    return c;
  }, [patients]);

  return (
    <div className="space-y-5" data-testid="crisis-management-list">
      {/* Severity strip — read-only, just so the user sees the lane sizes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {CRISIS_LEVELS.map((l) => (
          <div
            key={l.id}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: l.accent, boxShadow: `0 0 8px ${l.accent}` }}
              />
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300 font-semibold truncate">
                {l.name}
              </div>
            </div>
            <div className="font-mono text-sm text-slate-100">{counts[l.id] || 0}</div>
          </div>
        ))}
      </div>

      {/* Patient list */}
      <div
        className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden"
        data-testid="patients-table"
      >
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-slate-500 border-b border-slate-800 bg-slate-900/40">
          <div className="col-span-3">Patient</div>
          <div className="col-span-2">Crisis Level</div>
          <div className="col-span-1 text-center">Risk</div>
          <div className="col-span-2">Clinician</div>
          <div className="col-span-2">Vitals</div>
          <div className="col-span-1">Review</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {patients.length === 0 && (
          <div className="px-4 py-6 text-slate-500 text-sm">No patients yet.</div>
        )}

        {patients.map((p) => {
          const level = LEVEL_BY_ID[p.crisis_level] || LEVEL_BY_ID.stable;
          const editing = editingId === p.id;
          const overdue = isOverdue(p.review_date);
          const d = editing ? draft : p;
          return (
            <div
              key={p.id}
              data-testid={`patient-row-${p.id}`}
              className="relative grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-900/80 hover:bg-slate-900/30 transition-colors"
            >
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: level.accent }}
              />
              {/* Patient */}
              <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                <Avatar className="h-8 w-8 border border-slate-700">
                  <AvatarImage src={p.avatar_url} alt={p.name} />
                  <AvatarFallback className="bg-slate-800 text-slate-200 text-[11px]">
                    {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  {editing ? (
                    <Input
                      data-testid={`row-input-name-${p.id}`}
                      className="h-7 bg-slate-900/70 border-slate-800 text-slate-100 text-sm"
                      value={d.name}
                      onChange={(e) => setField("name", e.target.value)}
                    />
                  ) : (
                    <div className="text-[13px] font-bold text-slate-100 truncate">{p.name}</div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    <span className="font-mono">{p.crn}</span>
                    <span className="mx-1 text-slate-700">·</span>
                    {editing ? (
                      <input
                        type="number"
                        className="bg-transparent w-12 text-slate-300 outline-none border-b border-slate-700"
                        value={d.age}
                        onChange={(e) => setField("age", Number(e.target.value) || 0)}
                      />
                    ) : (
                      <span>{p.age} yrs</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Crisis level */}
              <div className="col-span-2">
                {editing ? (
                  <Select
                    value={d.crisis_level}
                    onValueChange={(v) => setField("crisis_level", v)}
                  >
                    <SelectTrigger
                      data-testid={`row-select-level-${p.id}`}
                      className="h-7 bg-slate-900/70 border-slate-800 text-slate-100"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                      {CRISIS_LEVELS.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded-md border ${level.badgeBg} ${level.badgeBorder} ${level.text}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: level.accent }} />
                    {level.name}
                  </span>
                )}
              </div>

              {/* Risk */}
              <div className="col-span-1 text-center">
                {editing ? (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    data-testid={`row-input-risk-${p.id}`}
                    className="h-7 bg-slate-900/70 border-slate-800 text-slate-100 font-mono text-center text-xs"
                    value={d.risk_score}
                    onChange={(e) =>
                      setField(
                        "risk_score",
                        Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      )
                    }
                  />
                ) : (
                  <span className="font-mono text-sm text-slate-200">{p.risk_score}</span>
                )}
              </div>

              {/* Clinician */}
              <div className="col-span-2 min-w-0">
                {editing ? (
                  <Input
                    className="h-7 bg-slate-900/70 border-slate-800 text-slate-100 text-xs"
                    value={d.assigned_clinician}
                    onChange={(e) => setField("assigned_clinician", e.target.value)}
                  />
                ) : (
                  <span className="text-[12px] text-slate-300 truncate inline-block max-w-full">
                    {p.assigned_clinician}
                  </span>
                )}
              </div>

              {/* Vitals */}
              <div className="col-span-2 font-mono text-[11px] text-slate-300">
                {editing ? (
                  <div className="flex gap-1">
                    <Input
                      className="h-7 w-12 bg-slate-900/70 border-slate-800 text-slate-100 font-mono text-[11px] px-1"
                      value={d.vitals.hr}
                      onChange={(e) => setVital("hr", e.target.value)}
                    />
                    <Input
                      className="h-7 w-16 bg-slate-900/70 border-slate-800 text-slate-100 font-mono text-[11px] px-1"
                      value={`${d.vitals.bp_sys}`}
                      onChange={(e) => setVital("bp_sys", e.target.value)}
                    />
                    <Input
                      className="h-7 w-12 bg-slate-900/70 border-slate-800 text-slate-100 font-mono text-[11px] px-1"
                      value={d.vitals.spo2}
                      onChange={(e) => setVital("spo2", e.target.value)}
                    />
                  </div>
                ) : (
                  <span>
                    HR {p.vitals?.hr} · {p.vitals?.bp_sys}/{p.vitals?.bp_dia} · SpO₂{" "}
                    {p.vitals?.spo2}%
                  </span>
                )}
              </div>

              {/* Review */}
              <div className="col-span-1 text-[11px] font-mono">
                {editing ? (
                  <Input
                    type="date"
                    className="h-7 bg-slate-900/70 border-slate-800 text-slate-100 text-[11px]"
                    value={d.review_date}
                    onChange={(e) => setField("review_date", e.target.value)}
                  />
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      overdue ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {overdue && <AlertTriangle className="h-3 w-3" />}
                    {p.review_date}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1">
                {editing ? (
                  <>
                    <Button
                      data-testid={`row-save-${p.id}`}
                      size="sm"
                      onClick={save}
                      className="h-7 px-2 bg-emerald-500/90 hover:bg-emerald-500 text-emerald-950 font-bold"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancel}
                      className="h-7 px-2 text-slate-400 hover:text-slate-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    data-testid={`row-edit-${p.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(p)}
                    className="h-7 px-2 text-slate-400 hover:text-slate-100"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="col-span-12 mt-1 text-[10px] text-slate-600 font-mono">
                Updated {formatRelative(p.last_update)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <Users className="h-3.5 w-3.5" />
        Editing a patient here instantly syncs to the Kanban tab and any popped-out kanban
        window.
      </div>
    </div>
  );
}

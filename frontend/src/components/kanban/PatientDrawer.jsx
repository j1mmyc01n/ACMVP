import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Save, User, Calendar, Stethoscope, FileText } from "lucide-react";
import { CRISIS_LEVELS, LEVEL_BY_ID, formatRelative, isOverdue } from "@/lib/kanbanConstants";
import VitalsStrip from "./VitalsStrip";

export default function PatientDrawer({ patient, open, onOpenChange, onSave, onDelete }) {
  const [form, setForm] = useState(patient);

  useEffect(() => {
    setForm(patient);
  }, [patient]);

  if (!form) return null;
  const level = LEVEL_BY_ID[form.crisis_level] || LEVEL_BY_ID.stable;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setVital = (key, value) =>
    setForm((f) => ({ ...f, vitals: { ...f.vitals, [key]: Number(value) || 0 } }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-full sm:!max-w-[460px] bg-[#0B121C] text-slate-100 border-l border-slate-800 overflow-y-auto p-0"
        data-testid="patient-drawer"
      >
        {/* Header */}
        <div
          className="relative p-5 border-b border-slate-800"
          style={{ background: level.gradient }}
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: level.accent }}
          />
          <SheetHeader className="space-y-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-slate-700">
                <AvatarImage src={form.avatar_url} alt={form.name} />
                <AvatarFallback className="bg-slate-800 text-slate-200">
                  {form.name?.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="font-[Manrope] text-slate-100 text-lg truncate">
                  {form.name}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                  <span className="font-mono">{form.crn}</span>
                  <span className="text-slate-600">·</span>
                  <span>{form.age} yrs</span>
                  <span className="text-slate-600">·</span>
                  <span className={`${level.text} font-semibold uppercase tracking-wider`}>
                    {level.name}
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-4">
            <VitalsStrip vitals={form.vitals} />
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
            <span className="text-slate-500">
              Updated {formatRelative(form.last_update)}
            </span>
            <span
              className={
                isOverdue(form.review_date) ? "text-rose-400 font-bold" : "text-slate-500"
              }
            >
              Review {form.review_date}
            </span>
          </div>
        </div>

        {/* Editable form */}
        <div className="p-5 space-y-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              <User className="h-3 w-3" /> Patient Profile
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-slate-400">Name</Label>
                <Input
                  data-testid="drawer-input-name"
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                  value={form.name || ""}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">Age</Label>
                <Input
                  data-testid="drawer-input-age"
                  type="number"
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                  value={form.age ?? ""}
                  onChange={(e) => setField("age", Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              <Stethoscope className="h-3 w-3" /> Clinical
            </div>
            <div>
              <Label className="text-[11px] text-slate-400">Crisis level</Label>
              <Select
                value={form.crisis_level}
                onValueChange={(v) => setField("crisis_level", v)}
              >
                <SelectTrigger
                  data-testid="drawer-select-level"
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  {CRISIS_LEVELS.map((l) => (
                    <SelectItem key={l.id} value={l.id} data-testid={`drawer-level-${l.id}`}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: l.accent }}
                        />
                        {l.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-slate-400">Risk score (0-100)</Label>
                <Input
                  data-testid="drawer-input-risk"
                  type="number"
                  min={0}
                  max={100}
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                  value={form.risk_score ?? 0}
                  onChange={(e) =>
                    setField("risk_score", Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">Assigned clinician</Label>
                <Input
                  data-testid="drawer-input-clinician"
                  className="bg-slate-900/60 border-slate-800 text-slate-100"
                  value={form.assigned_clinician || ""}
                  onChange={(e) => setField("assigned_clinician", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-[11px] text-slate-400">HR</Label>
                <Input
                  data-testid="drawer-input-hr"
                  type="number"
                  className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                  value={form.vitals?.hr ?? 0}
                  onChange={(e) => setVital("hr", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">BP sys</Label>
                <Input
                  data-testid="drawer-input-bpsys"
                  type="number"
                  className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                  value={form.vitals?.bp_sys ?? 0}
                  onChange={(e) => setVital("bp_sys", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">BP dia</Label>
                <Input
                  data-testid="drawer-input-bpdia"
                  type="number"
                  className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                  value={form.vitals?.bp_dia ?? 0}
                  onChange={(e) => setVital("bp_dia", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">SpO₂</Label>
                <Input
                  data-testid="drawer-input-spo2"
                  type="number"
                  className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                  value={form.vitals?.spo2 ?? 0}
                  onChange={(e) => setVital("spo2", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              <Calendar className="h-3 w-3" /> Review
            </div>
            <Input
              data-testid="drawer-input-review"
              type="date"
              className="bg-slate-900/60 border-slate-800 text-slate-100"
              value={form.review_date || ""}
              onChange={(e) => setField("review_date", e.target.value)}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              <FileText className="h-3 w-3" /> Clinical notes
            </div>
            <Textarea
              data-testid="drawer-input-notes"
              className="bg-slate-900/60 border-slate-800 text-slate-100 min-h-[110px]"
              value={form.notes || ""}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </section>

          <div className="flex items-center justify-between pt-2">
            <Button
              data-testid="drawer-btn-delete"
              variant="ghost"
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              onClick={() => onDelete?.(form.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button
              data-testid="drawer-btn-save"
              className="bg-emerald-500/90 hover:bg-emerald-500 text-emerald-950 font-bold"
              onClick={() => onSave?.(form)}
            >
              <Save className="h-4 w-4 mr-1" /> Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

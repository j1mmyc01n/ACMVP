import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CRISIS_LEVELS } from "@/lib/kanbanConstants";

const empty = {
  name: "",
  age: 30,
  avatar_url: "",
  crisis_level: "stable",
  risk_score: 10,
  assigned_clinician: "Dr. Sophia Lee",
  clinician_avatar: "",
  vitals: { hr: 72, bp_sys: 118, bp_dia: 76, spo2: 98 },
  notes: "",
  review_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
};

export default function AddPatientDialog({ open, onOpenChange, onCreate }) {
  const [form, setForm] = useState(empty);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setVital = (k, v) =>
    setForm((f) => ({ ...f, vitals: { ...f.vitals, [k]: Number(v) || 0 } }));

  const submit = () => {
    onCreate?.(form);
    setForm(empty);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0B121C] border border-slate-800 text-slate-100 sm:max-w-[520px]"
        data-testid="add-patient-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-[Manrope] text-slate-100">
            New Crisis Patient
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px] text-slate-400">Full name</Label>
            <Input
              data-testid="add-input-name"
              className="bg-slate-900/60 border-slate-800 text-slate-100"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Age</Label>
            <Input
              data-testid="add-input-age"
              type="number"
              className="bg-slate-900/60 border-slate-800 text-slate-100"
              value={form.age}
              onChange={(e) => setField("age", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Crisis level</Label>
            <Select
              value={form.crisis_level}
              onValueChange={(v) => setField("crisis_level", v)}
            >
              <SelectTrigger
                data-testid="add-select-level"
                className="bg-slate-900/60 border-slate-800 text-slate-100"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                {CRISIS_LEVELS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
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
          <div>
            <Label className="text-[11px] text-slate-400">Risk score (0-100)</Label>
            <Input
              data-testid="add-input-risk"
              type="number"
              min={0}
              max={100}
              className="bg-slate-900/60 border-slate-800 text-slate-100"
              value={form.risk_score}
              onChange={(e) => setField("risk_score", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Assigned clinician</Label>
            <Input
              data-testid="add-input-clinician"
              className="bg-slate-900/60 border-slate-800 text-slate-100"
              value={form.assigned_clinician}
              onChange={(e) => setField("assigned_clinician", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Review date</Label>
            <Input
              data-testid="add-input-review"
              type="date"
              className="bg-slate-900/60 border-slate-800 text-slate-100"
              value={form.review_date}
              onChange={(e) => setField("review_date", e.target.value)}
            />
          </div>
          <div className="col-span-2 grid grid-cols-4 gap-2">
            <div>
              <Label className="text-[11px] text-slate-400">HR</Label>
              <Input
                type="number"
                data-testid="add-input-hr"
                className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                value={form.vitals.hr}
                onChange={(e) => setVital("hr", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[11px] text-slate-400">BP sys</Label>
              <Input
                type="number"
                className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                value={form.vitals.bp_sys}
                onChange={(e) => setVital("bp_sys", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[11px] text-slate-400">BP dia</Label>
              <Input
                type="number"
                className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                value={form.vitals.bp_dia}
                onChange={(e) => setVital("bp_dia", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[11px] text-slate-400">SpO₂</Label>
              <Input
                type="number"
                className="bg-slate-900/60 border-slate-800 text-slate-100 font-mono"
                value={form.vitals.spo2}
                onChange={(e) => setVital("spo2", e.target.value)}
              />
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-slate-400">Clinical notes</Label>
            <Textarea
              data-testid="add-input-notes"
              className="bg-slate-900/60 border-slate-800 text-slate-100 min-h-[80px]"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Intake summary, safety plan, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="text-slate-300 hover:bg-slate-800"
            onClick={() => onOpenChange(false)}
            data-testid="add-btn-cancel"
          >
            Cancel
          </Button>
          <Button
            className="bg-emerald-500/90 hover:bg-emerald-500 text-emerald-950 font-bold"
            onClick={submit}
            disabled={!form.name.trim()}
            data-testid="add-btn-create"
          >
            Create patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

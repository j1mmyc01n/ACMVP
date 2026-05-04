import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Plus,
  Trash2,
  MapPin,
  Stethoscope,
  Network,
  Users,
  GripVertical,
  Workflow,
  ArrowRight,
  Building2,
} from "lucide-react";

const SPECIALITIES = [
  { value: "general", label: "General" },
  { value: "mental_health", label: "Mental health" },
  { value: "ndis", label: "NDIS" },
  { value: "acute_care", label: "Acute care" },
  { value: "gp", label: "General practice" },
  { value: "paediatric", label: "Paediatric" },
  { value: "allied", label: "Allied health" },
];

const SPEC_BG = {
  general: "#f3f3ef",
  mental_health: "#fef2f2",
  ndis: "#eff6ff",
  acute_care: "#fef2f2",
  gp: "#ecfdf5",
  paediatric: "#fffbeb",
  allied: "#f5f3ff",
};
const SPEC_C = {
  general: "#525252",
  mental_health: "#dc2626",
  ndis: "#2563eb",
  acute_care: "#dc2626",
  gp: "#10b981",
  paediatric: "#f59e0b",
  allied: "#7c3aed",
};

const STAGE_PALETTE = [
  "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#64748b",
  "#ef4444", "#0ea5e9", "#a855f7", "#14b8a6", "#f97316",
];

const DEFAULT_STAGES = [
  { key: "intake", label: "Intake", color: "#3b82f6" },
  { key: "triage", label: "Triage", color: "#f59e0b" },
  { key: "active", label: "Active", color: "#10b981" },
  { key: "follow_up", label: "Follow-up", color: "#8b5cf6" },
  { key: "discharged", label: "Discharged", color: "#64748b" },
];

function StagesEditor({ stages, onChange }) {
  const update = (i, key, val) => {
    onChange(stages.map((s, j) => (j === i ? { ...s, [key]: val } : s)));
  };
  const remove = (i) => onChange(stages.filter((_, j) => j !== i));
  const move = (i, dir) => {
    const ni = i + dir;
    if (ni < 0 || ni >= stages.length) return;
    const arr = [...stages];
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    onChange(arr);
  };
  const add = () => {
    const color = STAGE_PALETTE[stages.length % STAGE_PALETTE.length];
    onChange([
      ...stages,
      { key: `stage_${stages.length + 1}`, label: `Stage ${stages.length + 1}`, color },
    ]);
  };
  const reset = () => onChange(DEFAULT_STAGES.map((s) => ({ ...s })));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
          <Workflow size={12} strokeWidth={1.8} />
          <span>Each stage becomes a Kanban lane.</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={reset} className="text-[11px] text-ink-muted hover:text-ink underline-offset-2 hover:underline">
            Reset to default
          </button>
          <button type="button" onClick={add} className="flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink">
            <Plus size={12} /> Add stage
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {stages.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[24px_44px_1fr_1fr_auto] gap-2 items-center"
            data-testid={`stage-row-${i}`}
          >
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-ink-faint opacity-60 hover:opacity-100 disabled:opacity-20"
                aria-label="Move up"
              >
                <GripVertical size={12} />
              </button>
            </div>
            <input
              type="color"
              value={s.color || "#64748b"}
              onChange={(e) => update(i, "color", e.target.value)}
              className="h-9 w-11 rounded-[8px] border border-paper-rule bg-white cursor-pointer"
              aria-label="Stage colour"
            />
            <input
              value={s.label || ""}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Stage label"
              className="h-9 border border-paper-rule bg-white rounded-[8px] px-2.5 text-[12.5px]"
              data-testid={`stage-label-${i}`}
            />
            <input
              value={s.key || ""}
              onChange={(e) => update(i, "key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              placeholder="stage_key"
              className="h-9 border border-paper-rule bg-paper-rail rounded-[8px] px-2.5 text-[12px] font-mono"
              data-testid={`stage-key-${i}`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="icon-btn"
              aria-label="Remove stage"
              disabled={stages.length <= 1}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-ink-muted">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-medium tracking-wider uppercase"
              style={{ background: `${s.color}1a`, color: s.color }}
            >
              {s.label}
            </span>
            {i < stages.length - 1 && <ArrowRight size={11} className="text-ink-faint" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationCard({ location, onUpdate, onSaveFields, onSaveStages, onDelete }) {
  const [name, setName] = useState(location.name);
  const [speciality, setSpeciality] = useState(location.speciality || "general");
  const [network, setNetwork] = useState(location.network || "");
  const [seats, setSeats] = useState(location.seats || 5);
  const [fields, setFields] = useState(location.custom_fields || []);
  const [stages, setStages] = useState(
    location.pipeline_stages && location.pipeline_stages.length
      ? location.pipeline_stages
      : DEFAULT_STAGES.map((s) => ({ ...s }))
  );
  const [dirty, setDirty] = useState(false);

  const updateField = (i, key, val) => {
    setFields((arr) => arr.map((f, j) => (j === i ? { ...f, [key]: val } : f)));
    setDirty(true);
  };
  const addField = () => {
    setFields((arr) => [...arr, { key: `field_${arr.length + 1}`, label: "", type: "text" }]);
    setDirty(true);
  };
  const removeField = (i) => {
    setFields((arr) => arr.filter((_, j) => j !== i));
    setDirty(true);
  };

  const save = async () => {
    await onUpdate(location.id, { name, speciality, network, seats: Number(seats) });
    await onSaveFields(location.id, fields);
    await onSaveStages(location.id, stages);
    setDirty(false);
  };

  return (
    <div className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow" data-testid={`loc-${location.id}`}>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div className="flex-1 min-w-[220px]">
          <div className="label-micro flex items-center gap-1.5">
            <MapPin size={10} /> {location.timezone || "—"}
          </div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className="font-display text-[24px] tracking-[-0.01em] mt-1 bg-transparent w-full focus:outline-none border-b border-transparent focus:border-paper-rule"
            data-testid={`loc-name-${location.id}`}
          />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="chip" style={{ background: SPEC_BG[speciality], color: SPEC_C[speciality] }}>
              <Stethoscope size={10} />
              {SPECIALITIES.find((s) => s.value === speciality)?.label}
            </span>
            {network && (
              <span className="chip" style={{ background: "#f3f3ef", color: "#525252" }}>
                <Network size={10} />
                {network}
              </span>
            )}
            <span className="chip" style={{ background: "#f3f3ef", color: "#525252" }}>
              <Users size={10} />
              {seats} seats
            </span>
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(location)}
            className="icon-btn shrink-0"
            aria-label="Delete location"
            data-testid={`loc-delete-${location.id}`}
            title="Delete location"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-paper-rule pt-4">
        <label className="flex flex-col gap-1.5">
          <span className="label-micro">Speciality</span>
          <select
            value={speciality}
            onChange={(e) => {
              setSpeciality(e.target.value);
              setDirty(true);
            }}
            className="h-9 border border-paper-rule bg-white rounded-[8px] px-2.5 text-[12.5px]"
            data-testid={`loc-spec-${location.id}`}
          >
            {SPECIALITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-micro">Care network</span>
          <input
            value={network}
            onChange={(e) => {
              setNetwork(e.target.value);
              setDirty(true);
            }}
            placeholder="e.g. Acute Care Group"
            className="h-9 border border-paper-rule bg-white rounded-[8px] px-2.5 text-[12.5px]"
            data-testid={`loc-net-${location.id}`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-micro">Seats</span>
          <input
            type="number"
            min="1"
            value={seats}
            onChange={(e) => {
              setSeats(e.target.value);
              setDirty(true);
            }}
            className="h-9 border border-paper-rule bg-white rounded-[8px] px-2.5 text-[12.5px] font-mono ticker"
            data-testid={`loc-seats-${location.id}`}
          />
        </label>
      </div>

      <div className="border-t border-paper-rule pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="label-micro flex items-center gap-1.5">
            <Workflow size={11} /> Pipeline stages
          </div>
        </div>
        <StagesEditor
          stages={stages}
          onChange={(s) => {
            setStages(s);
            setDirty(true);
          }}
        />
      </div>

      <div className="border-t border-paper-rule pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="label-micro">Custom intake fields</div>
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
            data-testid={`loc-add-field-${location.id}`}
          >
            <Plus size={12} /> Add field
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {fields.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_120px_auto] gap-2 items-center">
              <input
                value={f.key}
                onChange={(e) => updateField(i, "key", e.target.value)}
                placeholder="field_key"
                className="h-9 border border-paper-rule bg-paper-rail rounded-[8px] px-2.5 text-[12px] font-mono"
              />
              <input
                value={f.label}
                onChange={(e) => updateField(i, "label", e.target.value)}
                placeholder="Display label"
                className="h-9 border border-paper-rule bg-white rounded-[8px] px-2.5 text-[12.5px]"
              />
              <select
                value={f.type || "text"}
                onChange={(e) => updateField(i, "type", e.target.value)}
                className="h-9 border border-paper-rule bg-white rounded-[8px] px-2 text-[12.5px]"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
              </select>
              <button type="button" onClick={() => removeField(i)} className="icon-btn" aria-label="Remove">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-[12px] text-ink-muted py-3 text-center border border-dashed border-paper-rule rounded-[10px]">
              No custom fields yet.
            </div>
          )}
        </div>
        {dirty && (
          <div className="mt-4 flex justify-end">
            <button onClick={save} className="btn-primary" data-testid={`loc-save-${location.id}`}>
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewLocationForm({ onCreate, seatPrice }) {
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("general");
  const [network, setNetwork] = useState("");
  const [seats, setSeats] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ name, speciality, network, seats: Number(seats) });
      setName("");
      setNetwork("");
    } finally {
      setSubmitting(false);
    }
  };
  const monthly = (Number(seats) || 0) * (seatPrice || 45);
  return (
    <form
      onSubmit={submit}
      className="bg-white border border-dashed border-paper-rule rounded-[16px] p-5"
      data-testid="new-loc-form"
    >
      <div className="flex items-center gap-2 mb-3">
        <Building2 size={13} strokeWidth={1.8} className="text-ink-muted" />
        <div className="label-micro">Add new care centre</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_200px_120px_auto] gap-3 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="label-micro">Care centre name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Manhattan Acute Care"
            className="h-10 border border-paper-rule bg-paper rounded-[10px] px-3 text-[13px]"
            data-testid="new-loc-name"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-micro">Speciality</span>
          <select
            value={speciality}
            onChange={(e) => setSpeciality(e.target.value)}
            className="h-10 border border-paper-rule bg-paper rounded-[10px] px-3 text-[13px]"
            data-testid="new-loc-spec"
          >
            {SPECIALITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-micro">Care network</span>
          <input
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="Optional"
            className="h-10 border border-paper-rule bg-paper rounded-[10px] px-3 text-[13px]"
            data-testid="new-loc-network"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-micro">Seats</span>
          <input
            type="number"
            min="1"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className="h-10 border border-paper-rule bg-paper rounded-[10px] px-3 text-[13px] font-mono ticker"
            data-testid="new-loc-seats"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary h-10"
          data-testid="new-loc-submit"
        >
          {submitting ? "Adding…" : "Add location"}
        </button>
      </div>
      <div className="mt-3 text-[11.5px] text-ink-muted">
        Adding a centre adds <strong className="text-ink">{seats} seats × ${seatPrice || 45}/mo</strong> = ${monthly.toLocaleString()}/mo to your subscription on the next invoice.
      </div>
    </form>
  );
}

export default function LocationsAdminSection({ seatPrice }) {
  const [locations, setLocations] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.listLocations().then(setLocations);
  }, [refreshKey]);

  const bump = () => setRefreshKey((k) => k + 1);

  const create = async (payload) => {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error("Could not create location");
      return;
    }
    toast.success(`${payload.name} added`);
    bump();
  };

  const updateMeta = async (id, meta) => {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    if (res.ok) toast.success("Location updated");
  };

  const saveFields = async (id, custom_fields) => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations/${id}/custom-fields`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_fields }),
    });
    bump();
  };

  const saveStages = async (id, pipeline_stages) => {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations/${id}/stages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline_stages }),
    });
    if (!res.ok) {
      toast.error("Could not save pipeline stages");
      return;
    }
    toast.success("Pipeline stages saved");
    bump();
  };

  const deleteLocation = async (loc) => {
    if (!window.confirm(`Permanently delete ${loc.name}? Patients in this centre will keep their records but become unscoped.`)) return;
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations/${loc.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Could not delete location");
      return;
    }
    toast.success(`${loc.name} removed`);
    bump();
  };

  return (
    <section className="mb-5" data-testid="locations-admin">
      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="label-micro flex items-center gap-1.5">
            <Building2 size={11} /> Care centres
          </div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mt-1">
            Manage locations &amp; pipelines
          </h2>
          <div className="text-[12.5px] text-ink-muted mt-0.5">
            Adding or editing centres affects your billed seat count.
          </div>
        </div>
        <span className="chip" style={{ background: "#f3f3ef", color: "#525252" }}>
          {locations.length} {locations.length === 1 ? "centre" : "centres"}
        </span>
      </div>
      <div className="mb-4">
        <NewLocationForm onCreate={create} seatPrice={seatPrice} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {locations.map((l) => (
          <LocationCard
            key={l.id}
            location={l}
            onUpdate={updateMeta}
            onSaveFields={saveFields}
            onSaveStages={saveStages}
            onDelete={deleteLocation}
          />
        ))}
      </div>
      {locations.length === 0 && (
        <div className="text-[13px] text-ink-muted py-12 text-center border border-dashed border-paper-rule rounded-[16px]">
          No care centres yet. Add the first one above.
        </div>
      )}
    </section>
  );
}

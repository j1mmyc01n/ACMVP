import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import { Plus, Trash2, MapPin, Stethoscope, Network, Users } from "lucide-react";

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

function LocationCard({ location, onUpdate, onSaveFields }) {
  const [name, setName] = useState(location.name);
  const [speciality, setSpeciality] = useState(location.speciality || "general");
  const [network, setNetwork] = useState(location.network || "");
  const [seats, setSeats] = useState(location.seats || 5);
  const [fields, setFields] = useState(location.custom_fields || []);
  const [dirty, setDirty] = useState(false);

  const update = (i, key, val) => {
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
          <div className="flex items-center gap-2 mt-2">
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
                onChange={(e) => update(i, "key", e.target.value)}
                placeholder="field_key"
                className="h-9 border border-paper-rule bg-paper-rail rounded-[8px] px-2.5 text-[12px] font-mono"
              />
              <input
                value={f.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="Display label"
                className="h-9 border border-paper-rule bg-white rounded-[8px] px-2.5 text-[12.5px]"
              />
              <select
                value={f.type || "text"}
                onChange={(e) => update(i, "type", e.target.value)}
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

function NewLocationForm({ onCreate }) {
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("general");
  const [network, setNetwork] = useState("");
  const [seats, setSeats] = useState(5);
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate({ name, speciality, network, seats: Number(seats) });
    setName("");
    setNetwork("");
  };
  return (
    <form
      onSubmit={submit}
      className="bg-white border border-dashed border-paper-rule rounded-[16px] p-6 mb-5 grid grid-cols-1 md:grid-cols-[1fr_220px_220px_120px_auto] gap-3 items-end"
      data-testid="new-loc-form"
    >
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
      <button type="submit" className="btn-primary h-10" data-testid="new-loc-submit">
        Add location
      </button>
    </form>
  );
}

export default function LocationsPage() {
  const { refreshKey, bump } = useShell();
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.listLocations().then(setLocations);
  }, [refreshKey]);

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
    await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/locations/${id}/custom-fields`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_fields }),
      },
    );
    bump();
  };

  return (
    <div className="p-6 lg:p-8 pb-14 max-w-full" data-testid="locations-page">
      <div className="mb-6">
        <div className="label-micro mb-2">Locations</div>
        <h1 className="font-display text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.02em]">
          Care centres
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          Each centre defines its speciality (mental health, NDIS, acute care, …),
          its parent care network, seat count, and any extra intake fields.
        </div>
      </div>

      <NewLocationForm onCreate={create} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {locations.map((l) => (
          <LocationCard key={l.id} location={l} onUpdate={updateMeta} onSaveFields={saveFields} />
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-[13px] text-ink-muted py-12 text-center border border-dashed border-paper-rule rounded-[16px]">
          No care centres yet. Add the first one above.
        </div>
      )}
    </div>
  );
}

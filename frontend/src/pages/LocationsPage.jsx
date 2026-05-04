import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import { Plus, Trash2, MapPin } from "lucide-react";

function LocationCard({ location, onSave, onOpenPatients }) {
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
    await onSave(location.id, fields);
    setDirty(false);
  };

  return (
    <div className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow" data-testid={`loc-${location.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="label-micro flex items-center gap-1.5">
            <MapPin size={10} /> {location.timezone || "—"}
          </div>
          <h3 className="font-display text-[24px] tracking-[-0.01em] mt-1">{location.name}</h3>
          <div className="text-[12px] text-ink-muted mt-0.5">{location.address || ""}</div>
        </div>
        <button
          onClick={onOpenPatients}
          className="btn-ghost !py-1.5 !px-3 text-[12px]"
          data-testid={`loc-view-patients-${location.id}`}
        >
          View patients
        </button>
      </div>

      <div className="border-t border-paper-rule pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="label-micro">Custom fields</div>
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
                className="h-9 border border-paper-rule bg-paper-rail rounded-[8px] px-2.5 text-[12px] font-mono focus:outline-none focus:border-ink"
                data-testid={`loc-field-key-${location.id}-${i}`}
              />
              <input
                value={f.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="Display label"
                className="h-9 border border-paper-rule bg-white rounded-[8px] px-2.5 text-[12.5px] focus:outline-none focus:border-ink"
                data-testid={`loc-field-label-${location.id}-${i}`}
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
              <button
                type="button"
                onClick={() => removeField(i)}
                className="icon-btn"
                data-testid={`loc-field-remove-${location.id}-${i}`}
                aria-label="Remove"
              >
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
            <button
              onClick={save}
              className="btn-primary"
              data-testid={`loc-save-${location.id}`}
            >
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const { refreshKey, bump } = useShell();
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.listLocations().then(setLocations);
  }, [refreshKey]);

  const save = async (id, custom_fields) => {
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/locations/${id}/custom-fields`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ custom_fields }),
        },
      );
      toast.success("Custom fields saved");
      bump();
    } catch (e) {
      toast.error("Save failed");
    }
  };

  return (
    <div className="p-8 pb-14" data-testid="locations-page">
      <div className="mb-6">
        <div className="label-micro mb-2">Locations</div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em]">
          Clinics &amp; custom fields
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          Each location can require extra intake fields. Stored in a secondary table so the
          core patient schema stays untouched.
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {locations.map((l) => (
          <LocationCard key={l.id} location={l} onSave={save} onOpenPatients={() => {}} />
        ))}
      </div>
    </div>
  );
}

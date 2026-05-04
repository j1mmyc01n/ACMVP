import { useEffect, useState } from "react";
import { X, Plus, Trash2, Wand2 } from "lucide-react";
import { api } from "@/lib/api";

const BLANK = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  dob: "",
  crn: "",
  patient_id: "",
  location_id: "",
  network: "",
  referred_from: "",
  concern: "",
  preferred_day: "Mon",
  preferred_time: "10:00",
  insurance: "",
  source: "Website",
  notes: "",
  custom_data: {},
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SOURCES = ["Website", "Referral", "Google Ads", "Meta Ads", "Organic", "Other"];

function Field({ label, children, required, testId }) {
  return (
    <label className="flex flex-col gap-1.5" data-testid={testId}>
      <span className="label-micro">
        {label}
        {required && <span className="text-brand-secondary"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "h-10 border border-paper-rule bg-white px-3 text-[13px] rounded-[10px] focus:outline-none focus:border-ink transition-colors";

export default function IntakeDrawer({ open, onClose, locations, onCreated, defaultLocationId }) {
  const [form, setForm] = useState(BLANK);
  const [customExtras, setCustomExtras] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...BLANK, location_id: defaultLocationId || "" });
      setCustomExtras([]);
    }
  }, [open, defaultLocationId]);

  const currentLocation = locations.find((l) => l.id === form.location_id);
  const locationCustomFields = currentLocation?.custom_fields || [];

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setCustom = (key, value) =>
    setForm((f) => ({ ...f, custom_data: { ...f.custom_data, [key]: value } }));

  const addExtra = () =>
    setCustomExtras((arr) => [...arr, { key: `field_${arr.length + 1}`, label: "", value: "" }]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;
    setSaving(true);
    try {
      const extras = {};
      customExtras.forEach((x) => {
        if (x.label) extras[x.label] = x.value;
      });
      const p = await api.createPatient({
        ...form,
        custom_data: { ...form.custom_data, ...extras },
      });
      onCreated(p);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" data-testid="intake-drawer">
      <div
        className="absolute inset-0 bg-ink/20"
        onClick={onClose}
        data-testid="intake-overlay"
      />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[520px] bg-paper border-l border-paper-rule shadow-2xl overflow-y-auto scrollbar-thin animate-fade-up rounded-l-[20px]">
        <div className="sticky top-0 bg-paper z-10 px-8 py-6 border-b border-paper-rule flex items-start justify-between">
          <div>
            <div className="label-micro mb-2">New intake</div>
            <h2 className="font-display text-[34px] leading-none tracking-[-0.02em]">
              Patient profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            data-testid="intake-close"
            aria-label="Close"
          >
            <X size={14} strokeWidth={1.6} />
          </button>
        </div>

        <form onSubmit={submit} className="p-8 flex flex-col gap-5">
          <div className="label-micro">Identity</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required>
              <input
                className={inputCls}
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                required
                data-testid="intake-first-name"
              />
            </Field>
            <Field label="Last name" required>
              <input
                className={inputCls}
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                required
                data-testid="intake-last-name"
              />
            </Field>
            <Field label="Patient ID">
              <input
                className={`${inputCls} font-mono`}
                placeholder="auto-generated if empty"
                value={form.patient_id}
                onChange={(e) => setField("patient_id", e.target.value)}
                data-testid="intake-patient-id"
              />
            </Field>
            <Field label="CRN">
              <div className="relative">
                <input
                  className={`${inputCls} font-mono pr-24 w-full`}
                  placeholder="auto if empty"
                  value={form.crn}
                  onChange={(e) => setField("crn", e.target.value)}
                  data-testid="intake-crn"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const r = await api.generateCrn(form.location_id || undefined);
                      setField("crn", r.crn);
                    } catch {}
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 bg-paper-rail rounded-[8px] text-[10px] uppercase tracking-wider hover:bg-paper-rule"
                  data-testid="intake-crn-generate"
                  title="Generate CRN"
                >
                  <Wand2 size={11} strokeWidth={1.8} />
                  Generate
                </button>
              </div>
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                className={`${inputCls} font-mono`}
                value={form.dob}
                onChange={(e) => setField("dob", e.target.value)}
                data-testid="intake-dob"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                data-testid="intake-email"
              />
            </Field>
            <Field label="Phone">
              <input
                className={`${inputCls} font-mono`}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                data-testid="intake-phone"
              />
            </Field>
            <Field label="Insurance">
              <input
                className={inputCls}
                value={form.insurance}
                onChange={(e) => setField("insurance", e.target.value)}
                data-testid="intake-insurance"
              />
            </Field>
          </div>

          <div className="label-micro mt-2">Care</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location">
              <select
                className={inputCls}
                value={form.location_id}
                onChange={(e) => setField("location_id", e.target.value)}
                data-testid="intake-location"
              >
                <option value="">Select location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source">
              <select
                className={inputCls}
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
                data-testid="intake-source"
              >
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Care network">
              <input
                className={inputCls}
                placeholder="Inherits from location if empty"
                value={form.network}
                onChange={(e) => setField("network", e.target.value)}
                data-testid="intake-network"
              />
            </Field>
            <Field label="Referred from network">
              <input
                className={inputCls}
                placeholder="If passed from another network"
                value={form.referred_from}
                onChange={(e) => setField("referred_from", e.target.value)}
                data-testid="intake-referred"
              />
            </Field>
            <Field label="Concern / condition">
              <input
                className={inputCls}
                value={form.concern}
                onChange={(e) => setField("concern", e.target.value)}
                data-testid="intake-concern"
              />
            </Field>
            <Field label="Preferred day">
              <select
                className={`${inputCls} font-mono`}
                value={form.preferred_day}
                onChange={(e) => setField("preferred_day", e.target.value)}
                data-testid="intake-day"
              >
                {DAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Preferred time">
              <input
                type="time"
                className={`${inputCls} font-mono`}
                value={form.preferred_time}
                onChange={(e) => setField("preferred_time", e.target.value)}
                data-testid="intake-time"
              />
            </Field>
          </div>

          {locationCustomFields.length > 0 && (
            <>
              <div className="label-micro mt-2">Location custom fields</div>
              <div className="grid grid-cols-2 gap-4">
                {locationCustomFields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <input
                      className={inputCls}
                      value={form.custom_data[f.key] || ""}
                      onChange={(e) => setCustom(f.key, e.target.value)}
                      data-testid={`intake-custom-${f.key}`}
                    />
                  </Field>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="label-micro">Extra fields</span>
            <button
              type="button"
              onClick={addExtra}
              className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink"
              data-testid="intake-add-extra"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {customExtras.map((x, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <Field label="Label">
                <input
                  className={inputCls}
                  value={x.label}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomExtras((arr) => arr.map((it, j) => (j === i ? { ...it, label: v } : it)));
                  }}
                  data-testid={`extra-label-${i}`}
                />
              </Field>
              <Field label="Value">
                <input
                  className={inputCls}
                  value={x.value}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomExtras((arr) => arr.map((it, j) => (j === i ? { ...it, value: v } : it)));
                  }}
                  data-testid={`extra-value-${i}`}
                />
              </Field>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setCustomExtras((arr) => arr.filter((_, j) => j !== i))}
                data-testid={`extra-remove-${i}`}
                aria-label="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          <Field label="Notes">
            <textarea
              rows={3}
              className="border border-paper-rule bg-white rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-ink"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              data-testid="intake-notes"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-paper-rule mt-4">
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              data-testid="intake-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              data-testid="intake-submit"
            >
              {saving ? "Saving…" : "Add patient"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

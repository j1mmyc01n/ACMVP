import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  CalendarDays,
  Sparkles,
  Plug,
  Building2,
  Globe,
  ChevronRight,
  CheckCircle2,
  Circle,
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useShell } from "@/components/crm/AppShell";

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Provider metadata. `fields` = list of input definitions; `secret` fields are masked.
 */
const PROVIDERS = [
  {
    id: "twilio",
    name: "Twilio",
    tag: "Voice & SMS",
    accent: "#F22F46",
    icon: Phone,
    summary:
      "Two-way calls, automated SMS reminders, and discharge follow-ups. Required for the call queue and SMS log to leave the mock.",
    docs: "https://console.twilio.com",
    steps: [
      { title: "Sign in to console.twilio.com", help: "Use the same email as your billing." },
      { title: "Open Account Info → API Keys & Tokens", help: "Copy your Account SID and Auth Token." },
      { title: "Open Phone Numbers → Manage → Active Numbers", help: "Pick a number with Voice + SMS enabled and copy it (E.164: +15551234567)." },
      { title: "Optional: Messaging → Services", help: "Create a service for compliant outbound campaigns and copy the Messaging SID." },
    ],
    fields: [
      { key: "account_sid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true, required: true },
      { key: "auth_token", label: "Auth Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true, required: true },
      { key: "from_number", label: "From number", placeholder: "+15551234567" },
      { key: "messaging_sid", label: "Messaging Service SID", placeholder: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
    ],
  },
  {
    id: "google",
    name: "Google Calendar",
    tag: "Scheduling",
    accent: "#34A853",
    icon: CalendarDays,
    summary:
      "Push appointments to a clinician's Google Calendar. Patients receive native invites and reminders.",
    docs: "https://console.cloud.google.com/apis/credentials",
    steps: [
      { title: "Open Google Cloud Console", help: "Create or pick a project for this clinic." },
      { title: "APIs & Services → Enable", help: "Enable Google Calendar API." },
      { title: "Credentials → OAuth Client ID", help: "Type: Web application. Add redirect URI to your CRM domain /oauth/google." },
      { title: "Copy Client ID + Client Secret", help: "Paste them below. Calendar ID is optional — leave blank for the user's primary calendar." },
    ],
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "123456-abc.apps.googleusercontent.com", required: true },
      { key: "client_secret", label: "Client Secret", placeholder: "GOCSPX-...", secret: true, required: true },
      { key: "calendar_id", label: "Calendar ID (optional)", placeholder: "primary" },
    ],
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    tag: "Scheduling",
    accent: "#0078D4",
    icon: CalendarDays,
    summary:
      "Send invites to Outlook / Microsoft 365 calendars. Required for clinics on Microsoft tenants.",
    docs: "https://entra.microsoft.com",
    steps: [
      { title: "Open Microsoft Entra admin centre", help: "App registrations → New registration." },
      { title: "Set redirect URI", help: "Web → https://your-crm-domain/oauth/outlook" },
      { title: "Certificates & secrets → New client secret", help: "Copy the value (shown once)." },
      { title: "API permissions → Calendars.ReadWrite", help: "Grant admin consent for the tenant." },
    ],
    fields: [
      { key: "client_id", label: "Application (client) ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
      { key: "client_secret", label: "Client Secret", placeholder: "Secret value", secret: true, required: true },
      { key: "tenant_id", label: "Directory (tenant) ID", placeholder: "common or tenant GUID" },
    ],
  },
  {
    id: "calendly",
    name: "Calendly",
    tag: "Scheduling",
    accent: "#006BFF",
    icon: CalendarDays,
    summary:
      "Embed a Calendly booking link inside the patient drawer and let the system absorb confirmed bookings.",
    docs: "https://calendly.com/integrations/api_webhooks",
    steps: [
      { title: "Open Calendly Integrations → API & Webhooks", help: "Click 'Generate New Token'." },
      { title: "Copy your Personal Access Token", help: "Paste it below." },
      { title: "Find your organisation URI", help: "Calendly: GET /users/me → resource.current_organization." },
    ],
    fields: [
      { key: "personal_access_token", label: "Personal Access Token", placeholder: "eyJraWQiOiIx...", secret: true, required: true },
      { key: "organization_uri", label: "Organisation URI", placeholder: "https://api.calendly.com/organizations/..." },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    tag: "AI",
    accent: "#10A37F",
    icon: Sparkles,
    summary:
      "Optional secondary AI provider for transcription and supplemental analysis. The CRM uses Claude by default.",
    docs: "https://platform.openai.com/api-keys",
    steps: [
      { title: "Open platform.openai.com → API keys", help: "Create a new secret key, scoped to this project." },
      { title: "Pick a model", help: "Defaults to gpt-4o-mini for cost-efficient inference." },
    ],
    fields: [
      { key: "api_key", label: "API Key", placeholder: "sk-proj-...", secret: true, required: true },
      { key: "model", label: "Model", placeholder: "gpt-4o-mini" },
    ],
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    tag: "AI",
    accent: "#D97706",
    icon: Sparkles,
    summary:
      "Powers the Pattern / Probability insights. Comes pre-wired via your Patient CRM key — supply your own only if you want isolated billing.",
    docs: "https://console.anthropic.com/settings/keys",
    steps: [
      { title: "Open console.anthropic.com → Settings → API keys", help: "Create a new key for this clinic." },
      { title: "Pick a model", help: "Defaults to claude-sonnet-4-5-20250929." },
    ],
    fields: [
      { key: "api_key", label: "API Key", placeholder: "sk-ant-...", secret: true, required: true },
      { key: "model", label: "Model", placeholder: "claude-sonnet-4-5-20250929" },
    ],
  },
];

function isProviderConnected(state, provider) {
  const cfg = state?.[provider.id];
  if (!cfg) return false;
  return provider.fields.filter((f) => f.required).every((f) => cfg[`${f.key}_set`]);
}

function StatusPill({ connected }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfdf5] text-[#065f46] text-[10.5px] font-semibold tracking-[0.14em] uppercase">
        <CheckCircle2 size={11} strokeWidth={2.4} />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper-rail text-ink-muted text-[10.5px] font-semibold tracking-[0.14em] uppercase">
      <Circle size={9} strokeWidth={2.4} />
      Not connected
    </span>
  );
}

function ProviderHero({ provider }) {
  const Icon = provider.icon;
  return (
    <div className="relative bg-white border border-paper-rule rounded-[18px] p-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          background: `radial-gradient(120% 80% at 0% 0%, ${provider.accent} 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: `${provider.accent}1a`, color: provider.accent }}
        >
          <Icon size={26} strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="label-micro">{provider.tag}</span>
          </div>
          <h2 className="font-display text-[28px] tracking-[-0.02em] mt-0.5">{provider.name}</h2>
          <p className="mt-1.5 text-[13px] text-ink-muted leading-snug max-w-[640px]">
            {provider.summary}
          </p>
          <a
            href={provider.docs}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink hover:underline"
            data-testid={`docs-${provider.id}`}
          >
            <ExternalLink size={12} strokeWidth={2} />
            Open the {provider.name} console
          </a>
        </div>
      </div>
    </div>
  );
}

function StepList({ steps }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-paper-rail border border-paper-rule flex items-center justify-center font-mono text-[11px] font-semibold text-ink">
            {i + 1}
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-ink">{s.title}</div>
            {s.help && <div className="mt-0.5 text-[12px] text-ink-muted leading-snug">{s.help}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function SecretInput({ field, value, onChange, redacted }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="relative">
      <input
        type={field.secret && !reveal ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={redacted ? "Stored — type to replace" : field.placeholder}
        className="w-full h-10 border border-paper-rule bg-white rounded-[10px] px-3 pr-10 text-[13px] font-mono focus:outline-none focus:border-ink"
        data-testid={`field-${field.key}`}
      />
      {field.secret && (
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
          aria-label={reveal ? "Hide" : "Show"}
        >
          {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}

function ProviderForm({ provider, scope, scopeId, onSaved, onDisconnected, currentState }) {
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Only send fields user actually filled in, so masked stored secrets aren't blanked.
    const config = Object.fromEntries(
      Object.entries(draft).filter(([, v]) => v && String(v).trim() !== ""),
    );
    if (Object.keys(config).length === 0) {
      toast.error("Fill at least one field before saving");
      return;
    }
    setSaving(true);
    try {
      const url =
        scope === "system"
          ? `${API}/api/integrations/system`
          : `${API}/api/locations/${scopeId}/integrations`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id, config }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      toast.success(`${provider.name} updated`);
      setDraft({});
      onSaved?.(json.integrations);
    } catch (e) {
      toast.error(`Could not save ${provider.name}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Disconnect ${provider.name}?`)) return;
    setSaving(true);
    try {
      const url =
        scope === "system"
          ? `${API}/api/integrations/system/${provider.id}`
          : `${API}/api/locations/${scopeId}/integrations/${provider.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      toast.success(`${provider.name} disconnected`);
      onDisconnected?.(json.integrations);
    } catch {
      toast.error("Could not disconnect");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-paper-rule rounded-[18px] p-6">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound size={13} strokeWidth={1.8} className="text-ink-muted" />
        <div className="label-micro">Credentials</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {provider.fields.map((f) => {
          const stored = currentState?.[provider.id]?.[`${f.key}_set`];
          const masked = currentState?.[provider.id]?.[f.key];
          return (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1 label-micro">
                {f.label}
                {f.required && <span className="text-[#dc2626]">*</span>}
              </span>
              <SecretInput
                field={f}
                value={draft[f.key] ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                redacted={stored}
              />
              {stored && (
                <span className="text-[10.5px] text-ink-muted font-mono">
                  Stored: {f.secret ? masked : masked || "—"}
                </span>
              )}
            </label>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
          <ShieldCheck size={12} strokeWidth={1.8} />
          Stored encrypted at rest, masked in the UI. Per-location keys override system defaults.
        </div>
        <div className="flex items-center gap-2">
          {currentState?.[provider.id]?.connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={saving}
              className="btn-ghost flex items-center gap-1.5 text-[12px]"
              data-testid={`disconnect-${provider.id}`}
            >
              <Trash2 size={12} />
              Disconnect
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-[12.5px]"
            data-testid={`save-${provider.id}`}
          >
            {saving ? "Saving…" : "Save credentials"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScopeToggle({ scope, setScope, locations }) {
  return (
    <div className="bg-white border border-paper-rule rounded-[16px] p-1.5 inline-flex items-center gap-1" data-testid="scope-toggle">
      <button
        onClick={() => setScope({ kind: "system" })}
        data-active={scope.kind === "system"}
        className="seg-btn flex items-center gap-2 px-3"
        data-testid="scope-system"
      >
        <Globe size={13} strokeWidth={1.8} />
        System defaults
      </button>
      <select
        value={scope.kind === "location" ? scope.id : ""}
        onChange={(e) => {
          const id = e.target.value;
          if (id) setScope({ kind: "location", id });
        }}
        className="h-8 bg-paper-rail border border-paper-rule rounded-[10px] px-2 text-[12.5px]"
        data-testid="scope-location-select"
      >
        <option value="">Per-location override…</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function IntegrationsPage() {
  const { locations } = useShell();
  const [scope, setScope] = useState({ kind: "system" });
  const [systemState, setSystemState] = useState({});
  const [locationState, setLocationState] = useState({});
  const [activeProvider, setActiveProvider] = useState("twilio");

  const refreshSystem = async () => {
    const r = await fetch(`${API}/api/integrations/system`);
    if (r.ok) {
      const j = await r.json();
      setSystemState(j.integrations || {});
    }
  };
  const refreshLocation = async (id) => {
    if (!id) return;
    const r = await fetch(`${API}/api/locations/${id}/integrations`);
    if (r.ok) {
      const j = await r.json();
      setLocationState(j.integrations || {});
    }
  };

  useEffect(() => {
    refreshSystem();
  }, []);

  useEffect(() => {
    if (scope.kind === "location") refreshLocation(scope.id);
  }, [scope]);

  const provider = useMemo(
    () => PROVIDERS.find((p) => p.id === activeProvider) || PROVIDERS[0],
    [activeProvider],
  );

  const currentState = scope.kind === "system" ? systemState : locationState;
  const onSaved = (integrations) => {
    if (scope.kind === "system") setSystemState(integrations);
    else setLocationState(integrations);
  };

  const scopeLabel =
    scope.kind === "system"
      ? "System defaults"
      : `Override · ${locations.find((l) => l.id === scope.id)?.name || ""}`;

  return (
    <div className="p-6 lg:p-10 pb-20 max-w-full" data-testid="integrations-page">
      <div className="flex items-start justify-between flex-wrap gap-5 mb-8">
        <div>
          <div className="label-micro mb-2 flex items-center gap-1.5">
            <Plug size={11} /> Integrations
          </div>
          <h1 className="font-display text-[34px] md:text-[44px] leading-[1.02] tracking-[-0.02em]">
            Bring your own keys
          </h1>
          <p className="mt-2 text-[13.5px] text-ink-muted max-w-[640px] leading-snug">
            Wire your clinic's Twilio, calendar, and AI providers in minutes. Each card
            walks you through where to find a key. System defaults apply to every
            location; per-location overrides take precedence.
          </p>
        </div>
        <ScopeToggle scope={scope} setScope={setScope} locations={locations} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Provider list */}
        <aside className="flex flex-col gap-2 lg:sticky lg:top-4" data-testid="provider-list">
          <div className="px-1.5 mb-1 flex items-center justify-between">
            <span className="label-micro">Providers</span>
            <span className="label-micro text-ink-faint">{scopeLabel}</span>
          </div>
          {PROVIDERS.map((p) => {
            const Icon = p.icon;
            const connected = isProviderConnected(currentState, p);
            const active = activeProvider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                data-testid={`provider-${p.id}`}
                data-active={active}
                className={`flex items-center gap-3 px-3 py-3 rounded-[14px] text-left border transition-all ${
                  active
                    ? "bg-white border-ink shadow-[0_2px_0_rgba(0,0,0,0.04)]"
                    : "bg-white/60 border-paper-rule hover:bg-white"
                }`}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `${p.accent}1a`, color: p.accent }}
                >
                  <Icon size={16} strokeWidth={1.7} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-ink truncate">{p.name}</div>
                  <div className="text-[10.5px] text-ink-muted font-medium tracking-[0.14em] uppercase">
                    {p.tag}
                  </div>
                </div>
                {connected ? (
                  <CheckCircle2 size={14} strokeWidth={2.4} className="text-[#10b981]" />
                ) : (
                  <ChevronRight size={14} strokeWidth={1.8} className="text-ink-faint" />
                )}
              </button>
            );
          })}

          {scope.kind === "location" && (
            <div className="mt-3 px-3 py-3 rounded-[12px] bg-paper-rail border border-dashed border-paper-rule text-[11.5px] text-ink-muted leading-snug flex gap-2">
              <Building2 size={12} strokeWidth={1.8} className="mt-0.5 shrink-0" />
              <span>
                Editing keys for <strong className="text-ink">{locations.find((l) => l.id === scope.id)?.name}</strong>. Anything you save here overrides the system defaults.
              </span>
            </div>
          )}
        </aside>

        {/* Detail */}
        <section className="flex flex-col gap-5" data-testid="provider-detail">
          <div className="flex items-center justify-end">
            <StatusPill connected={isProviderConnected(currentState, provider)} />
          </div>

          <ProviderHero provider={provider} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-paper-rule rounded-[18px] p-6">
              <div className="label-micro mb-3 flex items-center gap-1.5">
                <CalendarDays size={11} /> How to find your keys
              </div>
              <StepList steps={provider.steps} />
            </div>

            <ProviderForm
              provider={provider}
              scope={scope.kind}
              scopeId={scope.id}
              onSaved={onSaved}
              onDisconnected={onSaved}
              currentState={currentState}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

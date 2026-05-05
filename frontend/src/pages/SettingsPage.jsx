import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import LocationsAdminSection from "@/components/crm/LocationsAdminSection";
import BrandSection from "@/components/crm/BrandSection";
import CrnRequestInbox from "@/components/crm/CrnRequestInbox";
import {
  KeyRound,
  Link as LinkIcon,
  ShieldCheck,
  Phone,
  MessageSquare,
  Check,
  Activity,
  Brain,
  Sparkles,
} from "lucide-react";

function Pill({ children, color, bg }) {
  return (
    <span className="chip" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function Toggle({ on, onChange, testId }) {
  return (
    <button
      onClick={() => onChange(!on)}
      data-testid={testId}
      role="switch"
      aria-checked={on}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? "bg-[var(--stable)]" : "bg-paper-rule"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function fmt(n = 0) {
  return n.toLocaleString();
}

function IntegrationTile({ name, icon: Icon, sub, connected, linked, onToggle, accent, testId, extra }) {
  return (
    <div className="bg-white border border-paper-rule rounded-[16px] p-5 card-shadow flex flex-col" data-testid={testId}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: accent.bg, color: accent.c }}
          >
            <Icon size={18} strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-display text-[20px] tracking-[-0.01em] leading-tight">{name}</div>
            <div className="text-[12px] text-ink-muted">{sub}</div>
          </div>
        </div>
        {connected ? (
          <Pill color="#10b981" bg="#ecfdf5">Connected</Pill>
        ) : (
          <Pill color="#dc2626" bg="#fef2f2">Not connected</Pill>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-paper-rule">
        <div className="text-[12px] text-ink-muted">Link to CRM</div>
        <div className="flex items-center gap-2">
          {!connected && (
            <button className="btn-ghost !py-1.5 !px-3 text-[11.5px]" data-testid={`${testId}-connect`}>
              Connect
            </button>
          )}
          <Toggle on={linked} onChange={onToggle} testId={`${testId}-toggle`} />
        </div>
      </div>
      {extra}
    </div>
  );
}

export default function SysAdminPage() {
  const [data, setData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [smsBody, setSmsBody] = useState(
    "Hello, this is a discharge follow-up from your care team. Your CRN is {{crn}}. Please reply if you need a callback.",
  );
  const [smsLog, setSmsLog] = useState([]);

  const refresh = async () => {
    const d = await api.sysadminIntegrations();
    setData(d);
  };

  useEffect(() => {
    refresh();
    api.listPatients().then((p) => {
      setPatients(p);
      setSelected(p[0]);
    });
    api.listLocations().then(setLocations);
    api.listSms().then(setSmsLog);
  }, [refreshKey]);

  const bumpAll = () => setRefreshKey((k) => k + 1);

  const clearDemo = async () => {
    if (!window.confirm("Wipe ALL patients, locations, requests, queues and logs? This cannot be undone.")) return;
    try {
      await api.clearAllData();
      toast.success("Workspace cleared");
      bumpAll();
    } catch {
      toast.error("Could not clear data");
    }
  };

  const composed = (selected && smsBody.replace("{{crn}}", selected.crn || "—")) || smsBody;

  const sendSms = async () => {
    if (!selected) return;
    try {
      await api.sendSms(selected.id, composed, "discharge_crn");
      toast.success(`CRN SMS queued to ${selected.first_name}`);
      setSmsLog(await api.listSms());
    } catch {
      toast.error("SMS failed");
    }
  };

  const toggle = async (provider, linked) => {
    try {
      await api.toggleIntegration(provider, linked);
      toast.success(`${provider} ${linked ? "linked" : "unlinked"}`);
      refresh();
    } catch {
      toast.error("Toggle failed");
    }
  };

  const seats = data?.subscription?.seats || 0;

  return (
    <div className="p-6 lg:p-8 pb-14 max-w-[1180px]" data-testid="sysadmin-page">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="label-micro mb-2 flex items-center gap-1.5">
            <ShieldCheck size={10} /> System Admin
          </div>
          <h1 className="font-display text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.02em]">
            Integrations &amp; billing
          </h1>
          <div className="mt-2 text-[13px] text-ink-muted">
            Wire AI providers, telephony and calendars here. Per-location settings keep data isolated.
          </div>
        </div>
        <button
          onClick={clearDemo}
          className="btn-ghost text-[12px] !text-[#dc2626] !border-[#fecaca] hover:!bg-[#fef2f2]"
          data-testid="clear-demo-btn"
          title="Wipe all patients, locations and queue data"
        >
          Clear workspace data
        </button>
      </div>

      <BrandSection />

      <CrnRequestInbox locations={locations} onCreated={bumpAll} />

      <LocationsAdminSection />

      <section className="mb-5" data-testid="integrations">
        <div className="label-micro mb-3">Integrations</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IntegrationTile
            name="Jax"
            icon={Sparkles}
            sub="Platform chat agent · powered by OpenAI"
            connected={!!data?.openai?.connected}
            linked={!!data?.openai?.linked_to_crm}
            onToggle={(v) => toggle("openai", v)}
            accent={{ bg: "#ecfdf5", c: "#10b981" }}
            testId="openai-tile"
          />
          <IntegrationTile
            name="Claude Sonnet 4.5"
            icon={Brain}
            sub={`${data?.claude?.plan || "Pattern Intelligence Pro"} · ${data?.claude?.billing_note || "per location"}`}
            connected={!!data?.claude?.connected}
            linked={!!data?.claude?.linked_to_crm}
            onToggle={(v) => toggle("claude", v)}
            accent={{ bg: "#fef2f2", c: "#dc2626" }}
            testId="claude-tile"
            extra={
              <div className="mt-3 border-t border-paper-rule pt-3">
                <div className="label-micro mb-2">Usage by location · this cycle</div>
                <div className="flex flex-col gap-1.5">
                  {(data?.claude?.by_location || []).map((row) => (
                    <div key={row.location_id} className="flex items-center justify-between text-[12px]">
                      <span className="truncate">{row.name}</span>
                      <span className="font-mono ticker text-ink-muted">
                        {row.seats} staff · {row.groups} group · {row.calls} calls
                      </span>
                    </div>
                  ))}
                  {(!data?.claude?.by_location || data.claude.by_location.length === 0) && (
                    <div className="text-[11.5px] text-ink-muted">No usage yet.</div>
                  )}
                </div>
              </div>
            }
          />
        </div>
      </section>

      <section className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5" data-testid="twilio-card">
        <div className="label-micro mb-2">Twilio</div>
        <div className="flex items-center gap-4 py-3 border-b border-paper-rule/70">
          <div className="w-10 h-10 rounded-[10px] bg-paper-rail flex items-center justify-center text-ink-muted">
            <Phone size={16} strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="font-medium text-[13.5px]">Twilio voice</div>
            <div className="text-[12px] text-ink-muted">
              Outbound calls · {fmt(data?.twilio?.calls_cycle || 0)} this cycle
            </div>
          </div>
          {data?.twilio?.connected ? (
            <Pill color="#10b981" bg="#ecfdf5">Connected</Pill>
          ) : (
            <button className="btn-ghost !py-1.5 !px-3 text-[12px]" data-testid="conn-twilio">Connect</button>
          )}
        </div>
        <div className="flex items-center gap-4 py-3">
          <div className="w-10 h-10 rounded-[10px] bg-paper-rail flex items-center justify-center text-ink-muted">
            <MessageSquare size={16} strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="font-medium text-[13.5px]">Twilio SMS — CRN &amp; reminders</div>
            <div className="text-[12px] text-ink-muted">
              Discharge CRN SMS + automatic call reminders · {fmt(data?.twilio?.sms_cycle || 0)} sent
            </div>
          </div>
          <Pill color={data?.twilio?.connected ? "#10b981" : "#f59e0b"} bg={data?.twilio?.connected ? "#ecfdf5" : "#fffbeb"}>
            {data?.twilio?.connected ? "Ready" : "Mocked"}
          </Pill>
        </div>

        <div className="mt-4 border-t border-paper-rule pt-4">
          <div className="label-micro mb-3">Send CRN SMS to a discharged patient</div>
          {patients.length === 0 ? (
            <div className="text-[12px] text-ink-muted py-3 text-center border border-dashed border-paper-rule rounded-[10px]">
              No patients yet. Add a patient first.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3">
                <select
                  className="h-10 border border-paper-rule bg-white rounded-[10px] px-3 text-[13px]"
                  value={selected?.id || ""}
                  onChange={(e) => setSelected(patients.find((p) => p.id === e.target.value))}
                  data-testid="sms-patient"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} — {p.crn || "no CRN"}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  className="border border-paper-rule bg-white rounded-[10px] px-3 py-2 text-[12.5px]"
                  data-testid="sms-body"
                />
              </div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <button className="btn-primary" onClick={sendSms} data-testid="sms-send">
                  Send CRN SMS
                </button>
                <span className="text-[11.5px] text-ink-muted">
                  Preview: {composed.slice(0, 110)}
                  {composed.length > 110 ? "…" : ""}
                </span>
              </div>
              {smsLog.length > 0 && (
                <div className="mt-5">
                  <div className="label-micro mb-2">Recent SMS</div>
                  <div className="divide-y divide-paper-rule/70">
                    {smsLog.slice(0, 6).map((s) => (
                      <div key={s.id} className="py-2 flex items-center gap-3 text-[12px]">
                        <Pill color="#0d9488" bg="#ccfbf1">{s.kind.replace("_", " ")}</Pill>
                        <span className="font-mono ticker text-ink-muted truncate">{s.to_number}</span>
                        <span className="truncate flex-1 text-ink">{s.body}</span>
                        <span className="font-mono text-[10px] text-ink-faint ticker">
                          {new Date(s.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow" data-testid="calendar-card">
        <div className="label-micro mb-2">Calendar connectors</div>
        {[
          { k: "google", title: "Google Calendar" },
          { k: "outlook", title: "Outlook / Microsoft 365" },
          { k: "calendly", title: "Calendly" },
          { k: "ios_ics", title: "iOS / ICS download", forced: true },
        ].map((row) => (
          <div key={row.k} className="flex items-center gap-4 py-3 border-b border-paper-rule/70 last:border-b-0">
            <div className="w-10 h-10 rounded-[10px] bg-paper-rail flex items-center justify-center text-ink-muted">
              <LinkIcon size={16} strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-[13.5px] font-medium">{row.title}</div>
            {row.forced || data?.calendar?.[row.k] ? (
              <Pill color="#10b981" bg="#ecfdf5">{row.forced ? "Always on" : "Connected"}</Pill>
            ) : (
              <button className="btn-ghost !py-1.5 !px-3 text-[12px]" data-testid={`conn-${row.k}`}>
                Connect
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

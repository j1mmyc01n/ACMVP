import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  KeyRound,
  Link as LinkIcon,
  ShieldCheck,
  CreditCard,
  Phone,
  MessageSquare,
  Check,
  Activity,
} from "lucide-react";

function Pill({ children, color, bg }) {
  return (
    <span className="chip" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function Row({ icon: Icon, title, desc, right }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-paper-rule/70 last:border-b-0">
      <div className="w-10 h-10 rounded-[10px] bg-paper-rail flex items-center justify-center text-ink-muted shrink-0">
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[13.5px] text-ink">{title}</div>
        <div className="text-[12px] text-ink-muted mt-0.5 leading-relaxed">{desc}</div>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

function fmt(n = 0) {
  return n.toLocaleString();
}

export default function SysAdminPage() {
  const [data, setData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [smsBody, setSmsBody] = useState(
    "Hello, this is a discharge follow-up from your care team. Your CRN is {{crn}}. Please reply if you need a callback.",
  );
  const [smsLog, setSmsLog] = useState([]);

  useEffect(() => {
    api.sysadminIntegrations().then(setData);
    api.listPatients().then((p) => {
      setPatients(p);
      setSelected(p[0]);
    });
    api.listSms().then(setSmsLog);
  }, []);

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

  return (
    <div className="p-6 lg:p-8 pb-14 max-w-[1100px]" data-testid="sysadmin-page">
      <div className="mb-6">
        <div className="label-micro mb-2 flex items-center gap-1.5">
          <ShieldCheck size={10} /> System Admin
        </div>
        <h1 className="font-display text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.02em]">
          Integrations &amp; billing
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          Central place to wire Claude, Twilio and calendar connectors. Usage is metered here.
        </div>
      </div>

      <section className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5" data-testid="billing-card">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="label-micro flex items-center gap-1.5">
              <CreditCard size={10} /> Subscription
            </div>
            <h2 className="font-display text-[24px] tracking-[-0.01em] mt-1">
              Acute Care CRM
            </h2>
            <div className="text-[12px] text-ink-muted mt-0.5">
              Base plan · active · next invoice {data?.subscription?.next_invoice || "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[32px] ticker font-semibold">
              ${data?.subscription?.usd_per_month || 45}
            </div>
            <div className="label-micro">per month</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="bg-paper-rail rounded-[12px] p-4">
            <div className="label-micro">Base plan includes</div>
            <ul className="mt-2 text-[12.5px] text-ink leading-relaxed space-y-1">
              <li className="flex items-center gap-2"><Check size={12} /> Unlimited patient records</li>
              <li className="flex items-center gap-2"><Check size={12} /> Kanban + Calendar + Call Queue</li>
              <li className="flex items-center gap-2"><Check size={12} /> Location-scoped custom fields</li>
              <li className="flex items-center gap-2"><Check size={12} /> Clinical notes &amp; documents</li>
            </ul>
          </div>
          <div className="bg-paper-rail rounded-[12px] p-4">
            <div className="label-micro">Add-ons</div>
            <ul className="mt-2 text-[12.5px] text-ink leading-relaxed space-y-1">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Activity size={12} /> Claude Sonnet 4.5 (pattern AI)</span>
                <span className="font-mono ticker font-semibold">+${data?.claude?.subscription_usd_per_month || 125}/mo</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Phone size={12} /> Twilio calls &amp; SMS</span>
                <span className="font-mono ticker text-ink-muted">metered usage</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5" data-testid="claude-card">
        <div className="label-micro mb-2">AI</div>
        <Row
          icon={KeyRound}
          title={`Claude Sonnet 4.5 — ${data?.claude?.plan || "Pattern Intelligence Pro"}`}
          desc={`Connected via System Admin. Model: ${data?.claude?.model || "claude-sonnet-4-5-20250929"}. Usage this cycle: ${fmt(
            data?.claude?.usage_cycle_calls || 0,
          )} calls. Subscription $${data?.claude?.subscription_usd_per_month || 125}/month.`}
          right={
            data?.claude?.connected ? (
              <Pill color="#10b981" bg="#ecfdf5">Connected</Pill>
            ) : (
              <Pill color="#dc2626" bg="#fee2e2">Not connected</Pill>
            )
          }
        />
      </section>

      <section className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5" data-testid="twilio-card">
        <div className="label-micro mb-2">Twilio</div>
        <Row
          icon={Phone}
          title="Twilio voice"
          desc={`Outbound calling from the Call Queue. Calls this cycle: ${fmt(
            data?.twilio?.calls_cycle || 0,
          )}. Requires SID / Auth Token / From-number — add at System Admin level.`}
          right={
            data?.twilio?.connected ? (
              <Pill color="#10b981" bg="#ecfdf5">Connected</Pill>
            ) : (
              <button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-twilio">
                Connect
              </button>
            )
          }
        />
        <Row
          icon={MessageSquare}
          title="Twilio SMS — CRN &amp; reminders"
          desc={`Send the discharge CRN SMS after treatment, plus automatic call reminders. SMS this cycle: ${fmt(
            data?.twilio?.sms_cycle || 0,
          )}.`}
          right={
            data?.twilio?.connected ? (
              <Pill color="#10b981" bg="#ecfdf5">Ready</Pill>
            ) : (
              <Pill color="#f59e0b" bg="#fffbeb">Mocked</Pill>
            )
          }
        />

        <div className="mt-5 border-t border-paper-rule pt-5">
          <div className="label-micro mb-3">Send CRN SMS to a discharged patient</div>
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3">
            <select
              className="h-10 border border-paper-rule bg-white rounded-[10px] px-3 text-[13px]"
              value={selected?.id || ""}
              onChange={(e) => setSelected(patients.find((p) => p.id === e.target.value))}
              data-testid="sms-patient"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} — {p.crn}
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
          <div className="mt-3 flex items-center gap-3">
            <button className="btn-primary" onClick={sendSms} data-testid="sms-send">
              Send CRN SMS
            </button>
            <span className="text-[11.5px] text-ink-muted">
              Preview: {composed.slice(0, 120)}
              {composed.length > 120 ? "…" : ""}
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
        </div>
      </section>

      <section className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow" data-testid="calendar-card">
        <div className="label-micro mb-2">Calendar connectors</div>
        <Row
          icon={LinkIcon}
          title="Google Calendar"
          desc="Push each location's scheduled calls into the clinic's Google calendar."
          right={
            data?.calendar?.google ? (
              <Pill color="#10b981" bg="#ecfdf5">Connected</Pill>
            ) : (
              <button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-google">Connect</button>
            )
          }
        />
        <Row
          icon={LinkIcon}
          title="Outlook / Microsoft 365"
          desc="Microsoft Graph calendar creation."
          right={
            data?.calendar?.outlook ? (
              <Pill color="#10b981" bg="#ecfdf5">Connected</Pill>
            ) : (
              <button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-outlook">Connect</button>
            )
          }
        />
        <Row
          icon={LinkIcon}
          title="Calendly"
          desc="Self-serve booking link per location that deep-links patients into a time slot."
          right={
            data?.calendar?.calendly ? (
              <Pill color="#10b981" bg="#ecfdf5">Connected</Pill>
            ) : (
              <button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-calendly">Connect</button>
            )
          }
        />
        <Row
          icon={LinkIcon}
          title="iOS / ICS file"
          desc="One-click .ics download for iPhone / Mac calendars."
          right={<Pill color="#10b981" bg="#ecfdf5">Always on</Pill>}
        />
      </section>
    </div>
  );
}

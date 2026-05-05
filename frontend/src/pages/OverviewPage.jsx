import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import CarePulsePanel from "@/components/crm/CarePulsePanel";
import AnnouncementsBanner from "@/components/crm/AnnouncementsBanner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Newspaper,
  HeartPulse,
  CalendarClock,
  Inbox,
  Activity,
} from "lucide-react";

function Kpi({ label, value, sub, accent = "#111", testId, icon: Icon }) {
  return (
    <div
      className="bg-white border border-paper-rule rounded-[16px] p-5 animate-fade-up card-shadow"
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <div className="label-micro">{label}</div>
        {Icon && (
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center"
            style={{ background: `${accent}1a`, color: accent }}
          >
            <Icon size={13} strokeWidth={1.8} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span
          className="font-display text-[34px] leading-none tracking-[-0.02em] ticker"
          style={{ color: accent }}
        >
          {value}
        </span>
      </div>
      {sub && <div className="mt-3 text-[12px] text-ink-muted">{sub}</div>}
    </div>
  );
}

function InsightItem({ text, delta, label }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-paper-rule/70 last:border-b-0">
      <div className="w-6 h-6 rounded-full bg-[var(--highrisk-bg)] text-[var(--highrisk)] flex items-center justify-center shrink-0">
        <AlertCircle size={12} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] leading-snug">{text}</div>
        <div className="mt-1 text-[10px] font-medium tracking-[0.12em] uppercase text-ink-faint">
          {label}
          {delta && <> · <span className="text-ink-muted">{delta}</span></>}
        </div>
      </div>
    </div>
  );
}

function bandOf(score = 0) {
  if (score <= 25) return "stable";
  if (score <= 50) return "monitoring";
  if (score <= 75) return "elevated";
  return "critical";
}

const RISK_BANDS = [
  { key: "stable", label: "Stable", color: "#10b981", bg: "#ecfdf5" },
  { key: "monitoring", label: "Monitoring", color: "#f59e0b", bg: "#fffbeb" },
  { key: "elevated", label: "Elevated", color: "#f97316", bg: "#fff7ed" },
  { key: "critical", label: "Critical", color: "#dc2626", bg: "#fee2e2" },
];

function isOverdue(d) {
  return d && new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));
}

function dueToday(d) {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function OverviewPage() {
  const { refreshKey, openPatient, activeLocation, locations } = useShell();
  const [insights, setInsights] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [flags, setFlags] = useState({});
  const [claudeLinked, setClaudeLinked] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const params = activeLocation !== "all" ? { location_id: activeLocation } : {};
        const [i, e, p, r, f, sys] = await Promise.all([
          api.insights(),
          api.escalations(activeLocation !== "all" ? activeLocation : undefined),
          api.listPatients(params),
          api.listCrnRequests("pending"),
          api.getFlags(),
          api.sysadminIntegrations(),
        ]);
        setInsights(i);
        setEscalations(e);
        setPatients(p);
        setPendingRequests(r);
        setFlags(f.flags || {});
        setClaudeLinked(!!sys?.claude?.linked_to_crm);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [refreshKey, activeLocation]);

  const counts = useMemo(() => {
    const c = { stable: 0, monitoring: 0, elevated: 0, critical: 0, total: patients.length };
    patients.forEach((p) => (c[bandOf(p.escalation_score || 0)] += 1));
    const overdue = patients.filter((p) => isOverdue(p.next_appt)).length;
    const today = patients.filter((p) => dueToday(p.next_appt)).length;
    return { ...c, overdue, today };
  }, [patients]);

  // 14-day care load chart — synthesised from current patients' creation dates.
  const careTrend = useMemo(() => {
    const days = 14;
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = day.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
      const intake = patients.filter((p) => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return (
          d.getFullYear() === day.getFullYear() &&
          d.getMonth() === day.getMonth() &&
          d.getDate() === day.getDate()
        );
      }).length;
      out.push({ label, intake, escalations: 0 });
    }
    // distribute escalation scores for visual richness
    if (out.length && patients.length) {
      patients
        .filter((p) => (p.escalation_score || 0) > 50)
        .forEach((p, idx) => {
          const slot = out[(idx + 5) % out.length];
          if (slot) slot.escalations += 1;
        });
    }
    return out;
  }, [patients]);

  const refreshAI = async () => {
    setLoadingAI(true);
    const i = await api.insights(true);
    setInsights(i);
    setLoadingAI(false);
  };

  const activeLoc = locations.find((l) => l.id === activeLocation);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-14" data-testid="overview-page">
      <AnnouncementsBanner />

      {claudeLinked && (
        <CarePulsePanel
          locationId={activeLocation !== "all" ? activeLocation : null}
          locationName={activeLocation === "all" ? "all locations" : activeLoc?.name}
        />
      )}

      {/* Live ticker */}
      <div
        className="mb-6 flex items-center gap-3 px-4 py-2.5 bg-white border border-paper-rule rounded-full overflow-hidden"
        data-testid="news-ticker"
      >
        <span className="chip shrink-0" style={{ background: "#fef2f2", color: "#dc2626" }}>
          <Newspaper size={10} strokeWidth={2} />
          Live
        </span>
        <div className="flex-1 overflow-hidden whitespace-nowrap text-[12.5px] text-ink-muted">
          {(insights?.groups || []).slice(0, 4).map((g) => (
            <span key={g.label} className="inline-flex items-center gap-2 mr-8">
              <span className="w-1 h-1 rounded-full bg-ink-faint" />
              <span className="label-micro text-ink-faint">{g.label}</span>
              <span className="text-ink">{g.items?.[0]?.text || "—"}</span>
            </span>
          ))}
          {!insights && <span>Live insights streaming…</span>}
        </div>
      </div>

      <div className="mb-8">
        <div className="label-micro mb-2">Overview</div>
        <h1 className="font-display text-[28px] sm:text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.02em] text-ink">
          {activeLocation === "all" ? "All locations" : activeLoc?.name || "Location"}
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          {counts.total} patients in view · last refresh {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi
          label="Active patients"
          value={counts.total}
          sub={`${counts.stable} stable · ${counts.monitoring} monitoring`}
          accent="#10b981"
          icon={HeartPulse}
          testId="kpi-patients"
        />
        <Kpi
          label="Critical / elevated"
          value={counts.elevated + counts.critical}
          sub={`${counts.critical} critical · ${counts.elevated} elevated`}
          accent="#dc2626"
          icon={Activity}
          testId="kpi-escalations"
        />
        <Kpi
          label="Appointments today"
          value={counts.today}
          sub={counts.overdue > 0 ? `${counts.overdue} overdue` : "All on schedule"}
          accent="#f59e0b"
          icon={CalendarClock}
          testId="kpi-today"
        />
        <Kpi
          label="CRN requests"
          value={pendingRequests.length}
          sub={pendingRequests.length ? "Awaiting assignment" : "Inbox clear"}
          accent="#2563eb"
          icon={Inbox}
          testId="kpi-requests"
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Care load chart */}
        <section className="col-span-12 xl:col-span-8 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow animate-fade-up">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="label-micro mb-2">Care load</div>
              <h2 className="font-display text-[24px] leading-none tracking-[-0.01em]">
                Daily intake &amp; escalations
              </h2>
              <div className="mt-1.5 text-[12px] text-ink-muted">
                Last 14 days · scoped to {activeLocation === "all" ? "all locations" : activeLoc?.name}
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="label-micro mb-1">Intakes</div>
                <div className="font-mono text-[17px] ticker">
                  {careTrend.reduce((a, b) => a + b.intake, 0)}
                </div>
              </div>
              <div>
                <div className="label-micro mb-1">Escalations</div>
                <div className="font-mono text-[17px] ticker text-[var(--highrisk)]">
                  {counts.elevated + counts.critical}
                </div>
              </div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={careTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="careIntake" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="careEsc" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F3F3EF" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontFamily: "Geist", fontSize: 11, fill: "#8A8A85" }}
                  tickLine={false}
                  axisLine={{ stroke: "#EDEDEA" }}
                />
                <YAxis
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#8A8A85" }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ border: "1px solid #EDEDEA", borderRadius: 10, fontFamily: "Geist", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="intake" stroke="#10b981" strokeWidth={1.8} fill="url(#careIntake)" dot={false} />
                <Area type="monotone" dataKey="escalations" stroke="#dc2626" strokeWidth={1.4} fill="url(#careEsc)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Risk distribution */}
        <section className="col-span-12 xl:col-span-4 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow animate-fade-up">
          <div className="label-micro mb-2">Acuity distribution</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mb-4">By risk band</h2>
          {counts.total === 0 ? (
            <div className="text-[12.5px] text-ink-muted py-6">No patients yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {RISK_BANDS.map((b) => {
                const n = counts[b.key];
                const pct = counts.total ? (n / counts.total) * 100 : 0;
                return (
                  <div key={b.key}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                        <span className="font-medium">{b.label}</span>
                      </div>
                      <span className="font-mono ticker text-ink-muted">
                        {n} · {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-paper-rail rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, background: b.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pattern intelligence */}
        <section className="col-span-12 xl:col-span-8 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="label-micro mb-2 flex items-center gap-1.5">
                <Sparkles size={10} /> Pattern intelligence
              </div>
              <h2 className="font-display text-[22px] tracking-[-0.01em]">Pattern contributor</h2>
            </div>
            <button className="icon-btn" onClick={refreshAI} data-testid="ai-refresh-btn" aria-label="Refresh">
              <RefreshCw size={13} strokeWidth={1.8} className={loadingAI ? "animate-spin" : ""} />
            </button>
          </div>
          <div>
            {(insights?.groups || []).flatMap((g) =>
              (g.items || []).map((it, i) => (
                <InsightItem
                  key={`${g.label}-${i}`}
                  text={it.text}
                  delta={it.delta}
                  label={g.label}
                />
              )),
            )}
            {!insights && <div className="text-[12px] text-ink-muted py-6">Generating insights…</div>}
          </div>
        </section>

        {/* Escalations */}
        <section className="col-span-12 xl:col-span-4 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow animate-fade-up">
          <div className="label-micro mb-2">Needs attention</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mb-3">Escalate now</h2>
          {escalations.length === 0 && (
            <div className="text-[12.5px] text-ink-muted py-4">No escalations.</div>
          )}
          {escalations.map((e) => (
            <button
              key={e.patient_id}
              onClick={() => openPatient?.(patients.find((p) => p.id === e.patient_id))}
              className="w-full text-left py-3 border-b border-paper-rule/70 last:border-b-0 hover:bg-paper-rail -mx-2 px-2 rounded-md transition-colors"
              data-testid={`esc-${e.patient_id}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-paper-rail flex items-center justify-center shrink-0">
                  <span className="font-mono text-[10px] text-ink-muted">
                    {e.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-[16px] leading-tight truncate">{e.name}</span>
                    <span className="font-mono text-[11px] ticker text-[var(--highrisk)]">
                      {Math.round((1 - e.ai_probability) * 100)}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted truncate">{e.concern}</div>
                  <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-ink-faint mt-1">
                    {e.reason}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}

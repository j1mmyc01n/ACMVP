import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Newspaper,
} from "lucide-react";

function fmt(n = 0) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function Kpi({ label, value, delta, positive, suffix, testId }) {
  const D = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      className="bg-white border border-paper-rule rounded-[16px] p-5 animate-fade-up card-shadow"
      data-testid={testId}
    >
      <div className="label-micro">{label}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-[34px] leading-none tracking-[-0.02em] ticker">{value}</span>
        {suffix && <span className="font-mono text-[12px] text-ink-faint">{suffix}</span>}
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1 text-[12px]">
          <D
            size={12}
            strokeWidth={2}
            className={positive ? "text-[var(--stable)]" : "text-[var(--highrisk)]"}
          />
          <span className={positive ? "text-[var(--stable)]" : "text-[var(--highrisk)]"}>{delta}</span>
          <span className="text-ink-muted ml-1">vs last quarter</span>
        </div>
      )}
    </div>
  );
}

function LanePulse({ label, count, color, bg }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-paper-rule/70 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[12px] font-medium text-ink">{label}</span>
      </div>
      <span
        className="font-mono text-[12px] ticker font-semibold px-2 py-0.5 rounded-md"
        style={{ background: bg, color }}
      >
        {count}
      </span>
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
          {label} · <span className="text-ink-muted">{delta}</span>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { refreshKey, openPatient, activeLocation, locations } = useShell();
  const [metrics, setMetrics] = useState(null);
  const [trend, setTrend] = useState([]);
  const [insights, setInsights] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const params = activeLocation !== "all" ? { location_id: activeLocation } : {};
        const [m, t, i, e, p] = await Promise.all([
          fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/analytics/dashboard${
              activeLocation !== "all" ? `?location_id=${activeLocation}` : ""
            }`,
          ).then((r) => r.json()),
          api.forecastTrend(),
          api.insights(),
          api.escalations(activeLocation !== "all" ? activeLocation : undefined),
          api.listPatients(params),
        ]);
        setMetrics(m);
        setTrend(t);
        setInsights(i);
        setEscalations(e);
        setPatients(p);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [refreshKey, activeLocation]);

  const pipeline = metrics?.pipeline || {};
  const lanes = [
    { key: "stable", label: "Stable", color: "#10b981", bg: "#ecfdf5" },
    { key: "monitoring", label: "Monitoring", color: "#f59e0b", bg: "#fffbeb" },
    { key: "elevated", label: "Elevated", color: "#f97316", bg: "#fff7ed" },
    { key: "highrisk", label: "High risk", color: "#ef4444", bg: "#fef2f2" },
    { key: "critical", label: "Critical", color: "#dc2626", bg: "#fee2e2" },
  ];
  const laneCounts = lanes.map((l) => {
    const n = patients.filter((p) => {
      const s = p.escalation_score || 0;
      return (
        (l.key === "stable" && s <= 20) ||
        (l.key === "monitoring" && s > 20 && s <= 45) ||
        (l.key === "elevated" && s > 45 && s <= 65) ||
        (l.key === "highrisk" && s > 65 && s <= 84) ||
        (l.key === "critical" && s > 84)
      );
    }).length;
    return { ...l, count: n };
  });

  const refreshAI = async () => {
    setLoadingAI(true);
    const i = await api.insights(true);
    setInsights(i);
    setLoadingAI(false);
  };

  return (
    <div className="p-6 lg:p-8 pb-14" data-testid="overview-page">
      {/* Ticker news strip — sits outside the card-centric grid */}
      <div className="mb-6 flex items-center gap-3 px-4 py-2.5 bg-white border border-paper-rule rounded-full overflow-hidden" data-testid="news-ticker">
        <span className="chip shrink-0" style={{ background: "#fef2f2", color: "#dc2626" }}>
          <Newspaper size={10} strokeWidth={2} />
          Live
        </span>
        <div className="flex-1 overflow-hidden whitespace-nowrap text-[12.5px] text-ink-muted">
          {(insights?.groups || []).slice(0, 4).map((g, i) => (
            <span key={g.label} className="inline-flex items-center gap-2 mr-8">
              <span className="w-1 h-1 rounded-full bg-ink-faint" />
              <span className="label-micro text-ink-faint">{g.label}</span>
              <span className="text-ink">{g.items?.[0]?.text || "—"}</span>
              <span className="font-mono ticker text-ink-muted">{g.items?.[0]?.delta || ""}</span>
            </span>
          ))}
          {!insights && <span>Live insights streaming…</span>}
        </div>
      </div>

      <div className="mb-8">
        <div className="label-micro mb-2">Overview</div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em] text-ink">
          {activeLocation === "all"
            ? "All locations"
            : locations.find((l) => l.id === activeLocation)?.name || "Location"}
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          {patients.length} patients in view · last refresh {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Patients" value={metrics?.total_patients ?? "—"} delta="+6" positive testId="kpi-patients" />
        <Kpi label="Calls pending" value={metrics?.pending_calls ?? "—"} delta="-2" positive testId="kpi-calls" />
        <Kpi label="Conversion" value={metrics?.conversion_rate ?? 0} suffix="%" delta="+4.1%" positive testId="kpi-conv" />
        <Kpi
          label="Forecast"
          value={fmt(metrics?.ai_forecast || 0)}
          delta="+9.4%"
          positive
          testId="kpi-forecast"
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 xl:col-span-8 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow animate-fade-up">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="label-micro mb-2">Forecast history</div>
              <h2 className="font-display text-[26px] leading-none tracking-[-0.01em]">
                Forecast vs actual
              </h2>
              <div className="mt-1.5 text-[12px] text-ink-muted">
                Claude Sonnet 4.5 weighted probability · 12 rolling months
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="label-micro mb-1">Plan</div>
                <div className="font-mono text-[17px] ticker">{fmt(metrics?.plan || 0)}</div>
              </div>
              <div>
                <div className="label-micro mb-1">Forecast</div>
                <div className="font-mono text-[17px] ticker text-[var(--stable)]">
                  {fmt(metrics?.ai_forecast || 0)}
                </div>
              </div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ovGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F3F3EF" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "Geist", fontSize: 11, fill: "#8A8A85" }}
                  tickLine={false}
                  axisLine={{ stroke: "#EDEDEA" }}
                />
                <YAxis
                  tickFormatter={fmt}
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#8A8A85" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip
                  contentStyle={{ border: "1px solid #EDEDEA", borderRadius: 10, fontFamily: "Geist", fontSize: 12 }}
                  formatter={(v) => fmt(v)}
                />
                <Area type="monotone" dataKey="ai_forecast" stroke="#10b981" strokeWidth={1.8} fill="url(#ovGrad)" dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={1.4} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="col-span-12 xl:col-span-4 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow animate-fade-up">
          <div className="label-micro mb-2">Pipeline by lane</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mb-3">Patient distribution</h2>
          {laneCounts.map((l) => (
            <LanePulse key={l.key} label={l.label} count={l.count} color={l.color} bg={l.bg} />
          ))}
        </section>

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

        <section className="col-span-12 xl:col-span-4 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow animate-fade-up">
          <div className="label-micro mb-2">Needs attention</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mb-3">Escalate now</h2>
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
                    <span className="font-mono text-[11px] ticker text-[var(--highrisk)]">{Math.round((1 - e.ai_probability) * 100)}</span>
                  </div>
                  <div className="text-[11px] text-ink-muted truncate">{e.concern}</div>
                  <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-ink-faint mt-1">{e.reason}</div>
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}

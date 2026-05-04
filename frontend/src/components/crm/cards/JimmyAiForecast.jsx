import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";

const COLORS = {
  TOP: "bg-white border border-paper-rule text-ink",
  ACTIVITY: "bg-white border border-paper-rule text-ink",
  PIPELINE: "bg-white border border-paper-rule text-ink",
  NEWS: "bg-white border border-paper-rule text-ink",
  MACROECONOMIC: "bg-white border border-paper-rule text-ink",
  "SERVICE & SUPPLY CHAIN": "bg-white border border-paper-rule text-ink",
  "TOP PATIENTS": "bg-white border border-paper-rule text-ink",
  APPOINTMENTS: "bg-white border border-paper-rule text-ink",
  ENGAGEMENT: "bg-white border border-paper-rule text-ink",
  "CLINICAL FLAGS": "bg-white border border-paper-rule text-ink",
  DEMOGRAPHICS: "bg-white border border-paper-rule text-ink",
  "CARE HISTORY": "bg-white border border-paper-rule text-ink",
};

function fmt(n = 0) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export default function JimmyAiForecast({
  metrics,
  trend,
  insights,
  onRefresh,
  owner = "Clara Daniels",
  quarter = "Q2-2026",
}) {
  const [loading, setLoading] = useState(false);
  const groups = insights?.groups || [];
  const total = metrics?.ai_forecast || 0;

  const refresh = async () => {
    if (!onRefresh) return;
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  return (
    <div className="bg-white border border-paper-rule h-full flex flex-col" data-testid="ai-forecast-card">
      <div className="px-6 py-5 border-b border-paper-rule">
        <div className="flex items-start justify-between">
          <div>
            <div className="label-micro mb-2">JimmyAi forecast · {quarter}</div>
            <div className="font-heading text-[22px] leading-none tracking-tight">{owner}</div>
            <div className="font-mono text-[28px] ticker mt-3 leading-none">{fmt(total)}</div>
          </div>
          <button onClick={refresh} className="icon-btn" data-testid="ai-refresh" aria-label="Refresh">
            <RefreshCw size={14} strokeWidth={1.6} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 border-b border-paper-rule">
        <div className="label-micro px-2 mb-2">JimmyAi forecast history</div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="aiTrendGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0F4C3A" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#0F4C3A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F0F0EB" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "#8A8A85" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E5E0" }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ border: "1px solid #E5E5E0", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 10 }}
                formatter={(v) => fmt(v)}
              />
              <Area type="monotone" dataKey="ai_forecast" stroke="#0F4C3A" strokeWidth={1.4} fill="url(#aiTrendGrad)" dot={false} />
              <Line type="monotone" dataKey="actual" stroke="#D35400" strokeWidth={1.2} strokeDasharray="3 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 px-2 pt-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-brand" />
            <span className="label-micro">JimmyAi forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 border-t border-dashed border-brand-secondary" style={{ height: 1 }} />
            <span className="label-micro">Sales forecast</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex-1 flex flex-col min-h-0">
        <div className="label-micro mb-3">Top AI contributor</div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {groups.map((g) => (
            <span
              key={g.label}
              className={`text-[9.5px] font-mono uppercase tracking-[0.1em] px-2.5 py-1 rounded-full ${COLORS[g.label] || "bg-white border border-paper-rule"}`}
              data-testid={`ai-pill-${g.label}`}
            >
              {g.label} ({g.items?.length || 0})
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin -mr-2 pr-2">
          <ul className="flex flex-col">
            {groups.flatMap((g) =>
              (g.items || []).map((it, i) => (
                <li
                  key={`${g.label}-${i}`}
                  className="py-3 border-b border-paper-rule/60 last:border-b-0 flex items-start gap-3"
                >
                  <AlertCircle size={14} strokeWidth={1.6} className="text-brand-secondary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] leading-snug">{it.text}</div>
                    <div className="label-micro mt-1">
                      {g.label} · <span className="text-ink-muted">{it.delta}</span>
                    </div>
                  </div>
                </li>
              )),
            )}
            {groups.length === 0 && (
              <div className="text-[12px] text-ink-muted font-body">Generating insights…</div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export default function ForecastChart({ data, metrics }) {
  const forecast = metrics?.ai_forecast || 0;
  const plan = metrics?.plan || 0;
  const gap = metrics?.gap_to_plan || 0;

  return (
    <div data-testid="forecast-chart">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="label-micro mb-2">AI forecast history</div>
          <h2 className="font-heading text-[32px] leading-none tracking-tight">
            Forecast &nbsp;vs&nbsp; Actual
          </h2>
          <div className="mt-2 text-[12px] text-ink-muted font-body">
            Claude Sonnet 4.5 weighted probability over 12 rolling months.
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <div className="label-micro">Plan</div>
            <div className="font-mono text-[18px] ticker">{fmt(plan)}</div>
          </div>
          <div>
            <div className="label-micro">Forecast</div>
            <div className="font-mono text-[18px] ticker text-brand">{fmt(forecast)}</div>
          </div>
          <div>
            <div className="label-micro">Gap</div>
            <div className={`font-mono text-[18px] ticker ${gap > 0 ? "text-brand-secondary" : "text-brand"}`}>
              {fmt(gap)}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[260px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="aiGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0F4C3A" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0F4C3A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F0F0EB" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#8A8A85" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E5E0" }}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: "#8A8A85" }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #E5E5E0",
                borderRadius: 0,
                fontFamily: "JetBrains Mono",
                fontSize: 11,
              }}
              formatter={(v) => fmt(v)}
            />
            <Area
              type="monotone"
              dataKey="ai_forecast"
              stroke="#0F4C3A"
              strokeWidth={1.6}
              fill="url(#aiGrad)"
              name="AI forecast"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#D35400"
              strokeWidth={1.4}
              strokeDasharray="4 3"
              dot={false}
              name="Actual"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-6 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-[2px] bg-brand" />
          <span className="label-micro">AI Forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-[2px] border-t border-dashed border-brand-secondary" />
          <span className="label-micro">Actual</span>
        </div>
      </div>
    </div>
  );
}

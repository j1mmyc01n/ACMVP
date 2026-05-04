function fmt(n = 0) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function Sparkline({ data = [], stroke = "#0F4C3A" }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 120;
  const h = 26;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="block">
      <polyline fill="none" stroke={stroke} strokeWidth="1.2" points={pts} />
    </svg>
  );
}

function Category({ label, value, pct, color, spark, testId }) {
  return (
    <div className="flex-1 min-w-0 border-r border-paper-rule last:border-r-0 pr-4 pl-4 first:pl-0" data-testid={testId}>
      <div className="label-micro mb-2">{label}</div>
      <div className="font-mono text-[22px] ticker leading-none mb-2 whitespace-nowrap">
        {fmt(value)}
      </div>
      <div className="h-[3px] bg-paper-rule mb-1 w-full">
        <div
          className="h-full"
          style={{ width: `${Math.min(100, pct)}%`, background: color }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted">
        <span>{pct}%</span>
        <Sparkline data={spark} stroke={color} />
      </div>
    </div>
  );
}

export default function ForecastCategories({ data, lastUpdated }) {
  if (!data) return null;
  return (
    <div className="bg-white border border-paper-rule p-6 h-full" data-testid="forecast-categories">
      <div className="flex items-start justify-between mb-5">
        <div className="font-heading text-[22px] leading-none tracking-tight">
          Forecast categories
        </div>
        <span className="label-micro">
          Last updated: {new Date(lastUpdated || Date.now()).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-stretch">
        <Category label="Forecast" value={data.forecast.value} pct={data.forecast.pct} color="#0F4C3A" spark={data.forecast.spark} testId="cat-forecast" />
        <Category label="JimmyAi forecast" value={data.ai_forecast.value} pct={data.ai_forecast.pct} color="#D35400" spark={data.ai_forecast.spark} testId="cat-ai-forecast" />
        <Category label="Commit" value={data.commit.value} pct={data.commit.pct} color="#5C5C59" spark={data.commit.spark} testId="cat-commit" />
        <Category label="Probable" value={data.probable.value} pct={data.probable.pct} color="#5C5C59" spark={data.probable.spark} testId="cat-probable" />
        <Category label="Best case" value={data.best_case.value} pct={data.best_case.pct} color="#5C5C59" spark={data.best_case.spark} testId="cat-best" />
      </div>
    </div>
  );
}

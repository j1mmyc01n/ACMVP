import { ArrowUpRight, ArrowDownRight } from "lucide-react";

function fmtMoney(n = 0) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

function Kpi({ label, value, delta, positive, mono = true, big = false, testId, suffix }) {
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      className="p-8 border-r border-paper-rule last:border-r-0 hover:bg-white transition-colors animate-fade-up"
      data-testid={testId}
    >
      <div className="label-micro mb-5">{label}</div>
      <div className="flex items-end gap-2">
        <div className={`${mono ? "font-mono" : "font-heading"} ${big ? "text-[40px]" : "text-[32px]"} leading-none tracking-tight ticker`}>
          {value}
          {suffix && <span className="text-ink-faint text-[14px] ml-1 ticker">{suffix}</span>}
        </div>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1 text-[12px] font-mono">
          <DeltaIcon size={12} strokeWidth={1.8} className={positive ? "text-brand" : "text-brand-secondary"} />
          <span className={positive ? "text-brand" : "text-brand-secondary"}>{delta}</span>
          <span className="text-ink-faint ml-1">vs last quarter</span>
        </div>
      )}
    </div>
  );
}

export default function KPIStrip({ metrics, loading }) {
  const m = metrics || {};
  const pipeline = m.pipeline || {};
  const totalPipeline =
    (pipeline.lead || 0) + (pipeline.scheduled || 0) + (pipeline.contacted || 0) + (pipeline.converted || 0);
  const segs = [
    { key: "lead", color: "#E5E5E0", label: "Lead" },
    { key: "scheduled", color: "#F39C12", label: "Scheduled" },
    { key: "contacted", color: "#2980B9", label: "Contacted" },
    { key: "converted", color: "#0F4C3A", label: "Converted" },
  ];

  return (
    <section
      className="grid grid-cols-2 md:grid-cols-4 border-b border-paper-rule bg-paper"
      data-testid="kpi-strip"
    >
      <Kpi
        label="Patients"
        value={loading ? "—" : m.total_patients ?? 0}
        delta="+6"
        positive
        testId="kpi-patients"
      />
      <Kpi
        label="Calls Pending"
        value={loading ? "—" : m.pending_calls ?? 0}
        delta="-2"
        positive
        testId="kpi-pending-calls"
      />
      <Kpi
        label="Conversion"
        value={loading ? "—" : `${m.conversion_rate ?? 0}`}
        suffix="%"
        delta="+4.1%"
        positive
        testId="kpi-conversion"
      />
      <Kpi
        label="AI Forecast"
        value={loading ? "—" : fmtMoney(m.ai_forecast ?? 0)}
        delta="+9.4%"
        positive
        big
        testId="kpi-ai-forecast"
      />

      <div className="col-span-2 md:col-span-4 border-t border-paper-rule p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-baseline gap-3 md:w-72">
          <span className="label-micro">Pipeline</span>
          <span className="font-mono text-[13px] ticker">{totalPipeline} patients</span>
        </div>
        <div className="flex-1 flex h-[10px] overflow-hidden bg-paper-rule" data-testid="pipeline-strip">
          {segs.map((s) => {
            const v = pipeline[s.key] || 0;
            const pct = totalPipeline ? (v / totalPipeline) * 100 : 0;
            return (
              <div
                key={s.key}
                style={{ width: `${pct}%`, background: s.color }}
                title={`${s.label}: ${v}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-ink-muted">
          {segs.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 inline-block" style={{ background: s.color }} />
              <span className="uppercase tracking-wider">{s.label}</span>
              <span className="ticker">{pipeline[s.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

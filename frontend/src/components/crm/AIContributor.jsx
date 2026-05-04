import { Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";

const COLORS = {
  "TOP PATIENTS": "bg-[#0F4C3A] text-white",
  APPOINTMENTS: "bg-[#2980B9] text-white",
  ENGAGEMENT: "bg-[#F39C12] text-black",
  "CLINICAL FLAGS": "bg-[#D35400] text-white",
  DEMOGRAPHICS: "bg-ink text-white",
  "CARE HISTORY": "bg-white text-ink border border-paper-rule",
};

export default function AIContributor({ insights, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const groups = insights?.groups || [];

  const refresh = async () => {
    if (!onRefresh) return;
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  return (
    <section className="h-full flex flex-col" data-testid="ai-contributor">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="label-micro mb-2 flex items-center gap-1.5">
            <Sparkles size={10} strokeWidth={1.8} /> Top AI contributor
          </div>
          <h2 className="font-heading text-[26px] leading-none tracking-tight">
            Pattern intelligence
          </h2>
          <div className="text-[11px] font-mono text-ink-faint mt-2 ticker">
            claude-sonnet-4-5 · 12 signals
          </div>
        </div>
        <button
          onClick={refresh}
          data-testid="ai-refresh-btn"
          className="icon-btn"
          title="Refresh insights"
          aria-label="Refresh insights"
        >
          <RefreshCw size={14} strokeWidth={1.6} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {groups.map((g) => (
          <span
            key={g.label}
            className={`text-[9.5px] font-mono uppercase tracking-[0.1em] px-2 py-1 ${
              COLORS[g.label] || "bg-white border border-paper-rule"
            }`}
          >
            {g.label} ({g.items?.length || 0})
          </span>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {groups.map((g, idx) => (
          <div key={g.label} className="flex gap-3 animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="w-1.5 h-1.5 bg-brand mt-2 rounded-full" />
            <div className="flex-1">
              <div className="label-micro mb-1">{g.label}</div>
              {(g.items || []).map((it, j) => (
                <div key={j} className="flex items-start justify-between gap-3">
                  <div className="text-[13px] leading-snug font-body text-ink">{it.text}</div>
                  <div className="font-mono text-[10px] text-ink-muted whitespace-nowrap ticker">
                    {it.delta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-[12px] text-ink-muted font-body">Generating insights…</div>
        )}
      </div>
    </section>
  );
}

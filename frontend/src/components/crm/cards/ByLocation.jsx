import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

function fmt(n = 0) {
  return `$${Math.round(n).toLocaleString()}`;
}

function Bar({ value, target, color }) {
  const pct = target ? Math.min(115, (value / target) * 100) : 0;
  return (
    <div className="flex flex-col gap-1 min-w-[150px]">
      <div className="font-mono text-[13px] ticker">{fmt(value)}</div>
      <div className="h-[3px] bg-paper-rule w-full">
        <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <div className="text-[10px] font-mono text-ink-muted">{Math.round(pct)}%</div>
    </div>
  );
}

function SubRow({ label, plan, gap, fc, ai, won }) {
  return (
    <tr className="border-t border-paper-rule/40 bg-paper-rail/40">
      <td className="py-3 pl-14 pr-3 text-[13px]">{label}</td>
      <td className="py-3 pr-3 text-[11px] text-ink-muted">—</td>
      <td className="py-3 pr-3 font-mono text-[12px] ticker">{fmt(plan)}</td>
      <td className="py-3 pr-3 font-mono text-[12px] ticker text-brand-secondary">{fmt(gap)}</td>
      <td className="py-3 pr-3"><Bar value={fc} target={plan} color="#0F4C3A" /></td>
      <td className="py-3 pr-3"><Bar value={ai} target={plan} color="#D35400" /></td>
      <td className="py-3 pr-6"><Bar value={won} target={plan} color="#2980B9" /></td>
    </tr>
  );
}

export default function ByLocation({ rows = [] }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (id) => {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="bg-white border border-paper-rule h-full flex flex-col" data-testid="by-location-card">
      <div className="px-6 py-5 border-b border-paper-rule flex items-baseline justify-between">
        <div className="font-heading text-[22px] leading-none tracking-tight">
          Forecast by location
        </div>
        <span className="label-micro">{rows.length} locations</span>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="label-micro">
              <th className="py-3 pl-6 pr-3 font-normal">Name</th>
              <th className="py-3 pr-3 font-normal">Region</th>
              <th className="py-3 pr-3 font-normal">Plan</th>
              <th className="py-3 pr-3 font-normal">Gap to plan</th>
              <th className="py-3 pr-3 font-normal">Forecast</th>
              <th className="py-3 pr-3 font-normal">JimmyAi forecast</th>
              <th className="py-3 pr-6 font-normal">Won</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = open.has(r.id);
              const split = r.patient_count || 3;
              const per = 1 / split;
              return (
                <>
                  <tr
                    key={r.id}
                    className="border-t border-paper-rule/60 hover:bg-paper-rail transition-colors cursor-pointer"
                    onClick={() => toggle(r.id)}
                    data-testid={`loc-row-${r.id}`}
                  >
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown size={12} strokeWidth={1.6} className="text-ink" />
                        ) : (
                          <ChevronRight size={12} strokeWidth={1.6} className="text-ink-faint" />
                        )}
                        <span className="font-heading text-[17px]">{r.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 text-[12px] text-ink-muted">{r.region}</td>
                    <td className="py-3.5 pr-3 font-mono text-[12px] ticker">{fmt(r.plan)}</td>
                    <td className="py-3.5 pr-3 font-mono text-[12px] ticker text-brand-secondary">{fmt(r.gap_to_plan)}</td>
                    <td className="py-3.5 pr-3"><Bar value={r.forecast} target={r.plan} color="#0F4C3A" /></td>
                    <td className="py-3.5 pr-3"><Bar value={r.ai_forecast} target={r.plan} color="#D35400" /></td>
                    <td className="py-3.5 pr-6"><Bar value={r.won} target={r.plan} color="#2980B9" /></td>
                  </tr>
                  {isOpen && (
                    <>
                      <SubRow label="Intake cohort" plan={r.plan * 0.4} gap={r.gap_to_plan * 0.4} fc={r.forecast * 0.42} ai={r.ai_forecast * 0.4} won={r.won * 0.35} />
                      <SubRow label="Return cohort" plan={r.plan * 0.35} gap={r.gap_to_plan * 0.35} fc={r.forecast * 0.36} ai={r.ai_forecast * 0.35} won={r.won * 0.4} />
                      <SubRow label="Referral cohort" plan={r.plan * 0.25} gap={r.gap_to_plan * 0.25} fc={r.forecast * 0.22} ai={r.ai_forecast * 0.25} won={r.won * 0.25} />
                    </>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

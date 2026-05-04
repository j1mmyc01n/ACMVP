import { Users, AlertTriangle, Clock, Activity } from "lucide-react";
import { isOverdue } from "@/lib/kanbanConstants";

function KpiCard({ label, value, sub, icon: Icon, accent, testid }) {
  return (
    <div
      data-testid={testid}
      className="relative flex-1 min-w-[180px] rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950/70 backdrop-blur-xl px-5 py-4 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at 0% 0%, ${accent}, transparent 50%)`,
        }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400">
            {label}
          </div>
          <div className="mt-1.5 font-[Manrope] text-[28px] font-extrabold tracking-tight text-slate-100 leading-none">
            {value}
          </div>
          {sub && (
            <div className="mt-1.5 text-[11px] text-slate-500">{sub}</div>
          )}
        </div>
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center border"
          style={{
            background: `${accent}1A`,
            borderColor: `${accent}33`,
            color: accent,
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}

export default function KpiStrip({ patients }) {
  const total = patients.length;
  const critical = patients.filter((p) => p.crisis_level === "critical").length;
  const highRisk = patients.filter((p) => p.crisis_level === "high_risk").length;
  const overdue = patients.filter((p) => isOverdue(p.review_date)).length;
  const clinicians = new Set(patients.map((p) => p.assigned_clinician)).size;
  const avgRisk = total
    ? Math.round(
        patients.reduce((acc, p) => acc + (p.risk_score || 0), 0) / total
      )
    : 0;

  return (
    <div
      className="flex flex-wrap gap-3"
      data-testid="kpi-strip"
    >
      <KpiCard
        testid="kpi-total"
        label="Total Patients"
        value={total}
        sub={`${clinicians} active clinicians`}
        icon={Users}
        accent="#38bdf8"
      />
      <KpiCard
        testid="kpi-critical"
        label="In Critical"
        value={critical}
        sub={`${highRisk} high-risk on watchlist`}
        icon={AlertTriangle}
        accent="#e11d48"
      />
      <KpiCard
        testid="kpi-overdue"
        label="Overdue Reviews"
        value={overdue}
        sub={overdue ? "Action required" : "All caught up"}
        icon={Clock}
        accent="#f59e0b"
      />
      <KpiCard
        testid="kpi-avg-risk"
        label="Avg. Risk Score"
        value={avgRisk}
        sub="Across all patients"
        icon={Activity}
        accent="#10b981"
      />
    </div>
  );
}

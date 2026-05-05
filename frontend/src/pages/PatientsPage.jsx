import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import ProfilesView from "@/components/crm/ProfilesView";
import { ChevronRight, Filter, Plus, Table, Users as UsersIcon } from "lucide-react";

const RISK_BANDS = [
  { key: "all", label: "All risk levels" },
  { key: "stable", label: "Stable", color: "#10b981" },
  { key: "monitoring", label: "Monitoring", color: "#f59e0b" },
  { key: "elevated", label: "Elevated", color: "#f97316" },
  { key: "critical", label: "Critical", color: "#dc2626" },
];

function bandOf(score = 0) {
  if (score <= 25) return "stable";
  if (score <= 50) return "monitoring";
  if (score <= 75) return "elevated";
  return "critical";
}

const FALLBACK_STAGES = [
  { key: "intake", label: "Intake", color: "#3b82f6" },
  { key: "triage", label: "Triage", color: "#f59e0b" },
  { key: "active", label: "Active", color: "#10b981" },
  { key: "follow_up", label: "Follow-up", color: "#8b5cf6" },
  { key: "discharged", label: "Discharged", color: "#64748b" },
];

export default function PatientsPage() {
  const { search, refreshKey, openPatient, openIntake, activeLocation, locations } = useShell();
  const [params, setParams] = useSearchParams();
  const initialView = params.get("view") || "profiles";
  const [view, setView] = useState(["table", "profiles"].includes(initialView) ? initialView : "profiles");
  const [patients, setPatients] = useState([]);
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    api.listPatients().then(setPatients);
  }, [refreshKey]);

  const activeLoc = locations.find((l) => l.id === activeLocation);
  const stages =
    activeLoc && activeLoc.pipeline_stages && activeLoc.pipeline_stages.length
      ? activeLoc.pipeline_stages
      : FALLBACK_STAGES;
  const stageMap = useMemo(() => Object.fromEntries(stages.map((s) => [s.key, s])), [stages]);

  const filtered = useMemo(() => {
    let list = patients;
    if (activeLocation !== "all") list = list.filter((p) => p.location_id === activeLocation);
    if (riskFilter !== "all")
      list = list.filter((p) => bandOf(p.escalation_score || 0) === riskFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) ||
          (p.crn || "").toLowerCase().includes(s) ||
          (p.patient_id || "").toLowerCase().includes(s) ||
          (p.email || "").toLowerCase().includes(s) ||
          (p.phone || "").toLowerCase().includes(s) ||
          (p.concern || "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [patients, activeLocation, riskFilter, search]);

  // Distribution counts (scoped to current location filter, ignoring risk filter)
  const distribution = useMemo(() => {
    const scoped = activeLocation === "all"
      ? patients
      : patients.filter((p) => p.location_id === activeLocation);
    const counts = { stable: 0, monitoring: 0, elevated: 0, critical: 0 };
    scoped.forEach((p) => {
      counts[bandOf(p.escalation_score || 0)] += 1;
    });
    return { ...counts, total: scoped.length };
  }, [patients, activeLocation]);

  const setViewQ = (v) => {
    setView(v);
    const next = new URLSearchParams(params);
    if (v === "profiles") next.delete("view");
    else next.set("view", v);
    setParams(next, { replace: true });
  };

  const header = activeLocation === "all" ? "Patient directory" : `Patients — ${activeLoc?.name}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-14 max-w-full" data-testid="patients-page">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="label-micro mb-2">Patients</div>
          <h1 className="font-display text-[28px] sm:text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.02em]">
            {header}
          </h1>
          <div className="mt-2 text-[13px] text-ink-muted">
            {filtered.length} of {patients.length}
          </div>
        </div>
        <button
          onClick={openIntake}
          className="btn-primary flex items-center gap-2 shrink-0"
          data-testid="patients-add-btn"
        >
          <Plus size={13} strokeWidth={2} />
          Add new patient
        </button>
      </div>

      {distribution.total > 0 && (
        <div
          className="mb-5 bg-white border border-paper-rule rounded-[14px] p-4 card-shadow"
          data-testid="risk-distribution"
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="label-micro">Acuity at a glance</div>
            <div className="text-[11.5px] text-ink-muted font-mono ticker">
              {distribution.total} active
            </div>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-paper-rail">
            {RISK_BANDS.filter((b) => b.key !== "all").map((b) => {
              const pct = distribution.total ? (distribution[b.key] / distribution.total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <button
                  key={b.key}
                  onClick={() => setRiskFilter(riskFilter === b.key ? "all" : b.key)}
                  className="h-full transition-all hover:opacity-80"
                  style={{ width: `${pct}%`, background: b.color }}
                  title={`${distribution[b.key]} ${b.label}`}
                  data-testid={`risk-bar-${b.key}`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 flex-wrap text-[11.5px]">
            {RISK_BANDS.filter((b) => b.key !== "all").map((b) => (
              <button
                key={b.key}
                onClick={() => setRiskFilter(riskFilter === b.key ? "all" : b.key)}
                className={`flex items-center gap-1.5 transition-opacity ${
                  riskFilter === b.key ? "" : "opacity-60 hover:opacity-100"
                }`}
                data-testid={`risk-legend-${b.key}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                <span className="font-medium" style={{ color: b.color }}>
                  {distribution[b.key]}
                </span>
                <span className="text-ink-muted">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5 flex-wrap" data-testid="filters">
        <div
          className="inline-flex items-center gap-1 p-1 bg-paper-rail rounded-[12px] border border-paper-rule"
          data-testid="patients-view-toggle"
        >
          <button
            className="seg-btn"
            data-active={view === "profiles"}
            onClick={() => setViewQ("profiles")}
            data-testid="view-profiles"
          >
            <UsersIcon size={13} strokeWidth={1.8} />
            Profiles
          </button>
          <button
            className="seg-btn"
            data-active={view === "table"}
            onClick={() => setViewQ("table")}
            data-testid="view-table"
          >
            <Table size={13} strokeWidth={1.8} />
            Table
          </button>
        </div>

        <div className="inline-flex items-center gap-1 bg-white border border-paper-rule rounded-[12px] px-2 py-1.5">
          <Filter size={13} className="ml-1 text-ink-muted" />
          <select
            className="bg-transparent text-[12.5px] pr-6 focus:outline-none cursor-pointer"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            data-testid="risk-filter"
          >
            {RISK_BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "profiles" && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <ProfilesView patients={filtered} onOpen={openPatient} />
        </div>
      )}

      {view === "table" && (
        <div className="bg-white border border-paper-rule rounded-[16px] overflow-hidden card-shadow">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="label-micro">
                  <th className="py-3.5 pl-6 pr-3 font-normal">Patient</th>
                  <th className="py-3.5 pr-3 font-normal">CRN</th>
                  <th className="py-3.5 pr-3 font-normal">Phone</th>
                  <th className="py-3.5 pr-3 font-normal">Concern</th>
                  <th className="py-3.5 pr-3 font-normal">Risk</th>
                  <th className="py-3.5 pr-3 font-normal">Stage</th>
                  <th className="py-3.5 pr-3 font-normal">Score</th>
                  <th className="py-3.5 pr-3 font-normal">Doctor</th>
                  <th className="py-3.5 pr-6 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const band = RISK_BANDS.find((b) => b.key === bandOf(p.escalation_score || 0));
                  const stage = stageMap[p.stage] || { label: p.stage || "—", color: "#64748b" };
                  return (
                    <tr
                      key={p.id}
                      onClick={() => openPatient(p)}
                      className="border-t border-paper-rule/70 hover:bg-paper-rail cursor-pointer transition-colors group"
                      data-testid={`pat-row-${p.id}`}
                    >
                      <td className="py-3 pl-6 pr-3">
                        <div className="min-w-0 flex items-center gap-2">
                          <span
                            className="w-1.5 h-8 rounded-full shrink-0"
                            style={{ background: band?.color || "#64748b" }}
                            aria-hidden="true"
                          />
                          <div>
                            <div className="font-display text-[16px] leading-tight truncate">
                              {p.first_name} {p.last_name}
                            </div>
                            <div className="text-[10.5px] font-mono text-ink-muted ticker">
                              {p.patient_id} · {p.age || "—"} yrs
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[12px] ticker text-ink-muted">{p.crn}</td>
                      <td className="py-3 pr-3 font-mono text-[12px] ticker text-ink-muted">{p.phone}</td>
                      <td className="py-3 pr-3 text-[13px]">{p.concern || "—"}</td>
                      <td className="py-3 pr-3">
                        <span
                          className="chip"
                          style={{ background: `${band?.color || "#64748b"}1a`, color: band?.color || "#64748b" }}
                        >
                          {band?.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className="chip"
                          style={{ background: `${stage.color}1a`, color: stage.color }}
                        >
                          {stage.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[13px] ticker font-semibold">
                        {p.escalation_score || 0}
                      </td>
                      <td className="py-3 pr-3 text-[12.5px] text-ink-muted">{p.assigned_doctor || "Unassigned"}</td>
                      <td className="py-3 pr-6 text-right">
                        <ChevronRight
                          size={14}
                          strokeWidth={1.8}
                          className="text-ink-faint group-hover:text-ink transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[13px] text-ink-muted">
                      No patients match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

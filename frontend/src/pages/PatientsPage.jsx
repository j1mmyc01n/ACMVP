import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import { ChevronRight, Filter } from "lucide-react";

const LANES = {
  stable: { c: "#10b981", bg: "#ecfdf5", l: "Stable" },
  monitoring: { c: "#f59e0b", bg: "#fffbeb", l: "Monitoring" },
  elevated: { c: "#f97316", bg: "#fff7ed", l: "Elevated" },
  highrisk: { c: "#ef4444", bg: "#fef2f2", l: "High risk" },
  critical: { c: "#dc2626", bg: "#fee2e2", l: "Critical" },
};
const laneOf = (s) => (s <= 20 ? "stable" : s <= 45 ? "monitoring" : s <= 65 ? "elevated" : s <= 84 ? "highrisk" : "critical");

export default function PatientsPage() {
  const { search, refreshKey, openPatient } = useShell();
  const [patients, setPatients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locFilter, setLocFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");

  useEffect(() => {
    Promise.all([api.listPatients(), api.listLocations()]).then(([p, l]) => {
      setPatients(p);
      setLocations(l);
    });
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let list = patients;
    if (locFilter !== "all") list = list.filter((p) => p.location_id === locFilter);
    if (laneFilter !== "all") list = list.filter((p) => laneOf(p.escalation_score || 0) === laneFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) ||
          (p.crn || "").toLowerCase().includes(s) ||
          (p.concern || "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [patients, locFilter, laneFilter, search]);

  return (
    <div className="p-8 pb-14" data-testid="patients-page">
      <div className="mb-6">
        <div className="label-micro mb-2">Patients</div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em]">
          Patient directory
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">{filtered.length} of {patients.length}</div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap" data-testid="filters">
        <div className="inline-flex items-center gap-1 bg-white border border-paper-rule rounded-[12px] px-2 py-1.5">
          <Filter size={13} className="ml-1 text-ink-muted" />
          <select
            className="bg-transparent text-[12.5px] pr-6 focus:outline-none cursor-pointer"
            value={locFilter}
            onChange={(e) => setLocFilter(e.target.value)}
            data-testid="loc-filter"
          >
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="inline-flex items-center gap-1 bg-white border border-paper-rule rounded-[12px] px-2 py-1.5">
          <select
            className="bg-transparent text-[12.5px] pr-6 focus:outline-none cursor-pointer"
            value={laneFilter}
            onChange={(e) => setLaneFilter(e.target.value)}
            data-testid="lane-filter"
          >
            <option value="all">All risk lanes</option>
            {Object.entries(LANES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-paper-rule rounded-[16px] overflow-hidden card-shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="label-micro">
              <th className="py-3.5 pl-6 pr-3 font-normal">Patient</th>
              <th className="py-3.5 pr-3 font-normal">CRN</th>
              <th className="py-3.5 pr-3 font-normal">Concern</th>
              <th className="py-3.5 pr-3 font-normal">Lane</th>
              <th className="py-3.5 pr-3 font-normal">Score</th>
              <th className="py-3.5 pr-3 font-normal">Preferred</th>
              <th className="py-3.5 pr-3 font-normal">Doctor</th>
              <th className="py-3.5 pr-6 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const lane = LANES[laneOf(p.escalation_score || 0)];
              return (
                <tr
                  key={p.id}
                  onClick={() => openPatient(p)}
                  className="border-t border-paper-rule/70 hover:bg-paper-rail cursor-pointer transition-colors group"
                  data-testid={`pat-row-${p.id}`}
                >
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-paper-rule" />
                      <div className="min-w-0">
                        <div className="font-display text-[16px] leading-tight truncate">{p.first_name} {p.last_name}</div>
                        <div className="text-[10.5px] font-mono text-ink-muted ticker">{p.patient_id} · {p.age} yrs</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-[12px] ticker text-ink-muted">{p.crn}</td>
                  <td className="py-3 pr-3 text-[13px]">{p.concern || "—"}</td>
                  <td className="py-3 pr-3">
                    <span className="chip" style={{ background: lane.bg, color: lane.c }}>
                      {lane.l}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-mono text-[13px] ticker font-semibold">{p.escalation_score}</td>
                  <td className="py-3 pr-3 text-[12.5px] font-mono ticker text-ink-muted">
                    {p.preferred_day} · {p.preferred_time}
                  </td>
                  <td className="py-3 pr-3 text-[12.5px] text-ink-muted">{p.assigned_doctor}</td>
                  <td className="py-3 pr-6 text-right">
                    <ChevronRight size={14} strokeWidth={1.8} className="text-ink-faint group-hover:text-ink transition-colors" />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[13px] text-ink-muted">
                  No patients match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

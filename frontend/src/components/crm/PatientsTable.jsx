import { ChevronRight, ArrowUpDown } from "lucide-react";

function stageTone(stage) {
  switch (stage) {
    case "converted":
      return "bg-[#0F4C3A] text-white";
    case "scheduled":
      return "bg-[#F39C12] text-black";
    case "contacted":
      return "bg-[#2980B9] text-white";
    case "lead":
      return "bg-white text-ink border border-paper-rule";
    case "closed":
      return "bg-ink text-white";
    default:
      return "bg-white text-ink border border-paper-rule";
  }
}

function Meter({ value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-[3px] bg-paper-rule">
        <div
          className="h-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[11px] ticker w-[32px] text-right">{pct}%</span>
    </div>
  );
}

export default function PatientsTable({ patients, locations, onOpen }) {
  const locName = (id) => locations.find((l) => l.id === id)?.name?.replace("Sableheart — ", "") || "—";

  return (
    <section data-testid="patients-table">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="label-micro mb-2">Pipeline</div>
          <h2 className="font-heading text-[32px] leading-none tracking-tight">
            Patient ledger
          </h2>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-ink-muted font-mono">
          <span>{patients.length} rows</span>
          <button className="flex items-center gap-1 hover:text-ink">
            <ArrowUpDown size={12} strokeWidth={1.6} /> AI PROB.
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="label-micro">
              <th className="py-3 pr-4 border-b border-paper-rule font-normal">Patient</th>
              <th className="py-3 pr-4 border-b border-paper-rule font-normal">CRN</th>
              <th className="py-3 pr-4 border-b border-paper-rule font-normal">Concern</th>
              <th className="py-3 pr-4 border-b border-paper-rule font-normal">Location</th>
              <th className="py-3 pr-4 border-b border-paper-rule font-normal">Stage</th>
              <th className="py-3 pr-4 border-b border-paper-rule font-normal">AI Probability</th>
              <th className="py-3 pr-4 border-b border-paper-rule font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-muted font-body">
                  No patients match the current filters.
                </td>
              </tr>
            )}
            {patients.map((p) => (
              <tr
                key={p.id}
                className="group border-b border-paper-rule/60 hover:bg-white transition-colors cursor-pointer"
                onClick={() => onOpen(p)}
                data-testid={`patient-row-${p.id}`}
              >
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar_url}
                      alt=""
                      className="w-8 h-8 object-cover border border-paper-rule"
                    />
                    <div>
                      <div className="font-heading text-[17px] leading-tight">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wider">
                        {p.patient_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4 font-mono text-[12px] text-ink-muted ticker">{p.crn}</td>
                <td className="py-3.5 pr-4 text-[13px]">{p.concern || "—"}</td>
                <td className="py-3.5 pr-4 text-[12px] text-ink-muted">{locName(p.location_id)}</td>
                <td className="py-3.5 pr-4">
                  <span className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 ${stageTone(p.stage)}`}>
                    {p.stage}
                  </span>
                </td>
                <td className="py-3.5 pr-4">
                  <Meter value={p.ai_probability} />
                </td>
                <td className="py-3.5 pr-2 text-right">
                  <ChevronRight
                    size={14}
                    strokeWidth={1.6}
                    className="text-ink-faint group-hover:text-ink transition-colors"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

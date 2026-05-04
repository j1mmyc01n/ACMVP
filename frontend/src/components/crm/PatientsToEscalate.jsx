import { AlertCircle } from "lucide-react";

export default function PatientsToEscalate({ items, onOpen }) {
  return (
    <section data-testid="escalations">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="label-micro mb-2">Needs attention</div>
          <h2 className="font-heading text-[26px] leading-none tracking-tight">
            Patients to escalate
          </h2>
        </div>
        <AlertCircle size={16} strokeWidth={1.6} className="text-brand-secondary" />
      </div>

      <div className="flex flex-col">
        {items.map((it, i) => {
          const pct = Math.round((it.ai_probability || 0) * 100);
          return (
            <button
              key={it.patient_id}
              onClick={() => onOpen(it.patient_id)}
              data-testid={`escalate-${it.patient_id}`}
              className="group flex items-start gap-3 py-4 border-b border-paper-rule/70 hover:bg-white px-2 -mx-2 transition-colors text-left"
            >
              <img
                src={it.avatar_url}
                alt=""
                className="w-10 h-10 object-cover border border-paper-rule"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-heading text-[17px] leading-tight truncate">{it.name}</div>
                  <div className="font-mono text-[11px] ticker text-brand-secondary shrink-0">
                    {pct}%
                  </div>
                </div>
                <div className="text-[12px] text-ink-muted mt-0.5 truncate">{it.concern}</div>
                <div className="label-micro mt-1.5 text-ink-faint">{it.reason}</div>
              </div>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="text-[12px] text-ink-muted font-body py-6">No escalations right now.</div>
        )}
      </div>
    </section>
  );
}

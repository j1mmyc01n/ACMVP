function Donut({ pct, color }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46">
      <circle cx="23" cy="23" r={r} stroke="#F0F0EB" strokeWidth="3" fill="none" />
      <circle
        cx="23"
        cy="23"
        r={r}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray={`${filled} ${c}`}
        strokeDashoffset={c / 4}
        transform="rotate(-90 23 23)"
      />
      <text
        x="23"
        y="26"
        textAnchor="middle"
        fontFamily="JetBrains Mono"
        fontSize="10"
        fill="#111"
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function EscalationsCard({ items = [], onOpen }) {
  return (
    <div className="bg-white border border-paper-rule h-full" data-testid="escalations-card">
      <div className="px-6 py-5 border-b border-paper-rule">
        <div className="font-heading text-[22px] leading-none tracking-tight">
          Patients to escalate
        </div>
        <div className="label-micro mt-1">JimmyAi confidence · top of queue</div>
      </div>
      <div className="divide-y divide-paper-rule/60">
        {items.map((it) => {
          const pct = Math.round((1 - (it.ai_probability || 0)) * 100);
          return (
            <button
              key={it.patient_id}
              onClick={() => onOpen?.(it.patient_id)}
              data-testid={`esc-${it.patient_id}`}
              className="w-full text-left px-6 py-4 flex items-start gap-3 hover:bg-paper-rail transition-colors"
            >
              <Donut pct={pct} color="#D35400" />
              <div className="flex-1 min-w-0">
                <div className="font-heading text-[16px] leading-tight truncate">
                  {it.name}
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5 truncate">
                  {it.concern}
                </div>
                <div className="label-micro mt-1.5 text-ink-faint">{it.reason}</div>
              </div>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="px-6 py-6 text-[12px] text-ink-muted font-body">No escalations.</div>
        )}
      </div>
    </div>
  );
}

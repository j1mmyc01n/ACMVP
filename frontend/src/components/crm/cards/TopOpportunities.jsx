function Donut({ pct, color }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} stroke="#F0F0EB" strokeWidth="2.5" fill="none" />
      <circle
        cx="18"
        cy="18"
        r={r}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeDasharray={`${filled} ${c}`}
        strokeDashoffset={c / 4}
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="21" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#111">{pct}%</text>
    </svg>
  );
}

export default function TopOpportunities({ rows = [], onOpen }) {
  return (
    <div className="bg-white border border-paper-rule h-full" data-testid="top-opportunities">
      <div className="px-6 py-5 border-b border-paper-rule flex items-baseline justify-between">
        <div>
          <div className="font-heading text-[22px] leading-none tracking-tight">
            Top open patients
          </div>
          <div className="label-micro mt-1">Weighted by JimmyAi probability</div>
        </div>
        <span className="label-micro">{rows.length}</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="label-micro">
            <th className="py-3 pl-6 pr-3 font-normal">Name</th>
            <th className="py-3 pr-3 font-normal">Concern</th>
            <th className="py-3 pr-3 font-normal">Probability</th>
            <th className="py-3 pr-3 font-normal">JimmyAi prob.</th>
            <th className="py-3 pr-3 font-normal">Owner</th>
            <th className="py-3 pr-6 font-normal">Region</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onOpen?.(r.id)}
              className="border-t border-paper-rule/60 hover:bg-paper-rail transition-colors cursor-pointer"
              data-testid={`top-row-${r.id}`}
            >
              <td className="py-3.5 pl-6 pr-3">
                <div className="font-heading text-[16px] leading-tight hover-underline inline">
                  {r.name}
                </div>
                <div className="label-micro mt-0.5">{r.concern}</div>
              </td>
              <td className="py-3.5 pr-3 text-[12px] text-ink-muted">{r.concern}</td>
              <td className="py-3.5 pr-3">
                <Donut pct={Math.round((r.probability || 0) * 100)} color="#0F4C3A" />
              </td>
              <td className="py-3.5 pr-3">
                <Donut pct={Math.round((r.ai_probability || 0) * 100)} color="#D35400" />
              </td>
              <td className="py-3.5 pr-3 text-[12px]">{r.owner}</td>
              <td className="py-3.5 pr-6 text-[12px] text-ink-muted">{r.region}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-[12px] text-ink-muted">No open patients.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

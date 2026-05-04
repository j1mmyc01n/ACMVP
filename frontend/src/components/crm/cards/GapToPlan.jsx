function fmt(n = 0) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

export default function GapToPlan({ data }) {
  const plan = data?.plan || 0;
  const closed = data?.closed || 0;
  const gap = data?.gap || 0;
  const attain = plan ? (closed / plan) * 100 : 0;

  const cx = 90;
  const cy = 90;
  const r = 70;
  const arcLen = Math.PI * r;
  const filled = (Math.min(100, attain) / 100) * arcLen;
  const gapFilled = arcLen - filled;

  return (
    <div className="bg-white border border-paper-rule p-6 h-full flex flex-col" data-testid="gap-to-plan">
      <div className="flex items-start justify-between mb-4">
        <div className="font-heading text-[22px] leading-none tracking-tight">
          Gap to Plan
        </div>
        <span className="label-micro">Quarter</span>
      </div>

      <div className="flex items-center gap-5 flex-1">
        <div className="relative" style={{ width: 180, height: 110 }}>
          <svg viewBox="0 0 180 100" width="180" height="110">
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              stroke="#F0F0EB"
              strokeWidth="12"
              fill="none"
            />
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              stroke="#0F4C3A"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${filled} ${arcLen}`}
              strokeLinecap="butt"
            />
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              stroke="#E5E5E0"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${gapFilled} ${arcLen}`}
              strokeDashoffset={-filled}
              opacity="0.45"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
            <div className="label-micro">Gap to plan</div>
            <div className="font-mono text-[18px] ticker leading-none mt-1">
              {fmt(gap)}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div>
            <div className="label-micro mb-1">Plan</div>
            <div className="font-mono text-[20px] ticker leading-none">{fmt(plan)}</div>
          </div>
          <div className="h-px bg-paper-rule" />
          <div>
            <div className="label-micro mb-1">Closed</div>
            <div className="font-mono text-[20px] ticker leading-none">{fmt(closed)}</div>
          </div>
          <div className="h-px bg-paper-rule" />
          <div>
            <div className="label-micro mb-1">Attainment</div>
            <div className="font-mono text-[14px] ticker leading-none text-brand">{Math.round(attain)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Heart, Activity, Wind } from "lucide-react";

export default function VitalsStrip({ vitals }) {
  if (!vitals) return null;
  const chips = [
    {
      icon: Heart,
      label: "HR",
      value: `${vitals.hr}`,
      suffix: "bpm",
      color: "text-rose-300",
    },
    {
      icon: Activity,
      label: "BP",
      value: `${vitals.bp_sys}/${vitals.bp_dia}`,
      suffix: "mmHg",
      color: "text-sky-300",
    },
    {
      icon: Wind,
      label: "SpO₂",
      value: `${vitals.spo2}`,
      suffix: "%",
      color: "text-teal-300",
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5 mt-3" data-testid="vitals-strip">
      {chips.map(({ icon: Icon, label, value, suffix, color }) => (
        <div
          key={label}
          className="flex flex-col gap-0.5 bg-slate-800/40 border border-slate-700/40 rounded-md px-2 py-1.5"
          data-testid={`vital-${label.toLowerCase()}`}
        >
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-400 font-medium">
            <Icon className={`h-2.5 w-2.5 ${color}`} strokeWidth={2.5} />
            {label}
          </div>
          <div className="font-mono text-[13px] text-slate-100 leading-none">
            {value}
            <span className="text-[9px] text-slate-500 ml-0.5">{suffix}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

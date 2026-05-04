// Crisis Kanban shared constants + helpers (LIGHT / WHITE THEME)
export const CRISIS_LEVELS = [
  {
    id: "stable",
    name: "Stable",
    short: "Stable",
    range: "0 – 20",
    accent: "#059669", // emerald-600
    text: "text-emerald-700",
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-200",
    columnAccent: "from-emerald-500 via-emerald-300 to-transparent",
    gradient: "linear-gradient(90deg, rgba(5,150,105,0.10) 0%, rgba(5,150,105,0) 60%)",
    glow: "shadow-[0_4px_18px_rgba(5,150,105,0.10)]",
    ringHex: "rgba(5,150,105,0.45)",
  },
  {
    id: "monitoring",
    name: "Monitoring",
    short: "Monitoring",
    range: "21 – 45",
    accent: "#d97706", // amber-600
    text: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-200",
    columnAccent: "from-amber-500 via-amber-300 to-transparent",
    gradient: "linear-gradient(90deg, rgba(217,119,6,0.10) 0%, rgba(217,119,6,0) 60%)",
    glow: "shadow-[0_4px_18px_rgba(217,119,6,0.10)]",
    ringHex: "rgba(217,119,6,0.45)",
  },
  {
    id: "elevated",
    name: "Elevated",
    short: "Elevated",
    range: "46 – 65",
    accent: "#ea580c", // orange-600
    text: "text-orange-700",
    badgeBg: "bg-orange-50",
    badgeBorder: "border-orange-200",
    columnAccent: "from-orange-500 via-orange-300 to-transparent",
    gradient: "linear-gradient(90deg, rgba(234,88,12,0.10) 0%, rgba(234,88,12,0) 60%)",
    glow: "shadow-[0_4px_18px_rgba(234,88,12,0.12)]",
    ringHex: "rgba(234,88,12,0.45)",
  },
  {
    id: "high_risk",
    name: "High Risk",
    short: "High Risk",
    range: "66 – 84",
    accent: "#dc2626", // red-600
    text: "text-red-700",
    badgeBg: "bg-red-50",
    badgeBorder: "border-red-200",
    columnAccent: "from-red-500 via-red-300 to-transparent",
    gradient: "linear-gradient(90deg, rgba(220,38,38,0.10) 0%, rgba(220,38,38,0) 60%)",
    glow: "shadow-[0_4px_18px_rgba(220,38,38,0.14)]",
    ringHex: "rgba(220,38,38,0.5)",
  },
  {
    id: "critical",
    name: "Critical",
    short: "Critical",
    range: "85 – 100",
    accent: "#be123c", // rose-700
    text: "text-rose-700",
    badgeBg: "bg-rose-50",
    badgeBorder: "border-rose-300",
    columnAccent: "from-rose-600 via-rose-400 to-transparent",
    gradient: "linear-gradient(90deg, rgba(190,18,60,0.12) 0%, rgba(190,18,60,0) 60%)",
    glow: "shadow-[0_6px_22px_rgba(190,18,60,0.18)]",
    ringHex: "rgba(190,18,60,0.55)",
  },
];

export const LEVEL_BY_ID = Object.fromEntries(CRISIS_LEVELS.map((l) => [l.id, l]));

export function groupByLevel(patients) {
  const out = Object.fromEntries(CRISIS_LEVELS.map((l) => [l.id, []]));
  for (const p of patients) {
    if (out[p.crisis_level]) out[p.crisis_level].push(p);
  }
  for (const level of Object.keys(out)) {
    out[level].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return out;
}

export function formatRelative(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function isOverdue(reviewDateStr) {
  if (!reviewDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(reviewDateStr);
  return d < today;
}

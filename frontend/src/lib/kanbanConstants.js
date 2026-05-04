// Crisis Kanban shared constants + helpers
export const CRISIS_LEVELS = [
  {
    id: "stable",
    name: "Stable",
    short: "Stable",
    range: "0 – 20",
    accent: "#10b981", // emerald-500
    text: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/20",
    columnAccent: "from-emerald-500/80 via-emerald-500/20 to-transparent",
    gradient: "linear-gradient(90deg, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0) 60%)",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.12)]",
    ringHex: "rgba(16,185,129,0.35)",
  },
  {
    id: "monitoring",
    name: "Monitoring",
    short: "Monitoring",
    range: "21 – 45",
    accent: "#f59e0b", // amber-500
    text: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/20",
    columnAccent: "from-amber-500/80 via-amber-500/20 to-transparent",
    gradient: "linear-gradient(90deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0) 60%)",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.12)]",
    ringHex: "rgba(245,158,11,0.35)",
  },
  {
    id: "elevated",
    name: "Elevated",
    short: "Elevated",
    range: "46 – 65",
    accent: "#f97316", // orange-500
    text: "text-orange-400",
    badgeBg: "bg-orange-500/10",
    badgeBorder: "border-orange-500/20",
    columnAccent: "from-orange-500/80 via-orange-500/20 to-transparent",
    gradient: "linear-gradient(90deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0) 60%)",
    glow: "shadow-[0_0_18px_rgba(249,115,22,0.15)]",
    ringHex: "rgba(249,115,22,0.35)",
  },
  {
    id: "high_risk",
    name: "High Risk",
    short: "High Risk",
    range: "66 – 84",
    accent: "#ef4444", // red-500
    text: "text-red-400",
    badgeBg: "bg-red-500/10",
    badgeBorder: "border-red-500/25",
    columnAccent: "from-red-500/80 via-red-500/20 to-transparent",
    gradient: "linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0) 60%)",
    glow: "shadow-[0_0_18px_rgba(239,68,68,0.18)]",
    ringHex: "rgba(239,68,68,0.4)",
  },
  {
    id: "critical",
    name: "Critical",
    short: "Critical",
    range: "85 – 100",
    accent: "#e11d48", // rose-600
    text: "text-rose-400",
    badgeBg: "bg-rose-600/15",
    badgeBorder: "border-rose-600/30",
    columnAccent: "from-rose-600/90 via-rose-600/25 to-transparent",
    gradient: "linear-gradient(90deg, rgba(225,29,72,0.16) 0%, rgba(225,29,72,0) 60%)",
    glow: "shadow-[0_0_24px_rgba(225,29,72,0.25)]",
    ringHex: "rgba(225,29,72,0.5)",
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

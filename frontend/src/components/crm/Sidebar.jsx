import {
  LayoutGrid,
  Users,
  Phone,
  CalendarDays,
  Sparkles,
  FileText,
  MapPin,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { key: "overview", icon: LayoutGrid, label: "Overview" },
  { key: "patients", icon: Users, label: "Patients" },
  { key: "calls", icon: Phone, label: "Call queue" },
  { key: "calendar", icon: CalendarDays, label: "Calendar" },
  { key: "ai", icon: Sparkles, label: "AI studio" },
  { key: "notes", icon: FileText, label: "Clinical notes" },
];

export default function Sidebar({ locations, activeLocation, onSelectLocation }) {
  const [active, setActive] = useState("overview");
  return (
    <aside
      className="w-[64px] shrink-0 bg-paper border-r border-paper-rule flex flex-col items-center py-4"
      data-testid="crm-sidebar"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-ink text-paper mb-6" data-testid="brand-mark" title="JimmyAi">
        <span className="font-heading text-[18px] leading-none">J</span>
      </div>

      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              title={item.label}
              data-testid={`nav-${item.key}`}
              className={`w-10 h-10 flex items-center justify-center relative transition-colors ${
                isActive ? "text-ink bg-white border border-paper-rule" : "text-ink-muted hover:text-ink"
              }`}
              aria-label={item.label}
            >
              <Icon size={16} strokeWidth={1.6} />
            </button>
          );
        })}
        <div className="mt-3 label-micro text-ink-faint">LOC</div>
        <button
          onClick={() => onSelectLocation("all")}
          title="All locations"
          data-testid="location-all"
          className={`w-10 h-10 flex items-center justify-center font-mono text-[10px] ${
            activeLocation === "all" ? "bg-white border border-paper-rule text-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          ALL
        </button>
        {locations.map((l) => {
          const initial = (l.name.split("— ")[1] || l.name).slice(0, 3).toUpperCase();
          const isActive = activeLocation === l.id;
          return (
            <button
              key={l.id}
              onClick={() => onSelectLocation(l.id)}
              title={l.name}
              data-testid={`location-${l.id}`}
              className={`w-10 h-10 flex items-center justify-center font-mono text-[10px] ${
                isActive ? "bg-white border border-paper-rule text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {initial}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2">
        <button className="w-10 h-10 flex items-center justify-center text-ink-muted hover:text-ink" title="Map view" aria-label="Map view">
          <MapPin size={14} strokeWidth={1.6} />
        </button>
        <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center font-mono text-[10px]">
          HA
        </div>
      </div>
    </aside>
  );
}

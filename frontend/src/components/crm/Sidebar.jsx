import {
  LayoutGrid,
  Users,
  CalendarDays,
  Phone,
  Sparkles,
  FileText,
  MapPin,
  Settings,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "patients", label: "Patients", icon: Users },
  { key: "calls", label: "Call Queue", icon: Phone },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "ai", label: "AI Studio", icon: Sparkles },
  { key: "notes", label: "Clinical Notes", icon: FileText },
];

export default function Sidebar({ locations, activeLocation, onSelectLocation }) {
  const [active, setActive] = useState("overview");

  return (
    <aside
      className="w-[248px] shrink-0 bg-white border-r border-paper-rule flex flex-col"
      data-testid="crm-sidebar"
    >
      <div className="h-[72px] px-6 flex items-center border-b border-paper-rule">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[28px] leading-none tracking-tight">
            Sableheart
          </span>
          <span className="label-micro">CRM</span>
        </div>
      </div>

      <nav className="py-4" data-testid="sidebar-nav">
        {NAV.map((item, i) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              data-testid={`nav-${item.key}`}
              className={`w-full flex items-center gap-3 px-6 py-2.5 text-[13px] transition-colors relative ${
                isActive
                  ? "text-ink bg-paper-rail"
                  : "text-ink-muted hover:text-ink hover:bg-paper-rail/60"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand" />
              )}
              <Icon size={16} strokeWidth={1.6} />
              <span className="font-body">{item.label}</span>
              <span className="ml-auto label-micro">{String(i + 1).padStart(2, "0")}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 mt-4">
        <div className="label-micro mb-3 flex items-center gap-2">
          <MapPin size={10} /> Locations
        </div>
        <div className="flex flex-col gap-1" data-testid="sidebar-locations">
          <button
            onClick={() => onSelectLocation("all")}
            data-testid="location-all"
            className={`text-left text-[13px] py-1.5 flex items-center justify-between ${
              activeLocation === "all" ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            <span>All locations</span>
            <span className="label-micro">{locations.length}</span>
          </button>
          {locations.map((l) => (
            <button
              key={l.id}
              onClick={() => onSelectLocation(l.id)}
              data-testid={`location-${l.id}`}
              className={`text-left text-[13px] py-1.5 truncate ${
                activeLocation === l.id ? "text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {l.name.replace("Sableheart — ", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-paper-rule p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ink text-white flex items-center justify-center font-mono text-[11px]">
            HA
          </div>
          <div className="text-[12px] leading-tight">
            <div className="font-body">Harper Alcott</div>
            <div className="label-micro">Admin</div>
          </div>
        </div>
        <button className="icon-btn" data-testid="settings-btn" aria-label="Settings">
          <Settings size={14} strokeWidth={1.6} />
        </button>
      </div>
    </aside>
  );
}

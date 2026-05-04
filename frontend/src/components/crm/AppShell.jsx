import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity,
  LayoutDashboard,
  Users,
  Columns,
  CalendarDays,
  Phone,
  MapPin,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  Search,
  Plus,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import IntakeDrawer from "@/components/crm/IntakeDrawer";
import CallQueueRail from "@/components/crm/CallQueueRail";
import PatientDetailDrawer from "@/components/crm/PatientDetailDrawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";

const ShellCtx = createContext({});
export const useShell = () => useContext(ShellCtx);

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/board", label: "Board", icon: Columns },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/call-queue", label: "Call Queue", icon: Phone },
  { to: "/chat", label: "Team Chat", icon: MessageSquare },
  { to: "/ai-studio", label: "AI Studio", icon: Sparkles },
  { to: "/locations", label: "Locations", icon: MapPin },
  { to: "/sysadmin", label: "System Admin", icon: ShieldCheck },
];

export default function AppShell({ children }) {
  const routeLoc = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(true); // call queue sticky open by default
  const [detailPatient, setDetailPatient] = useState(null);
  const [locations, setLocations] = useState([]);
  const [queue, setQueue] = useState([]);
  const [activeLocation, setActiveLocation] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAuxiliary = async () => {
    try {
      const [l, q] = await Promise.all([api.listLocations(), api.listQueue()]);
      setLocations(l);
      setQueue(q);
    } catch {}
  };

  const bump = () => {
    setRefreshKey((k) => k + 1);
    loadAuxiliary();
  };

  useEffect(() => {
    loadAuxiliary();
  }, [refreshKey]);

  const onMaximize = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const activeLoc = locations.find((l) => l.id === activeLocation);
  const brandLabel = activeLocation === "all" ? "All locations" : activeLoc?.name || "Patient CRM";
  const brandShort =
    activeLocation === "all"
      ? "ALL"
      : (activeLoc?.name || "").slice(0, 3).toUpperCase() || "LOC";

  const sortedQueue = [...queue].sort((a, b) => {
    const tA = `${a.requested_day || "ZZZ"} ${a.requested_time || "23:59"}`;
    const tB = `${b.requested_day || "ZZZ"} ${b.requested_time || "23:59"}`;
    return tA.localeCompare(tB);
  });
  const scopedQueue =
    activeLocation === "all"
      ? sortedQueue
      : sortedQueue.filter((q) => q.patient?.location_id === activeLocation);

  return (
    <ShellCtx.Provider
      value={{
        search,
        setSearch,
        refreshKey,
        bump,
        locations,
        activeLocation,
        setActiveLocation,
        openPatient: setDetailPatient,
        openIntake: () => setIntakeOpen(true),
        toggleQueue: () => setRailOpen((v) => !v),
      }}
    >
      <div className="h-screen w-full flex bg-paper text-ink" data-testid="app-shell">
        <aside
          className={`${collapsed ? "w-[68px]" : "w-[240px]"} shrink-0 bg-white border-r border-paper-rule flex flex-col transition-all duration-200`}
          data-testid="sidebar"
        >
          <div className="h-[72px] flex items-center gap-3 px-5 border-b border-paper-rule">
            <div className="w-9 h-9 rounded-[10px] bg-ink text-white flex items-center justify-center shrink-0">
              {collapsed ? (
                <span className="font-mono text-[10px] font-semibold">{brandShort}</span>
              ) : (
                <Activity size={16} strokeWidth={2.2} className="text-[var(--stable)]" />
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0" data-testid="brand">
                <div className="font-display text-[18px] leading-tight tracking-[-0.02em] truncate">
                  {brandLabel}
                </div>
                <div className="label-micro mt-0.5">Patient CRM</div>
              </div>
            )}
          </div>

          <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin" data-testid="nav">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? routeLoc.pathname === item.to
                : routeLoc.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-colors ${
                    isActive
                      ? "bg-paper-rail text-ink font-medium"
                      : "text-ink-muted hover:text-ink hover:bg-paper-rail/60"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.8} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-paper-rule">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[12px] text-ink-muted hover:text-ink hover:bg-paper-rail/60"
              data-testid="sidebar-collapse"
              aria-label="Collapse sidebar"
            >
              {collapsed ? (
                <PanelLeftOpen size={14} strokeWidth={1.8} />
              ) : (
                <>
                  <PanelLeftClose size={14} strokeWidth={1.8} />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="h-[72px] shrink-0 bg-paper border-b border-paper-rule flex items-center px-6 gap-3"
            data-testid="topbar"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-10 px-3 bg-white border border-paper-rule rounded-[10px] flex items-center gap-2 text-[13px] hover:border-ink"
                  data-testid="location-picker"
                >
                  <MapPin size={13} strokeWidth={1.8} className="text-ink-muted" />
                  <span className="truncate max-w-[220px]">{brandLabel}</span>
                  <ChevronDown size={13} strokeWidth={1.8} className="text-ink-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-[10px] border-paper-rule min-w-[220px]">
                <DropdownMenuItem
                  onClick={() => setActiveLocation("all")}
                  data-testid="picker-all"
                  className="text-[12.5px] cursor-pointer flex items-center justify-between"
                >
                  All locations
                  {activeLocation === "all" && <Check size={12} />}
                </DropdownMenuItem>
                {locations.map((l) => (
                  <DropdownMenuItem
                    key={l.id}
                    onClick={() => setActiveLocation(l.id)}
                    data-testid={`picker-${l.id}`}
                    className="text-[12.5px] cursor-pointer flex items-center justify-between"
                  >
                    <span>
                      {l.name}
                      {l.speciality && l.speciality !== "general" && (
                        <span className="ml-2 text-[10px] text-ink-muted uppercase tracking-wider">
                          {l.speciality.replace("_", " ")}
                        </span>
                      )}
                    </span>
                    {activeLocation === l.id && <Check size={12} />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-[440px]">
                <Search
                  size={14}
                  strokeWidth={1.8}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patients, CRN, concern…"
                  data-testid="global-search"
                  className="w-full h-10 pl-9 pr-12 bg-white border border-paper-rule rounded-[12px] text-[13px] placeholder:text-ink-faint focus:outline-none focus:border-ink"
                />
                <span className="kbd absolute right-3 top-1/2 -translate-y-1/2">⌘K</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`btn-ghost flex items-center gap-2 ${railOpen ? "!border-ink !text-ink" : ""}`}
                data-testid="topbar-queue-btn"
                onClick={() => setRailOpen((v) => !v)}
                title="Toggle call queue"
              >
                <Phone size={13} strokeWidth={1.8} />
                Queue
                <span className="ml-1 bg-paper-rail text-ink-muted px-1.5 py-0.5 rounded-md text-[10px] font-mono ticker">
                  {scopedQueue.length}
                </span>
              </button>
              <button
                className="icon-btn"
                onClick={onMaximize}
                title="Pop out"
                data-testid="topbar-pop-out"
                aria-label="Pop out"
              >
                <Maximize2 size={14} strokeWidth={1.8} />
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setIntakeOpen(true)}
                data-testid="topbar-new-intake"
              >
                <Plus size={13} strokeWidth={2} />
                New intake
              </button>
            </div>
          </header>

          <div className="flex-1 flex min-h-0">
            <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>

            {railOpen && (
              <CallQueueRail
                items={scopedQueue}
                onClose={() => setRailOpen(false)}
                onCall={async (p) => {
                  await api.twilioCall(p.id);
                  toast.success(`Dialing ${p.first_name} via Twilio (mock)`);
                }}
                onSchedule={async (p, provider) => {
                  const when = new Date();
                  when.setDate(when.getDate() + 1);
                  await api.schedule({
                    patient_id: p.id,
                    provider,
                    when_iso: when.toISOString(),
                  });
                  toast.success(`Scheduled on ${provider}`);
                  bump();
                }}
                onOpen={(p) => setDetailPatient(p)}
              />
            )}
          </div>
        </div>

        <IntakeDrawer
          open={intakeOpen}
          onClose={() => setIntakeOpen(false)}
          locations={locations}
          defaultLocationId={activeLocation !== "all" ? activeLocation : ""}
          onCreated={(p) => {
            toast.success(`Patient ${p.first_name} ${p.last_name} added`);
            setIntakeOpen(false);
            bump();
          }}
        />
        <PatientDetailDrawer
          patient={detailPatient}
          onClose={() => setDetailPatient(null)}
          onChanged={bump}
        />
      </div>
    </ShellCtx.Provider>
  );
}

import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Phone,
  MapPin,
  ShieldCheck,
  Sparkles,
  Plug,
  Search,
  Plus,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Check,
  Building2,
  Menu,
  X,
  UserCog,
} from "lucide-react";
import { isSysadmin, getRole, setRole as persistRole } from "@/lib/role";
import NotificationBell from "@/components/crm/NotificationBell";

function RolePill({ role }) {
  return (
    <button
      onClick={() => persistRole(role === "sysadmin" ? "staff" : "sysadmin")}
      className={`hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[10px] border text-[11px] font-medium tracking-[0.14em] uppercase ${
        role === "sysadmin"
          ? "bg-ink text-white border-ink"
          : "bg-white text-ink-muted border-paper-rule hover:border-ink"
      }`}
      title={`You are signed in as ${role}. Click to switch (mock auth — real logins coming).`}
      data-testid="role-pill"
    >
      <UserCog size={11} strokeWidth={2} />
      {role}
    </button>
  );
}
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
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/call-queue", label: "Call Queue", icon: Phone },
  { to: "/ai-studio", label: "AI Studio", icon: Sparkles },
  { to: "/integrations", label: "Integrations", icon: Plug, sysadminOnly: true },
  { to: "/sysadmin", label: "System Admin", icon: ShieldCheck, sysadminOnly: true },
];

export default function AppShell({ children }) {
  const routeLoc = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(true); // call queue sticky open by default
  const [detailPatient, setDetailPatient] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [role, setRoleState] = useState(getRole());

  useEffect(() => {
    const onChange = (e) => setRoleState(e.detail || getRole());
    window.addEventListener("role-change", onChange);
    return () => window.removeEventListener("role-change", onChange);
  }, []);

  const visibleNav = NAV.filter((n) => !n.sysadminOnly || role === "sysadmin");

  // Route guard — staff cannot reach admin routes.
  useEffect(() => {
    if (role !== "sysadmin" && (routeLoc.pathname.startsWith("/sysadmin") || routeLoc.pathname.startsWith("/integrations"))) {
      navigate("/", { replace: true });
    }
  }, [role, routeLoc.pathname, navigate]);
  const [locations, setLocations] = useState([]);
  const [queue, setQueue] = useState([]);
  const [activeLocation, setActiveLocation] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [brand, setBrand] = useState({ company_name: null, logo_url: null });

  const loadAuxiliary = async () => {
    try {
      const [l, q, b] = await Promise.all([
        api.listLocations(),
        api.listQueue(),
        api.getBrand(),
      ]);
      setLocations(l);
      setQueue(q);
      setBrand(b || { company_name: null, logo_url: null });
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
  const companyLabel = brand.company_name || "Patient CRM";
  const brandLabel = activeLocation === "all" ? companyLabel : activeLoc?.name || companyLabel;
  const brandShort =
    activeLocation === "all"
      ? (companyLabel || "CRM").slice(0, 3).toUpperCase()
      : (activeLoc?.name || "").slice(0, 3).toUpperCase() || "LOC";
  const logoUrl = brand.logo_url
    ? brand.logo_url.startsWith("http")
      ? brand.logo_url
      : `${process.env.REACT_APP_BACKEND_URL}${brand.logo_url}`
    : null;

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
        role,
        isSysadmin: role === "sysadmin",
      }}
    >
      <div className="h-screen w-full flex bg-paper text-ink" data-testid="app-shell">
        {/* Mobile nav drawer overlay */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileNavOpen(false)}
            data-testid="mobile-nav-backdrop"
          />
        )}

        <aside
          className={`${
            collapsed ? "md:w-[68px]" : "md:w-[240px]"
          } shrink-0 bg-white border-r border-paper-rule flex flex-col transition-all duration-200 z-50 ${
            mobileNavOpen
              ? "fixed left-0 top-0 bottom-0 w-[260px]"
              : "hidden md:flex"
          }`}
          data-testid="sidebar"
        >
          <div className="h-[72px] flex items-center gap-3 px-5 border-b border-paper-rule">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyLabel}
                className="w-9 h-9 rounded-[10px] object-cover bg-white border border-paper-rule shrink-0"
                data-testid="brand-logo"
              />
            ) : (
              <div className="w-9 h-9 rounded-[10px] bg-ink text-white flex items-center justify-center shrink-0" data-testid="brand-mark">
                <span className="font-mono text-[10px] font-semibold tracking-wider">{brandShort}</span>
              </div>
            )}
            {(!collapsed || mobileNavOpen) && (
              <div className="min-w-0 flex-1" data-testid="brand">
                <div className="font-display text-[18px] leading-tight tracking-[-0.02em] truncate">
                  {brandLabel}
                </div>
                <div className="label-micro mt-0.5">
                  {activeLocation === "all" ? "All locations" : companyLabel}
                </div>
              </div>
            )}
            {mobileNavOpen && (
              <button
                className="icon-btn md:hidden"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                data-testid="mobile-nav-close"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            )}
          </div>

          <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin" data-testid="nav">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? routeLoc.pathname === item.to
                : routeLoc.pathname.startsWith(item.to);
              const isCollapsed = collapsed && !mobileNavOpen;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-colors ${
                    isActive
                      ? "bg-paper-rail text-ink font-medium"
                      : "text-ink-muted hover:text-ink hover:bg-paper-rail/60"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.8} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-paper-rule hidden md:block">
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
            className="h-[72px] shrink-0 bg-paper border-b border-paper-rule flex items-center px-3 md:px-6 gap-2 md:gap-3"
            data-testid="topbar"
          >
            <button
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-[12px] bg-white border border-paper-rule hover:border-ink active:bg-paper-rail shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              data-testid="mobile-nav-open"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
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

            <div className="flex-1 flex justify-center min-w-0">
              <div className="relative w-full max-w-[440px] hidden sm:block">
                <Search
                  size={14}
                  strokeWidth={1.8}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, CRN, phone, email…"
                  data-testid="global-search"
                  className="w-full h-10 pl-9 pr-12 bg-white border border-paper-rule rounded-[12px] text-[13px] placeholder:text-ink-faint focus:outline-none focus:border-ink"
                />
                <span className="kbd absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-block">⌘K</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <NotificationBell role={role} locationId={activeLocation === "all" ? null : activeLocation} />
              <RolePill role={role} />
              <button
                className={`btn-ghost hidden md:flex items-center gap-2 ${railOpen ? "!border-ink !text-ink" : ""}`}
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
                className="icon-btn hidden md:inline-flex"
                onClick={onMaximize}
                title="Pop out"
                data-testid="topbar-pop-out"
                aria-label="Pop out"
              >
                <Maximize2 size={14} strokeWidth={1.8} />
              </button>
              <button
                className="btn-primary flex items-center gap-1.5 md:gap-2 !px-3 md:!px-4"
                onClick={() => setIntakeOpen(true)}
                data-testid="topbar-new-intake"
              >
                <Plus size={13} strokeWidth={2} />
                <span className="hidden sm:inline">New intake</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </header>

          <div className="flex-1 flex min-h-0">
            <main className="flex-1 overflow-y-auto scrollbar-thin min-w-0">{children}</main>

            {railOpen && (
              <div className="hidden md:flex shrink-0 max-h-[calc(100vh-72px)]">
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
              </div>
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

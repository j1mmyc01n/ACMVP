import { Users, LayoutGrid, Wifi, Search } from "lucide-react";

export default function BoardToolbar({
  view,
  onViewChange,
  search,
  onSearch,
  patientCount,
  laneCount,
}) {
  return (
    <div className="px-10 pb-5" data-testid="board-toolbar">
      <h1 className="font-display text-[46px] md:text-[52px] leading-[1.02] tracking-[-0.02em] text-ink" data-testid="page-title">
        Patient Pipeline
      </h1>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-paper-rail rounded-[14px] border border-paper-rule" role="tablist" data-testid="view-toggle">
          <button
            className="seg-btn"
            data-active={view === "profiles"}
            onClick={() => onViewChange("profiles")}
            data-testid="view-profiles"
          >
            <Users size={14} strokeWidth={1.8} />
            Patient profiles
          </button>
          <button
            className="seg-btn"
            data-active={view === "kanban"}
            onClick={() => onViewChange("kanban")}
            data-testid="view-kanban"
          >
            <LayoutGrid size={14} strokeWidth={1.8} />
            Kanban
          </button>
        </div>

        <div className="flex-1 flex justify-center min-w-[220px]">
          <div className="relative w-full max-w-[340px]">
            <Search size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search patient, CRN, concern…"
              data-testid="search-input"
              className="w-full h-10 pl-9 pr-12 bg-white border border-paper-rule rounded-[12px] text-[13px] placeholder:text-ink-faint focus:outline-none focus:border-ink"
            />
            <span className="kbd absolute right-3 top-1/2 -translate-y-1/2">⌘K</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-[var(--stable-bg)] text-[var(--stable)] px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wider uppercase" data-testid="realtime-pill">
            <Wifi size={11} strokeWidth={2} />
            Realtime
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.14em] uppercase text-ink-muted" data-testid="board-meta">
        <span>{laneCount} Lanes</span>
        <span className="w-1 h-1 rounded-full bg-ink-faint" />
        <span>{patientCount} Patients</span>
      </div>
    </div>
  );
}

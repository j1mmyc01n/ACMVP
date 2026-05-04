import { Search, Plus, Maximize2, Bell, Sparkles } from "lucide-react";

export default function TopBar({
  search,
  onSearch,
  onOpenIntake,
  onMaximize,
  locationCount,
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header
      className="h-[72px] bg-white border-b border-paper-rule flex items-center px-8 gap-6"
      data-testid="topbar"
    >
      <div className="flex items-baseline gap-3 min-w-0">
        <h1 className="font-heading text-[28px] leading-none tracking-tight truncate">
          Overview
        </h1>
        <span className="label-micro hidden md:inline">
          {dateStr} · {locationCount} locations
        </span>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-[420px]">
          <Search
            size={14}
            strokeWidth={1.6}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search patient, CRN, concern…"
            data-testid="search-input"
            className="w-full h-9 pl-9 pr-10 border border-paper-rule bg-paper text-[13px] font-body placeholder:text-ink-faint focus:outline-none focus:border-ink"
          />
          <span className="kbd absolute right-2 top-1/2 -translate-y-1/2">⌘K</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="icon-btn"
          title="AI studio"
          data-testid="ai-studio-btn"
          aria-label="AI studio"
        >
          <Sparkles size={14} strokeWidth={1.6} />
        </button>
        <button
          className="icon-btn relative"
          title="Notifications"
          data-testid="notifications-btn"
          aria-label="Notifications"
        >
          <Bell size={14} strokeWidth={1.6} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-secondary rounded-full" />
        </button>
        <button
          className="icon-btn"
          onClick={onMaximize}
          title="Maximize"
          data-testid="maximize-btn"
          aria-label="Maximize"
        >
          <Maximize2 size={14} strokeWidth={1.6} />
        </button>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={onOpenIntake}
          data-testid="open-intake-btn"
        >
          <Plus size={14} strokeWidth={1.8} />
          New intake
        </button>
      </div>
    </header>
  );
}

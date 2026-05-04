import { ChevronDown, Plus, Maximize2, Search, Bell, Sparkles } from "lucide-react";

export default function TopBar({
  search,
  onSearch,
  onOpenIntake,
  onMaximize,
  onToggleQueue,
  queueOpen,
  owner = "Clara Daniels",
  quarter = "Q2-2026",
  onQuarterChange,
  onOwnerChange,
}) {
  return (
    <header
      className="h-[64px] bg-paper border-b border-paper-rule px-8 flex items-center gap-5"
      data-testid="topbar"
    >
      <h1 className="font-heading text-[28px] leading-none tracking-tight" data-testid="page-title">
        Dashboard
      </h1>

      <div className="flex items-center gap-3 ml-6">
        <button
          className="h-8 px-3 bg-white border border-paper-rule flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider hover:border-ink"
          data-testid="quarter-select"
          onClick={() => onQuarterChange?.()}
        >
          {quarter}
          <ChevronDown size={12} strokeWidth={1.6} />
        </button>
        <button
          className="h-8 px-3 bg-white border border-paper-rule flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider hover:border-ink"
          data-testid="owner-select"
          onClick={() => onOwnerChange?.()}
        >
          {owner}
          <ChevronDown size={12} strokeWidth={1.6} />
        </button>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-[360px]">
          <Search size={14} strokeWidth={1.6} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search patient, CRN, concern…"
            data-testid="search-input"
            className="w-full h-9 pl-9 pr-10 border border-paper-rule bg-white text-[13px] font-body placeholder:text-ink-faint focus:outline-none focus:border-ink"
          />
          <span className="kbd absolute right-2 top-1/2 -translate-y-1/2">⌘K</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="icon-btn" title="JimmyAi studio" data-testid="ai-studio-btn" aria-label="AI studio">
          <Sparkles size={14} strokeWidth={1.6} />
        </button>
        <button className="icon-btn relative" title="Notifications" data-testid="notifications-btn" aria-label="Notifications">
          <Bell size={14} strokeWidth={1.6} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-secondary rounded-full" />
        </button>
        <button className="icon-btn" onClick={onMaximize} title="Maximize" data-testid="maximize-btn" aria-label="Maximize">
          <Maximize2 size={14} strokeWidth={1.6} />
        </button>
        <button
          className={`icon-btn ${queueOpen ? "border-ink text-ink" : ""}`}
          onClick={onToggleQueue}
          title="Toggle call queue"
          data-testid="toggle-queue-btn"
          aria-label="Toggle call queue"
        >
          <span className="font-mono text-[10px] uppercase tracking-wider">Q</span>
        </button>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={onOpenIntake}
          data-testid="open-intake-btn"
        >
          <Plus size={12} strokeWidth={1.8} />
          New intake
        </button>
      </div>
    </header>
  );
}

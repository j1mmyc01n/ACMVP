import { Activity, ChevronUp, Maximize2, Plus, Phone } from "lucide-react";

export default function BrandHeader({ onOpenIntake, onMaximize, onOpenQueue, collapsed, onToggleCollapse }) {
  return (
    <header
      className="flex items-center justify-between px-10 pt-8 pb-6 border-b border-paper-rule bg-paper"
      data-testid="brand-header"
    >
      <div className="flex items-center gap-3">
        <Activity size={18} strokeWidth={2} className="text-[var(--accent-teal)]" />
        <span
          className="text-[11px] font-medium tracking-[0.18em] uppercase text-ink-muted"
          data-testid="brand-tag"
        >
          Acute Connect · Patient CRM
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenQueue}
          className="btn-ghost flex items-center gap-2"
          data-testid="open-queue-btn"
        >
          <Phone size={13} strokeWidth={1.8} />
          Call queue
        </button>
        <button
          className="btn-ghost flex items-center gap-2"
          data-testid="maximize-btn"
          onClick={onMaximize}
          aria-label="Maximize"
        >
          <Maximize2 size={13} strokeWidth={1.8} />
          Pop out
        </button>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={onOpenIntake}
          data-testid="new-intake-btn"
        >
          <Plus size={13} strokeWidth={2} />
          New intake
        </button>
        <button
          className="icon-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand" : "Collapse"}
          data-testid="collapse-btn"
          aria-label="Collapse"
        >
          <ChevronUp size={14} strokeWidth={1.8} className={collapsed ? "rotate-180" : ""} />
        </button>
      </div>
    </header>
  );
}

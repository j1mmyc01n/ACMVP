import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";

const PROVIDER_COLORS = {
  google: "#4285F4",
  outlook: "#0078D4",
  ios: "#111111",
  calendly: "#006BFF",
};

function toMonthKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default function CalendarPage() {
  const { refreshKey, openPatient } = useShell();
  const [events, setEvents] = useState([]);
  const [queue, setQueue] = useState([]);
  const [cursor, setCursor] = useState(() => new Date());

  useEffect(() => {
    Promise.all([api.listEvents(), api.listQueue()]).then(([e, q]) => {
      setEvents(e);
      setQueue(q);
    });
  }, [refreshKey]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon start
  const daysInMonth = lastDay.getDate();

  const eventsByDay = {};
  events.forEach((e) => {
    const d = new Date(e.when_iso);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      (eventsByDay[key] = eventsByDay[key] || []).push(e);
    }
  });

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-8 pb-14" data-testid="calendar-page">
      <div className="mb-6">
        <div className="label-micro mb-2 flex items-center gap-1.5">
          <CalIcon size={10} /> Scheduled
        </div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em]">
          Call calendar
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          {events.length} scheduled · {queue.length} pending requests
        </div>
      </div>

      <div className="bg-white border border-paper-rule rounded-[16px] p-5 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[24px] tracking-[-0.01em]">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button
              className="icon-btn"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              data-testid="cal-prev"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} strokeWidth={1.8} />
            </button>
            <button
              className="btn-ghost !py-1.5 !px-3 text-[12px]"
              onClick={() => setCursor(new Date())}
              data-testid="cal-today"
            >
              Today
            </button>
            <button
              className="icon-btn"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              data-testid="cal-next"
              aria-label="Next month"
            >
              <ChevronRight size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-paper-rule border border-paper-rule rounded-[12px] overflow-hidden">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-paper-rail px-3 py-2 label-micro text-ink">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            const isToday =
              d &&
              today.getDate() === d &&
              today.getMonth() === month &&
              today.getFullYear() === year;
            const dayEvents = d ? eventsByDay[d] || [] : [];
            return (
              <div
                key={i}
                className={`bg-white min-h-[110px] p-2 ${isToday ? "ring-2 ring-[var(--accent-teal)] ring-inset" : ""}`}
                data-testid={d ? `cal-day-${d}` : undefined}
              >
                {d && (
                  <>
                    <div className={`text-[12px] font-mono ticker mb-1 ${isToday ? "text-[var(--accent-teal)] font-semibold" : "text-ink"}`}>
                      {String(d).padStart(2, "0")}
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => openPatient?.(e.patient)}
                          className="text-left text-[10.5px] truncate px-1.5 py-1 rounded-md bg-paper-rail hover:bg-paper-rule"
                          style={{ borderLeft: `3px solid ${PROVIDER_COLORS[e.provider] || "#8A8A85"}` }}
                          data-testid={`cal-event-${e.id}`}
                        >
                          <span className="font-mono text-ink-muted">
                            {new Date(e.when_iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>{" "}
                          <span className="text-ink">
                            {e.patient ? `${e.patient.first_name} ${e.patient.last_name}` : "—"}
                          </span>
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-ink-muted">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <section className="mt-6 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow">
        <h2 className="font-display text-[22px] tracking-[-0.01em] mb-4">Upcoming</h2>
        <div className="divide-y divide-paper-rule/70">
          {events.slice(0, 8).map((e) => (
            <button
              key={e.id}
              onClick={() => openPatient?.(e.patient)}
              className="w-full flex items-center gap-4 py-3 text-left hover:bg-paper-rail -mx-3 px-3 rounded-md transition-colors"
            >
              <span
                className="w-1.5 h-10 rounded-full"
                style={{ background: PROVIDER_COLORS[e.provider] || "#8A8A85" }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-display text-[16px] leading-tight">
                  {e.patient ? `${e.patient.first_name} ${e.patient.last_name}` : "—"}
                </div>
                <div className="text-[11.5px] text-ink-muted">
                  {e.patient?.concern || ""}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[12px] ticker">
                  {new Date(e.when_iso).toLocaleString()}
                </div>
                <div className="label-micro mt-0.5">{e.provider}</div>
              </div>
            </button>
          ))}
          {events.length === 0 && (
            <div className="text-[12.5px] text-ink-muted py-6 text-center">
              No scheduled calls yet. Schedule from the Call Queue.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

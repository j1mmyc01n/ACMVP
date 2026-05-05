import { useEffect, useState } from "react";
import { CloudSun, Newspaper, Bell, BrainCircuit, RefreshCw, Phone, Inbox, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

const KIND_ICON = {
  overdue: AlertCircle,
  queue: Phone,
  intake: Inbox,
};
const KIND_ACCENT = {
  overdue: { bg: "#fef2f2", c: "#dc2626" },
  queue: { bg: "#fff7ed", c: "#f97316" },
  intake: { bg: "#eff6ff", c: "#2563eb" },
};

export default function CarePulsePanel({ locationId, locationName }) {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const out = await api.carePulse(locationId);
      setData(out);
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  if (!data) return null;
  const w = data.weather;

  return (
    <section
      className="bg-white border border-paper-rule rounded-[18px] p-6 card-shadow mb-6 animate-fade-up relative overflow-hidden"
      data-testid="care-pulse"
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(120% 80% at 100% 0%, #d97706 0%, transparent 60%)" }}
      />
      <div className="relative flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#fef3c7] text-[#a16207] flex items-center justify-center">
            <BrainCircuit size={18} strokeWidth={1.7} />
          </div>
          <div>
            <div className="label-micro flex items-center gap-1.5 text-[#a16207]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Care Pulse · Claude
            </div>
            <h2 className="font-display text-[22px] tracking-[-0.01em] mt-0.5">
              Watching {locationName || "your locations"}
            </h2>
            <div className="text-[12px] text-ink-muted">Reminders, weather and pressing matters — refreshed every minute.</div>
          </div>
        </div>
        <button
          onClick={refresh}
          className="icon-btn"
          aria-label="Refresh"
          data-testid="care-pulse-refresh"
        >
          <RefreshCw size={13} strokeWidth={1.8} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reminders */}
        <div className="md:col-span-2 border border-paper-rule rounded-[14px] p-4">
          <div className="label-micro flex items-center gap-1.5 mb-2">
            <Bell size={11} /> Don&apos;t forget
          </div>
          {data.reminders.length === 0 ? (
            <div className="text-[12.5px] text-ink-muted py-6 text-center">
              All caught up. Nothing urgent in the last sweep.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-paper-rule/60">
              {data.reminders.map((r, i) => {
                const Icon = KIND_ICON[r.kind] || Bell;
                const A = KIND_ACCENT[r.kind] || { bg: "#f5f5f2", c: "#525252" };
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5"
                    data-testid={`pulse-reminder-${r.kind}`}
                  >
                    <div
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                      style={{ background: A.bg, color: A.c }}
                    >
                      <Icon size={12} strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-ink">{r.title}</div>
                      <div className="text-[11.5px] text-ink-muted leading-snug">{r.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weather + News */}
        <div className="flex flex-col gap-4">
          <div className="border border-paper-rule rounded-[14px] p-4 bg-paper-rail/40">
            <div className="label-micro flex items-center gap-1.5 mb-2">
              <CloudSun size={11} /> Local conditions
            </div>
            {w ? (
              <div className="flex items-center gap-3">
                <div className="font-display text-[28px] tracking-[-0.02em] ticker">
                  {Math.round(w.temp_c)}°
                </div>
                <div className="text-[12px]">
                  <div className="font-medium">{w.description}</div>
                  <div className="text-ink-muted">Wind {Math.round(w.wind_kph || 0)} km/h</div>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-ink-muted">Weather unavailable</div>
            )}
          </div>
          <div className="border border-paper-rule rounded-[14px] p-4">
            <div className="label-micro flex items-center gap-1.5 mb-2">
              <Newspaper size={11} /> Pressing matters
            </div>
            <div className="flex flex-col gap-2.5">
              {(data.news || []).slice(0, 2).map((n, i) => (
                <div key={i} className="text-[12px]" data-testid={`pulse-news-${i}`}>
                  <div className="font-medium text-ink leading-snug">{n.title}</div>
                  <div className="text-ink-muted leading-snug mt-0.5 line-clamp-2">{n.summary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

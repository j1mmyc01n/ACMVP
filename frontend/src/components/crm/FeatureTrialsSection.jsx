import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

function Toggle({ on, onChange, testId }) {
  return (
    <button
      onClick={onChange}
      data-active={on}
      data-testid={testId}
      className="w-10 h-6 rounded-full bg-paper-rail border border-paper-rule data-[active=true]:bg-ink data-[active=true]:border-ink relative transition-colors"
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white border border-paper-rule transition-transform"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function FeatureTrialsSection() {
  const [flags, setFlags] = useState({});

  const refresh = async () => {
    try {
      const r = await api.getFlags();
      setFlags(r.flags || {});
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggle = async (key, on) => {
    try {
      const r = await api.setFlag(key, on);
      setFlags(r.flags || {});
      toast.success(on ? "Trial enabled" : "Trial disabled");
    } catch {
      toast.error("Could not save");
    }
  };

  const entries = Object.entries(flags);

  return (
    <section
      className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5"
      data-testid="trials-section"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-[10px] bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center">
          <FlaskConical size={16} strokeWidth={1.8} />
        </div>
        <div>
          <div className="label-micro">Feature trials</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mt-0.5">
            Grant access to new features
          </h2>
          <div className="text-[12px] text-ink-muted mt-0.5">
            Sysadmin-only switches. Toggle a trial on for the whole org — staff see it the next time they reload.
          </div>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-paper-rule/60">
        {entries.map(([key, f]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 py-3"
            data-testid={`flag-row-${key}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-[13.5px] font-medium">{f.label}</div>
                {f.trial && (
                  <span className="chip" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                    <Sparkles size={9} />
                    Trial
                  </span>
                )}
              </div>
              {f.description && (
                <div className="text-[11.5px] text-ink-muted leading-snug mt-0.5">{f.description}</div>
              )}
            </div>
            <Toggle on={!!f.enabled} onChange={() => toggle(key, !f.enabled)} testId={`flag-${key}`} />
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-[12.5px] text-ink-muted py-6 text-center">No feature flags loaded.</div>
        )}
      </div>
    </section>
  );
}

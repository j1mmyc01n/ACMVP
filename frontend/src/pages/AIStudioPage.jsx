import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useShell } from "@/components/crm/AppShell";
import { Sparkles, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

export default function AIStudioPage() {
  const { refreshKey, openPatient } = useShell();
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.listPatients(), api.insights()]).then(([p, i]) => {
      setPatients(p);
      setInsights(i);
    });
  }, [refreshKey]);

  const run = async (p) => {
    setSelected(p);
    setLoading(true);
    setPrediction("");
    try {
      const r = await api.predict(p.id);
      setPrediction(r.prediction);
    } catch {
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setInsightsLoading(true);
    const i = await api.insights(true);
    setInsights(i);
    setInsightsLoading(false);
    toast.success("Insights refreshed");
  };

  return (
    <div className="p-8 pb-14" data-testid="ai-studio">
      <div className="mb-6">
        <div className="label-micro mb-2 flex items-center gap-1.5">
          <Sparkles size={10} /> AI studio
        </div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em]">
          Pattern intelligence
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          Powered by Claude Sonnet 4.5 via Emergent Universal Key.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 xl:col-span-5 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[22px] tracking-[-0.01em]">Global insights</h2>
            <button onClick={refresh} className="icon-btn" data-testid="ai-insights-refresh" aria-label="Refresh">
              <RefreshCw size={13} strokeWidth={1.8} className={insightsLoading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="divide-y divide-paper-rule/70">
            {(insights?.groups || []).flatMap((g) =>
              (g.items || []).map((it, i) => (
                <div key={`${g.label}-${i}`} className="py-3">
                  <div className="label-micro mb-1">{g.label}</div>
                  <div className="text-[13px] leading-snug">{it.text}</div>
                  <div className="text-[10.5px] font-mono text-ink-muted mt-1">{it.delta}</div>
                </div>
              )),
            )}
            {!insights && <div className="text-[12.5px] text-ink-muted py-6">Loading…</div>}
          </div>
        </section>

        <section className="col-span-12 xl:col-span-7 bg-white border border-paper-rule rounded-[16px] p-6 card-shadow">
          <h2 className="font-display text-[22px] tracking-[-0.01em] mb-3">Per-patient prediction</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {patients.slice(0, 12).map((p) => (
              <button
                key={p.id}
                onClick={() => run(p)}
                className={`text-left border rounded-[12px] px-3 py-2 flex items-center gap-2 transition-colors ${
                  selected?.id === p.id
                    ? "border-ink bg-paper-rail"
                    : "border-paper-rule hover:border-ink"
                }`}
                data-testid={`ai-patient-${p.id}`}
              >
                <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                <div>
                  <div className="text-[12.5px] font-medium leading-tight">
                    {p.first_name} {p.last_name}
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted ticker">
                    Score {p.escalation_score}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="border border-paper-rule rounded-[12px] p-5 bg-paper-rail">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display text-[17px]">
                  {selected.first_name} {selected.last_name}
                </div>
                <button
                  onClick={() => openPatient(selected)}
                  className="text-[11.5px] text-ink-muted hover:text-ink underline"
                >
                  Open profile
                </button>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                  <Send size={12} strokeWidth={1.8} className="animate-pulse" />
                  Running Claude Sonnet 4.5…
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{prediction}</pre>
              )}
            </div>
          ) : (
            <div className="text-[12.5px] text-ink-muted py-6 text-center border border-dashed border-paper-rule rounded-[12px]">
              Pick a patient to run a prediction.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

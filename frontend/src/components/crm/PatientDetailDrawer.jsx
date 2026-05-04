import { useEffect, useState } from "react";
import { X, Phone, Sparkles, FileText, Paperclip } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function PatientDetailDrawer({ patient, onClose, onChanged }) {
  const [notes, setNotes] = useState([]);
  const [docs, setDocs] = useState([]);
  const [calls, setCalls] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (!patient) return;
    (async () => {
      const [n, d, c] = await Promise.all([
        api.listNotes(patient.id),
        api.listDocs(patient.id),
        api.patientCalls(patient.id),
      ]);
      setNotes(n);
      setDocs(d);
      setCalls(c);
      setPrediction(null);
    })();
  }, [patient]);

  if (!patient) return null;

  const pct = Math.round((patient.ai_probability || 0) * 100);

  const runPredict = async () => {
    setPredLoading(true);
    try {
      const r = await api.predict(patient.id);
      setPrediction(r.prediction);
    } catch (e) {
      toast.error("Prediction failed");
    } finally {
      setPredLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const n = await api.addNote(patient.id, newNote);
    setNotes([n, ...notes]);
    setNewNote("");
    toast.success("Note added");
  };

  const call = async () => {
    await api.twilioCall(patient.id);
    toast.success(`Dialing ${patient.first_name} (Twilio mock)`);
    const c = await api.patientCalls(patient.id);
    setCalls(c);
    onChanged?.();
  };

  return (
    <div className="fixed inset-0 z-50" data-testid="detail-drawer">
      <div className="absolute inset-0 bg-ink/25" onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[620px] bg-paper border-l border-paper-rule shadow-2xl overflow-y-auto scrollbar-thin animate-fade-up">
        <div className="sticky top-0 bg-paper z-10 px-8 py-6 border-b border-paper-rule flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={patient.avatar_url}
              alt=""
              className="w-14 h-14 object-cover border border-paper-rule"
            />
            <div>
              <div className="label-micro mb-1">
                {patient.patient_id} · {patient.crn}
              </div>
              <h2 className="font-heading text-[32px] leading-none tracking-tight">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="text-[12px] text-ink-muted mt-1">{patient.concern || "—"}</div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" data-testid="detail-close" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 border-b border-paper-rule">
          <div className="p-5 border-r border-paper-rule">
            <div className="label-micro mb-2">AI probability</div>
            <div className="font-mono text-[28px] ticker">{pct}%</div>
          </div>
          <div className="p-5 border-r border-paper-rule">
            <div className="label-micro mb-2">Stage</div>
            <div className="font-heading text-[22px] leading-none capitalize">{patient.stage}</div>
          </div>
          <div className="p-5 flex items-center justify-center">
            <button
              onClick={call}
              className="btn-primary flex items-center gap-2"
              data-testid="detail-call-btn"
            >
              <Phone size={12} />
              Call now
            </button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="px-8 py-6">
          <TabsList className="bg-transparent border-b border-paper-rule rounded-none w-full justify-start gap-6 p-0 h-auto">
            {[
              { v: "overview", l: "Overview" },
              { v: "notes", l: "Clinical Notes" },
              { v: "docs", l: "Documents" },
              { v: "calls", l: "Call History" },
              { v: "ai", l: "AI Insights" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                data-testid={`tab-${t.v}`}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-ink data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 pb-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted data-[state=active]:text-ink"
              >
                {t.l}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
              {[
                ["Email", patient.email],
                ["Phone", patient.phone],
                ["DOB", patient.dob],
                ["Insurance", patient.insurance],
                ["Source", patient.source],
                ["Preferred", `${patient.preferred_day || "—"} · ${patient.preferred_time || "—"}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="label-micro mb-1">{k}</div>
                  <div className="font-body">{v || "—"}</div>
                </div>
              ))}
            </div>
            {patient.notes && (
              <div className="mt-6 border-t border-paper-rule pt-6">
                <div className="label-micro mb-2">Intake notes</div>
                <div className="text-[13px] font-body leading-relaxed">{patient.notes}</div>
              </div>
            )}
            {patient.custom_data && Object.keys(patient.custom_data).length > 0 && (
              <div className="mt-6 border-t border-paper-rule pt-6">
                <div className="label-micro mb-3">Custom data</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
                  {Object.entries(patient.custom_data).map(([k, v]) => (
                    <div key={k}>
                      <div className="label-micro mb-1">{k}</div>
                      <div className="font-body">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="pt-6">
            <div className="flex gap-2 mb-4">
              <textarea
                rows={2}
                placeholder="New clinical note…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 border border-paper-rule bg-white px-3 py-2 text-[13px] font-body focus:outline-none focus:border-ink"
                data-testid="new-note-input"
              />
              <button className="btn-primary" onClick={addNote} data-testid="add-note-btn">
                Add
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {notes.map((n) => (
                <div key={n.id} className="border-l-2 border-brand pl-4 py-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="font-heading text-[16px]">{n.author}</div>
                    <div className="label-micro">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-[13px] font-body text-ink leading-relaxed">{n.body}</div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-[12px] text-ink-muted font-body">No notes yet.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="docs" className="pt-6">
            <div className="flex flex-col gap-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 border border-paper-rule bg-white p-3">
                  <Paperclip size={14} strokeWidth={1.6} className="text-ink-muted" />
                  <div className="flex-1 text-[13px]">{d.title}</div>
                  <div className="label-micro">{d.kind}</div>
                </div>
              ))}
              {docs.length === 0 && (
                <div className="text-[12px] text-ink-muted font-body">No documents attached.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calls" className="pt-6">
            <div className="flex flex-col gap-2">
              {calls.map((c) => (
                <div key={c.id} className="flex items-center gap-3 border border-paper-rule bg-white p-3">
                  <Phone size={14} strokeWidth={1.6} className="text-brand" />
                  <div className="flex-1">
                    <div className="text-[13px]">{c.to_number}</div>
                    <div className="label-micro">{c.sid}</div>
                  </div>
                  <div className="font-mono text-[11px] text-ink-muted ticker">
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {calls.length === 0 && (
                <div className="text-[12px] text-ink-muted font-body">No calls logged yet.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="label-micro flex items-center gap-1.5">
                <Sparkles size={10} /> Claude Sonnet 4.5 prediction
              </div>
              <button
                className="btn-ghost"
                onClick={runPredict}
                disabled={predLoading}
                data-testid="predict-btn"
              >
                {predLoading ? "Analyzing…" : prediction ? "Re-run" : "Run prediction"}
              </button>
            </div>
            {prediction ? (
              <pre className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-ink bg-white border border-paper-rule p-5">
                {prediction}
              </pre>
            ) : (
              <div className="text-[12px] text-ink-muted font-body border border-dashed border-paper-rule p-6">
                Run a prediction to get engagement likelihood, patterns, best call window, and the
                recommended next action.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}

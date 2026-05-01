import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase/supabase";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(iso) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function Badge({ status }) {
  const map = {
    active:   "bg-green-100 text-green-700",
    urgent:   "bg-red-100 text-red-700",
    overdue:  "bg-orange-100 text-orange-700",
    pending:  "bg-yellow-100 text-yellow-700",
    resolved: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function Overview({ urgent, overdue, pending }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-red-600">{urgent}</div>
        <div className="text-xs text-red-500 mt-0.5">Urgent</div>
      </div>
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-orange-600">{overdue}</div>
        <div className="text-xs text-orange-500 mt-0.5">Overdue</div>
      </div>
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-yellow-600">{pending}</div>
        <div className="text-xs text-yellow-500 mt-0.5">Pending</div>
      </div>
    </div>
  );
}

function CheckIns({ checkins: init, onResolve }) {
  const [tab, setTab] = useState("urgent");
  const views = {
    urgent:  init.filter(c => c.status === "urgent"),
    overdue: init.filter(c => c.status === "overdue"),
    all:     init.filter(c => !c.resolved),
  };
  const current = views[tab];
  const moodColor = { Critical: "text-red-600", Low: "text-orange-500", Moderate: "text-yellow-600", Good: "text-green-600" };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {[["urgent","🚨 Urgent"],["overdue","⏰ Overdue"],["all","📋 All"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            {label} <span className="ml-1 text-xs">{views[id].length}</span>
          </button>
        ))}
      </div>
      {current.map(c => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-gray-800">{c.name}</div>
              <div className="text-xs text-gray-400 font-mono">{c.crn}</div>
            </div>
            <Badge status={c.status} />
          </div>
          <div className="mt-2 text-sm">
            Mood: <span className={`font-semibold ${moodColor[c.mood] ?? "text-gray-700"}`}>{c.mood}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{fmt(c.ts || c.created_at)}</div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => alert(`Contacting ${c.name}`)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-1.5 rounded-lg">
              📞 Contact
            </button>
            <button onClick={() => onResolve(c.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg">
              ✅ Resolve
            </button>
          </div>
        </div>
      ))}
      {current.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-sm">No {tab} check-ins</div>
        </div>
      )}
    </div>
  );
}

function Clients({ clients, loading }) {
  const [search, setSearch] = useState("");
  const [office, setOffice] = useState("all");
  const offices = ["all", ...new Set(clients.map(c => c.care_centre || c.office || "Unknown"))];
  const filtered = clients.filter(c =>
    (office === "all" || (c.care_centre || c.office) === office) &&
    ((c.crn || "").toLowerCase().includes(search.toLowerCase()) ||
     (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
     (c.postcode || "").includes(search))
  );
  return (
    <div className="space-y-3">
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        placeholder="Search CRN, name or postcode…" value={search} onChange={e => setSearch(e.target.value)} />
      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        value={office} onChange={e => setOffice(e.target.value)}>
        {offices.map(o => <option key={o}>{o}</option>)}
      </select>
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">CRN</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">PC</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filtered.map(c => (
                <tr key={c.crn} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{c.crn}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{c.name}</td>
                  <td className="px-3 py-2 text-gray-500">{c.postcode || "—"}</td>
                  <td className="px-3 py-2"><Badge status={c.status || "active"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No clients found.</p>}
        </div>
      )}
    </div>
  );
}

function Offices({ centres, loading, onToggle }) {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
      ) : centres.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No care centres found.</div>
      ) : centres.map(o => (
        <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-gray-800">{o.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{o.address}</div>
              <div className="text-xs text-gray-500">📞 {o.phone || "—"}</div>
              <div className="text-xs text-gray-400 mt-1">👥 {o.clients_count ?? o.clients ?? 0} clients</div>
            </div>
            <button onClick={() => onToggle(o.id, !o.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${o.active ? "bg-blue-600" : "bg-gray-200"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${o.active ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "checkins", label: "Check-Ins", icon: "📋" },
  { id: "clients",  label: "Clients",  icon: "👥" },
  { id: "offices",  label: "Offices",  icon: "🏢" },
];

export function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [checkins, setCheckins] = useState([]);
  const [clients, setClients] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ciRes, ptRes, ctRes] = await Promise.all([
        supabase.from("check_ins_1740395000").select("id,crn,name,mood_score,status,resolved,created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("clients_1777020684735").select("crn,name,postcode,care_centre,status").order("created_at", { ascending: false }).limit(100),
        supabase.from("care_centres_1777090000").select("*").order("name"),
      ]);
      setCheckins((ciRes.data || []).map(c => ({
        ...c,
        mood: c.mood_score <= 3 ? "Critical" : c.mood_score <= 5 ? "Low" : c.mood_score <= 7 ? "Moderate" : "Good",
        ts: c.created_at,
        status: c.status || (c.mood_score <= 3 ? "urgent" : "pending"),
        resolved: !!c.resolved,
      })));
      setClients(ptRes.data || []);
      setCentres(ctRes.data || []);
    } catch (err) {
      console.error("AdminDashboard load error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleResolve = async (id) => {
    await supabase.from("check_ins_1740395000").update({ resolved: true, status: "resolved" }).eq("id", id);
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, resolved: true, status: "resolved" } : c));
  };

  const handleToggleCentre = async (id, active) => {
    await supabase.from("care_centres_1777090000").update({ active }).eq("id", id);
    setCentres(prev => prev.map(o => o.id === id ? { ...o, active } : o));
  };

  const urgent  = checkins.filter(c => c.status === "urgent").length;
  const overdue = checkins.filter(c => c.status === "overdue").length;
  const pending = checkins.filter(c => !c.resolved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500">Live admin control</p>
      </div>
      <div className="bg-white border-b border-gray-100 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {tab === "overview" && <Overview urgent={urgent} overdue={overdue} pending={pending} />}
        {tab === "checkins" && <CheckIns checkins={checkins} onResolve={handleResolve} />}
        {tab === "clients"  && <Clients clients={clients} loading={loading} />}
        {tab === "offices"  && <Offices centres={centres} loading={loading} onToggle={handleToggleCentre} />}
      </div>
    </div>
  );
}

export { default as ModernTriageDashboard } from './admin/ModernTriageDashboard';

// ─── Re-exports from admin/ subdirectory ─────────────────────────────
export { default as PatientDirectoryGrid } from './admin/PatientDirectoryGrid';
export { default as CRMPage }             from './admin/CRMPage';
export { default as InvoicingPage }        from './admin/InvoicingPage';
export { default as CrisisPage }           from './admin/ComprehensiveCrisisManagement'; // Updated to comprehensive view
export { default as ReportsPage }          from './admin/ReportsPage';
export { default as SponsorLedger }        from './admin/SponsorLedger';
export { default as MultiCentreCheckin }   from './admin/MultiCentreCheckin';
export { BulkOffboardingPage, FeedbackDashPage } from './admin/AdditionalPages';
export { default as LocationIntegrationsPage } from './admin/LocationIntegrationsPage';

// Import for aliasing
import ComprehensiveCrisisManagement from './admin/ComprehensiveCrisisManagement';

// Export comprehensive crisis as replacement for crisis analytics and heatmap
export { ComprehensiveCrisisManagement };
export const CrisisAnalyticsPage = ComprehensiveCrisisManagement;
export const HeatMapPage = ComprehensiveCrisisManagement;

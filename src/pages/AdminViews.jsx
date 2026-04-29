import { useState } from "react";

const MOCK_CLIENTS = [
  { crn: "CRN12345", name: "John Doe",       postcode: "2000", office: "Sydney CBD",   status: "active",  lastCheckin: "2025-05-28T14:00:00Z" },
  { crn: "CRN67890", name: "Jane Smith",      postcode: "2010", office: "Sydney CBD",   status: "active",  lastCheckin: "2025-05-27T09:30:00Z" },
  { crn: "CRN54321", name: "Michael Johnson", postcode: "2060", office: "North Sydney", status: "urgent",  lastCheckin: "2025-05-28T08:00:00Z" },
  { crn: "CRN09876", name: "Sarah Williams",  postcode: "2011", office: "North Sydney", status: "overdue", lastCheckin: "2025-05-26T16:00:00Z" },
  { crn: "CRN13579", name: "David Brown",     postcode: "2000", office: "Parramatta",   status: "overdue", lastCheckin: "2025-05-20T10:00:00Z" },
  { crn: "CRN24680", name: "Emma Wilson",     postcode: "2150", office: "Parramatta",   status: "active",  lastCheckin: "2025-05-28T11:00:00Z" },
];

const MOCK_CHECKINS = [
  { id: "c1", crn: "CRN54321", name: "Michael Johnson", mood: "Critical", ts: "2025-05-28T14:02:00Z", status: "urgent",  resolved: false },
  { id: "c2", crn: "CRN12345", name: "John Doe",        mood: "Low",      ts: "2025-05-28T12:30:00Z", status: "pending", resolved: false },
  { id: "c3", crn: "CRN67890", name: "Jane Smith",      mood: "Moderate", ts: "2025-05-28T11:00:00Z", status: "pending", resolved: false },
  { id: "c4", crn: "CRN24680", name: "Emma Wilson",     mood: "Good",     ts: "2025-05-28T09:00:00Z", status: "active",  resolved: true  },
  { id: "c5", crn: "CRN09876", name: "Sarah Williams",  mood: "Low",      ts: "2025-05-27T16:00:00Z", status: "overdue", resolved: false },
];

const MOCK_OFFICES = [
  { id: "o1", name: "Sydney CBD",   address: "Level 5, 100 George St NSW 2000",      phone: "(02) 9000 1111", active: true,  clients: 12 },
  { id: "o2", name: "North Sydney", address: "Suite 3, 88 Walker St NSW 2060",        phone: "(02) 9000 2222", active: true,  clients: 8  },
  { id: "o3", name: "Parramatta",   address: "Level 2, 150 Church St NSW 2150",       phone: "(02) 9000 3333", active: true,  clients: 6  },
  { id: "o4", name: "Penrith",      address: "10 Lawson St, Penrith NSW 2750",        phone: "(02) 9000 4444", active: false, clients: 0  },
];

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

function Overview({ checkins }) {
  const urgent  = checkins.filter(c => c.status === "urgent").length;
  const overdue = checkins.filter(c => c.status === "overdue").length;
  const pending = checkins.filter(c => !c.resolved).length;
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

function CheckIns({ checkins: init }) {
  const [checkins, setCheckins] = useState(init);
  const [tab, setTab] = useState("urgent");
  const views = {
    urgent:  checkins.filter(c => c.status === "urgent"),
    overdue: checkins.filter(c => c.status === "overdue"),
    all:     checkins.filter(c => !c.resolved),
  };
  const current = views[tab];
  function resolve(id) {
    setCheckins(p => p.map(c => c.id === id ? { ...c, resolved: true, status: "resolved" } : c));
  }
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
          <div className="text-xs text-gray-400 mt-0.5">{fmt(c.ts)}</div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => alert(`Contacting ${c.name}`)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-1.5 rounded-lg">
              📞 Contact
            </button>
            <button onClick={() => resolve(c.id)}
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

function Clients() {
  const [search, setSearch] = useState("");
  const [office, setOffice] = useState("all");
  const offices = ["all", ...new Set(MOCK_CLIENTS.map(c => c.office))];
  const filtered = MOCK_CLIENTS.filter(c =>
    (office === "all" || c.office === office) &&
    (c.crn.toLowerCase().includes(search.toLowerCase()) ||
     c.name.toLowerCase().includes(search.toLowerCase()) ||
     c.postcode.includes(search))
  );
  return (
    <div className="space-y-3">
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        placeholder="Search CRN, name or postcode…" value={search} onChange={e => setSearch(e.target.value)} />
      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        value={office} onChange={e => setOffice(e.target.value)}>
        {offices.map(o => <option key={o}>{o}</option>)}
      </select>
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
                <td className="px-3 py-2 text-gray-500">{c.postcode}</td>
                <td className="px-3 py-2"><Badge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No clients found.</p>}
      </div>
    </div>
  );
}

function Offices() {
  const [offices, setOffices] = useState(MOCK_OFFICES);
  function toggle(id) {
    setOffices(p => p.map(o => o.id === id ? { ...o, active: !o.active } : o));
  }
  return (
    <div className="space-y-3">
      {offices.map(o => (
        <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-gray-800">{o.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{o.address}</div>
              <div className="text-xs text-gray-500">📞 {o.phone}</div>
              <div className="text-xs text-gray-400 mt-1">👥 {o.clients} clients</div>
            </div>
            <button onClick={() => toggle(o.id)}
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
        {tab === "overview" && <Overview checkins={MOCK_CHECKINS} />}
        {tab === "checkins" && <CheckIns checkins={MOCK_CHECKINS} />}
        {tab === "clients"  && <Clients />}
        {tab === "offices"  && <Offices />}
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

// Import for aliasing
import ComprehensiveCrisisManagement from './admin/ComprehensiveCrisisManagement';

// Export comprehensive crisis as replacement for crisis analytics and heatmap
export { ComprehensiveCrisisManagement };
export const CrisisAnalyticsPage = ComprehensiveCrisisManagement;
export const HeatMapPage = ComprehensiveCrisisManagement;

import { useState, useEffect } from "react";

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; }
    catch { return init; }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(val)), [key, val]);
  return [val, setVal];
}

function fmt(iso) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const SEED_USERS = [
  { id: "u1", name: "Alice Nguyen",  role: "admin",    email: "alice@acutecare.com.au", active: true,  lastLogin: "2025-05-28T08:10:00Z" },
  { id: "u2", name: "Ben Hartley",   role: "admin",    email: "ben@acutecare.com.au",   active: true,  lastLogin: "2025-05-27T14:32:00Z" },
  { id: "u3", name: "Cass Morgan",   role: "staff",    email: "cass@acutecare.com.au",  active: true,  lastLogin: "2025-05-28T09:00:00Z" },
  { id: "u4", name: "Dan Wu",        role: "staff",    email: "dan@acutecare.com.au",   active: false, lastLogin: "2025-04-10T11:00:00Z" },
  { id: "u5", name: "Eva Singh",     role: "sysadmin", email: "eva@acutecare.com.au",   active: true,  lastLogin: "2025-05-28T10:45:00Z" },
];

const SEED_INTEGRATIONS = [
  { id: "i1", name: "Epic EHR",    protocol: "FHIR API", status: "active",   lastSync: "2025-05-28T14:30:00Z" },
  { id: "i2", name: "Cerner",      protocol: "HL7",      status: "active",   lastSync: "2025-05-28T12:15:00Z" },
  { id: "i3", name: "SMS Gateway", protocol: "REST",     status: "active",   lastSync: "2025-05-28T13:00:00Z" },
  { id: "i4", name: "Pathways DB", protocol: "JDBC",     status: "degraded", lastSync: "2025-05-27T18:00:00Z" },
  { id: "i5", name: "MBS Billing", protocol: "SOAP",     status: "active",   lastSync: "2025-05-28T11:00:00Z" },
  { id: "i6", name: "NDIS Portal", protocol: "OAuth2",   status: "inactive", lastSync: "2025-05-20T09:00:00Z" },
];

const SEED_LOGS = [
  { id: "l1", ts: "2025-05-28T14:17:00Z", level: "info",    source: "Auth",   msg: "User login successful",       detail: "User: eva@acutecare.com.au" },
  { id: "l2", ts: "2025-05-28T14:12:00Z", level: "error",   source: "DB",     msg: "Database connection timeout", detail: "Failed to connect after 30s" },
  { id: "l3", ts: "2025-05-28T14:07:00Z", level: "warning", source: "API",    msg: "Rate limit approaching",      detail: "Usage at 85% of limit" },
  { id: "l4", ts: "2025-05-28T14:02:00Z", level: "info",    source: "System", msg: "Scheduled backup completed",  detail: "3.2 GB archived" },
  { id: "l5", ts: "2025-05-28T13:55:00Z", level: "error",   source: "Auth",   msg: "Failed login attempt",        detail: "IP: 192.168.1.45 — 3 attempts" },
  { id: "l6", ts: "2025-05-28T13:44:00Z", level: "info",    source: "EHR",    msg: "Epic sync completed",         detail: "47 records updated" },
  { id: "l7", ts: "2025-05-28T13:30:00Z", level: "warning", source: "DB",     msg: "Slow query detected",         detail: "Query took 4.2s" },
  { id: "l8", ts: "2025-05-28T13:20:00Z", level: "info",    source: "System", msg: "Module config updated",       detail: "Admin: alice@acutecare.com.au" },
];

const SEED_MODULES = [
  { id: "m1", name: "Client Check-In",    enabled: true  },
  { id: "m2", name: "Resources",          enabled: true  },
  { id: "m3", name: "Admin Panel",        enabled: true  },
  { id: "m4", name: "Integrations",       enabled: true  },
  { id: "m5", name: "Client Management",  enabled: true  },
  { id: "m6", name: "Office Management",  enabled: true  },
  { id: "m7", name: "Reports",            enabled: false },
  { id: "m8", name: "Testing & QA",       enabled: true  },
];

function Badge({ status }) {
  const map = {
    active:   "bg-green-100 text-green-700",
    degraded: "bg-yellow-100 text-yellow-700",
    inactive: "bg-gray-100 text-gray-500",
    info:     "bg-blue-100 text-blue-700",
    warning:  "bg-yellow-100 text-yellow-700",
    error:    "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function Overview({ users, integrations, logs }) {
  const activeUsers  = users.filter(u => u.active).length;
  const activeConns  = integrations.filter(i => i.status === "active").length;
  const degraded     = integrations.filter(i => i.status === "degraded").length;
  const errors       = logs.filter(l => l.level === "error").length;
  const ok           = degraded === 0 && errors === 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 flex items-center gap-3 ${ok ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
        <span className="text-2xl">{ok ? "✅" : "⚠️"}</span>
        <div>
          <div className={`font-semibold ${ok ? "text-green-800" : "text-yellow-800"}`}>
            {ok ? "All systems operational" : "Some systems need attention"}
          </div>
          <div className="text-xs text-gray-500">Last checked: {fmt(new Date().toISOString())}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Active Users",        value: activeUsers, icon: "👤", color: "text-blue-600"  },
          { label: "Active Integrations", value: activeConns, icon: "🔗", color: "text-green-600" },
          { label: "Degraded Services",   value: degraded,    icon: "⚠️", color: degraded > 0 ? "text-yellow-600" : "text-gray-400" },
          { label: "Recent Errors",       value: errors,      icon: "🔴", color: errors > 0 ? "text-red-600" : "text-gray-400" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="font-semibold text-gray-800 mb-3">Integration Health</div>
        <div className="space-y-2">
          {integrations.map(i => (
            <div key={i.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{i.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{fmt(i.lastSync)}</span>
                <Badge status={i.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Users({ users, setUsers }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  function toggleActive(id) {
    setUsers(p => p.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }
  function changeRole(id, role) {
    setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
    setEditId(null);
  }
  return (
    <div className="space-y-4">
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.map(u => (
        <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-gray-800">{u.name}</div>
              <div className="text-xs text-gray-400">{u.email}</div>
            </div>
            <Badge status={u.active ? "active" : "inactive"} />
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {editId === u.id ? (
              <>
                {["staff","admin","sysadmin"].map(r => (
                  <button key={r} onClick={() => changeRole(u.id, r)}
                    className={`px-2 py-1 rounded text-xs font-medium border ${u.role === r ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600"}`}>{r}</button>
                ))}
                <button onClick={() => setEditId(null)} className="text-xs text-gray-400">Cancel</button>
              </>
            ) : (
              <>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{u.role}</span>
                <button onClick={() => setEditId(u.id)} className="text-xs text-blue-600 hover:underline">Edit Role</button>
                <button onClick={() => toggleActive(u.id)} className={`text-xs ${u.active ? "text-red-500" : "text-green-600"} hover:underline`}>
                  {u.active ? "Deactivate" : "Activate"}
                </button>
              </>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">Last login: {fmt(u.lastLogin)}</div>
        </div>
      ))}
    </div>
  );
}

function Logs({ logs, setLogs }) {
  const [search, setSearch] = useState("");
  const [level,  setLevel]  = useState("all");
  const [source, setSource] = useState("all");
  const sources = ["all", ...new Set(logs.map(l => l.source))];
  const filtered = logs.filter(l =>
    (level  === "all" || l.level  === level) &&
    (source === "all" || l.source === source) &&
    (l.msg.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase()))
  );
  function exportCSV() {
    const csv = ["Timestamp,Level,Source,Message,Detail",
      ...filtered.map(l => `"${fmt(l.ts)}","${l.level}","${l.source}","${l.msg}","${l.detail}"`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `logs-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }
  const lc = { info: "text-blue-600", warning: "text-yellow-600", error: "text-red-600" };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={exportCSV} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium">Export CSV</button>
        <button onClick={() => setLogs([])} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium">Clear</button>
      </div>
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="flex gap-2">
        <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" value={level} onChange={e => setLevel(e.target.value)}>
          {["all","info","warning","error"].map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" value={source} onChange={e => setSource(e.target.value)}>
          {sources.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-400 self-center">{filtered.length} entries</span>
      </div>
      {filtered.map(l => (
        <div key={l.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase ${lc[l.level]}`}>{l.level}</span>
            <span className="text-xs text-gray-400">{fmt(l.ts)}</span>
          </div>
          <div className="font-medium text-sm text-gray-800 mt-1">{l.msg}</div>
          <div className="text-xs text-gray-500">{l.source} — {l.detail}</div>
        </div>
      ))}
      {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No entries match.</p>}
    </div>
  );
}

function Modules({ modules, setModules }) {
  return (
    <div className="space-y-2">
      {modules.map(m => (
        <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center justify-between">
          <span className="font-medium text-sm text-gray-800">{m.name}</span>
          <button onClick={() => setModules(p => p.map(x => x.id === m.id ? { ...x, enabled: !x.enabled } : x))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.enabled ? "bg-blue-600" : "bg-gray-200"}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${m.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview",    icon: "🏠" },
  { id: "users",    label: "Users",       icon: "👥" },
  { id: "logs",     label: "Logs",        icon: "📋" },
  { id: "modules",  label: "Modules",     icon: "🧩" },
];

export function SysAdminDashboard() {
  const [tab,     setTab]     = useState("overview");
  const [users,   setUsers]   = useLocalStorage("ac_users",   SEED_USERS);
  const [intgs,   setIntgs]   = useLocalStorage("ac_intgs",   SEED_INTEGRATIONS);
  const [logs,    setLogs]    = useLocalStorage("ac_logs",    SEED_LOGS);
  const [modules, setModules] = useLocalStorage("ac_modules", SEED_MODULES);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">SysAdmin Dashboard</h1>
        <p className="text-sm text-gray-500">Live system control</p>
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
        {tab === "overview" && <Overview users={users} integrations={intgs} logs={logs} />}
        {tab === "users"    && <Users users={users} setUsers={setUsers} />}
        {tab === "logs"     && <Logs  logs={logs}   setLogs={setLogs}   />}
        {tab === "modules"  && <Modules modules={modules} setModules={setModules} />}
      </div>
    </div>
  );
}

export default SysAdminDashboard;

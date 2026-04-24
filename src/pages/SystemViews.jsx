import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { Gauge, Card, Tabs, DiamondLogo, StatusBadge, Input, Button, Toggle, Field, Select } from '../components/UI';
import { supabase } from '../supabase/supabase';

const { FiPlus, FiSearch, FiArrowLeft, FiDownload, FiCloud, FiActivity, FiTerminal, FiTrendingUp } = FiIcons;

const OFFICES = [
  { name: "Camperdown Mental Health Centre", suburb: "Camperdown", address: "96 Carillon Ave, Newtown NSW 2042", phone: "(02) 9515 9000", prefix: "CAM", color: "#E8F4FD" },
  { name: "Northern Acute Care Service", suburb: "St Leonards", address: "100 Pacific Hwy, St Leonards NSW 2065", phone: "(02) 9926 7111", prefix: "NTH", color: "#F0FDF4" },
  { name: "Marrickville Mental Health", suburb: "Marrickville", address: "123 Illawarra Rd, Marrickville NSW 2204", phone: "(02) 9767 4000", prefix: "MRK", color: "#FDF4FF" },
  { name: "Redfern Community Mental Health", suburb: "Redfern", address: "45 Hugo St, Redfern NSW 2016", phone: "(02) 9318 7400", prefix: "RDF", color: "#FFF7ED" },
];

const INTEGRATIONS = [
  { name: "Epic EHR Integration", type: "FHIR API", desc: "Connection to Epic EHR system", status: "active", enabled: true },
  { name: "Cerner Integration", type: "HL7", desc: "HL7 connection to Cerner health", status: "active", enabled: true },
  { name: "Twilio SMS", type: "REST API", desc: "SMS notification service", status: "active", enabled: true },
  { name: "Google Calendar", type: "REST API", desc: "Two-way calendar sync", status: "active", enabled: true },
  { name: "Athenahealth", type: "REST API", desc: "Integration with Athenahealth", status: "error", enabled: false },
];

export const OfficesPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">Office Locations & Creation</h2>
    <Card title="Create New Office" subtitle="Add a new physical service location">
      <div className="ac-stack">
        <Field label="Office Name"><Input placeholder="e.g. Bondi Mental Health" /></Field>
        <div className="ac-grid-2">
          <Field label="Suburb"><Input placeholder="Bondi" /></Field>
          <Field label="Postcode"><Input placeholder="2026" /></Field>
        </div>
        <Field label="Full Address"><Input placeholder="123 Example Rd, Bondi NSW" /></Field>
        <Field label="Phone Number"><Input placeholder="(02) XXXX XXXX" /></Field>
        <Button icon={FiPlus}>Create Office</Button>
      </div>
    </Card>
    
    <Card title="Existing Office Locations">
      <div className="ac-stack">
        <div style={{ position: 'relative' }}>
          <Input placeholder="Search by name or address" style={{ paddingLeft: 40 }} />
          <SafeIcon icon={FiSearch} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
        </div>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Office Name</th><th>Location</th><th>Address</th></tr>
            </thead>
            <tbody>
              {OFFICES.map((o, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  <td><span style={{ background: o.color, padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{o.suburb}</span></td>
                  <td style={{ color: 'var(--ac-muted)' }}>{o.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  </div>
);

export const IntegrationPage = () => {
  const [items, setItems] = useState(INTEGRATIONS);
  return (
    <div className="ac-stack">
      <h2 className="ac-h2">Integrations</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="ac-muted">Manage external health system connections</p>
        <Button size="sm" icon={FiPlus}>Add Connection</Button>
      </div>
      <div className="ac-stack">
        {items.map((intg, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{intg.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ac-primary)', marginTop: 2 }}>{intg.type}</div>
              </div>
              <StatusBadge status={intg.status} />
            </div>
            <p className="ac-muted ac-xs" style={{ margin: '8px 0 12px' }}>{intg.desc}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Toggle on={intg.enabled} onChange={v => setItems(prev => prev.map((p,j)=>j===i?{...p,enabled:v}:p))} />
              <span style={{ fontSize: 13 }}>{intg.enabled ? "Enabled" : "Disabled"}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <Button variant="outline" size="sm" style={{ padding: '6px 14px', fontSize: 12 }}>Test</Button>
                <Button variant="outline" size="sm" style={{ padding: '6px 14px', fontSize: 12 }}>Edit</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const ReportsPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">Reports</h2>
    <Card title="Generate System Report">
      <div className="ac-stack">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          {[25,26,27,28,29,30,31].map(d => (
            <div key={d} style={{ width:32, height:32, borderRadius:"50%", background: d===28?"#007AFF":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight: d===28?700:400, color: d===28?"#fff":"inherit", cursor:"pointer" }}>{d}</div>
          ))}
        </div>
        <Field label="Report Type">
          <Select options={["Client Activity", "System Performance", "AI Credit Usage", "Overdue Check-ins"]} />
        </Field>
        <div className="ac-grid-2">
          <Field label="Format"><Select options={["PDF", "Excel", "CSV"]} /></Field>
          <Field label="Group By"><Select options={["Day", "Week", "Month"]} /></Field>
        </div>
        <Button icon={FiDownload}>Generate Report</Button>
      </div>
    </Card>
    <Card title="Saved Reports">
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ac-muted)" }}>
        <SafeIcon icon={FiCloud} size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
        <p>No saved reports found.</p>
      </div>
    </Card>
  </div>
);

export const LogsPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">System Logs</h2>
    <Card>
      <div className="ac-table-container">
        <table className="ac-table">
          <thead>
            <tr><th>Time</th><th>Level</th><th>Source</th><th>Message</th></tr>
          </thead>
          <tbody style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {[
              { t:"14:32", lvl:"info",  src:"Auth",    msg:"Admin login: ops@acuteconnect.health" },
              { t:"14:31", lvl:"info",  src:"SMS",     msg:"Code dispatched to +61 4XX XXX 7K2" },
              { t:"14:28", lvl:"warn",  src:"API",     msg:"Rate limit 87% — AI credits threshold approaching" },
              { t:"14:15", lvl:"error", src:"SYD-West",msg:"Calendar sync failed — retrying (attempt 3/5)" },
              { t:"14:01", lvl:"info",  src:"Checkin", msg:"Patient NTH-126113 checked in successfully" },
            ].map((l, i) => (
              <tr key={i}>
                <td style={{ color: "var(--ac-muted)" }}>{l.t}</td>
                <td><span style={{ color: l.lvl === 'error' ? 'var(--ac-danger)' : l.lvl === 'warn' ? 'var(--ac-warn)' : 'var(--ac-success)', fontWeight: 700 }}>{l.lvl.toUpperCase()}</span></td>
                <td style={{ color: "var(--ac-primary)" }}>{l.src}</td>
                <td>{l.msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export const RegressionPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">Regression Tests</h2>
    <Card title="Diagnostic Suite" subtitle="Run automated tests across system modules">
      <div className="ac-stack">
        {[
          { name: "Auth Service", status: "passed", time: "1.2s" },
          { name: "SMS Gateway", status: "passed", time: "0.8s" },
          { name: "AI Triage Engine", status: "passed", time: "2.4s" },
          { name: "FHIR API Bridge", status: "warning", time: "4.1s" },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--ac-border)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div className="ac-muted ac-xs">Last run: 2 mins ago</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatusBadge status={t.status === 'passed' ? 'active' : 'pending'} />
              <div className="ac-muted ac-xs" style={{ marginTop: 4 }}>{t.time}</div>
            </div>
          </div>
        ))}
        <Button variant="outline" style={{ marginTop: 12 }}>Run Full Suite</Button>
      </div>
    </Card>
  </div>
);

export const SettingsPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">Settings</h2>
    <Card title="Site Configuration">
      <div className="ac-stack">
        <Field label="Site Name"><Input defaultValue="Acute Connect" /></Field>
        <Field label="Timezone"><Select options={["Australia/Sydney", "Australia/Melbourne", "Australia/Perth"]} /></Field>
        <div style={{ height: 1, background: "var(--ac-border)", margin: "8px 0" }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Enable Notifications</div>
            <div className="ac-muted ac-xs">Receive email alerts for urgent check-ins</div>
          </div>
          <Toggle on={true} onChange={() => {}} />
        </div>
        <Button style={{ marginTop: 12 }}>Save Site Settings</Button>
      </div>
    </Card>
  </div>
);

export const SuperAdminPage = () => {
  const [zones, setZones] = useState([
    { name: "SYD-East", lat: 42, up: 99.97, tput: 847, status: "nominal" },
    { name: "SYD-West", lat: 51, up: 99.94, tput: 623, status: "nominal" },
    { name: "Hunter", lat: 38, up: 99.98, tput: 412, status: "nominal" },
    { name: "Illawarra", lat: 87, up: 98.21, tput: 298, status: "warning" },
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      setZones(prev => prev.map(z => ({
        ...z,
        lat: Math.max(20, Math.min(200, z.lat + (Math.random() - 0.5) * 10)),
        tput: Math.max(100, Math.min(1200, z.tput + (Math.random() - 0.5) * 40))
      })));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ac-stack ac-super-admin" style={{ padding: 20 }}>
      <div className="ac-retro-header" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SafeIcon icon={FiTerminal} size={24} color="#3FB950" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>ACUTE CONNECT · SYSTEM HEALTH</div>
            <div style={{ fontSize: 10, color: "#3FB950" }}>● LIVE · REFRESHING EVERY 3s</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" variant="outline" style={{ background: '#161B22', color: '#8B949E', borderColor: '#30363D' }}>Export Log</Button>
        </div>
      </div>

      <div className="ac-grid-2">
        {zones.map(z => (
          <div key={z.name} className="ac-retro-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8B949E", letterSpacing: 0.5 }}>{z.name}</div>
              <span style={{ fontSize: 9, background: z.status === 'warning' ? '#92400E' : '#166534', color: z.status === 'warning' ? '#FDE68A' : '#6EE7B7', padding: '2px 6px', borderRadius: 20, textTransform: 'uppercase', fontWeight: 700 }}>{z.status}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Gauge val={z.lat} max={200} label="Latency" unit="ms" color={z.lat > 80 ? "#F59E0B" : "#3A7D7B"} sz={90} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
              <div style={{ background: "#0D1117", padding: 8, textAlign: "center", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#6E7681", marginBottom: 2 }}>UPTIME</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: z.up < 99 ? "#F59E0B" : "#3FB950" }}>{z.up}%</div>
              </div>
              <div style={{ background: "#0D1117", padding: 8, textAlign: "center", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#6E7681", marginBottom: 2 }}>TPUT/s</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#58A6FF" }}>{Math.round(z.tput)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ac-grid-3" style={{ marginTop: 20 }}>
        <div className="ac-retro-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: "#8B949E", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>AI CREDITS</div>
          <Gauge val={76} max={100} label="" unit="%" color="#A78BFA" sz={100} />
          <div style={{ fontSize: 11, color: "#6E7681", marginTop: 8 }}>760k / 1M used</div>
        </div>
        <div className="ac-retro-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: "#8B949E", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>THROUGHPUT</div>
          <Gauge val={2180} max={4000} label="" unit="/s" color="#58A6FF" sz={100} />
          <div style={{ fontSize: 11, color: "#6E7681", marginTop: 8 }}>System-wide msgs</div>
        </div>
        <div className="ac-retro-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: "#8B949E", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>TRANSFERS</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#3FB950", margin: '14px 0' }}>14</div>
          <div style={{ fontSize: 11, color: "#6E7681" }}>Active transfers</div>
        </div>
      </div>
    </div>
  );
};

export const SysDashPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">System Dashboard</h2>
    <div className="ac-grid-2">
      <Card title="Traffic Overview" right={<SafeIcon icon={FiActivity} color="var(--ac-primary)" />}>
        <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {[40, 60, 45, 90, 65, 80, 50, 70, 85, 40].map((h, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--ac-primary-soft)', height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
          ))}
        </div>
      </Card>
      <Card title="Cloud Sync" right={<SafeIcon icon={FiCloud} color="var(--ac-success)" />}>
        <div style={{ padding: '20px 0' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>99.9%</div>
          <p className="ac-muted">Data synchronized with primary EHR</p>
        </div>
      </Card>
    </div>
  </div>
);

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'Admin' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users_1777025000000')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const { error } = await supabase
        .from('admin_users_1777025000000')
        .insert([{ email: form.email, role: form.role }]);
      if (error) throw error;
      setShowForm(false);
      setForm({ email: '', role: 'Admin' });
      fetchUsers();
    } catch (err) {
      alert(`Failed to create admin: ${err.message || 'Unknown error'}`);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('admin_users_1777025000000')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="ac-h2">User Management</h2>
        <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setShowForm(true)}>Add Admin</Button>
      </div>
      <Card title="System Users" subtitle="Manage access, reset passwords, or remove accounts">
         <div className="ac-table-container">
           <table className="ac-table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>No users found.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                     <td style={{ fontWeight: 600 }}>{u.email}</td>
                     <td>{u.role}</td>
                     <td><StatusBadge status={u.status} /></td>
                     <td>
                       <div style={{ display: 'flex', gap: 8 }}>
                         <Button size="sm" variant="outline" onClick={() => handleToggleStatus(u.id, u.status)}>
                           {u.status === 'active' ? 'Deactivate' : 'Activate'}
                         </Button> 
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
           </table>
         </div>
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <Card title="Add New Admin" style={{ maxWidth: 400, width: '100%' }}>
            <div className="ac-stack">
              <Field label="Email Address"><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="admin@example.com" /></Field>
              <Field label="Role">
                <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})} options={["Admin", "SysAdmin", "Viewer"]} />
              </Field>
              <div className="ac-grid-2" style={{ marginTop: 12 }}>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreateUser} disabled={!form.email}>Create Admin</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const HeatMapPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">City Heat Map & Big Data Insights</h2>
    <Card title="Live Event Heat Map" subtitle="Real-time check-in density and alert hotspots">
      <div className="ac-map-container" style={{ height: 400, borderRadius: 12, position: 'relative', overflow: 'hidden', border: '1px solid var(--ac-border)' }}>
        <iframe 
          title="Map Area"
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          src="https://www.openstreetmap.org/export/embed.html?bbox=151.10%2C-33.95%2C151.25%2C-33.80&amp;layer=mapnik" 
          style={{ border: 0, position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'var(--ac-map-filter)' }}
        />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,59,48,0.2) 20%, transparent 60%)', backgroundSize: '100px 100px', backgroundPosition: '50px 50px', zIndex: 1 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,149,0,0.2) 20%, transparent 60%)', backgroundSize: '150px 150px', backgroundPosition: '150px 80px', zIndex: 1 }} />
        
        <div style={{ position: 'absolute', top: '30%', left: '40%', width: 60, height: 60, background: 'radial-gradient(circle, rgba(255,59,48,0.8) 0%, rgba(255,59,48,0) 70%)', borderRadius: '50%', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: '60%', left: '60%', width: 100, height: 100, background: 'radial-gradient(circle, rgba(255,149,0,0.6) 0%, rgba(255,149,0,0) 70%)', borderRadius: '50%', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: '20%', left: '70%', width: 40, height: 40, background: 'radial-gradient(circle, rgba(52,199,89,0.8) 0%, rgba(52,199,89,0) 70%)', borderRadius: '50%', zIndex: 2 }} />
      </div>
    </Card>
    <div className="ac-grid-2">
      <Card title="System Insights" right={<SafeIcon icon={FiActivity} color="var(--ac-primary)" />}>
        <ul style={{ paddingLeft: 20, color: 'var(--ac-muted)', fontSize: 14 }}>
          <li style={{ marginBottom: 8 }}><strong>Surge Detected:</strong> 15% increase in urgent check-ins in the Eastern Suburbs over the last 2 hours.</li>
          <li style={{ marginBottom: 8 }}><strong>Resource Allocation:</strong> Recommend deploying additional telehealth staff to cover the evening window.</li>
          <li><strong>Predictive Alert:</strong> Historical data suggests a 20% spike in volume tomorrow morning due to regional events.</li>
        </ul>
      </Card>
      <Card title="Monetization Opportunities" right={<SafeIcon icon={FiTrendingUp} color="var(--ac-success)" />}>
         <p className="ac-muted ac-xs" style={{ marginBottom: 16 }}>Aggregated, anonymized data insights ready for partner distribution.</p>
         <Button style={{ width: '100%' }}>Export Partner Data Package</Button>
      </Card>
    </div>
  </div>
);

export const ModuleAccessPage = () => <Card title="Module Access">System Permission Matrices</Card>;
export const SiteMapPage = () => <Card title="Site Map">Structural Wireframes & PDF Export</Card>;
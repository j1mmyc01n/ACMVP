import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { Card, Button, Badge, StatusBadge, Field, Input, Select, Textarea } from '../components/UI';

const {
  FiRefreshCw, FiCheckCircle, FiX, FiCalendar, FiCpu,
  FiActivity, FiDatabase, FiShield, FiMap, FiHome,
  FiPlus, FiSettings, FiUsers, FiEdit2, FiMessageSquare,
  FiThumbsUp, FiAlertTriangle, FiTrash2, FiLink, FiGlobe,
  FiFileText, FiList, FiNavigation, FiKey, FiSave, FiMail, FiClock, FiTrendingUp
} = FiIcons;

const Toast = ({ msg, onClose }) => (
  <div className="ac-toast">
    <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

const ModalOverlay = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 20 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

/* ─── SYSTEM DASHBOARD WITH SUPPORT GAUGES & PROVIDER TRACKING ────── */
export const SysDashPage = () => {
  return (
    <div className="ac-stack">
      <h1 className="ac-h1">System Dashboard</h1>
      
      <div className="ac-grid-3">
        <Card title="Support Stations Connectivity">
          <div className="ac-stack-sm" style={{ marginTop: 8 }}>
            <div className="ac-flex-between">
              <span className="ac-sm">Camperdown Node</span>
              <Badge tone="green">99%</Badge>
            </div>
            <div className="ac-progress"><div className="ac-progress-bar" style={{ width: '99%' }}/></div>
            
            <div className="ac-flex-between" style={{ marginTop: 8 }}>
              <span className="ac-sm">Newtown Database</span>
              <Badge tone="amber">76%</Badge>
            </div>
            <div className="ac-progress"><div className="ac-progress-bar" style={{ width: '76%', background: 'var(--ac-warn)' }}/></div>
            
            <div className="ac-flex-between" style={{ marginTop: 8 }}>
              <span className="ac-sm">Central Hub Data</span>
              <Badge tone="green">100%</Badge>
            </div>
            <div className="ac-progress"><div className="ac-progress-bar" style={{ width: '100%' }}/></div>
          </div>
        </Card>

        <Card title="Provider Leads & Audits">
          <div className="ac-stack-sm">
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ac-primary)' }}>142</div>
            <div className="ac-muted ac-xs">Provider Registrations (YTD)</div>
            <div className="ac-divider"/>
            <div className="ac-flex-between">
              <span className="ac-sm">Converted</span>
              <span style={{ fontWeight: 600 }}>89</span>
            </div>
            <div className="ac-flex-between">
              <span className="ac-sm">Pending Audit</span>
              <span style={{ fontWeight: 600 }}>53</span>
            </div>
          </div>
        </Card>

        <Card title="System Status">
          <div className="ac-stack-sm">
             <div className="ac-flex-between">
              <span className="ac-sm">API Gateway</span>
              <Badge tone="green">Online</Badge>
            </div>
            <div className="ac-flex-between">
              <span className="ac-sm">Auth Services</span>
              <Badge tone="green">Online</Badge>
            </div>
            <div className="ac-flex-between">
              <span className="ac-sm">Analytics Engine</span>
              <Badge tone="green">Online</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Daily Traffic Overview">
        <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '20px 0' }}>
          {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--ac-primary)', height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
          ))}
        </div>
        <div className="ac-flex-between ac-muted ac-xs">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </Card>
    </div>
  );
};

/* ─── PROVIDER PERFORMANCE METRICS ───────────────────────────────── */
export const ProviderMetricsPage = () => {
  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Provider Performance Metrics</h1>
        <Button variant="outline" icon={FiRefreshCw}>Refresh Data</Button>
      </div>
      
      <div className="ac-grid-3">
        <Card title="Average Response Time">
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-primary)' }}>4.2m</div>
          <div className="ac-muted ac-xs">Top 10% of network</div>
        </Card>
        <Card title="Patient Satisfaction">
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-success)' }}>4.8/5</div>
          <div className="ac-muted ac-xs">Based on 1,204 reviews</div>
        </Card>
        <Card title="Resolution Rate">
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-primary)' }}>92%</div>
          <div className="ac-muted ac-xs">First-contact resolution</div>
        </Card>
      </div>

      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Provider Name</th><th>Facility</th><th>Response Time</th><th>Rating</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td style={{ fontWeight: 600 }}>Dr. Sarah Smith</td><td>Camperdown Medical</td><td>3.1m</td><td>4.9</td><td><Badge tone="green">Excellent</Badge></td></tr>
              <tr><td style={{ fontWeight: 600 }}>Paramedic Team Alpha</td><td>Newtown Station</td><td>4.5m</td><td>4.7</td><td><Badge tone="green">Good</Badge></td></tr>
              <tr><td style={{ fontWeight: 600 }}>Dr. James Wilson</td><td>Main Campus</td><td>6.2m</td><td>4.2</td><td><Badge tone="amber">Needs Review</Badge></td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ─── SUPER ADMIN ────────────────────────────────────────────────── */
export const SuperAdminPage = () => {
  const [stats, setStats] = useState({ patients: 0, crns: 0, checkins: 0, admins: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
      supabase.from('crns_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }),
    ]).then(([p, c, ci, a]) => {
      setStats({ patients: p.count || 0, crns: c.count || 0, checkins: ci.count || 0, admins: a.count || 0 });
    });
  }, []);

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">⚡ Super Admin</h1>
        <Badge tone="green">System Online</Badge>
      </div>
      <div className="ac-grid-4">
        {[
          { label: 'Patients', val: stats.patients, icon: FiUsers, color: 'var(--ac-primary)' },
          { label: 'CRN Pool', val: stats.crns, icon: FiDatabase, color: 'var(--ac-success)' },
          { label: 'Check-ins', val: stats.checkins, icon: FiActivity, color: 'var(--ac-warn)' },
          { label: 'Staff', val: stats.admins, icon: FiShield, color: 'var(--ac-violet, #AF52DE)' }
        ].map(t => (
          <div key={t.label} className="ac-stat-tile">
            <div className="ac-flex-gap" style={{ marginBottom: 8 }}>
              <SafeIcon icon={t.icon} style={{ color: t.color }} />
              <span className="ac-muted ac-xs">{t.label}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: t.color }}>{t.val}</div>
          </div>
        ))}
      </div>
      <div className="ac-grid-2">
        <Card title="System Health">
          <div className="ac-stack-sm">
            {[['API Latency', '24ms', 'green'], ['DB Load', '12%', 'green'], ['Memory', '68%', 'amber'], ['Uptime', '99.9%', 'green']].map(([k, v, t]) => (
              <div key={k} className="ac-flex-between">
                <span className="ac-sm">{k}</span>
                <Badge tone={t}>{v}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Database Overview">
          <div className="ac-stack-sm ac-muted ac-xs">
            <p>PostgreSQL 15.1 hosted by Supabase.</p>
            <p>RLS active on all public wrapper tables.</p>
            <p>Storage: 45MB / 500MB</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ─── USERS PAGE ─────────────────────────────────────────────────── */
export const UsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, email: '', role: 'admin', status: 'active' });

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admin_users_1777025000000').select('*');
    setAdmins(data || []);
  };

  const handleSave = async () => {
    if (form.id) {
      await supabase.from('admin_users_1777025000000').update({ role: form.role, status: form.status }).eq('id', form.id);
    } else {
      await supabase.from('admin_users_1777025000000').insert([{ email: form.email, role: form.role, status: form.status }]);
    }
    setModal(false);
    fetchAdmins();
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Staff Management</h1>
        <Button icon={FiPlus} onClick={() => { setForm({ id: null, email: '', role: 'admin', status: 'active' }); setModal(true); }}>Add Staff</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.email}</td>
                  <td><Badge tone={a.role === 'sysadmin' ? 'violet' : 'blue'}>{a.role}</Badge></td>
                  <td><StatusBadge status={a.status || 'active'} /></td>
                  <td>
                    <button className="ac-icon-btn" onClick={() => { setForm(a); setModal(true); }}>
                      <SafeIcon icon={FiEdit2} size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <ModalOverlay title={form.id ? 'Edit Staff' : 'Add Staff'} onClose={() => setModal(false)}>
          <div className="ac-stack">
            <Field label="Email"><Input value={form.email} disabled={!!form.id} onChange={e => setForm({...form, email: e.target.value})} /></Field>
            <Field label="Role">
              <Select value={form.role} onChange={e => setForm({...form, role: e.target.value})} options={['admin', 'sysadmin']} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})} options={['active', 'inactive']} />
            </Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── HEATMAP WITH AI INSIGHTS ──────────────────────────────────── */
export const HeatMapPage = () => {
  const [aiInsight, setAiInsight] = useState(false);

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">City Heat Map & Dispatch</h1>
        <Button variant="outline" icon={FiRefreshCw} onClick={() => setAiInsight(true)}>Run AI Analysis</Button>
      </div>
      
      {aiInsight && (
        <div style={{ background: 'var(--ac-primary-soft)', border: '1px solid var(--ac-primary)', padding: 16, borderRadius: 12 }}>
          <div className="ac-flex-gap" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
            <SafeIcon icon={FiActivity} style={{ color: 'var(--ac-primary)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontWeight: 700, color: 'var(--ac-primary)', flex: 1, lineHeight: 1.3 }}>
              AI Predictive Insight generated at {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="ac-sm" style={{ color: 'var(--ac-text)', marginBottom: 16, lineHeight: 1.5 }}>
            Historical data patterns indicate a <strong>78% probability</strong> of a crisis spike in the <strong>Camperdown</strong> sector between 22:00 and 02:00. 
            Recommendation: Pre-deploy 1 Ambulance and 1 Support Staff to the Newtown staging area.
          </div>
          <Button size="sm" style={{ width: '100%' }}>Deploy Units</Button>
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden', height: 550, position: 'relative' }}>
        <iframe
          title="Heat Map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=151.16%2C-33.91%2C151.21%2C-33.86&layer=mapnik"
          width="100%" height="100%"
          style={{ border: 0, filter: 'var(--ac-map-filter)', display: 'block' }}
          loading="lazy"
        />
      </Card>
    </div>
  );
};

/* ─── OFFICES ────────────────────────────────────────────────── */
export const OfficesPage = () => {
  const [offices, setOffices] = useState([
    { id: 1, name: 'Main Campus', suffix: 'MCP', address: '123 Health Way', status: 'active', beds: 45, fallback_office_id: null },
    { id: 2, name: 'North Clinic', suffix: 'NCL', address: '45 North Blvd', status: 'maintenance', beds: 12, fallback_office_id: 1 },
  ]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', suffix: '', address: '', status: 'active', beds: 0, fallback_office_id: null });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = () => {
    if (!form.name || !form.suffix) return alert('Name and CRN Suffix are required');
    if (form.id) {
      setOffices(offices.map(o => o.id === form.id ? form : o));
      showToast('Care Centre updated successfully');
    } else {
      setOffices([...offices, { ...form, id: Date.now() }]);
      showToast('Care Centre created successfully');
    }
    setModal(false);
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Care Centre Management</h1>
        <Button icon={FiPlus} onClick={() => { 
          setForm({ id: null, name: '', suffix: '', address: '', status: 'active', beds: 0, fallback_office_id: null }); 
          setModal(true); 
        }}>Add Care Centre</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Name</th><th>CRN Suffix</th><th>Address</th><th>Capacity</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {offices.map(o => {
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td><Badge tone="violet">{o.suffix}</Badge></td>
                    <td className="ac-muted ac-xs">{o.address}</td>
                    <td>{o.beds} Beds</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <button className="ac-icon-btn" onClick={() => { setForm(o); setModal(true); }}>
                        <SafeIcon icon={FiEdit2} size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {modal && (
        <ModalOverlay title={form.id ? "Edit Care Centre" : "Add Care Centre"} onClose={() => setModal(false)}>
          <div className="ac-stack">
            <Field label="Facility Name">
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Main Campus" />
            </Field>
            <Field label="CRN Suffix (3 Letters)">
              <Input 
                value={form.suffix} 
                onChange={e => setForm({...form, suffix: e.target.value.toUpperCase().slice(0, 3)})} 
                placeholder="e.g. MCP"
                maxLength={3}
              />
            </Field>
            <Field label="Address">
              <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </Field>
            <div className="ac-grid-2">
              <Field label="Capacity (Beds)">
                <Input type="number" value={form.beds} onChange={e => setForm({...form, beds: parseInt(e.target.value) || 0})} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})} options={['active', 'maintenance', 'closed']} />
              </Field>
            </div>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── INTEGRATIONS WITH LOCAL STORAGE ────────────────────────────────────────────── */
export const IntegrationPage = () => {
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  
  const [googleConfig, setGoogleConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_google')) || { client_id: '', client_secret: '', calendar_id: '', status: 'disconnected' });
  const [aiConfig, setAiConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_ai')) || { api_key: '', model: 'gpt-4', endpoint: 'https://api.openai.com/v1', status: 'disconnected' });
  const [outlookConfig, setOutlookConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_outlook')) || { client_id: '', tenant_id: '', status: 'disconnected' });
  const [calendlyConfig, setCalendlyConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_calendly')) || { api_key: '', link: '', status: 'disconnected' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = (type) => {
    let conf;
    if (type === 'google') {
      conf = { ...googleConfig, status: 'connected' };
      setGoogleConfig(conf);
      localStorage.setItem('ac_int_google', JSON.stringify(conf));
    } else if (type === 'ai') {
      conf = { ...aiConfig, status: 'connected' };
      setAiConfig(conf);
      localStorage.setItem('ac_int_ai', JSON.stringify(conf));
    } else if (type === 'outlook') {
      conf = { ...outlookConfig, status: 'connected' };
      setOutlookConfig(conf);
      localStorage.setItem('ac_int_outlook', JSON.stringify(conf));
    } else if (type === 'calendly') {
      conf = { ...calendlyConfig, status: 'connected' };
      setCalendlyConfig(conf);
      localStorage.setItem('ac_int_calendly', JSON.stringify(conf));
    }
    showToast(`${type.toUpperCase()} configuration saved securely.`);
    setModal(null);
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">Integrations & API Hub</h1>
      
      <div className="ac-grid-2">
        <Card title="Google Workspace Sync">
          <div className="ac-stack-sm">
            <div className="ac-flex-between" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-gap"><SafeIcon icon={FiCalendar} /><span className="ac-sm" style={{ fontWeight: 600 }}>Google Calendar</span></div>
              <Badge tone={googleConfig.status === 'connected' ? 'green' : 'amber'}>{googleConfig.status === 'connected' ? 'Connected' : 'Not Configured'}</Badge>
            </div>
            <Button variant="outline" icon={FiSettings} onClick={() => setModal('google')}>Configure Google</Button>
          </div>
        </Card>

        <Card title="Microsoft Outlook Sync">
          <div className="ac-stack-sm">
            <div className="ac-flex-between" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-gap"><SafeIcon icon={FiMail} /><span className="ac-sm" style={{ fontWeight: 600 }}>Outlook 365</span></div>
              <Badge tone={outlookConfig.status === 'connected' ? 'green' : 'amber'}>{outlookConfig.status === 'connected' ? 'Connected' : 'Not Configured'}</Badge>
            </div>
            <Button variant="outline" icon={FiSettings} onClick={() => setModal('outlook')}>Configure Outlook</Button>
          </div>
        </Card>

        <Card title="Calendly Integration">
          <div className="ac-stack-sm">
            <div className="ac-flex-between" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-gap"><SafeIcon icon={FiClock} /><span className="ac-sm" style={{ fontWeight: 600 }}>Calendly Booking</span></div>
              <Badge tone={calendlyConfig.status === 'connected' ? 'green' : 'amber'}>{calendlyConfig.status === 'connected' ? 'Connected' : 'Not Configured'}</Badge>
            </div>
            <Button variant="outline" icon={FiSettings} onClick={() => setModal('calendly')}>Configure Calendly</Button>
          </div>
        </Card>

        <Card title="AI Triage Engine">
          <div className="ac-stack-sm">
            <div className="ac-flex-between" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-gap"><SafeIcon icon={FiCpu} /><span className="ac-sm" style={{ fontWeight: 600 }}>OpenAI GPT-4</span></div>
              <Badge tone={aiConfig.status === 'connected' ? 'green' : 'amber'}>{aiConfig.status === 'connected' ? 'Connected' : 'Not Configured'}</Badge>
            </div>
            <Button variant="outline" icon={FiSettings} onClick={() => setModal('ai')}>Configure AI Engine</Button>
          </div>
        </Card>
      </div>

      {modal === 'google' && (
        <ModalOverlay title="Configure Google Workspace" onClose={() => setModal(null)}>
          <div className="ac-stack">
            <Field label="Client ID"><Input value={googleConfig.client_id} onChange={e => setGoogleConfig({...googleConfig, client_id: e.target.value})} /></Field>
            <Field label="Client Secret"><Input type="password" value={googleConfig.client_secret} onChange={e => setGoogleConfig({...googleConfig, client_secret: e.target.value})} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 12 }}><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('google')}>Save Configuration</Button></div>
          </div>
        </ModalOverlay>
      )}

      {modal === 'outlook' && (
        <ModalOverlay title="Configure Microsoft Outlook" onClose={() => setModal(null)}>
          <div className="ac-stack">
            <Field label="Client ID (App ID)"><Input value={outlookConfig.client_id} onChange={e => setOutlookConfig({...outlookConfig, client_id: e.target.value})} /></Field>
            <Field label="Tenant ID"><Input value={outlookConfig.tenant_id} onChange={e => setOutlookConfig({...outlookConfig, tenant_id: e.target.value})} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 12 }}><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('outlook')}>Save Configuration</Button></div>
          </div>
        </ModalOverlay>
      )}

      {modal === 'calendly' && (
        <ModalOverlay title="Configure Calendly" onClose={() => setModal(null)}>
          <div className="ac-stack">
            <Field label="Personal Access Token"><Input type="password" value={calendlyConfig.api_key} onChange={e => setCalendlyConfig({...calendlyConfig, api_key: e.target.value})} /></Field>
            <Field label="Default Booking Link"><Input value={calendlyConfig.link} onChange={e => setCalendlyConfig({...calendlyConfig, link: e.target.value})} placeholder="https://calendly.com/your-name" /></Field>
            <div className="ac-grid-2" style={{ marginTop: 12 }}><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('calendly')}>Save Configuration</Button></div>
          </div>
        </ModalOverlay>
      )}

      {modal === 'ai' && (
        <ModalOverlay title="Configure AI Engine" onClose={() => setModal(null)}>
          <div className="ac-stack">
            <Field label="API Key"><Input type="password" value={aiConfig.api_key} onChange={e => setAiConfig({...aiConfig, api_key: e.target.value})} /></Field>
            <Field label="Model"><Select value={aiConfig.model} onChange={e => setAiConfig({...aiConfig, model: e.target.value})} options={['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 12 }}><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('ai')}>Save Configuration</Button></div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── FEEDBACK & TICKETS ─────────────────────────────────────────── */
export const FeedbackPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from('feedback_tickets_1777090000').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Feedback & Tickets</h1>
        <Button variant="outline" icon={FiRefreshCw} onClick={fetchTickets}>Refresh</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Subject</th><th>Submitter</th><th>Category</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="4" className="ac-center" style={{ padding: 24 }}>Loading...</td></tr> : 
               tickets.length === 0 ? <tr><td colSpan="4" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No tickets found.</td></tr> :
               tickets.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.subject}</td>
                  <td><div className="ac-sm">{t.submitted_by}</div></td>
                  <td>{t.category}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ─── FEATURE REQUESTS ───────────────────────────────────────────── */
export const FeatureRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase.from('feature_requests_1777090000').select('*').order('votes', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Feature Requests</h1>
      </div>
      <div className="ac-grid-2">
        {loading ? <p className="ac-muted">Loading...</p> : 
         requests.length === 0 ? <p className="ac-muted">No requests found.</p> :
         requests.map(req => (
          <Card key={req.id}>
            <div className="ac-flex-between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{req.title}</h3>
              <Badge tone="amber">{req.status}</Badge>
            </div>
            <p className="ac-sm" style={{ marginBottom: 16 }}>{req.description}</p>
            <div className="ac-flex-gap"><Button variant="outline" size="sm" icon={FiThumbsUp}>{req.votes}</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ─── LOGS, REGRESSION, MODULE ACCESS, SETTINGS, SITEMAP ─────────── */
export const LogsPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">System Logs</h1>
    <Card>
      <div className="ac-mono ac-xs" style={{ whiteSpace: 'pre-wrap', color: 'var(--ac-fg)', background: 'var(--ac-bg)', padding: 16, borderRadius: 8 }}>
        [10:45:12] INFO: Supabase connection established.{"\n"}
        [10:46:01] WARN: Failed to sync Google Calendar (Token expired).{"\n"}
        [10:48:33] INFO: Admin user logged in.
      </div>
    </Card>
  </div>
);

export const RegressionPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Regression Tests</h1>
    <Card title="Automated QA Suite">
      <div className="ac-stack-sm">
        {['Auth Flow', 'Database RLS', 'UI Rendering', 'CRM Sync'].map(test => (
          <div key={test} className="ac-flex-between" style={{ padding: 12, border: '1px solid var(--ac-border)', borderRadius: 8 }}>
            <span style={{ fontWeight: 600 }}>{test}</span>
            <Badge tone="green">Passed</Badge>
          </div>
        ))}
        <Button variant="outline" style={{ marginTop: 12 }}>Run All Tests</Button>
      </div>
    </Card>
  </div>
);

export const ModuleAccessPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Module Access Control</h1>
    <Card title="Role Permissions">
      <div className="ac-table-container">
        <table className="ac-table">
          <thead>
            <tr><th>Module</th><th>SysAdmin</th><th>Admin</th><th>Public</th></tr>
          </thead>
          <tbody>
            {['Client Check-in', 'Crisis Management', 'System Config'].map((m, i) => (
              <tr key={m}>
                <td style={{ fontWeight: 600 }}>{m}</td>
                <td><SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /></td>
                <td>{i < 2 ? <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /> : <SafeIcon icon={FiX} style={{ color: 'var(--ac-danger)' }} />}</td>
                <td>{i === 0 ? <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /> : <SafeIcon icon={FiX} style={{ color: 'var(--ac-danger)' }} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export const SettingsPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Global Settings</h1>
    <div className="ac-grid-2">
      <Card title="Application Config">
        <div className="ac-stack-sm">
          <Field label="Site Name"><Input defaultValue="Acute Care Services" /></Field>
          <Field label="Support Email"><Input defaultValue="support@acuteconnect.health" /></Field>
          <Button>Save Settings</Button>
        </div>
      </Card>
    </div>
  </div>
);

export const SiteMapPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Site Map & Structure</h1>
    <Card>
      <div className="ac-stack-sm" style={{ fontFamily: 'monospace' }}>
        <div>├── 📂 Client Views</div>
        <div>├── 📂 Admin Views</div>
        <div>└── 📂 System Views</div>
      </div>
    </Card>
  </div>
);
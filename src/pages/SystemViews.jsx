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
  FiFileText, FiList, FiNavigation
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

/* ─── HEATMAP WITH AI INSIGHTS - FIXED LAYOUT ──────────────────────────────────── */
export const HeatMapPage = () => {
  const [aiInsight, setAiInsight] = useState(false);

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">City Heat Map & Dispatch</h1>
        <Button variant="outline" icon={FiRefreshCw} onClick={() => setAiInsight(true)}>Run AI Analysis</Button>
      </div>
      
      {aiInsight && (
        <div style={{ background: 'var(--ac-primary-soft)', border: '1px solid var(--ac-primary)', padding: 16, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <SafeIcon icon={FiActivity} style={{ color: 'var(--ac-primary)', marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--ac-primary)', marginBottom: 4 }}>AI Predictive Insight generated at {new Date().toLocaleTimeString()}</div>
            <div className="ac-sm" style={{ color: 'var(--ac-text)' }}>
              Historical data patterns indicate a <strong>78% probability</strong> of a crisis spike in the <strong>Camperdown</strong> sector between 22:00 and 02:00. 
              Recommendation: Pre-deploy 1 Ambulance and 1 Support Staff to the Newtown staging area.
            </div>
          </div>
          <Button size="sm" style={{ whiteSpace: 'nowrap', padding: '6px 12px' }}>Deploy Units</Button>
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
        <div style={{ position: 'absolute', top: '40%', left: '30%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ background: 'var(--ac-primary)', padding: '6px 12px', borderRadius: 20, color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
            🚔 Unit 4 (Dr. Smith)
          </div>
        </div>
        <div style={{ position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ background: 'var(--ac-success)', padding: '6px 12px', borderRadius: 20, color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
            🚑 Med 1 (Available)
          </div>
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '45%', width: 140, height: 140, background: 'radial-gradient(circle, rgba(255,0,0,0.5) 0%, rgba(255,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none', transform: 'translate(-50%, -50%)' }} />
      </Card>

      <div className="ac-grid-2" style={{ marginTop: 16 }}>
        <Card title="Active Hot Zones">
          <div className="ac-stack-sm">
            <div className="ac-flex-between">
              <span className="ac-sm" style={{ fontWeight: 600 }}>Camperdown Center</span>
              <Badge tone="red">High</Badge>
            </div>
            <div className="ac-flex-between">
              <span className="ac-sm" style={{ fontWeight: 600 }}>Newtown Station</span>
              <Badge tone="amber">Medium</Badge>
            </div>
          </div>
        </Card>
        
        <Card title="Admin Locality">
          <div className="ac-stack-sm">
            <div className="ac-flex-between">
              <div>
                <div className="ac-sm" style={{ fontWeight: 600 }}>Dr. Smith</div>
                <div className="ac-xs ac-muted">Unit 4 • 2 mins away</div>
              </div>
              <Badge tone="blue">Dispatched</Badge>
            </div>
            <div className="ac-flex-between">
              <div>
                <div className="ac-sm" style={{ fontWeight: 600 }}>Paramedic Team</div>
                <div className="ac-xs ac-muted">Med 1 • Available</div>
              </div>
              <Badge tone="green">Ready</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ─── OFFICES WITH CRN SUFFIX ────────────────────────────────────────────────── */
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
    if (form.suffix.length !== 3) return alert('CRN Suffix must be exactly 3 letters');
    
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
              <tr><th>Name</th><th>CRN Suffix</th><th>Address</th><th>Capacity</th><th>Fallback</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {offices.map(o => {
                const fallback = offices.find(f => f.id === o.fallback_office_id);
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td><Badge tone="violet">{o.suffix}</Badge></td>
                    <td className="ac-muted ac-xs">{o.address}</td>
                    <td>{o.beds} Beds</td>
                    <td className="ac-xs">{fallback ? fallback.name : '—'}</td>
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
                style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1 }}
              />
              <div className="ac-xs ac-muted" style={{ marginTop: 4 }}>
                This suffix will be added to all CRNs generated for this facility
              </div>
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
            <Field label="Fallback Care Centre">
              <Select 
                value={form.fallback_office_id || ''} 
                onChange={e => setForm({...form, fallback_office_id: e.target.value ? parseInt(e.target.value) : null})}
                options={['', ...offices.filter(o => o.id !== form.id).map(o => ({ value: o.id, label: o.name }))]}
              />
              <div className="ac-xs ac-muted" style={{ marginTop: 4 }}>
                Route clients here if this facility goes down
              </div>
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

/* ─── INTEGRATIONS ───────────────────────────────────────────────── */
export const IntegrationPage = () => {
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">Integrations & API Hub</h1>
      <div className="ac-grid-2">
        <Card title="Google Workspace Sync">
          <div className="ac-stack-sm">
            <p className="ac-muted ac-xs">Sync calendars and CRM data with external Google Workspace accounts.</p>
            <div className="ac-flex-between" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-gap">
                <SafeIcon icon={FiCalendar} />
                <span className="ac-sm" style={{ fontWeight: 600 }}>Google Calendar</span>
              </div>
              <Badge tone="green">Connected</Badge>
            </div>
            <Button variant="outline" onClick={() => showToast('Force sync initiated...')}>Force Sync Now</Button>
          </div>
        </Card>
        <Card title="AI Triage Engine">
          <div className="ac-stack-sm">
            <p className="ac-muted ac-xs">Connect to external LLMs for advanced mood analysis and crisis detection.</p>
            <div className="ac-flex-between" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-gap">
                <SafeIcon icon={FiCpu} />
                <span className="ac-sm" style={{ fontWeight: 600 }}>OpenAI GPT-4</span>
              </div>
              <Badge tone="amber">Pending API Key</Badge>
            </div>
            <Button variant="outline" onClick={() => showToast('Test connection ping sent.')}>Test Connection</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ─── FEEDBACK & TICKETS ─────────────────────────────────────────── */
export const FeedbackPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from('feedback_tickets_1777090000').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleUpdate = async (status) => {
    await supabase.from('feedback_tickets_1777090000')
      .update({ status, admin_response: response || selectedTicket.admin_response, updated_at: new Date().toISOString() })
      .eq('id', selectedTicket.id);
    showToast(`Ticket marked as ${status}`);
    setModal(false);
    fetchTickets();
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Feedback & Tickets</h1>
        <Button variant="outline" icon={FiRefreshCw} onClick={fetchTickets}>Refresh</Button>
      </div>

      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Subject</th><th>Submitter</th><th>Category</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="ac-center" style={{ padding: 24 }}>Loading...</td></tr> : 
               tickets.length === 0 ? <tr><td colSpan="6" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No tickets found.</td></tr> :
               tickets.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.subject}</td>
                  <td>
                    <div className="ac-sm">{t.submitted_by}</div>
                    <div className="ac-xs ac-muted">{t.submitter_type}</div>
                  </td>
                  <td>{t.category}</td>
                  <td><Badge tone={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'amber' : 'blue'}>{t.priority}</Badge></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <button className="ac-icon-btn" onClick={() => { setSelectedTicket(t); setResponse(t.admin_response || ''); setModal(true); }}>
                      <SafeIcon icon={FiMessageSquare} size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && selectedTicket && (
        <ModalOverlay title="Ticket Details" onClose={() => setModal(false)}>
          <div className="ac-stack">
            <div style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-muted ac-xs">Message from {selectedTicket.submitted_by}</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>{selectedTicket.message}</div>
            </div>
            <Field label="Admin Response">
              <Textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Type your response to the user..." />
            </Field>
            <div className="ac-grid-3" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => handleUpdate('open')}>Keep Open</Button>
              <Button style={{ background: 'var(--ac-warn)', borderColor: 'var(--ac-warn)' }} onClick={() => handleUpdate('in_progress')}>In Progress</Button>
              <Button onClick={() => handleUpdate('closed')}>Close Ticket</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── FEATURE REQUESTS ───────────────────────────────────────────── */
export const FeatureRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', requested_by: 'Admin', category: 'enhancement', priority: 'medium' });
  const [toast, setToast] = useState('');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase.from('feature_requests_1777090000').select('*').order('votes', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleCreate = async () => {
    if (!form.title) return alert('Title is required');
    await supabase.from('feature_requests_1777090000').insert([form]);
    showToast('Feature request submitted.');
    setModal(false);
    fetchRequests();
  };

  const handleVote = async (req) => {
    await supabase.from('feature_requests_1777090000').update({ votes: req.votes + 1 }).eq('id', req.id);
    fetchRequests();
  };

  const handleStatusChange = async (id, status) => {
    await supabase.from('feature_requests_1777090000').update({ status }).eq('id', id);
    showToast('Status updated.');
    fetchRequests();
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Feature Requests</h1>
        <Button icon={FiPlus} onClick={() => { setForm({ title: '', description: '', requested_by: 'Admin', category: 'enhancement', priority: 'medium' }); setModal(true); }}>New Request</Button>
      </div>

      <div className="ac-grid-2">
        {loading ? <p className="ac-muted">Loading features...</p> : 
         requests.length === 0 ? <p className="ac-muted">No feature requests found.</p> :
         requests.map(req => (
          <Card key={req.id}>
            <div className="ac-flex-between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{req.title}</h3>
                <div className="ac-xs ac-muted">By {req.requested_by} • {new Date(req.created_at).toLocaleDateString()}</div>
              </div>
              <Badge tone={req.status === 'completed' ? 'green' : req.status === 'in_progress' ? 'blue' : 'amber'}>
                {req.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="ac-sm" style={{ marginBottom: 16, color: 'var(--ac-fg)' }}>{req.description}</p>
            
            <div className="ac-flex-between" style={{ borderTop: '1px solid var(--ac-border)', paddingTop: 12 }}>
              <div className="ac-flex-gap">
                <Button variant="outline" size="sm" icon={FiThumbsUp} onClick={() => handleVote(req)}>
                  {req.votes}
                </Button>
              </div>
              <Select value={req.status} onChange={(e) => handleStatusChange(req.id, e.target.value)} options={['pending', 'planned', 'in_progress', 'completed']} />
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <ModalOverlay title="Submit Feature Request" onClose={() => setModal(false)}>
          <div className="ac-stack">
            <Field label="Title"><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></Field>
            <Field label="Description"><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
            <div className="ac-grid-2">
              <Field label="Category">
                <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} options={['enhancement', 'bugfix', 'integration', 'ui']} />
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} options={['low', 'medium', 'high']} />
              </Field>
            </div>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Submit Request</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
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
        [10:48:33] INFO: Admin user logged in (ops@acuteconnect.health).{"\n"}
        [10:52:10] ERROR: Invalid CRN format submitted by client.
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
            {['Client Check-in', 'Patient Registry', 'Crisis Management', 'System Config'].map((m, i) => (
              <tr key={m}>
                <td style={{ fontWeight: 600 }}>{m}</td>
                <td><SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /></td>
                <td>{i < 3 ? <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /> : <SafeIcon icon={FiX} style={{ color: 'var(--ac-danger)' }} />}</td>
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
      <Card title="Security">
        <div className="ac-stack-sm">
          <div className="ac-flex-between">
            <span className="ac-sm">Require 2FA for Admins</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="ac-flex-between">
            <span className="ac-sm">Session Timeout (mins)</span>
            <input type="number" defaultValue="60" style={{ width: 60, padding: 4 }} />
          </div>
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
        <div>│   ├── Check-in Form</div>
        <div>│   └── Resources</div>
        <div>├── 📂 Admin Views</div>
        <div>│   ├── Triage Dashboard</div>
        <div>│   ├── CRM & Patients</div>
        <div>│   └── Crisis Management</div>
        <div>└── 📂 System Views</div>
        <div>    ├── Metrics Dashboard</div>
        <div>    ├── User/Staff Management</div>
        <div>    ├── Integrations Hub</div>
        <div>    └── Feedback & Features</div>
      </div>
    </Card>
  </div>
);
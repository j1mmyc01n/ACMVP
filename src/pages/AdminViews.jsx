import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { generateCRN, cx } from '../lib/utils';
import { supabase } from '../supabase/supabase';
import { Badge, Button, Card, Field, Input, StatusBadge, Textarea, Select } from '../components/UI';

const {
  FiRefreshCw, FiPlus, FiCheckCircle, FiDownload, FiUserPlus, FiX,
  FiCalendar, FiUserX, FiPhone, FiAlertTriangle, FiEdit2, FiShield, FiUserCheck, FiFilter
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
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 450, boxShadow: 'var(--ac-shadow-lg)' }}>
      <div className="ac-flex-between" style={{ marginBottom: 20 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

/* ─── ADMIN DASHBOARD ───────────────────────────────────────────── */
export const AdminPage = () => {
  const [checkins, setCheckins] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCRN, setNewCRN] = useState('');
  const [generatingCRN, setGeneratingCRN] = useState(false);
  const [toast, setToast] = useState('');
  const [convertModal, setConvertModal] = useState(null);
  const [convertForm, setConvertForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [ci, cl] = await Promise.all([
      supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false }),
      supabase.from('clients_1777020684735').select('*'),
    ]);
    setCheckins(ci.data || []);
    setClients(cl.data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleGenerateCRN = async () => {
    setGeneratingCRN(true);
    const code = generateCRN();
    const { error } = await supabase.from('crns_1740395000').insert([{ code, is_active: true }]);
    if (!error) { setNewCRN(code); showToast(`CRN ${code} generated successfully!`); fetchAll(); }
    else alert(error.message);
    setGeneratingCRN(false);
  };

  const handleConvertCheckin = async () => {
    if (!convertForm.name) return alert('Name is required');
    const { error } = await supabase.from('clients_1777020684735').insert([{ 
      name: convertForm.name, 
      email: convertForm.email, 
      phone: convertForm.phone,
      crn: convertModal.crn 
    }]);
    if (!error) {
      showToast('Client profile linked securely.');
      setConvertModal(null);
      fetchAll();
    } else {
      alert(error.message);
    }
  };

  const pending = checkins.filter(c => c.status === 'pending').length;
  const avgMood = checkins.length ? (checkins.reduce((a, b) => a + (b.mood || 0), 0) / checkins.length).toFixed(1) : '—';

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Clinical Triage</h1>
        <Button variant="outline" icon={FiRefreshCw} onClick={fetchAll}>Refresh</Button>
      </div>

      <div className="ac-grid-4">
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Total Check-ins</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{checkins.length}</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Pending</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: pending > 0 ? 'var(--ac-warn)' : 'inherit' }}>{pending}</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Avg Mood</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ac-primary)' }}>{avgMood}</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Patients</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{clients.length}</div>
        </div>
      </div>

      <div className="ac-grid-2">
        <Card title="Generate CRN">
          <div className="ac-stack-sm">
            <p className="ac-muted ac-xs">Create a new Clinical Reference Number and assign to a patient.</p>
            <Button variant="primary" icon={FiPlus} onClick={handleGenerateCRN} disabled={generatingCRN}>
              {generatingCRN ? 'Generating…' : 'New CRN'}
            </Button>
            {newCRN && (
              <div style={{ background: 'var(--ac-primary-soft)', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid var(--ac-primary)', marginTop: 4 }}>
                <div className="ac-xs" style={{ color: 'var(--ac-primary)', fontWeight: 700 }}>GENERATED</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>{newCRN}</div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Today's Pulse">
          <div className="ac-grid-2" style={{ gap: 8 }}>
            <div style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div className="ac-muted ac-xs">High Priority</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ac-danger)' }}>
                {checkins.filter(c => c.mood <= 3).length}
              </div>
            </div>
            <div style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div className="ac-muted ac-xs">Moderate</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ac-warn)' }}>
                {checkins.filter(c => c.mood > 3 && c.mood <= 6).length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recent Check-ins">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>CRN</th><th>Patient</th><th>Mood</th><th>Window</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
              ) : checkins.length === 0 ? (
                <tr><td colSpan="5" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No check-ins yet.</td></tr>
              ) : checkins.map(c => {
                const client = clients.find(cl => cl.crn === c.crn);
                return (
                  <tr key={c.id}>
                    <td className="ac-mono" style={{ fontWeight: 600, fontSize: 12 }}>{c.crn}</td>
                    <td>
                      {client ? (
                        client.name
                      ) : (
                        <Button variant="outline" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => { setConvertForm({name:'', phone:'', email:''}); setConvertModal(c); }}>
                          Convert to Patient
                        </Button>
                      )}
                    </td>
                    <td>
                      <Badge tone={c.mood <= 3 ? 'red' : c.mood <= 6 ? 'amber' : 'green'}>{c.mood}/10</Badge>
                    </td>
                    <td className="ac-muted ac-xs">{c.scheduled_window || '—'}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {convertModal && (
        <ModalOverlay title="Convert to Patient" onClose={() => setConvertModal(null)}>
          <div className="ac-stack">
            <p className="ac-muted ac-xs">Link CRN <strong className="ac-mono">{convertModal.crn}</strong> securely to a new patient profile.</p>
            <Field label="Full Name"><Input value={convertForm.name} onChange={e => setConvertForm({...convertForm, name: e.target.value})} /></Field>
            <Field label="Email"><Input type="email" value={convertForm.email} onChange={e => setConvertForm({...convertForm, email: e.target.value})} /></Field>
            <Field label="Phone"><Input value={convertForm.phone} onChange={e => setConvertForm({...convertForm, phone: e.target.value})} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setConvertModal(null)}>Cancel</Button>
              <Button onClick={handleConvertCheckin}>Create Patient Profile</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── CLIENT CRM PAGE WITH CATEGORIES ───────────────────────────────────────────────────────────────── */
export const CRMPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
  const [offboardReason, setOffboardReason] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCentre, setFilterCentre] = useState('all');

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleEdit = async () => {
    const { error } = await supabase.from('clients_1777020684735').update({
      name: form.name, email: form.email, phone: form.phone, support_category: form.support_category, care_centre: form.care_centre
    }).eq('id', selectedClient.id);
    if (!error) { showToast('Client profile updated.'); setModalMode(null); fetchClients(); }
    else alert(error.message);
  };

  const handleOffboard = async () => {
    if (!offboardReason) return alert('Please provide a reason for offboarding.');
    const { error } = await supabase.from('clients_1777020684735').update({
      status: 'offboarded', offboard_reason: offboardReason
    }).eq('id', selectedClient.id);
    if (!error) { showToast('Client successfully offboarded.'); setModalMode(null); fetchClients(); }
    else alert(error.message);
  };

  const syncCalendar = () => {
    showToast('Calendar sync initiated for external CRM.');
  };

  const filteredClients = clients.filter(c => {
    const matchCategory = filterCategory === 'all' || c.support_category === filterCategory;
    const matchCentre = filterCentre === 'all' || c.care_centre === filterCentre;
    return matchCategory && matchCentre;
  });

  const categories = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing'];
  const centres = ['Main Campus', 'North Clinic', 'Camperdown Medical'];

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Client CRM</h1>
        <Button variant="outline" icon={FiCalendar} onClick={syncCalendar}>Sync Calendars</Button>
      </div>

      <div className="ac-grid-2" style={{ marginBottom: 16 }}>
        <Field label="Filter by Support Category">
          <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} options={['all', ...categories]} />
        </Field>
        <Field label="Filter by Care Centre">
          <Select value={filterCentre} onChange={e => setFilterCentre(e.target.value)} options={['all', ...centres]} />
        </Field>
      </div>

      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Name</th><th>CRN</th><th>Support Category</th><th>Care Centre</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
               : filteredClients.length === 0 ? <tr><td colSpan="7" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No clients found.</td></tr>
               : filteredClients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="ac-mono ac-xs">{c.crn}</td>
                  <td>
                    <Badge tone={c.support_category === 'crisis' ? 'red' : c.support_category === 'mental_health' ? 'amber' : 'blue'}>
                      {c.support_category || 'general'}
                    </Badge>
                  </td>
                  <td className="ac-xs">{c.care_centre || '—'}</td>
                  <td>
                    <div className="ac-xs">{c.email || '—'}</div>
                    <div className="ac-xs ac-muted">{c.phone || '—'}</div>
                  </td>
                  <td><StatusBadge status={c.status || 'active'} /></td>
                  <td>
                    {c.status !== 'offboarded' && (
                      <div className="ac-flex-gap">
                        <button className="ac-icon-btn" onClick={() => { 
                          setSelectedClient(c); 
                          setForm({ 
                            name: c.name, 
                            email: c.email, 
                            phone: c.phone, 
                            support_category: c.support_category || 'general',
                            care_centre: c.care_centre || ''
                          }); 
                          setModalMode('edit'); 
                        }}>
                          <SafeIcon icon={FiEdit2} size={14} />
                        </button>
                        <button className="ac-icon-btn" style={{ color: 'var(--ac-danger)' }} onClick={() => { setSelectedClient(c); setOffboardReason(''); setModalMode('offboard'); }}>
                          <SafeIcon icon={FiUserX} size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalMode === 'edit' && (
        <ModalOverlay title="Edit Client Profile" onClose={() => setModalMode(null)}>
          <div className="ac-stack">
            <Field label="Full Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Support Category">
              <Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={categories} />
            </Field>
            <Field label="Care Centre">
              <Select value={form.care_centre} onChange={e => setForm({ ...form, care_centre: e.target.value })} options={['', ...centres]} />
            </Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {modalMode === 'offboard' && (
        <ModalOverlay title="Offboard Client" onClose={() => setModalMode(null)}>
          <div className="ac-stack">
            <p className="ac-muted ac-xs">You are about to offboard <strong>{selectedClient.name}</strong>. This action will mark them as inactive.</p>
            <Field label="Reason for Offboarding">
              <Textarea value={offboardReason} onChange={e => setOffboardReason(e.target.value)} placeholder="e.g. Treatment completed, transferred..." />
            </Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <Button style={{ background: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }} onClick={handleOffboard}>Confirm Offboard</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── CRISIS MANAGEMENT ─────────────────────────────────────────── */
export const CrisisPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ client_name: '', client_crn: '', location: '', severity: 'high', crisis_type: 'mental_health', notes: '' });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('crisis_events_1777090000').select('*').order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleCreate = async () => {
    if (!form.client_name) return alert('Client name is required');
    const { error } = await supabase.from('crisis_events_1777090000').insert([form]);
    if (!error) { showToast('Crisis Event Raised!'); setModal(false); fetchEvents(); }
  };

  const handleDispatch = async (event, type) => {
    const update = type === 'police' ? { police_requested: true } : { ambulance_requested: true };
    await supabase.from('crisis_events_1777090000').update(update).eq('id', event.id);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} dispatched.`);
    fetchEvents();
  };

  const handleResolve = async (event) => {
    await supabase.from('crisis_events_1777090000').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', event.id);
    showToast('Crisis Event Resolved.');
    fetchEvents();
  };

  const handleAssignTeam = async (event) => {
    const newTeam = [...(event.assigned_team || []), 'Dr. Smith'];
    await supabase.from('crisis_events_1777090000').update({ assigned_team: newTeam }).eq('id', event.id);
    showToast('Team member assigned.');
    fetchEvents();
  };

  const activeEvents = events.filter(e => e.status === 'active');
  const resolvedEvents = events.filter(e => e.status === 'resolved');

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Crisis Management</h1>
        <Button style={{ background: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }} icon={FiAlertTriangle} onClick={() => { setForm({ client_name: '', client_crn: '', location: '', severity: 'high', crisis_type: 'mental_health', notes: '' }); setModal(true); }}>
          Raise Event
        </Button>
      </div>

      <div className="ac-grid-2">
        <Card title="Active Events" subtitle="Requires immediate attention">
          <div className="ac-stack-sm">
            {activeEvents.length === 0 ? <p className="ac-muted">No active crisis events.</p> : activeEvents.map(e => (
              <div key={e.id} style={{ border: '1px solid var(--ac-danger)', borderRadius: 12, padding: 16, background: 'var(--ac-surface)' }}>
                <div className="ac-flex-between" style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{e.client_name} <span className="ac-mono ac-xs">{e.client_crn}</span></div>
                  <Badge tone="red">{e.severity.toUpperCase()}</Badge>
                </div>
                <div className="ac-muted ac-xs" style={{ marginBottom: 12 }}>{e.location}</div>
                <div style={{ background: 'var(--ac-bg)', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{e.notes || 'No additional notes provided.'}</div>
                
                <div className="ac-flex-gap" style={{ flexWrap: 'wrap' }}>
                  <Button variant="outline" size="sm" onClick={() => handleAssignTeam(e)} icon={FiUserCheck}>
                    Assign Me
                  </Button>
                  <Button variant="outline" size="sm" disabled={e.police_requested} onClick={() => handleDispatch(e, 'police')} icon={FiShield}>
                    {e.police_requested ? 'Police Dispatched' : 'Request Police'}
                  </Button>
                  <Button variant="outline" size="sm" disabled={e.ambulance_requested} onClick={() => handleDispatch(e, 'ambulance')} icon={FiPhone}>
                    {e.ambulance_requested ? 'Ambulance Dispatched' : 'Request Ambulance'}
                  </Button>
                  <Button style={{ marginLeft: 'auto' }} size="sm" onClick={() => handleResolve(e)} icon={FiCheckCircle}>Resolve</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="ac-stack">
          <Card title="Resolved Events">
            <div className="ac-stack-sm">
              {resolvedEvents.slice(0, 5).map(e => (
                <div key={e.id} className="ac-flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--ac-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.client_name}</div>
                    <div className="ac-muted ac-xs">{new Date(e.resolved_at).toLocaleString()}</div>
                  </div>
                  <StatusBadge status="resolved" />
                </div>
              ))}
              {resolvedEvents.length === 0 && <p className="ac-muted">No resolved events.</p>}
            </div>
          </Card>
        </div>
      </div>

      {modal && (
        <ModalOverlay title="Raise Crisis Event" onClose={() => setModal(false)}>
          <div className="ac-stack">
            <Field label="Client Name"><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></Field>
            <div className="ac-grid-2">
              <Field label="CRN (Optional)"><Input value={form.client_crn} onChange={e => setForm({ ...form, client_crn: e.target.value })} /></Field>
              <Field label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
            </div>
            <div className="ac-grid-2">
              <Field label="Severity">
                <Select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} options={['high', 'critical', 'medium']} />
              </Field>
              <Field label="Type">
                <Select value={form.crisis_type} onChange={e => setForm({ ...form, crisis_type: e.target.value })} options={['mental_health', 'medical', 'violence', 'substance']} />
              </Field>
            </div>
            <Field label="Notes"><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
              <Button style={{ background: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }} onClick={handleCreate}>Raise Event</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── INVOICING & BILLING ───────────────────────────────────────── */
export const InvoicingPage = () => {
  const [invoices] = useState([
    { id: 'INV-1001', provider: 'Camperdown Medical', amount: '$4,200', status: 'pending', date: '2023-10-01' },
    { id: 'INV-1002', provider: 'Newtown Support Center', amount: '$1,850', status: 'paid', date: '2023-09-28' },
    { id: 'INV-1003', provider: 'Dr. Smith (Unit 4)', amount: '$3,100', status: 'pending', date: '2023-10-02' },
  ]);

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Invoicing & Billing</h1>
        <Button icon={FiDownload}>Export for Billing Agency</Button>
      </div>
      <div className="ac-grid-3">
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Total Outstanding</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ac-warn)' }}>$7,300</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Paid This Month</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ac-success)' }}>$12,450</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Active Providers</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>8</div>
        </div>
      </div>
      <Card title="Recent Invoices">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Invoice ID</th><th>Provider / Care Centre</th><th>Date</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="ac-mono" style={{ fontWeight: 600 }}>{inv.id}</td>
                  <td>{inv.provider}</td>
                  <td className="ac-muted ac-xs">{inv.date}</td>
                  <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                  <td><Badge tone={inv.status === 'paid' ? 'green' : 'amber'}>{inv.status.toUpperCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ─── EXISTING ADMIN PAGES (Clients, Reports, CRN) ─────────────── */
export const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [toast, setToast] = useState('');

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleCreate = async () => {
    if (!form.name) return alert('Name is required.');
    const crn = generateCRN();
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    await supabase.from('clients_1777020684735').insert([{ ...form, crn }]);
    showToast(`Patient registered — CRN: ${crn}`);
    setShowForm(false);
    fetchClients();
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Patient Registry</h1>
        <Button variant="primary" icon={FiUserPlus} onClick={() => setShowForm(true)}>Register Patient</Button>
      </div>

      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Name</th><th>CRN</th><th>Email</th><th>Phone</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
               : clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="ac-mono ac-xs">{c.crn}</td>
                  <td className="ac-muted ac-xs">{c.email || '—'}</td>
                  <td className="ac-muted ac-xs">{c.phone || '—'}</td>
                  <td className="ac-muted ac-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <ModalOverlay title="New Patient" onClose={() => setShowForm(false)}>
          <div className="ac-stack">
            <Field label="Full Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create & Assign CRN</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export const ReportsPage = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false }).then(({ data }) => setData(data || []));
  }, []);

  const exportCSV = () => {
    const rows = [['Date', 'CRN', 'Mood', 'Window', 'Status']];
    data.forEach(d => rows.push([new Date(d.created_at).toLocaleDateString(), d.crn, d.mood, d.scheduled_window || '', d.status]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `checkins_${Date.now()}.csv`; a.click();
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Clinical Reports</h1>
        <Button variant="outline" icon={FiDownload} onClick={exportCSV} disabled={!data.length}>Export CSV</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Date</th><th>CRN</th><th>Mood</th><th>Window</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="ac-mono ac-xs">{d.crn}</td>
                  <td><Badge tone={d.mood <= 3 ? 'red' : d.mood <= 6 ? 'amber' : 'green'}>{d.mood}/10</Badge></td>
                  <td className="ac-muted ac-xs">{d.scheduled_window || '—'}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const CRNPage = () => {
  const [crns, setCrns] = useState([]);
  useEffect(() => {
    supabase.from('crns_1740395000').select('*').order('created_at', { ascending: false }).then(({ data }) => setCrns(data || []));
  }, []);

  return (
    <div className="ac-stack">
      <h1 className="ac-h1">CRN Registry</h1>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Reference Code</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {crns.map(c => (
                <tr key={c.id}>
                  <td className="ac-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                  <td><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></td>
                  <td className="ac-muted ac-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
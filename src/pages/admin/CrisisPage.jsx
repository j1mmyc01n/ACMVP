import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, Select, StatusBadge, Textarea } from '../../components/UI';

const { FiAlertTriangle, FiCheckCircle, FiX, FiUserCheck, FiShield, FiPhone } = FiIcons;

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
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 450, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 20 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default function CrisisPage() {
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
    else alert(error.message);
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
}
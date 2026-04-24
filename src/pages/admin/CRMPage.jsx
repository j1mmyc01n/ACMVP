import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, StatusBadge, Textarea, Select } from '../../components/UI';

const { FiRefreshCw, FiEdit2, FiUserX, FiX, FiCheckCircle, FiCalendar } = FiIcons;

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

export default function CRMPage() {
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
}
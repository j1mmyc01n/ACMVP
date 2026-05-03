import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { generateCRN } from '../../lib/utils';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, Select } from '../../components/UI';

const { FiUserPlus, FiX, FiCheckCircle } = FiIcons;

const Toast = ({ msg, onClose }) => (
  <div className="ac-toast">
    <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

export default function PatientRegistry() {
  const [clients, setClients] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchClients();
    fetchCentres();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients_1777020684735').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const fetchCentres = async () => {
    const { data, error } = await supabase.from('care_centres_1777090000').select('*').order('name');
    if (!error && data) setCentres(data);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleCreate = async () => {
    if (!form.name) return alert('Name is required.');
    const centre = centres.find(c => c.name === form.care_centre);
    const crnPrefix = centre?.suffix?.toUpperCase() || 'CRN';
    const crn = generateCRN(crnPrefix);
    await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    const { error } = await supabase.from('clients_1777020684735').insert([{
      ...form, crn, status: 'active', care_centre: form.care_centre || null
    }]);
    if (!error) {
      showToast(`Patient registered — CRN: ${crn}`);
      setForm({ name: '', phone: '', email: '', support_category: 'general', care_centre: '' });
      fetchClients();
    } else { alert(error.message); }
  };

  const categories = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing'];
  const centreOptions = centres.length > 0
    ? [{ value: '', label: '-- Select Care Centre --' }, ...centres.map(c => ({ value: c.name, label: c.name }))]
    : [{ value: '', label: '-- No Care Centres in DB --' }];

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">Patient Registry</h1>

      <div className="ac-grid-2" style={{ gap: 24 }}>
        <Card title="Register New Patient">
          <div className="ac-stack">
            <p className="ac-muted ac-xs">Auto-generates a CRN and adds the patient to the CRM.</p>
            <Field label="Full Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" /></Field>
            <Field label="Support Category">
              <Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={categories} />
            </Field>
            <Field label="Care Centre">
              <Select value={form.care_centre} onChange={e => setForm({ ...form, care_centre: e.target.value })} options={centreOptions} />
            </Field>
            <Button icon={FiUserPlus} onClick={handleCreate} style={{ marginTop: 8 }}>Register & Add to CRM</Button>
          </div>
        </Card>

        <Card title="Recently Registered">
          <div className="ac-stack-sm">
            {loading ? <p className="ac-muted">Loading...</p> : clients.slice(0, 10).map(c => (
              <div key={c.id} style={{ padding: 12, background: 'var(--ac-bg)', borderRadius: 8 }}>
                <div className="ac-flex-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <Badge tone="violet">{c.crn}</Badge>
                </div>
                <div className="ac-xs ac-muted">
                  {c.support_category || 'general'} •{' '}
                  {c.care_centre
                    ? <span style={{ color: 'var(--ac-success)', fontWeight: 600 }}>{c.care_centre}</span>
                    : 'Not assigned'}
                </div>
              </div>
            ))}
            {!loading && clients.length === 0 && <p className="ac-muted">No patients registered yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
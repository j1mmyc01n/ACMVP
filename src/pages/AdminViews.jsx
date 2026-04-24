import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { generateCRN } from '../lib/utils';
import { supabase } from '../supabase/supabase';
import { Badge, Button, Card, Field, Input, StatusBadge } from '../components/UI';

const {
  FiRefreshCw, FiPlus, FiCheckCircle, FiDownload, FiUserPlus, FiX
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

export const AdminPage = () => {
  const [checkins, setCheckins] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCRN, setNewCRN] = useState('');
  const [generatingCRN, setGeneratingCRN] = useState(false);
  const [toast, setToast] = useState('');

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
                    <td>{client?.name || <span className="ac-muted">Unlinked</span>}</td>
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
    </div>
  );
};

export const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
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
    if (!form.name) { alert('Name is required.'); return; }
    setSubmitting(true);
    const crn = generateCRN();
    const { error: e1 } = await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);
    if (e1) { alert(e1.message); setSubmitting(false); return; }
    const { error: e2 } = await supabase.from('clients_1777020684735').insert([{ ...form, crn }]);
    if (e2) { alert(e2.message); setSubmitting(false); return; }
    showToast(`Patient ${form.name} registered — CRN: ${crn}`);
    setShowForm(false);
    setForm({ name: '', phone: '', email: '' });
    fetchClients();
    setSubmitting(false);
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
              {loading ? (
                <tr><td colSpan="5" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="5" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No patients yet.</td></tr>
              ) : clients.map(c => (
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
          <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: 'var(--ac-shadow-lg)' }}>
            <div className="ac-flex-between" style={{ marginBottom: 20 }}>
              <h2 className="ac-h2">New Patient</h2>
              <button className="ac-icon-btn" onClick={() => setShowForm(false)}><SafeIcon icon={FiX} size={16} /></button>
            </div>
            <div className="ac-stack">
              <Field label="Full Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 4XX XXX XXX" /></Field>
              <div className="ac-grid-2" style={{ marginTop: 8 }}>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating…' : 'Create & Assign CRN'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReportsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setData(data || []); setLoading(false); });
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
              {loading ? <tr><td colSpan="5" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
               : data.map(d => (
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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchCrns(); }, []);

  const fetchCrns = async () => {
    setLoading(true);
    const { data } = await supabase.from('crns_1740395000').select('*').order('created_at', { ascending: false });
    setCrns(data || []);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const code = generateCRN();
    const { error } = await supabase.from('crns_1740395000').insert([{ code, is_active: true }]);
    if (!error) { setToast(`CRN ${code} created!`); setTimeout(() => setToast(''), 3500); fetchCrns(); }
    setGenerating(false);
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">CRN Registry</h1>
        <Button variant="primary" icon={FiPlus} onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : 'New CRN'}
        </Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Reference Code</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="3" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
               : crns.map(c => (
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
import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { generateCRN } from '../../lib/utils';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, StatusBadge, Textarea } from '../../components/UI';

const { FiRefreshCw, FiPlus, FiCheckCircle, FiX } = FiIcons;

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

export default function TriageDashboard() {
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
      crn: convertModal.crn,
      support_category: 'general',
      status: 'active'
    }]);
    if (!error) {
      showToast('Client converted to patient and synced to CRM.');
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
        <h1 className="ac-h1">Clinical Triage Dashboard</h1>
        <Button variant="outline" icon={FiRefreshCw} onClick={fetchAll}>Refresh</Button>
      </div>

      <div className="ac-grid-4">
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Total Check-ins</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{checkins.length}</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Needs Review</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: pending > 0 ? 'var(--ac-warn)' : 'inherit' }}>{pending}</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Avg Mood</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ac-primary)' }}>{avgMood}</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Registered Patients</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{clients.length}</div>
        </div>
      </div>

      <div className="ac-grid-2">
        <Card title="CRN Generator System">
          <div className="ac-stack-sm">
            <p className="ac-muted ac-xs">Generate a unique Clinical Reference Number for patient assignment.</p>
            <Button variant="primary" icon={FiPlus} onClick={handleGenerateCRN} disabled={generatingCRN}>
              {generatingCRN ? 'Generating…' : 'Generate New CRN'}
            </Button>
            {newCRN && (
              <div style={{ background: 'var(--ac-primary-soft)', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid var(--ac-primary)', marginTop: 4 }}>
                <div className="ac-xs" style={{ color: 'var(--ac-primary)', fontWeight: 700 }}>GENERATED CRN</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 }}>{newCRN}</div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Today's Priority Breakdown">
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

      <Card title="Recent Check-ins (Auto-Sync to CRM)">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>CRN</th><th>Patient</th><th>Mood</th><th>Window</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="ac-center" style={{ padding: 24 }}>Loading…</td></tr>
              ) : checkins.length === 0 ? (
                <tr><td colSpan="6" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No check-ins yet.</td></tr>
              ) : checkins.map(c => {
                const client = clients.find(cl => cl.crn === c.crn);
                return (
                  <tr key={c.id}>
                    <td className="ac-mono" style={{ fontWeight: 600, fontSize: 12 }}>{c.crn}</td>
                    <td>
                      {client ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{client.name}</div>
                          <div className="ac-xs ac-muted">Synced to CRM</div>
                        </div>
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
                    <td className="ac-muted ac-xs">{client ? '✓ In CRM' : '—'}</td>
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
            <p className="ac-muted ac-xs">Link CRN <strong className="ac-mono">{convertModal.crn}</strong> to a patient profile and sync to CRM.</p>
            <Field label="Full Name"><Input value={convertForm.name} onChange={e => setConvertForm({...convertForm, name: e.target.value})} /></Field>
            <Field label="Email"><Input type="email" value={convertForm.email} onChange={e => setConvertForm({...convertForm, email: e.target.value})} /></Field>
            <Field label="Phone"><Input value={convertForm.phone} onChange={e => setConvertForm({...convertForm, phone: e.target.value})} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setConvertModal(null)}>Cancel</Button>
              <Button onClick={handleConvertCheckin}>Create & Sync to CRM</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
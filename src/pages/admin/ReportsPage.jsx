import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, StatusBadge, Field, Textarea } from '../../components/UI';
import { generateClinicalReport } from '../../lib/clinicalReport';

const { FiDownload, FiEdit2, FiSave, FiX, FiCheckCircle, FiFileText } = FiIcons;

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
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 600, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 20 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

// Medically formatted clinical-report PDF generation lives in
// src/lib/clinicalReport.js. The download itself records an audit entry.
const handleDownload = async (record, onSuccess) => {
  try {
    await generateClinicalReport(record, { actor: 'admin@acuteconnect.health' });
    onSuccess?.('Clinical report opened — use Print / Save as PDF.');
  } catch (err) {
    alert(`Could not generate report: ${err?.message || err}`);
  }
};

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false });
    setData(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const exportCSV = () => {
    const rows = [['Date', 'CRN', 'Mood', 'Window', 'Status', 'Clinical Notes']];
    data.forEach(d => rows.push([
      new Date(d.created_at).toLocaleDateString(),
      d.crn, d.mood,
      d.scheduled_window || '',
      d.status,
      (d.clinical_notes || '').replace(/,/g, ';')
    ]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clinical_reports_${Date.now()}.csv`;
    a.click();
    showToast('Clinical report exported successfully.');
  };

  const handleSaveNotes = async () => {
    const { error } = await supabase.from('check_ins_1740395000').update({
      clinical_notes: notes,
      last_edited_by: 'admin@acuteconnect.health',
      last_edited_at: new Date().toISOString()
    }).eq('id', editModal.id);
    if (!error) { showToast('Clinical notes saved.'); setEditModal(null); fetchData(); }
    else alert(error.message);
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Clinical Reports</h1>
        <Button variant="outline" icon={FiDownload} onClick={exportCSV} disabled={!data.length}>Export CSV</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Date</th><th>CRN</th><th>Mood</th><th>Window</th><th>Status</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan="7" className="ac-center" style={{ padding: 24 }}>Loading...</td></tr>
                : data.length === 0
                  ? <tr><td colSpan="7" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No data available.</td></tr>
                  : data.map(d => (
                    <tr key={d.id}>
                      <td>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="ac-mono ac-xs">{d.crn}</td>
                      <td><Badge tone={d.mood <= 3 ? 'red' : d.mood <= 6 ? 'amber' : 'green'}>{d.mood}/10</Badge></td>
                      <td className="ac-muted ac-xs">{d.scheduled_window || '—'}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        {d.clinical_notes
                          ? <div className="ac-flex-gap"><SafeIcon icon={FiFileText} size={14} style={{ color: 'var(--ac-success)' }} /><span className="ac-xs ac-muted">Attached</span></div>
                          : <span className="ac-xs ac-muted">—</span>}
                      </td>
                      <td>
                        <div className="ac-flex-gap">
                          <button className="ac-icon-btn" title="Edit Notes" onClick={() => { setEditModal(d); setNotes(d.clinical_notes || ''); }}>
                            <SafeIcon icon={FiEdit2} size={14} />
                          </button>
                          <button className="ac-icon-btn" title="Download Report" onClick={() => handleDownload(d, showToast)}>
                            <SafeIcon icon={FiDownload} size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </Card>

      {editModal && (
        <ModalOverlay title={`Clinical Notes — ${editModal.crn}`} onClose={() => setEditModal(null)}>
          <div className="ac-stack">
            <div style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-between ac-xs ac-muted">
                <span>Date: {new Date(editModal.created_at).toLocaleDateString()}</span>
                <Badge tone={editModal.mood <= 3 ? 'red' : editModal.mood <= 6 ? 'amber' : 'green'}>Mood: {editModal.mood}/10</Badge>
              </div>
            </div>
            <Field label="Clinical Notes">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add clinical observations, treatment notes, follow-up recommendations..." rows={8} />
            </Field>
            {editModal.last_edited_by && (
              <div className="ac-xs ac-muted">Last edited by {editModal.last_edited_by} on {new Date(editModal.last_edited_at).toLocaleString()}</div>
            )}
            <div className="ac-grid-2" style={{ marginTop: 8 }}>
              <Button variant="outline" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button icon={FiSave} onClick={handleSaveNotes}>Save Notes</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
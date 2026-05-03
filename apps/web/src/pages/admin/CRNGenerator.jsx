import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { generateCRN } from '../../lib/utils';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, StatusBadge } from '../../components/UI';

const { FiPlus, FiRefreshCw, FiCheckCircle, FiX } = FiIcons;

const Toast = ({ msg, onClose }) => (
  <div className="ac-toast">
    <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

export default function CRNGenerator() {
  const [crns, setCrns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [generatedCRN, setGeneratedCRN] = useState('');

  useEffect(() => { fetchCRNs(); }, []);

  const fetchCRNs = async () => {
    setLoading(true);
    const { data } = await supabase.from('crns_1740395000').select('*').order('created_at', { ascending: false });
    setCrns(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleGenerate = async () => {
    const code = generateCRN();
    const { error } = await supabase.from('crns_1740395000').insert([{ code, is_active: true }]);
    if (!error) {
      setGeneratedCRN(code);
      showToast(`CRN ${code} generated successfully!`);
      fetchCRNs();
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">CRN Generator</h1>

      <div className="ac-grid-2">
        <Card title="Generate New CRN">
          <div className="ac-stack">
            <p className="ac-muted ac-xs">
              Clinical Reference Numbers are unique identifiers for patient records. 
              Click below to generate a new CRN.
            </p>
            <Button variant="primary" icon={FiPlus} onClick={handleGenerate}>
              Generate CRN
            </Button>
            {generatedCRN && (
              <div style={{ 
                background: 'var(--ac-primary-soft)', 
                padding: 20, 
                borderRadius: 12, 
                textAlign: 'center', 
                border: '2px solid var(--ac-primary)',
                marginTop: 12
              }}>
                <div className="ac-xs" style={{ color: 'var(--ac-primary)', fontWeight: 700, marginBottom: 8 }}>
                  ✓ GENERATED
                </div>
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 800, 
                  fontFamily: 'monospace', 
                  letterSpacing: 2,
                  color: 'var(--ac-primary)'
                }}>
                  {generatedCRN}
                </div>
                <div className="ac-xs ac-muted" style={{ marginTop: 8 }}>
                  This CRN is now available in the registry
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Generation Stats">
          <div className="ac-stack-sm">
            <div style={{ background: 'var(--ac-bg)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
              <div className="ac-muted ac-xs">Total CRNs Generated</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ac-primary)', marginTop: 4 }}>
                {crns.length}
              </div>
            </div>
            <div style={{ background: 'var(--ac-bg)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
              <div className="ac-muted ac-xs">Active CRNs</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ac-success)', marginTop: 4 }}>
                {crns.filter(c => c.is_active).length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="CRN Registry">
        <div className="ac-flex-between" style={{ marginBottom: 16 }}>
          <p className="ac-muted ac-xs">All generated Clinical Reference Numbers</p>
          <Button variant="outline" icon={FiRefreshCw} onClick={fetchCRNs} size="sm">Refresh</Button>
        </div>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Reference Code</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="ac-center" style={{ padding: 24 }}>Loading...</td></tr>
              ) : crns.length === 0 ? (
                <tr><td colSpan="3" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No CRNs generated yet.</td></tr>
              ) : crns.map(c => (
                <tr key={c.id}>
                  <td className="ac-mono" style={{ fontWeight: 600, fontSize: 14, letterSpacing: 1 }}>{c.code}</td>
                  <td><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></td>
                  <td className="ac-muted ac-xs">{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
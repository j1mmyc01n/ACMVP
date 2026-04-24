import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { cx, generateCRN, callClaudeAI } from '../lib/utils';
import { supabase } from '../supabase/supabase';
import { Badge, Button, Card, Field, Input, StatusBadge } from '../components/UI';

const { FiSearch, FiRefreshCw, FiExternalLink, FiPlus, FiTerminal, FiCheckCircle } = FiIcons;

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('triage');
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [triageResult, setTriageResult] = useState(null);
  const [triaging, setTriaging] = useState(false);
  const [newCRN, setNewCRN] = useState('');
  const [generatingCRN, setGeneratingCRN] = useState(false);

  useEffect(() => {
    fetchCheckins();
  }, []);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('check_ins_1740395000')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCheckins(data || []);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCRN = async () => {
    setGeneratingCRN(true);
    try {
      const code = generateCRN();
      const { error } = await supabase
        .from('crns_1740395000')
        .insert([{ code, is_active: true }]);
      
      if (error) throw error;
      setNewCRN(code);
    } catch (err) {
      console.error('Error generating CRN:', err);
      alert("Failed to generate CRN.");
    } finally {
      setGeneratingCRN(false);
    }
  };

  const handleTriage = async (checkin) => {
    setSelectedCheckin(checkin);
    setTriaging(true);
    const result = await callClaudeAI(checkin.concerns || "No specific concerns shared.");
    setTriageResult(result);
    setTriaging(false);
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('check_ins_1740395000')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      fetchCheckins();
      setSelectedCheckin(null);
      setTriageResult(null);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="ac-h1">Admin Dashboard</h1>
        <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={fetchCheckins}>Refresh</Button>
      </div>

      <div className="ac-grid-2">
        <Card title="Quick Actions">
          <div className="ac-stack">
            <Button variant="primary" style={{ width: '100%' }} icon={FiPlus} onClick={handleGenerateCRN} disabled={generatingCRN}>
              {generatingCRN ? "Generating..." : "Generate New CRN"}
            </Button>
            {newCRN && (
              <div style={{ background: 'var(--ac-primary-soft)', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid var(--ac-primary)' }}>
                <div style={{ fontSize: 11, color: 'var(--ac-primary)', fontWeight: 700, marginBottom: 4 }}>NEW CRN GENERATED</div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace' }}>{newCRN}</div>
                <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 4 }}>Share this code with the patient</div>
              </div>
            )}
          </div>
        </Card>
        
        <Card title="Statistics">
          <div className="ac-grid-2">
            <div className="ac-stat-tile">
              <div className="ac-muted ac-xs">Pending</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{checkins.filter(c => c.status === 'pending').length}</div>
            </div>
            <div className="ac-stat-tile">
              <div className="ac-muted ac-xs">Reviewed</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{checkins.filter(c => c.status === 'reviewed').length}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Patient Check-ins">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>CRN</th>
                <th>Mood</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
              ) : checkins.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No check-ins found.</td></tr>
              ) : checkins.map(c => (
                <tr key={c.id}>
                  <td>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.crn}</td>
                  <td><Badge tone={c.mood < 4 ? 'red' : c.mood < 7 ? 'amber' : 'green'}>{c.mood}/10</Badge></td>
                  <td>{c.scheduled_day} - {c.scheduled_window}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => handleTriage(c)}>Triage</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedCheckin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <Card 
            title={`Triage: ${selectedCheckin.crn}`} 
            subtitle="AI-Assisted Patient Assessment"
            style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="ac-stack">
              <div style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>PATIENT CONCERNS</div>
                <div style={{ fontSize: 14, color: 'var(--ac-text)' }}>{selectedCheckin.concerns || "No concerns shared."}</div>
              </div>

              {triaging ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--ac-primary)', fontWeight: 600 }}>AI Analysing...</div>
                </div>
              ) : triageResult && (
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: 16, borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#7C3AED' }}>
                    <SafeIcon icon={FiTerminal} />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>AI TRIAGE REPORT</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#4C1D95', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: 12 }}><strong>Risk Level:</strong> <Badge tone={triageResult.priority === 'High' ? 'red' : triageResult.priority === 'Medium' ? 'amber' : 'green'}>{triageResult.priority}</Badge></div>
                    <div style={{ marginBottom: 12 }}><strong>Summary:</strong> {triageResult.summary}</div>
                    <div><strong>Recommendation:</strong> {triageResult.recommendation}</div>
                  </div>
                </div>
              )}

              <div className="ac-grid-2">
                <Button variant="outline" onClick={() => setSelectedCheckin(null)}>Close</Button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" style={{ flex: 1 }} onClick={() => updateStatus(selectedCheckin.id, 'reviewed')}>Mark Reviewed</Button>
                  <Button style={{ flex: 1 }} icon={FiCheckCircle} onClick={() => updateStatus(selectedCheckin.id, 'completed')}>Complete</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const ClientsPage = () => {
  return (
    <div className="ac-stack">
      <h1 className="ac-h1">Clients Directory</h1>
      <Card title="Clients">
        <p className="ac-muted">Manage active clients below.</p>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--ac-muted)' }}>
          Client management functionality coming soon.
        </div>
      </Card>
    </div>
  );
};

export const CRNPage = () => {
  return (
    <div className="ac-stack">
      <h1 className="ac-h1">CRN Management</h1>
      <Card title="CRNs">
        <p className="ac-muted">View and manage Client Reference Numbers.</p>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--ac-muted)' }}>
          Detailed CRN management functionality coming soon.
        </div>
      </Card>
    </div>
  );
};
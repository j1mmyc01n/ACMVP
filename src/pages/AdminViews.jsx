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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [triageResult, setTriageResult] = useState(null);
  const [triaging, setTriaging] = useState(false);
  const [newCRN, setNewCRN] = useState('');
  const [generatingCRN, setGeneratingCRN] = useState(false);

  useEffect(() => {
    fetchCheckinsAndClients();
  }, []);

  const fetchCheckinsAndClients = async () => {
    setLoading(true);
    try {
      const [checkinsRes, clientsRes] = await Promise.all([
        supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false }),
        supabase.from('clients_1777020684735').select('*')
      ]);
      if (checkinsRes.error) throw checkinsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      setCheckins(checkinsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
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
      alert(`Failed to generate CRN: ${err.message || 'Unknown error'}`);
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
      fetchCheckinsAndClients();
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
        <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={fetchCheckinsAndClients}>Refresh</Button>
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
                <th>Client / CRN</th>
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
              ) : checkins.map(c => {
                const client = clients.find(cl => cl.crn === c.crn);
                return (
                <tr key={c.id}>
                  <td>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.crn}</div>
                    {client && <div className="ac-muted ac-xs" style={{ marginTop: 2 }}>{client.name}</div>}
                  </td>
                  <td><Badge tone={c.mood < 4 ? 'red' : c.mood < 7 ? 'amber' : 'green'}>{c.mood}/10</Badge></td>
                  <td>{c.scheduled_day} - {c.scheduled_window}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => handleTriage(c)}>Triage</Button>
                  </td>
                </tr>
              )})}
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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients_1777020684735')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    setSubmitting(true);
    try {
      // Generate a new CRN for the client
      const newCrn = generateCRN();
      
      const { error: crnError } = await supabase
        .from('crns_1740395000')
        .insert([{ code: newCrn, is_active: true }]);
      if (crnError) throw crnError;

      const { error: clientError } = await supabase
        .from('clients_1777020684735')
        .insert([{
          name: form.name,
          phone: form.phone,
          email: form.email,
          crn: newCrn
        }]);
      if (clientError) throw clientError;

      setShowForm(false);
      setForm({ name: '', phone: '', email: '' });
      fetchClients();
    } catch (err) {
      console.error('Error creating client:', err);
      alert(`Failed to create client: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="ac-h1">Clients Directory</h1>
        <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setShowForm(true)}>New Client</Button>
      </div>
      
      <Card title="Clients" subtitle="Manage active clients and their CRNs">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>CRN</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>No clients found.</td></tr>
              ) : clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.phone}</div>
                    <div className="ac-muted ac-xs">{c.email}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.crn}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <Card title="Create New Client" subtitle="This will automatically generate a CRN." style={{ maxWidth: 400, width: '100%' }}>
            <div className="ac-stack">
              <Field label="Full Name"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Doe" /></Field>
              <Field label="Phone Number"><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="04XX XXX XXX" /></Field>
              <Field label="Email Address"><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" /></Field>
              
              <div className="ac-grid-2" style={{ marginTop: 12 }}>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreateClient} disabled={submitting || !form.name}>
                  {submitting ? "Saving..." : "Create Client"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const CRNPage = () => {
  const [crns, setCrns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrns();
  }, []);

  const fetchCrns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crns_1740395000')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCrns(data || []);
    } catch (err) {
      console.error('Error fetching CRNs:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('crns_1740395000')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchCrns();
    } catch (err) {
      console.error('Error updating CRN:', err);
    }
  };

  return (
    <div className="ac-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="ac-h1">CRN Management</h1>
        <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={fetchCrns}>Refresh</Button>
      </div>
      <Card title="Client Reference Numbers">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
              ) : crns.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>No CRNs found.</td></tr>
              ) : crns.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</td>
                  <td><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(c.id, c.is_active)}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
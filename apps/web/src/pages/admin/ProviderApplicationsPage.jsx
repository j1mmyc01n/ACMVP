import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Badge, Field, Textarea } from '../../components/UI';

const TABS = ['Pending Review', 'Approved', 'Rejected'];

const statusMap = {
  'Pending Review': 'pending',
  'Approved': 'approved',
  'Rejected': 'rejected',
};

function CredBadge({ label, verified, pending }) {
  if (verified) return <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>✓ {label}</span>;
  if (pending) return <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{label} (Pending)</span>;
  return null;
}

export const ProviderApplicationsPage = ({ role }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending Review');
  const [notes, setNotes] = useState({});

  const canAccess = role === 'admin' || role === 'sysadmin';

  useEffect(() => {
    if (!canAccess) return;
    supabase
      .from('providers_1740395000')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setProviders(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [canAccess]);

  if (!canAccess) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--ac-muted)' }}>You do not have permission to view this page.</p>
      </div>
    );
  }

  const filtered = providers.filter(p => (p.status || 'pending') === statusMap[activeTab]);

  const tabCount = (tab) => providers.filter(p => (p.status || 'pending') === statusMap[tab]).length;

  const updateStatus = async (id, status, extra = {}) => {
    const update = { status, ...extra };
    if (status === 'approved') update.verified_at = new Date().toISOString();
    const { error } = await supabase.from('providers_1740395000').update(update).eq('id', id);
    if (!error) setProviders(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
    else alert('Update failed. Please try again.');
  };

  const handleApprove = (p) => {
    if (window.confirm(`Approve application from ${p.name}?`)) {
      updateStatus(p.id, 'approved');
    }
  };

  const handleReject = (p) => {
    const reason = window.prompt(`Reason for rejecting ${p.name}'s application:`);
    if (reason !== null) updateStatus(p.id, 'rejected', { admin_notes: reason });
  };

  const handleRequestInfo = (p) => {
    const msg = window.prompt(`Message to send to ${p.name}:`);
    if (msg) alert(`[Demo] Message to ${p.email}: ${msg}`);
  };

  const saveNotes = async (id, noteText) => {
    await supabase.from('providers_1740395000').update({ admin_notes: noteText }).eq('id', id);
  };

  return (
    <div className="ac-stack">
      <div>
        <h2 className="ac-h2">Provider Applications</h2>
        <p className="ac-muted">Review and approve healthcare provider applications.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--ac-border)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px', fontSize: 14, fontWeight: activeTab === tab ? 700 : 500,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab ? 'var(--ac-primary)' : 'var(--ac-muted)',
              borderBottom: activeTab === tab ? '2.5px solid var(--ac-primary)' : '2.5px solid transparent',
              marginBottom: -1,
            }}>
            {tab} ({tabCount(tab)})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading applications…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <div>No {activeTab.toLowerCase()} applications.</div>
        </div>
      ) : (
        <div className="ac-stack">
          {filtered.map(p => (
            <Card key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>{p.email}</div>
                  {p.provider_type && <div style={{ fontSize: 13, marginTop: 2 }}>{p.provider_type}</div>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              </div>

              {/* Credential info */}
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: 13 }}>
                {p.abn && <div><span style={{ color: 'var(--ac-muted)' }}>ABN:</span> {p.abn}</div>}
                {p.ahpra_number && <div><span style={{ color: 'var(--ac-muted)' }}>AHPRA:</span> {p.ahpra_number}</div>}
                {p.ndis_number && <div><span style={{ color: 'var(--ac-muted)' }}>NDIS:</span> {p.ndis_number}</div>}
                {p.medicare_provider_number && <div><span style={{ color: 'var(--ac-muted)' }}>Medicare:</span> {p.medicare_provider_number}</div>}
              </div>

              {/* Verification badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                <CredBadge label="ABN" verified={p.abn_verified} pending={p.abn && !p.abn_verified} />
                <CredBadge label="AHPRA" verified={p.ahpra_verified} pending={p.ahpra_number && !p.ahpra_verified} />
                <CredBadge label="NDIS" verified={p.ndis_verified} pending={p.ndis_number && !p.ndis_verified} />
                {p.insurance_doc_url && (
                  <a href={p.insurance_doc_url} target="_blank" rel="noopener noreferrer"
                    style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textDecoration: 'none' }}>
                    📄 Insurance Doc
                  </a>
                )}
              </div>

              {/* Qualifications & Bio */}
              {p.qualification && (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: 'var(--ac-muted)', fontSize: 11, textTransform: 'uppercase' }}>Qualifications</span>
                  <div style={{ marginTop: 3, background: 'var(--ac-bg)', borderRadius: 8, padding: '8px 10px' }}>{p.qualification}</div>
                </div>
              )}
              {p.bio && (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: 'var(--ac-muted)', fontSize: 11, textTransform: 'uppercase' }}>Bio</span>
                  <div style={{ marginTop: 3, background: 'var(--ac-bg)', borderRadius: 8, padding: '8px 10px' }}>{p.bio}</div>
                </div>
              )}

              {/* Admin notes */}
              <Field label="Admin Notes" style={{ marginTop: 12 }}>
                <Textarea
                  value={notes[p.id] !== undefined ? notes[p.id] : (p.admin_notes || '')}
                  onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                  onBlur={e => saveNotes(p.id, e.target.value)}
                  placeholder="Internal notes visible only to admins…"
                  style={{ minHeight: 60 }}
                />
              </Field>

              {/* Action buttons */}
              {activeTab === 'Pending Review' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <Button onClick={() => handleApprove(p)}>Approve</Button>
                  <Button variant="outline" onClick={() => handleReject(p)}>Reject</Button>
                  <Button variant="outline" onClick={() => handleRequestInfo(p)}>Request More Info</Button>
                </div>
              )}
              {activeTab === 'Approved' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Button variant="outline" onClick={() => handleReject(p)}>Revoke Approval</Button>
                </div>
              )}
              {activeTab === 'Rejected' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Button onClick={() => handleApprove(p)}>Re-approve</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderApplicationsPage;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Badge } from '../../components/UI';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiDownload, FiEdit2, FiCheck, FiX, FiClock, FiAlertCircle, FiCheckCircle, FiImage, FiSave } = FiIcons;

// ── Toast Notification ────────────────────────────────────────────────
const Toast = ({ msg, type = 'success', onClose }) => (
  <div className={`ac-toast ${type === 'error' ? 'ac-toast-err' : ''}`} style={{ position: 'fixed', top: 76, right: 16, zIndex: 999 }}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle} style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button style={{ background: 'none', border: 0, cursor: 'pointer', padding: 4 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

// ── Edit Modal ─────────────────────────────────────────────────────────
const EditModal = ({ sponsor, isSysAdmin, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    company_name: sponsor.company_name,
    start_date: sponsor.start_date,
    end_date: sponsor.end_date,
    amount: sponsor.amount || 15000,
    receipt_number: sponsor.receipt_number || '',
  });

  const handleSave = () => {
    if (!formData.company_name || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(sponsor.id, formData);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: 'var(--ac-shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Edit Sponsor</h2>
          <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Company Name</label>
            <input 
              className="ac-input"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Company Name"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Start Date</label>
              <input 
                type="date"
                className="ac-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>End Date</label>
              <input 
                type="date"
                className="ac-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Amount ($)</label>
              <input 
                type="number"
                className="ac-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Receipt Number</label>
              <input 
                className="ac-input"
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                placeholder="RCP-001"
              />
            </div>
          </div>

          {!isSysAdmin && (
            <div style={{ padding: 12, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E' }}>
              <SafeIcon icon={FiAlertCircle} size={14} style={{ marginRight: 6 }} />
              <strong>Note:</strong> Changes require SysAdmin approval before taking effect
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button icon={FiSave} onClick={handleSave} style={{ flex: 1 }}>
              {isSysAdmin ? 'Save Changes' : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_BANNER = { title: '', subtitle: '', image_url: '', link_url: '', bg_color: '#4F46E5', active: false };

export default function SponsorLedger({ role }) {
  const [sponsors, setSponsors] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [toast, setToast] = useState('');
  const [banner, setBanner] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sponsor_banner') || 'null') || DEFAULT_BANNER; }
    catch { return DEFAULT_BANNER; }
  });
  const [bannerSaving, setBannerSaving] = useState(false);

  const isSysAdmin = role === 'sysadmin';

  useEffect(() => {
    fetchSponsors();
    fetchPendingChanges();
  }, []);

  const fetchSponsors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sponsors_1777090009')
      .select('*')
      .order('created_at', { ascending: false });
    setSponsors(data || []);
    setLoading(false);
  };

  const fetchPendingChanges = async () => {
    // In production, you'd have a separate table for pending changes
    // For now, using localStorage as a simple demo
    const stored = localStorage.getItem('sponsor_pending_changes');
    if (stored) {
      setPendingChanges(JSON.parse(stored));
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3500);
  };

  const handleSaveEdit = async (sponsorId, formData) => {
    if (isSysAdmin) {
      // SysAdmin can directly apply changes
      const { error } = await supabase
        .from('sponsors_1777090009')
        .update(formData)
        .eq('id', sponsorId);
      if (!error) {
        setEditingSponsor(null);
        showToast('Sponsor updated successfully');
        fetchSponsors();
      } else {
        showToast('Error saving changes', 'error');
      }
      return;
    }

    // Non-sysadmin: create pending change request
    const change = {
      id: `change-${Date.now()}`,
      sponsor_id: sponsorId,
      changes: formData,
      requested_by: 'current_user',
      requested_at: new Date().toISOString(),
      status: 'pending',
    };

    const updated = [...pendingChanges, change];
    setPendingChanges(updated);
    localStorage.setItem('sponsor_pending_changes', JSON.stringify(updated));
    
    setEditingSponsor(null);
    showToast('Changes submitted for SysAdmin approval');
  };

  const handleApproveChange = async (changeId) => {
    const change = pendingChanges.find(c => c.id === changeId);
    if (!change) return;

    // Apply the change to the sponsor
    const { error } = await supabase
      .from('sponsors_1777090009')
      .update(change.changes)
      .eq('id', change.sponsor_id);

    if (!error) {
      // Remove from pending
      const updated = pendingChanges.filter(c => c.id !== changeId);
      setPendingChanges(updated);
      localStorage.setItem('sponsor_pending_changes', JSON.stringify(updated));
      
      showToast('Change approved and applied');
      fetchSponsors();
    } else {
      showToast('Error approving change', 'error');
    }
  };

  const handleRejectChange = (changeId) => {
    const updated = pendingChanges.filter(c => c.id !== changeId);
    setPendingChanges(updated);
    localStorage.setItem('sponsor_pending_changes', JSON.stringify(updated));
    showToast('Change rejected');
  };

  const handleSaveBanner = () => {
    setBannerSaving(true);
    localStorage.setItem('sponsor_banner', JSON.stringify(banner));
    setTimeout(() => { setBannerSaving(false); showToast('Sponsor banner updated'); }, 400);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading ledger...</div>;

  const totalRevenue = sponsors.reduce((acc, s) => acc + (s.amount || 15000), 0);

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast('')} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="ac-h2">Sponsor Ledger</h2>
          <p className="ac-muted">Corporate sponsorship tax spreadsheet and queue management.</p>
        </div>
        <div style={{ background: 'var(--ac-primary-soft)', border: '1px solid var(--ac-primary)', padding: '12px 20px', borderRadius: 12, color: 'var(--ac-primary)', textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Pending Changes - Only visible to SysAdmin */}
      {isSysAdmin && pendingChanges.length > 0 && (
        <Card title="🔔 Pending Approval Requests" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingChanges.map(change => {
              const sponsor = sponsors.find(s => s.id === change.sponsor_id);
              return (
                <div key={change.id} style={{ padding: 14, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{sponsor?.company_name}</div>
                      <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                        Requested {new Date(change.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge tone="amber">Pending</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: '#854D0E', marginBottom: 10 }}>
                    <strong>Changes:</strong> {Object.keys(change.changes).map(key => `${key}: ${change.changes[key]}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleApproveChange(change.id)}
                      className="ac-btn ac-btn-primary"
                      style={{ fontSize: 12, padding: '6px 12px', background: '#10B981', borderColor: '#10B981' }}
                    >
                      <SafeIcon icon={FiCheck} size={13} /> Approve
                    </button>
                    <button 
                      onClick={() => handleRejectChange(change.id)}
                      className="ac-btn ac-btn-outline"
                      style={{ fontSize: 12, padding: '6px 12px', color: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }}
                    >
                      <SafeIcon icon={FiX} size={13} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ac-border)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', whiteSpace: 'nowrap' }}>Date Purchased</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', whiteSpace: 'nowrap' }}>Receipt No.</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', whiteSpace: 'nowrap' }}>Company</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', whiteSpace: 'nowrap' }}>Run Dates</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map(s => {
                const now = new Date();
                const start = s.start_date ? new Date(s.start_date) : new Date(s.created_at);
                const end = s.end_date ? new Date(s.end_date) : new Date(s.created_at);
                let status = 'Completed';
                let stColor = 'gray';
                
                now.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                
                if (start > now) {
                  status = 'Queued';
                  stColor = 'orange';
                } else if (end >= now) {
                  status = 'Active';
                  stColor = 'green';
                }

                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--ac-border)' }}>
                    <td style={{ padding: '12px 16px' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{s.receipt_number || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ac-text)' }}>{s.company_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.start_date ? `${start.toLocaleDateString()} – ${end.toLocaleDateString()}` : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: stColor === 'green' ? '#e6f4ea' : stColor === 'orange' ? '#fef3c7' : '#f1f5f9',
                        color: stColor === 'green' ? '#1e4620' : stColor === 'orange' ? '#92400e' : '#475569'
                      }}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>${(s.amount || 15000).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button 
                        onClick={() => setEditingSponsor(s)}
                        className="ac-icon-btn"
                        title="Edit Sponsor"
                        style={{ width: 32, height: 32 }}
                      >
                        <SafeIcon icon={FiEdit2} size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button icon={FiDownload} onClick={() => window.print()} variant="outline">
          Export Ledger (PDF)
        </Button>
      </div>

      {/* Sponsor Banner Editor — sysadmin only */}
      {isSysAdmin && (
        <Card title="🖼️ Sponsor Banner Editor" subtitle="Configure the promotional banner displayed across the platform">
          {banner.active && (
            <div style={{ background: banner.bg_color || '#4F46E5', borderRadius: 12, padding: '16px 20px', marginBottom: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
              {banner.image_url && <img src={banner.image_url} alt="Sponsor" style={{ height: 40, borderRadius: 8, objectFit: 'contain', background: '#fff' }} onError={e => e.target.style.display = 'none'} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{banner.title || 'Banner Title'}</div>
                {banner.subtitle && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{banner.subtitle}</div>}
              </div>
              {banner.link_url && <a href={banner.link_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>Learn More →</a>}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Banner Title</label>
                <input className="ac-input" value={banner.title} onChange={e => setBanner({ ...banner, title: e.target.value })} placeholder="e.g. Proud Partner — Acme Corp" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Subtitle</label>
                <input className="ac-input" value={banner.subtitle} onChange={e => setBanner({ ...banner, subtitle: e.target.value })} placeholder="e.g. Supporting mental health across Australia" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Logo / Image URL</label>
                <input className="ac-input" value={banner.image_url} onChange={e => setBanner({ ...banner, image_url: e.target.value })} placeholder="https://example.com/logo.png" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Link URL</label>
                <input className="ac-input" value={banner.link_url} onChange={e => setBanner({ ...banner, link_url: e.target.value })} placeholder="https://sponsor.example.com" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Background Colour</label>
                <input type="color" value={banner.bg_color || '#4F46E5'} onChange={e => setBanner({ ...banner, bg_color: e.target.value })} style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--ac-border)', cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={banner.active} onChange={e => setBanner({ ...banner, active: e.target.checked })} style={{ accentColor: 'var(--ac-primary)', width: 16, height: 16 }} />
                  Show banner across platform
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <Button icon={FiSave} onClick={handleSaveBanner} disabled={bannerSaving}>
                {bannerSaving ? 'Saving…' : 'Save Banner'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      {editingSponsor && (
        <EditModal 
          sponsor={editingSponsor}
          isSysAdmin={isSysAdmin}
          onClose={() => setEditingSponsor(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
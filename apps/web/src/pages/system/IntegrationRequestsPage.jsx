import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const { FiZap, FiRefreshCw } = FiIcons;

const INTEGRATION_REQUESTS_TABLE = 'location_integration_requests_1777090015';
const ORG_ACCESS_TABLE = 'org_access_requests_1777090000';

const REQUEST_TYPE_LABELS = {
  ai_activation:        '🤖 AI Engine Activation',
  email_platform:       '📧 Email Platform',
  crm_connection:       '🗄️ CRM Connection',
  calendar_connection:  '📅 Calendar Connection',
  field_agents_upgrade: '🚑 Field Agents Upgrade',
  field_agent_add:      '👤 Add Field Agent Login',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function IntegrationRequestsPage() {
  const [tab, setTab] = useState('integration');
  const [integrationReqs, setIntegrationReqs] = useState([]);
  const [orgReqs, setOrgReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [intgRes, orgRes] = await Promise.all([
        supabase.from(INTEGRATION_REQUESTS_TABLE).select('*').order('created_at', { ascending: false }),
        supabase.from(ORG_ACCESS_TABLE).select('*').order('created_at', { ascending: false }),
      ]);
      setIntegrationReqs(intgRes.data || []);
      setOrgReqs(orgRes.data || []);
    } catch (e) {
      console.error('IntegrationRequestsPage load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdateIntegration = async (id, status) => {
    try {
      const { error } = await supabase.from(INTEGRATION_REQUESTS_TABLE).update({ status }).eq('id', id);
      if (error) throw error;
      setIntegrationReqs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast(`Request ${status === 'active' ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      showToast('Failed to update: ' + err.message, 'error');
    }
  };

  const handleUpdateOrg = async (id, status) => {
    try {
      const { error } = await supabase.from(ORG_ACCESS_TABLE).update({ status }).eq('id', id);
      if (error) throw error;
      setOrgReqs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast(`Organisation request ${status === 'approved' ? 'approved' : 'rejected'}.`);
    } catch (err) {
      showToast('Failed to update: ' + err.message, 'error');
    }
  };

  const pendingIntg = integrationReqs.filter(r => r.status === 'pending').length;
  const pendingOrg  = orgReqs.filter(r => r.status === 'pending').length;

  const statusStyle = (status) => {
    if (status === 'active' || status === 'approved') return { bg: '#D1FAE5', color: '#065F46', label: status === 'active' ? 'Active' : 'Approved' };
    if (status === 'pending') return { bg: '#FEF3C7', color: '#92400E', label: 'Pending' };
    return { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' };
  };

  return (
    <div style={{ padding: '0 0 32px' }}>
      {toast.msg && (
        <div style={{ position: 'fixed', top: 76, right: 16, zIndex: 999, padding: '12px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderLeft: `4px solid ${toast.type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)'}`, borderRadius: 10, boxShadow: 'var(--ac-shadow-lg)', fontSize: 14, fontWeight: 600, maxWidth: 360 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <SafeIcon icon={FiZap} size={22} style={{ color: 'var(--ac-primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Integration Requests</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            Review and approve field agent, AI, and platform access requests
          </div>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <SafeIcon icon={FiRefreshCw} size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid var(--ac-border)', paddingBottom: 0 }}>
        {[
          { id: 'integration', label: 'Location Upgrades', count: pendingIntg },
          { id: 'org',         label: 'Platform Access',   count: pendingOrg },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--ac-primary)' : 'transparent'}`, color: tab === t.id ? 'var(--ac-primary)' : 'var(--ac-text-secondary)', fontWeight: tab === t.id ? 700 : 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ background: '#EF4444', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading…</div>
      ) : tab === 'integration' ? (
        <div>
          {integrationReqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No integration requests yet</div>
              <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>Field agent, AI, and other upgrade requests will appear here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {integrationReqs.map(req => {
                const ss = statusStyle(req.status);
                const typeLabel = REQUEST_TYPE_LABELS[req.type] || req.type;
                return (
                  <div key={req.id} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{typeLabel}</div>
                        <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                          Location ID: <span style={{ fontFamily: 'monospace' }}>{req.location_id || '—'}</span> · {fmtDate(req.created_at)}
                        </div>
                        {req.payload && req.type === 'field_agent_add' && (
                          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ac-text-secondary)' }}>
                            Agent: <strong>{req.payload.name || '—'}</strong> · {req.payload.email || '—'}
                            {req.payload.requested_by && <> · Requested by: {req.payload.requested_by}</>}
                          </div>
                        )}
                        {req.payload && req.type !== 'field_agent_add' && Object.keys(req.payload).length > 0 && (
                          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ac-muted)', fontFamily: 'monospace', background: 'var(--ac-bg)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                            {Object.entries(req.payload).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </div>
                        )}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </div>
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => handleUpdateIntegration(req.id, 'active')}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          ✅ Approve
                        </button>
                        <button onClick={() => handleUpdateIntegration(req.id, 'rejected')}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-danger)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {orgReqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No platform access requests yet</div>
              <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>Organisation platform access applications will appear here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orgReqs.map(req => {
                const ss = statusStyle(req.status);
                return (
                  <div key={req.id} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{req.org_name || 'Unknown Organisation'}</div>
                        <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginBottom: 4 }}>
                          {req.org_type} · {fmtDate(req.created_at)}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
                          Contact: <strong>{req.contact_name || '—'}</strong> · {req.contact_email || '—'}
                          {req.contact_phone && <> · {req.contact_phone}</>}
                        </div>
                        {req.abn && <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 2 }}>ABN: {req.abn}</div>}
                        {req.state && <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>State: {req.state} · Clients: {req.num_clients || '—'} · Locations: {req.num_locations || '—'}</div>}
                        {req.description && <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginTop: 6, fontStyle: 'italic' }}>"{req.description}"</div>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {req.selected_plan && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#EDE9FE', color: '#5B21B6', fontWeight: 600 }}>Plan: {req.selected_plan}</span>}
                          {req.ndis_registered && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#D1FAE5', color: '#065F46', fontWeight: 600 }}>NDIS Registered</span>}
                          {req.dv_accredited && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>DV Accredited</span>}
                        </div>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </div>
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => handleUpdateOrg(req.id, 'approved')}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          ✅ Approve Access
                        </button>
                        <button onClick={() => handleUpdateOrg(req.id, 'rejected')}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-danger)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IntegrationRequestsPage;

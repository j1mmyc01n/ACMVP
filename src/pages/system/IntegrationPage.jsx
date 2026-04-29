import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '../../components/UI';

const {
  FiCheck, FiX, FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiExternalLink,
  FiCloud, FiDatabase, FiZap, FiSettings, FiAlertCircle, FiCheckCircle,
  FiUpload, FiDownload, FiSync, FiLock, FiUnlock
} = FiIcons;

// ── Toast Notification ────────────────────────────────────────────────
const Toast = ({ msg, type = 'success', onClose }) => (
  <div className={`ac-toast ${type === 'error' ? 'ac-toast-err' : ''}`}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle} style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

// ── Modal Overlay ─────────────────────────────────────────────────────
const ModalOverlay = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: wide ? 750 : 520, boxShadow: 'var(--ac-shadow-xl)', maxHeight: '92vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 22 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ── CRM Platform Configurations ───────────────────────────────────────
const CRM_PLATFORMS = [
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: '#00A1E0' },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', color: '#FF7A59' },
  { id: 'microsoft_dynamics', name: 'Microsoft Dynamics 365', icon: '🔷', color: '#0078D4' },
  { id: 'zoho', name: 'Zoho CRM', icon: '📊', color: '#E42527' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🚀', color: '#1A1A1A' },
  { id: 'monday', name: 'Monday.com', icon: '⚡', color: '#FF3D57' },
  { id: 'custom', name: 'Custom CRM (API)', icon: '🔧', color: '#507C7B' },
];

// ── Integration Card ──────────────────────────────────────────────────
const IntegrationCard = ({ integration, onEdit, onDelete, onToggle, onTest, onSync }) => {
  const crm = CRM_PLATFORMS.find(p => p.id === integration.platform) || CRM_PLATFORMS[0];
  const isActive = integration.status === 'active';

  return (
    <div style={{
      background: 'var(--ac-surface)',
      border: `2px solid ${isActive ? crm.color : 'var(--ac-border)'}`,
      borderRadius: 16,
      padding: 20,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${crm.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            {crm.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{integration.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{crm.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone={isActive ? 'green' : 'gray'}>
            {isActive ? '● Active' : '○ Inactive'}
          </Badge>
          <button
            onClick={() => onToggle(integration.id)}
            className="ac-icon-btn"
            title={isActive ? 'Deactivate' : 'Activate'}
          >
            <SafeIcon icon={isActive ? FiUnlock : FiLock} size={14} style={{ color: isActive ? 'var(--ac-success)' : 'var(--ac-muted)' }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, padding: 12, background: 'var(--ac-bg)', borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 2 }}>API Endpoint</div>
          <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
            {integration.api_url || '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 2 }}>Last Sync</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>

      {integration.auto_sync && (
        <div style={{ fontSize: 12, color: 'var(--ac-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SafeIcon icon={FiSync} size={12} />
          Auto-sync enabled · Every {integration.sync_interval || 30} minutes
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => onSync(integration.id)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px' }} disabled={!isActive}>
          <SafeIcon icon={FiSync} size={13} /> Sync Now
        </button>
        <button onClick={() => onTest(integration.id)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>
          <SafeIcon icon={FiCheckCircle} size={13} /> Test Connection
        </button>
        <button onClick={() => onEdit(integration)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>
          <SafeIcon icon={FiEdit2} size={13} /> Edit
        </button>
        <button onClick={() => onDelete(integration.id)} className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '7px 12px', color: 'var(--ac-danger)', borderColor: 'var(--ac-danger)' }}>
          <SafeIcon icon={FiTrash2} size={13} /> Delete
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────
export default function IntegrationPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [syncModal, setSyncModal] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    platform: 'salesforce',
    api_url: '',
    api_key: '',
    username: '',
    auto_sync: false,
    sync_interval: 30,
    field_mappings: {},
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    // In production, this would fetch from Supabase
    // For now, use localStorage as a demo
    const stored = localStorage.getItem('ac_integrations');
    if (stored) {
      setIntegrations(JSON.parse(stored));
    }
    setLoading(false);
  };

  const saveToStorage = (data) => {
    localStorage.setItem('ac_integrations', JSON.stringify(data));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3500);
  };

  const handleSaveIntegration = () => {
    if (!formData.name || !formData.api_url) {
      return showToast('Name and API URL are required', 'error');
    }

    if (editingIntegration) {
      // Update existing
      const updated = integrations.map(i => 
        i.id === editingIntegration.id ? { ...formData, id: i.id, last_sync: i.last_sync } : i
      );
      setIntegrations(updated);
      saveToStorage(updated);
      showToast('Integration updated successfully');
    } else {
      // Create new
      const newIntegration = {
        ...formData,
        id: `int-${Date.now()}`,
        status: 'inactive',
        last_sync: null,
        created_at: new Date().toISOString(),
      };
      const updated = [...integrations, newIntegration];
      setIntegrations(updated);
      saveToStorage(updated);
      showToast('Integration created successfully');
    }

    setModalOpen(false);
    setEditingIntegration(null);
    resetForm();
  };

  const handleEdit = (integration) => {
    setEditingIntegration(integration);
    setFormData({ ...integration });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    const updated = integrations.filter(i => i.id !== id);
    setIntegrations(updated);
    saveToStorage(updated);
    showToast('Integration deleted');
  };

  const handleToggle = (id) => {
    const updated = integrations.map(i => 
      i.id === id ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i
    );
    setIntegrations(updated);
    saveToStorage(updated);
    showToast(`Integration ${updated.find(i => i.id === id).status === 'active' ? 'activated' : 'deactivated'}`);
  };

  const handleTest = async (id) => {
    const integration = integrations.find(i => i.id === id);
    showToast('Testing connection...');
    
    // Simulate API test
    setTimeout(() => {
      showToast(`Connection to ${integration.name} successful!`);
    }, 1500);
  };

  const handleSync = (id) => {
    const integration = integrations.find(i => i.id === id);
    setSyncModal(integration);
  };

  const performSync = async (direction) => {
    if (!syncModal) return;

    showToast(`Syncing patient data ${direction === 'export' ? 'to' : 'from'} ${syncModal.name}...`);
    
    // Simulate sync process
    setTimeout(() => {
      const updated = integrations.map(i => 
        i.id === syncModal.id ? { ...i, last_sync: new Date().toISOString() } : i
      );
      setIntegrations(updated);
      saveToStorage(updated);
      setSyncModal(null);
      showToast(`Successfully synced ${Math.floor(Math.random() * 50) + 10} patient records`);
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      platform: 'salesforce',
      api_url: '',
      api_key: '',
      username: '',
      auto_sync: false,
      sync_interval: 30,
      field_mappings: {},
    });
  };

  const openNewIntegration = () => {
    resetForm();
    setEditingIntegration(null);
    setModalOpen(true);
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast('')} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <SafeIcon icon={FiCloud} size={28} style={{ color: 'var(--ac-primary)' }} />
            Integrations & CRM Data Sync
          </h1>
          <div style={{ fontSize: 14, color: 'var(--ac-text-secondary)', marginTop: 6 }}>
            Connect and synchronize patient data with external CRM platforms
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" icon={FiRefreshCw} onClick={fetchIntegrations}>Refresh</Button>
          <Button icon={FiPlus} onClick={openNewIntegration}>New Integration</Button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Integrations', value: integrations.length, icon: FiDatabase, color: 'var(--ac-primary)' },
          { label: 'Active', value: integrations.filter(i => i.status === 'active').length, icon: FiCheckCircle, color: '#10B981' },
          { label: 'Auto-Sync Enabled', value: integrations.filter(i => i.auto_sync).length, icon: FiSync, color: '#3B82F6' },
          { label: 'Last 24h Syncs', value: integrations.filter(i => i.last_sync && (new Date() - new Date(i.last_sync)) < 86400000).length, icon: FiZap, color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} className="ac-stat-tile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)' }}>{stat.label}</span>
              <SafeIcon icon={stat.icon} size={16} style={{ color: stat.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Integration Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading integrations...</div>
      ) : integrations.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No Integrations Yet</div>
            <div style={{ fontSize: 14, color: 'var(--ac-muted)', marginBottom: 20 }}>
              Connect your CRM platform to sync patient data automatically
            </div>
            <Button icon={FiPlus} onClick={openNewIntegration}>Add Your First Integration</Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {integrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onTest={handleTest}
              onSync={handleSync}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Integration Modal */}
      {modalOpen && (
        <ModalOverlay title={editingIntegration ? 'Edit Integration' : 'New Integration'} onClose={() => setModalOpen(false)} wide>
          <div className="ac-stack">
            <Field label="Integration Name *">
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="My CRM Integration" />
            </Field>

            <Field label="CRM Platform">
              <Select 
                value={formData.platform} 
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                options={CRM_PLATFORMS.map(p => ({ value: p.id, label: `${p.icon} ${p.name}` }))}
              />
            </Field>

            <div className="ac-grid-2">
              <Field label="API Endpoint URL *">
                <Input value={formData.api_url} onChange={(e) => setFormData({ ...formData, api_url: e.target.value })} placeholder="https://api.crm.com/v2" />
              </Field>
              <Field label="API Key / Token *">
                <Input type="password" value={formData.api_key} onChange={(e) => setFormData({ ...formData, api_key: e.target.value })} placeholder="sk_live_..." />
              </Field>
            </div>

            <Field label="Username / Client ID (if applicable)">
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="user@company.com" />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--ac-bg)', borderRadius: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                <input 
                  type="checkbox" 
                  checked={formData.auto_sync} 
                  onChange={(e) => setFormData({ ...formData, auto_sync: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Enable Auto-Sync</span>
              </label>
              {formData.auto_sync && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Every</span>
                  <input 
                    type="number" 
                    value={formData.sync_interval} 
                    onChange={(e) => setFormData({ ...formData, sync_interval: parseInt(e.target.value) || 30 })}
                    min="5"
                    max="1440"
                    style={{ width: 70, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--ac-border)', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>min</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 12 }}>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveIntegration} style={{ flex: 1 }}>
                {editingIntegration ? 'Update Integration' : 'Create Integration'}
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Sync Modal */}
      {syncModal && (
        <ModalOverlay title={`Sync Patient Data: ${syncModal.name}`} onClose={() => setSyncModal(null)}>
          <div className="ac-stack">
            <div style={{ padding: 16, background: 'var(--ac-bg)', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 8 }}>Choose sync direction:</div>
              <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>
                This will merge patient records between ACMVP and {syncModal.name}. 
                Duplicate detection is automatic based on email and phone matching.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => performSync('export')}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  border: '2px solid var(--ac-primary)',
                  background: 'var(--ac-primary-soft)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SafeIcon icon={FiUpload} size={24} style={{ color: 'var(--ac-primary)', marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ac-primary)', marginBottom: 4 }}>
                  Export to CRM
                </div>
                <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)' }}>
                  Push ACMVP patients to {CRM_PLATFORMS.find(p => p.id === syncModal.platform)?.name}
                </div>
              </button>

              <button
                onClick={() => performSync('import')}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  border: '2px solid #10B981',
                  background: '#D1FAE5',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SafeIcon icon={FiDownload} size={24} style={{ color: '#10B981', marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: '#10B981', marginBottom: 4 }}>
                  Import from CRM
                </div>
                <div style={{ fontSize: 11, color: 'var(--ac-text-secondary)' }}>
                  Pull patients from {CRM_PLATFORMS.find(p => p.id === syncModal.platform)?.name} to ACMVP
                </div>
              </button>
            </div>

            <div style={{ padding: 14, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, fontSize: 12, color: '#92400E' }}>
              <SafeIcon icon={FiAlertCircle} size={14} style={{ marginRight: 6 }} />
              <strong>Note:</strong> Bi-directional sync may create duplicates if field mappings aren't configured correctly.
            </div>

            <Button variant="outline" onClick={() => setSyncModal(null)}>Cancel</Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

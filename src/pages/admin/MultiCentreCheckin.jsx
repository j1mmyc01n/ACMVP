import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, Field, Input, Select, StatCard } from '../../components/UI';

const {
  FiHome, FiUsers, FiArrowRight, FiRefreshCw, FiAlertCircle,
  FiCheckCircle, FiX, FiActivity, FiShield, FiTrendingUp
} = FiIcons;

const Toast = ({ msg, tone = 'success', onClose }) => (
  <div className={`ac-toast${tone === 'error' ? ' ac-toast-err' : ''}`}>
    <SafeIcon icon={tone === 'success' ? FiCheckCircle : FiAlertCircle} style={{ color: tone === 'success' ? 'var(--ac-success)' : 'var(--ac-danger)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

const CapacityBar = ({ used, total }) => {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color = pct >= 90 ? 'var(--ac-danger)' : pct >= 70 ? 'var(--ac-warn)' : 'var(--ac-success)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--ac-muted)' }}>
        <span>{used} / {total} clients</span>
        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--ac-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

const CentreCard = ({ centre, clientCount, onTransfer, onAutoRoute }) => {
  const pct = centre.capacity > 0 ? Math.round((clientCount / centre.capacity) * 100) : 0;
  const isFull = pct >= 100;
  const isNearFull = pct >= 80;
  return (
    <div style={{
      background: 'var(--ac-surface)', border: `1.5px solid ${isFull ? 'var(--ac-danger)' : isNearFull ? 'var(--ac-warn)' : 'var(--ac-border)'}`,
      borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: isFull ? '#fff0f0' : 'var(--ac-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SafeIcon icon={FiHome} size={17} style={{ color: isFull ? 'var(--ac-danger)' : 'var(--ac-primary)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{centre.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>{centre.location || 'No location set'}</div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {isFull
            ? <span style={{ background: '#fff0f0', color: 'var(--ac-danger)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>FULL</span>
            : isNearFull
              ? <span style={{ background: '#fff8e1', color: 'var(--ac-warn)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>NEAR FULL</span>
              : <span style={{ background: 'var(--ac-badge-green-bg)', color: 'var(--ac-badge-green-text)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>AVAILABLE</span>
          }
        </div>
      </div>
      <CapacityBar used={clientCount} total={centre.capacity || 0} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onTransfer(centre)}
          style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <SafeIcon icon={FiArrowRight} size={12} /> Transfer
        </button>
        {!isFull && (
          <button
            onClick={() => onAutoRoute(centre)}
            style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid var(--ac-primary)', background: 'var(--ac-primary-soft)', color: 'var(--ac-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            <SafeIcon icon={FiRefreshCw} size={12} /> Auto-Route
          </button>
        )}
      </div>
    </div>
  );
};

const TransferModal = ({ centres, clients, fromCentre, onConfirm, onClose }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [targetCentre, setTargetCentre] = useState('');
  const centreClients = clients.filter(c => c.care_centre === fromCentre?.name);
  const availableCentres = centres.filter(c => c.name !== fromCentre?.name);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, boxShadow: 'var(--ac-shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16 }}>Transfer Client</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)' }}><SafeIcon icon={FiX} size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Client to Transfer">
            <Select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              options={[{ value: '', label: '— Select client —' }, ...centreClients.map(c => ({ value: c.id, label: `${c.name} (${c.crn})` }))]} />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ac-muted)', fontSize: 13 }}>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{fromCentre?.name}</span>
            <SafeIcon icon={FiArrowRight} size={16} style={{ color: 'var(--ac-primary)' }} />
            <span style={{ flex: 1, fontWeight: 600 }}>{targetCentre || '?'}</span>
          </div>
          <Field label="Transfer To">
            <Select value={targetCentre} onChange={e => setTargetCentre(e.target.value)}
              options={[{ value: '', label: '— Select destination —' }, ...availableCentres.map(c => ({ value: c.name, label: c.name }))]} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button onClick={() => onConfirm(selectedClient, targetCentre)} disabled={!selectedClient || !targetCentre} style={{ flex: 2 }}>
              Confirm Transfer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MultiCentreCheckin() {
  const [centres, setCentres] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [unassigned, setUnassigned] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: c }, { data: cl }] = await Promise.all([
      supabase.from('care_centres_1777090000').select('*').order('name'),
      supabase.from('clients_1777020684735').select('*').eq('status', 'active')
    ]);
    setCentres(c || []);
    setClients(cl || []);
    setUnassigned((cl || []).filter(x => !x.care_centre));
    setLoading(false);
  };

  const showToast = (msg, tone = 'success') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const logClientEvent = async (clientId, summary) => {
    // event_log may not exist in schema — fire-and-forget, ignore errors
    const newEvent = { summary, who: 'System', time: new Date().toLocaleString() };
    supabase.from('clients_1777020684735')
      .update({ event_log: [newEvent] })
      .eq('id', clientId)
      .then(() => {});
  };

  const handleTransferConfirm = async (clientId, targetCentre) => {
    const client = clients.find(c => c.id === clientId);
    const { error } = await supabase.from('clients_1777020684735')
      .update({ care_centre: targetCentre })
      .eq('id', clientId);
    if (!error) {
      await logClientEvent(clientId, `Transferred from ${client?.care_centre || 'unassigned'} to ${targetCentre}`);
      showToast(`${client?.name} transferred to ${targetCentre}`);
      setTransferModal(null);
      fetchAll();
    } else showToast(error.message, 'error');
  };

  const handleAutoRoute = async (targetCentre) => {
    const toRoute = unassigned.slice(0, 3);
    if (toRoute.length === 0) return showToast('No unassigned clients to route.', 'error');
    for (const client of toRoute) {
      await supabase.from('clients_1777020684735').update({ care_centre: targetCentre.name }).eq('id', client.id);
      await logClientEvent(client.id, `Auto-routed to ${targetCentre.name} due to availability`);
    }
    showToast(`${toRoute.length} client(s) auto-routed to ${targetCentre.name}`);
    fetchAll();
  };

  const clientCountFor = (name) => clients.filter(c => c.care_centre === name).length;
  const totalCapacity = centres.reduce((s, c) => s + (c.capacity || 0), 0);
  const totalOccupied = clients.filter(c => c.care_centre).length;
  const fullCentres = centres.filter(c => clientCountFor(c.name) >= (c.capacity || 1)).length;

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading centres…</div>;

  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast.msg} tone={toast.tone} onClose={() => setToast(null)} />}

      <div className="ac-flex-between">
        <div>
          <h1 className="ac-h1">Multi-Centre Management</h1>
          <p style={{ color: 'var(--ac-muted)', fontSize: 13, marginTop: 4 }}>Live capacity, transfers & auto-routing across all care centres</p>
        </div>
        <Button variant="outline" icon={FiRefreshCw} onClick={fetchAll}>Refresh</Button>
      </div>

      {/* Summary Stats */}
      <div className="ac-grid-4">
        <StatCard label="Total Centres" value={centres.length} icon={FiHome} />
        <StatCard label="Active Clients" value={totalOccupied} icon={FiUsers} tone="blue" />
        <StatCard label="Unassigned" value={unassigned.length} icon={FiAlertCircle} tone={unassigned.length > 0 ? 'warn' : 'default'} sub="Needs routing" />
        <StatCard label="Full Centres" value={fullCentres} icon={FiShield} tone={fullCentres > 0 ? 'danger' : 'default'} sub={`of ${centres.length} total`} />
      </div>

      {/* Unassigned Alert */}
      {unassigned.length > 0 && (
        <div style={{ background: '#fff8e1', border: '1px solid var(--ac-warn)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <SafeIcon icon={FiAlertCircle} size={18} style={{ color: 'var(--ac-warn)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{unassigned.length} client(s) unassigned to a care centre</div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 2 }}>Use Auto-Route on any available centre to assign them automatically.</div>
          </div>
        </div>
      )}

      {/* Centre Grid */}
      {centres.length === 0
        ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
              <SafeIcon icon={FiHome} size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No care centres configured</div>
              <div style={{ fontSize: 13 }}>Add care centres via the Care Centres module in SysAdmin.</div>
            </div>
          </Card>
        )
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {centres.map(centre => (
              <CentreCard
                key={centre.id}
                centre={centre}
                clientCount={clientCountFor(centre.name)}
                onTransfer={() => setTransferModal(centre)}
                onAutoRoute={handleAutoRoute}
              />
            ))}
          </div>
        )
      }

      {/* Unassigned Clients Table */}
      {unassigned.length > 0 && (
        <Card title={`Unassigned Clients (${unassigned.length})`}>
          <div className="ac-table-container">
            <table className="ac-table">
              <thead>
                <tr><th>Name</th><th>CRN</th><th>Category</th><th>Contact</th></tr>
              </thead>
              <tbody>
                {unassigned.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="ac-mono ac-xs">{c.crn}</td>
                    <td><Badge tone="amber">{c.support_category || 'general'}</Badge></td>
                    <td className="ac-xs">{c.email || c.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Transfer Modal */}
      {transferModal && (
        <TransferModal
          centres={centres}
          clients={clients}
          fromCentre={transferModal}
          onConfirm={handleTransferConfirm}
          onClose={() => setTransferModal(null)}
        />
      )}
    </div>
  );
}
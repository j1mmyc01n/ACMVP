import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Badge, StatusBadge } from '../../components/UI';

const { FiRefreshCw, FiUserMinus, FiPieChart, FiMessageSquare } = FiIcons;

export const BulkOffboardingPage = () => {
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients_1777020684735').select('*').in('status', ['active', 'pending']);
    setClients(data || []);
    setLoading(false);
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  const handleBulkOffboard = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Are you sure you want to offboard ${selected.size} clients?`)) return;
    
    await Promise.all(Array.from(selected).map(id => 
      supabase.from('clients_1777020684735').update({ status: 'offboarded', offboard_reason: 'Bulk offboarded' }).eq('id', id)
    ));
    setSelected(new Set());
    fetchClients();
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Bulk Client Offboarding</h1>
        <Button 
          icon={FiUserMinus} 
          onClick={handleBulkOffboard} 
          disabled={selected.size === 0}
          style={{ background: selected.size > 0 ? 'var(--ac-danger)' : undefined, borderColor: selected.size > 0 ? 'var(--ac-danger)' : undefined }}
        >
          Offboard Selected ({selected.size})
        </Button>
      </div>

      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(clients.map(c => c.id)) : new Set())} checked={selected.size === clients.length && clients.length > 0} /></th>
                <th>Name</th>
                <th>CRN</th>
                <th>Care Centre</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="ac-center" style={{ padding: 24 }}>Loading...</td></tr> : 
               clients.length === 0 ? <tr><td colSpan="5" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No active clients to offboard.</td></tr> :
               clients.map(c => (
                <tr key={c.id}>
                  <td><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="ac-mono ac-xs">{c.crn}</td>
                  <td>{c.care_centre || '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const CrisisAnalyticsPage = () => {
  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Crisis Event Analytics</h1>
        <Button variant="outline" icon={FiRefreshCw}>Refresh Data</Button>
      </div>
      
      <div className="ac-grid-3">
        <Card title="Total Crisis Events">
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-danger)' }}>42</div>
          <div className="ac-muted ac-xs">Last 30 Days</div>
        </Card>
        <Card title="Average Resolution Time">
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-primary)' }}>14m</div>
          <div className="ac-muted ac-xs">Target: &lt; 15m</div>
        </Card>
        <Card title="High Risk Hotspots">
          <div className="ac-stack-sm" style={{ marginTop: 8 }}>
            <div className="ac-flex-between"><span className="ac-sm">Camperdown</span><Badge tone="red">18 Events</Badge></div>
            <div className="ac-flex-between"><span className="ac-sm">Newtown</span><Badge tone="amber">12 Events</Badge></div>
            <div className="ac-flex-between"><span className="ac-sm">Inner West</span><Badge tone="blue">8 Events</Badge></div>
          </div>
        </Card>
      </div>

      <Card title="Event Distribution by Time">
        <div style={{ height: 250, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '20px 0' }}>
          {[2, 5, 8, 14, 22, 18, 12, 6, 3, 1, 4, 7].map((h, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--ac-danger)', height: `${(h/22)*100}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
          ))}
        </div>
        <div className="ac-flex-between ac-muted ac-xs">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
        </div>
      </Card>
    </div>
  );
};

export const FeedbackDashPage = () => {
  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">User Feedback Dashboard</h1>
      </div>
      
      <div className="ac-grid-4">
        <div className="ac-stat-tile">
          <div className="ac-flex-gap" style={{ marginBottom: 8 }}><SafeIcon icon={FiMessageSquare} style={{ color: 'var(--ac-primary)' }} /><span className="ac-muted ac-xs">Total Feedback</span></div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ac-primary)' }}>328</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-flex-gap" style={{ marginBottom: 8 }}><SafeIcon icon={FiMessageSquare} style={{ color: 'var(--ac-success)' }} /><span className="ac-muted ac-xs">Positive</span></div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ac-success)' }}>214</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-flex-gap" style={{ marginBottom: 8 }}><SafeIcon icon={FiMessageSquare} style={{ color: 'var(--ac-amber)' }} /><span className="ac-muted ac-xs">Neutral</span></div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ac-amber)' }}>76</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-flex-gap" style={{ marginBottom: 8 }}><SafeIcon icon={FiMessageSquare} style={{ color: 'var(--ac-danger)' }} /><span className="ac-muted ac-xs">Negative</span></div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ac-danger)' }}>38</div>
        </div>
      </div>

      <Card title="Recent Qualitative Feedback">
        <div className="ac-stack">
          <div style={{ padding: 16, background: 'var(--ac-bg)', borderRadius: 8 }}>
            <div className="ac-flex-between" style={{ marginBottom: 8 }}>
              <Badge tone="green">Positive</Badge>
              <span className="ac-xs ac-muted">2 hours ago</span>
            </div>
            <p className="ac-sm">"The new check-in system is much faster and easier to use on my phone. Great improvement!"</p>
          </div>
          <div style={{ padding: 16, background: 'var(--ac-bg)', borderRadius: 8 }}>
            <div className="ac-flex-between" style={{ marginBottom: 8 }}>
              <Badge tone="red">Negative</Badge>
              <span className="ac-xs ac-muted">5 hours ago</span>
            </div>
            <p className="ac-sm">"I was confused about where to find the resources section after logging in. The menu is a bit cluttered."</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
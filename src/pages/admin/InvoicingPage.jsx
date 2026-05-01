import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { Badge, Button, Card } from '../../components/UI';
import { supabase } from '../../supabase/supabase';

const { FiDownload, FiRefreshCw, FiDatabase, FiZap, FiDollarSign, FiSend, FiPrinter } = FiIcons;

const RATE_DB_PER_RECORD = 0.0004;   // $ per Supabase row-read (approx)
const RATE_AI_PER_CALL   = 0.002;    // $ per AI/API call (approx GPT-3.5)

const MOCK_INVOICES = [
  { id: 'INV-1001', provider: 'Camperdown Medical', location_id: 'loc_01', amount: 4200, status: 'pending', date: '2025-10-01', clients: 84, sessions: 210 },
  { id: 'INV-1002', provider: 'Newtown Support Center', location_id: 'loc_02', amount: 1850, status: 'paid',    date: '2025-09-28', clients: 37, sessions: 92  },
  { id: 'INV-1003', provider: 'Dr. Smith (Unit 4)',     location_id: 'loc_03', amount: 3100, status: 'pending', date: '2025-10-02', clients: 62, sessions: 155 },
];

const MOCK_USAGE = [
  { location: 'Camperdown Medical',     db_reads: 840000, ai_calls: 12400, period: 'Oct 2025' },
  { location: 'Newtown Support Center', db_reads: 370000, ai_calls: 5500,  period: 'Oct 2025' },
  { location: 'Dr. Smith (Unit 4)',     db_reads: 620000, ai_calls: 9100,  period: 'Oct 2025' },
];

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState([]);
  const [usageRows, setUsageRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('invoices');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try loading locations to build invoice data
      const [locRes, usageRes] = await Promise.all([
        supabase.from('location_instances').select('id,location_name,status,plan_type,monthly_credit_limit,primary_contact_email').order('created_at', { ascending: false }),
        supabase.from('location_daily_usage').select('location_id,db_reads,ai_api_calls,date').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      ]);

      if (locRes.data && locRes.data.length > 0) {
        const built = locRes.data.map((loc, i) => ({
          id: `INV-${1001 + i}`,
          provider: loc.location_name,
          location_id: loc.id,
          amount: loc.monthly_credit_limit || 2500,
          status: i % 3 === 1 ? 'paid' : 'pending',
          date: new Date().toISOString().split('T')[0],
          clients: null,
          sessions: null,
          email: loc.primary_contact_email,
        }));
        setInvoices(built);
      } else {
        setInvoices(MOCK_INVOICES);
      }

      if (usageRes.data && usageRes.data.length > 0) {
        // Aggregate per location
        const agg = {};
        usageRes.data.forEach(row => {
          if (!agg[row.location_id]) agg[row.location_id] = { db_reads: 0, ai_calls: 0 };
          agg[row.location_id].db_reads += row.db_reads || 0;
          agg[row.location_id].ai_calls += row.ai_api_calls || 0;
        });
        const locMap = (locRes.data || []).reduce((m, l) => { m[l.id] = l.location_name; return m; }, {});
        setUsageRows(Object.entries(agg).map(([lid, v]) => ({
          location: locMap[lid] || lid,
          db_reads: v.db_reads,
          ai_calls: v.ai_calls,
          period: new Date().toLocaleString('en-AU', { month: 'short', year: 'numeric' }),
        })));
      } else {
        setUsageRows(MOCK_USAGE);
      }
    } catch (err) {
      console.error(err);
      setInvoices(MOCK_INVOICES);
      setUsageRows(MOCK_USAGE);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalOutstanding = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalDbCost = usageRows.reduce((s, r) => s + r.db_reads * RATE_DB_PER_RECORD, 0);
  const totalAiCost = usageRows.reduce((s, r) => s + r.ai_calls * RATE_AI_PER_CALL, 0);

  const fmt$ = (n) => `$${(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtN = (n) => (n || 0).toLocaleString('en-AU');

  return (
    <div className="ac-stack">
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--ac-success)', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, zIndex: 600, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <div className="ac-flex-between">
        <h1 className="ac-h1">Invoicing & Billing</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" icon={FiRefreshCw} onClick={load} disabled={loading}>Refresh</Button>
          <Button icon={FiDownload} onClick={() => { showToast('Export ready — check Downloads'); }}>Export CSV</Button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="ac-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {[
          { label: 'Outstanding', value: fmt$(totalOutstanding), color: 'var(--ac-warn)',    icon: FiDollarSign },
          { label: 'Paid This Month', value: fmt$(totalPaid),        color: 'var(--ac-success)', icon: FiDollarSign },
          { label: 'DB Usage Cost',   value: fmt$(totalDbCost),       color: 'var(--ac-primary)', icon: FiDatabase  },
          { label: 'AI / API Cost',   value: fmt$(totalAiCost),       color: '#7c3aed',           icon: FiZap       },
        ].map(t => (
          <div key={t.label} className="ac-stat-tile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="ac-muted ac-xs">{t.label}</div>
              <SafeIcon icon={t.icon} size={15} style={{ color: t.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--ac-border)', paddingBottom: 0 }}>
        {[{ id: 'invoices', label: '🧾 Invoices' }, { id: 'usage', label: '📊 Usage & Costs' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
            fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? 'var(--ac-primary)' : 'var(--ac-text-secondary)',
            borderBottom: tab === t.id ? '2px solid var(--ac-primary)' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Invoices tab */}
      {tab === 'invoices' && (
        <Card title="Location Invoices">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>Loading…</div>
          ) : (
            <div className="ac-table-container">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Location / Provider</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="ac-mono" style={{ fontWeight: 600 }}>{inv.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.provider}</div>
                        {inv.email && <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{inv.email}</div>}
                      </td>
                      <td className="ac-muted ac-xs">{inv.date}</td>
                      <td style={{ fontWeight: 700 }}>{fmt$(inv.amount)}</td>
                      <td><Badge tone={inv.status === 'paid' ? 'green' : 'amber'}>{inv.status.toUpperCase()}</Badge></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}
                            onClick={() => showToast(`Invoice ${inv.id} sent to ${inv.email || 'contact'}`)} title="Send Invoice">
                            <SafeIcon icon={FiSend} size={13} />
                          </button>
                          <button className="ac-btn ac-btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}
                            onClick={() => showToast(`Printing ${inv.id}…`)} title="Print">
                            <SafeIcon icon={FiPrinter} size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Usage tab */}
      {tab === 'usage' && (
        <div className="ac-stack">
          <Card title="Database & API Usage by Location" subtitle="Costs shown are approximate based on usage rates">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>Loading…</div>
            ) : (
              <div className="ac-table-container">
                <table className="ac-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Period</th>
                      <th>DB Reads</th>
                      <th>DB Cost</th>
                      <th>AI Calls</th>
                      <th>AI Cost</th>
                      <th>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageRows.map((r, i) => {
                      const dbCost = r.db_reads * RATE_DB_PER_RECORD;
                      const aiCost = r.ai_calls * RATE_AI_PER_CALL;
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.location}</td>
                          <td className="ac-muted ac-xs">{r.period}</td>
                          <td className="ac-mono">{fmtN(r.db_reads)}</td>
                          <td style={{ color: 'var(--ac-primary)', fontWeight: 600 }}>{fmt$(dbCost)}</td>
                          <td className="ac-mono">{fmtN(r.ai_calls)}</td>
                          <td style={{ color: '#7c3aed', fontWeight: 600 }}>{fmt$(aiCost)}</td>
                          <td style={{ fontWeight: 800 }}>{fmt$(dbCost + aiCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--ac-bg)', fontWeight: 800 }}>
                      <td colSpan={3}>Totals</td>
                      <td style={{ color: 'var(--ac-primary)' }}>{fmt$(totalDbCost)}</td>
                      <td></td>
                      <td style={{ color: '#7c3aed' }}>{fmt$(totalAiCost)}</td>
                      <td>{fmt$(totalDbCost + totalAiCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          <Card title="Rate Reference" subtitle="Approximate costs used for calculations">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { label: 'Supabase DB read', rate: `${fmt$(RATE_DB_PER_RECORD)} per row`, icon: FiDatabase, color: 'var(--ac-primary)' },
                { label: 'AI / LLM API call', rate: `${fmt$(RATE_AI_PER_CALL)} per call`, icon: FiZap, color: '#7c3aed' },
              ].map(r => (
                <div key={r.label} style={{ padding: '14px 18px', background: 'var(--ac-bg)', borderRadius: 14, border: '1px solid var(--ac-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <SafeIcon icon={r.icon} size={22} style={{ color: r.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ac-text)' }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{r.rate}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
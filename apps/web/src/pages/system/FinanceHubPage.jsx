/**
 * FinanceHubPage — unified tabbed view for:
 *   • Revenue Analytics (first tab — overview, AI projected growth)
 *   • Invoicing & Billing
 *   • Sponsor Ledger
 *   • Provider Metrics
 */
import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import InvoicingPage  from '../admin/InvoicingPage';
import SponsorLedger  from '../admin/SponsorLedger';
import { ProviderMetricsPage } from '../SystemViews';
import { supabase } from '../../supabase/supabase';

const {
  FiBarChart2, FiFileText, FiAward, FiTrendingUp,
  FiDollarSign, FiArrowUp, FiArrowDown, FiRefreshCw,
  FiCpu, FiZap, FiTag, FiSave, FiCheck,
} = FiIcons;

// ─── Default feature prices ───────────────────────────────────────────────────
const DEFAULT_PRICES = [
  { id: 'ai_engine',        label: 'AI Engine',                unit: '/ location / month',   price: 150 },
  { id: 'field_agent',      label: 'Field Agent Seat',         unit: '/ agent / month',       price: 100 },
  { id: 'push_pack',        label: 'Push Notification Pack',   unit: '/ month',               price: 75  },
  { id: 'crm_connection',   label: 'CRM Integration',          unit: '/ month',               price: 50  },
  { id: 'calendar',         label: 'Calendar Integration',     unit: '/ month',               price: 30  },
  { id: 'db_connection',    label: 'Database Connection',      unit: '/ month',               price: 40  },
  { id: 'base_platform',    label: 'Base Platform Fee',        unit: '/ location / month',   price: 200 },
];
const PRICING_LS_KEY = 'ac_feature_prices';

// ─── Pricing Management Tab ───────────────────────────────────────────────────
function PricingTab() {
  const [prices, setPrices] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PRICING_LS_KEY) || 'null');
      if (stored && Array.isArray(stored)) return stored;
    } catch { /* ignore */ }
    return DEFAULT_PRICES;
  });
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saved, setSaved] = useState(false);

  const startEdit = (f) => { setEditId(f.id); setEditVal(String(f.price)); };
  const cancelEdit = () => { setEditId(null); setEditVal(''); };

  const saveEdit = (id) => {
    const newPrice = parseFloat(editVal);
    if (isNaN(newPrice) || newPrice < 0) return;
    const next = prices.map(p => p.id === id ? { ...p, price: newPrice } : p);
    setPrices(next);
    localStorage.setItem(PRICING_LS_KEY, JSON.stringify(next));
    setEditId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetDefaults = () => {
    setPrices(DEFAULT_PRICES);
    localStorage.setItem(PRICING_LS_KEY, JSON.stringify(DEFAULT_PRICES));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fmt$ = (n) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 3 }}>Feature Pricing Management</div>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Set the monthly prices for each platform feature. Prices are stored and used in invoices and billing.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10B981', fontWeight: 700 }}>
              <SafeIcon icon={FiCheck} size={13} /> Saved
            </span>
          )}
          <button
            onClick={resetDefaults}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text-secondary)', fontSize: 12, cursor: 'pointer' }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 100px', padding: '10px 18px', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-bg)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Feature</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Billing Unit</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Price (AUD)</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Actions</div>
        </div>
        {prices.map(f => (
          <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 100px', padding: '14px 18px', borderBottom: '1px solid var(--ac-border)', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)' }}>{f.unit}</div>
            <div>
              {editId === f.id ? (
                <input
                  type="number"
                  value={editVal}
                  min={0}
                  step={5}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(f.id); if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus
                  style={{ width: 100, padding: '5px 8px', borderRadius: 7, border: '1.5px solid var(--ac-primary)', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}
                />
              ) : (
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ac-text)' }}>{fmt$(f.price)}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {editId === f.id ? (
                <>
                  <button onClick={() => saveEdit(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: 'var(--ac-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <SafeIcon icon={FiSave} size={12} /> Save
                  </button>
                  <button onClick={cancelEdit} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => startEdit(f)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 12, color: '#1E40AF' }}>
        💡 Prices are stored locally in this browser. For production use, prices should be persisted in the database with access controls. Changes take effect immediately for new requests.
      </div>
    </div>
  );
}

// ─── Simple linear regression for trend projection ────────────────────────────
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0] ?? 0 };
  const sumX = points.reduce((s, _, i) => s + i, 0);
  const sumY = points.reduce((s, v) => s + v, 0);
  const sumXY = points.reduce((s, v, i) => s + i * v, 0);
  const sumXX = points.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function project(points, periodsAhead = 3) {
  const { slope, intercept } = linearRegression(points);
  return Array.from({ length: periodsAhead }, (_, i) => Math.max(0, intercept + slope * (points.length + i)));
}

const fmt$ = (n) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);

// ─── Sparkline bar chart (pure CSS) ──────────────────────────────────────────
function MiniBarChart({ data, projected = [], color = 'var(--ac-primary)', height = 52 }) {
  const all  = [...data, ...projected];
  const max  = Math.max(...all, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: color, borderRadius: '3px 3px 0 0', height: `${Math.max(4, (v / max) * height)}px`, opacity: 0.85, transition: 'height 0.4s' }} title={fmt$(v)} />
      ))}
      {projected.map((v, i) => (
        <div key={`p${i}`} style={{ flex: 1, background: color, borderRadius: '3px 3px 0 0', height: `${Math.max(4, (v / max) * height)}px`, opacity: 0.35, border: `1px dashed ${color}`, boxSizing: 'border-box', transition: 'height 0.4s' }} title={`Projected: ${fmt$(v)}`} />
      ))}
    </div>
  );
}

// ─── Revenue Analytics tab ────────────────────────────────────────────────────
function RevenueAnalyticsTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Pull whatever we can from known tables
        const [sponsorRes, invoiceRes, centreRes] = await Promise.all([
          supabase.from('sponsors_1777020684735').select('id, contribution_amount, status, created_at').order('created_at'),
          supabase.from('invoices_1777090000').select('id, amount, status, created_at').order('created_at').limit(200),
          supabase.from('care_centres_1777090000').select('id, name, plan_type, active').order('name'),
        ]);

        const sponsors  = sponsorRes.data  || [];
        const invoices  = invoiceRes.data  || [];
        const centres   = centreRes.data   || [];

        // Build monthly buckets for the last 6 months
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
            label: d.toLocaleString('en-AU', { month: 'short', year: '2-digit' }),
            year: d.getFullYear(),
            month: d.getMonth(),
          };
        });

        const bucket = (rows, field = 'created_at', valField = 'amount') =>
          months.map(m =>
            rows
              .filter(r => {
                const d = new Date(r[field]);
                return d.getFullYear() === m.year && d.getMonth() === m.month;
              })
              .reduce((s, r) => s + (parseFloat(r[valField]) || 0), 0)
          );

        const invoiceMonthly = bucket(invoices.filter(i => i.status === 'paid'));
        const sponsorMonthly = bucket(sponsors.filter(s => s.status === 'active'), 'created_at', 'contribution_amount');

        // Platform subscription fees (estimated from centres)
        const tierFees = { basic: 199, standard: 499, premium: 999, enterprise: 2499 };
        const subMonthly = months.map(() =>
          centres.filter(c => c.active).reduce((s, c) => s + (tierFees[c.plan_type] || 299), 0)
        );

        const totalMonthly = months.map((_, i) => invoiceMonthly[i] + sponsorMonthly[i] + subMonthly[i]);

        // AI projections (next 3 months)
        const invoiceProjRaw  = project(invoiceMonthly);
        const sponsorProjRaw  = project(sponsorMonthly);
        const subProjRaw      = project(subMonthly);
        const totalProjRaw    = project(totalMonthly);

        // Current month stats
        const curMonthIdx = 5;
        const curTotal    = totalMonthly[curMonthIdx];
        const prevTotal   = totalMonthly[curMonthIdx - 1] || curTotal;
        const growth      = prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : 0;

        // YoY growth estimate
        const { slope } = linearRegression(totalMonthly);
        const annualisedGrowthRate = totalMonthly[0] > 0
          ? ((totalProjRaw[2] - totalMonthly[0]) / totalMonthly[0]) * 100
          : 0;

        setData({
          months,
          invoiceMonthly, sponsorMonthly, subMonthly, totalMonthly,
          invoiceProj: invoiceProjRaw,
          sponsorProj: sponsorProjRaw,
          subProj: subProjRaw,
          totalProj: totalProjRaw,
          curTotal, growth, slope,
          annualisedGrowthRate,
          activeSponsorCount: sponsors.filter(s => s.status === 'active').length,
          activeCentres: centres.filter(c => c.active).length,
          paidInvoiceCount: invoices.filter(i => i.status === 'paid').length,
          totalSponsorContrib: sponsors.filter(s => s.status === 'active').reduce((s, r) => s + (parseFloat(r.contribution_amount) || 0), 0),
          totalInvoiced: invoices.filter(i => i.status === 'paid').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0),
          subRevenue: subMonthly[curMonthIdx],
        });
      } catch (e) {
        console.error('RevenueAnalyticsTab error:', e);
        // No data available — stay null so the empty state is shown
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
        <SafeIcon icon={FiRefreshCw} size={22} style={{ color: 'var(--ac-muted)', opacity: 0.4 }} />
      </div>
    );
  }

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No revenue data yet</div>
      <div style={{ fontSize: 13, color: 'var(--ac-muted)', maxWidth: 380, margin: '0 auto' }}>
        Revenue figures will appear here once invoices, sponsor contributions and active locations are recorded in the system.
      </div>
    </div>
  );

  const streams = [
    {
      label:    'Location Invoicing',
      icon:     FiFileText,
      color:    '#3B82F6',
      monthly:  data.invoiceMonthly,
      proj:     data.invoiceProj,
      current:  data.invoiceMonthly[5],
      meta:     `${data.paidInvoiceCount} paid invoices`,
    },
    {
      label:    'Sponsor Contributions',
      icon:     FiAward,
      color:    '#7C3AED',
      monthly:  data.sponsorMonthly,
      proj:     data.sponsorProj,
      current:  data.sponsorMonthly[5],
      meta:     `${data.activeSponsorCount} active sponsors`,
    },
    {
      label:    'Platform Subscriptions',
      icon:     FiZap,
      color:    '#10B981',
      monthly:  data.subMonthly,
      proj:     data.subProj,
      current:  data.subMonthly[5],
      meta:     `${data.activeCentres} active locations`,
    },
  ];

  const growthPositive = data.growth >= 0;
  const nextMonthTotal = data.totalProj[0];
  const in3MonthsTotal = data.totalProj[2];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Revenue This Month', value: fmt$(data.curTotal), sub: `${growthPositive ? '▲' : '▼'} ${Math.abs(data.growth).toFixed(1)}% vs last month`, color: growthPositive ? '#10B981' : '#EF4444' },
          { label: 'Projected Next Month', value: fmt$(nextMonthTotal), sub: 'AI trend forecast', color: '#3B82F6' },
          { label: '3-Month Outlook', value: fmt$(in3MonthsTotal), sub: 'AI trend forecast', color: '#7C3AED' },
          { label: 'Annualised Growth', value: `${data.annualisedGrowthRate > 0 ? '+' : ''}${data.annualisedGrowthRate.toFixed(1)}%`, sub: 'Based on 6-month trend', color: data.annualisedGrowthRate >= 0 ? '#10B981' : '#EF4444' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ac-text)', lineHeight: 1, marginBottom: 6, letterSpacing: -0.5 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: kpi.color, fontWeight: 600 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Total revenue bar chart */}
      <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 18, padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>Total Revenue — 6 Month Trend</div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>Solid bars = actual · Faded bars = AI projected</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EEF2FF', borderRadius: 20 }}>
            <SafeIcon icon={FiCpu} size={12} style={{ color: '#4F46E5' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5' }}>AI Projection</span>
          </div>
        </div>
        <MiniBarChart data={data.totalMonthly} projected={data.totalProj} color="var(--ac-primary)" height={72} />
        <div style={{ display: 'flex', marginTop: 8 }}>
          {[...data.months, ...['M+1', 'M+2', 'M+3'].map(l => ({ label: l }))].map((m, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: i >= 6 ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: i >= 6 ? 700 : 400 }}>
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue streams */}
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>Revenue Streams</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {streams.map(s => {
            const prev = s.monthly[4] || 0;
            const curr = s.current;
            const streamGrowth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
            return (
              <div key={s.label} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SafeIcon icon={s.icon} size={16} style={{ color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 1 }}>{s.meta}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ac-text)' }}>{fmt$(curr)}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: streamGrowth >= 0 ? '#10B981' : '#EF4444' }}>
                      {streamGrowth >= 0 ? '▲' : '▼'} {Math.abs(streamGrowth).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <MiniBarChart data={s.monthly} projected={s.proj} color={s.color} height={44} />
                <div style={{ marginTop: 10, padding: '8px 12px', background: `${s.color}0d`, borderRadius: 8, fontSize: 12, color: s.color, fontWeight: 600 }}>
                  📈 AI projects {fmt$(s.proj[0])}/mo next month
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI growth insights */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: 18, padding: '24px 28px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiCpu} size={18} style={{ color: '#A5B4FC' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>AI Growth Intelligence</div>
            <div style={{ fontSize: 12, color: '#A5B4FC', marginTop: 1 }}>Linear trend model trained on your last 6 months</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            {
              title: 'Revenue Trajectory',
              insight: data.slope > 0
                ? `Monthly revenue is growing at approximately ${fmt$(data.slope * 4.33)}/month on average. At this rate, annual revenue will reach ${fmt$(data.totalProj[2] * 12)}.`
                : `Revenue has been declining. Projected recovery requires an average increase of ${fmt$(Math.abs(data.slope * 4.33 * 2))}/month.`,
            },
            {
              title: 'Strongest Stream',
              insight: (() => {
                const maxStream = streams.reduce((a, b) => b.current > a.current ? b : a);
                return `${maxStream.label} is your top revenue stream at ${fmt$(maxStream.current)}/month, contributing ${((maxStream.current / data.curTotal) * 100).toFixed(0)}% of total revenue.`;
              })(),
            },
            {
              title: 'Growth Opportunity',
              insight: (() => {
                const minStream = streams.reduce((a, b) => b.current < a.current ? b : a);
                const potential = minStream.proj[2] - minStream.current;
                return `${minStream.label} shows the most upside — projected to grow by ${fmt$(Math.max(0, potential))} over the next 3 months if trends continue.`;
              })(),
            },
          ].map(item => (
            <div key={item.title} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#C7D2FE', marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{item.insight}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>
          Projections are estimates based on linear regression — not financial advice.
        </div>
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'analytics', label: 'Revenue Analytics',  icon: FiBarChart2,  desc: 'Revenue streams, trends and AI-projected growth' },
  { id: 'invoicing', label: 'Invoicing & Billing', icon: FiFileText,   desc: 'Location invoices and platform usage costs' },
  { id: 'pricing',   label: 'Feature Pricing',     icon: FiTag,        desc: 'Manage monthly prices for each platform feature' },
  { id: 'sponsors',  label: 'Sponsor Ledger',       icon: FiAward,      desc: 'Funding partners and contribution ledger' },
  { id: 'providers', label: 'Provider Metrics',     icon: FiTrendingUp, desc: 'Registered providers and performance data' },
];

export default function FinanceHubPage({ role }) {
  const [tab, setTab] = useState('analytics');
  const active = TABS.find(t => t.id === tab);

  return (
    <div style={{ padding: '0 0 48px' }}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiDollarSign} size={18} style={{ color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.4 }}>Finance &amp; Partners</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ac-muted)', margin: '0 0 0 46px' }}>
          {active?.desc}
        </p>
      </div>

      {/* ── Tab strip ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--ac-border)', marginBottom: 28, overflowX: 'auto' }}>
        {TABS.map(t => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 18px',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--ac-primary)' : 'transparent'}`,
                color: isActive ? 'var(--ac-primary)' : 'var(--ac-text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                marginBottom: -2,
              }}
            >
              <SafeIcon icon={t.icon} size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      {tab === 'analytics' && <RevenueAnalyticsTab />}
      {tab === 'invoicing' && <InvoicingPage />}
      {tab === 'pricing'   && <PricingTab />}
      {tab === 'sponsors'  && <SponsorLedger role={role} />}
      {tab === 'providers' && <ProviderMetricsPage />}
    </div>
  );
}

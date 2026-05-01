/**
 * FinanceHubPage — unified tabbed view for:
 *   • Invoicing & Billing
 *   • Sponsor Ledger
 *   • Provider Metrics
 */
import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import InvoicingPage  from '../admin/InvoicingPage';
import SponsorLedger  from '../admin/SponsorLedger';
import { ProviderMetricsPage } from '../SystemViews';

const { FiFileText, FiAward, FiTrendingUp } = FiIcons;

const TABS = [
  { id: 'invoicing', label: 'Invoicing & Billing', icon: FiFileText,   desc: 'Location invoices and platform usage costs' },
  { id: 'sponsors',  label: 'Sponsor Ledger',       icon: FiAward,      desc: 'Funding partners and contribution ledger' },
  { id: 'providers', label: 'Provider Metrics',     icon: FiTrendingUp, desc: 'Registered providers and performance data' },
];

export default function FinanceHubPage({ role }) {
  const [tab, setTab] = useState('invoicing');
  const active = TABS.find(t => t.id === tab);

  return (
    <div style={{ padding: '0 0 48px' }}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.4 }}>
          Finance &amp; Partners
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ac-muted)', margin: 0 }}>
          {active?.desc}
        </p>
      </div>

      {/* ── Tab strip ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ac-border)', marginBottom: 28, overflowX: 'auto' }}>
        {TABS.map(t => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 20px',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--ac-primary)' : 'transparent'}`,
                color: isActive ? 'var(--ac-primary)' : 'var(--ac-text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              <SafeIcon icon={t.icon} size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      {tab === 'invoicing' && <InvoicingPage />}
      {tab === 'sponsors'  && <SponsorLedger role={role} />}
      {tab === 'providers' && <ProviderMetricsPage />}
    </div>
  );
}

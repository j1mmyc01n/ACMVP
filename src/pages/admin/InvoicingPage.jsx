import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { Badge, Button, Card } from '../../components/UI';

const { FiDownload } = FiIcons;

export default function InvoicingPage() {
  const [invoices] = useState([
    { id: 'INV-1001', provider: 'Camperdown Medical', amount: '$4,200', status: 'pending', date: '2023-10-01' },
    { id: 'INV-1002', provider: 'Newtown Support Center', amount: '$1,850', status: 'paid', date: '2023-09-28' },
    { id: 'INV-1003', provider: 'Dr. Smith (Unit 4)', amount: '$3,100', status: 'pending', date: '2023-10-02' },
  ]);

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Invoicing & Billing</h1>
        <Button icon={FiDownload}>Export for Billing Agency</Button>
      </div>
      <div className="ac-grid-3">
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Total Outstanding</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ac-warn)' }}>$7,300</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Paid This Month</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ac-success)' }}>$12,450</div>
        </div>
        <div className="ac-stat-tile">
          <div className="ac-muted ac-xs">Active Providers</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>8</div>
        </div>
      </div>
      <Card title="Recent Invoices">
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr><th>Invoice ID</th><th>Provider / Care Centre</th><th>Date</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="ac-mono" style={{ fontWeight: 600 }}>{inv.id}</td>
                  <td>{inv.provider}</td>
                  <td className="ac-muted ac-xs">{inv.date}</td>
                  <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                  <td><Badge tone={inv.status === 'paid' ? 'green' : 'amber'}>{inv.status.toUpperCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
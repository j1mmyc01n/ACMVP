import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { Card, Button } from '../../components/UI';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

export default function SponsorLedger() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sponsors_1777090009')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSponsors(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading ledger...</div>;

  const totalRevenue = sponsors.reduce((acc, s) => acc + (s.amount || 15000), 0);

  return (
    <div className="ac-stack">
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

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ac-border)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)' }}>Date Purchased</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)' }}>Receipt No.</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)' }}>Company</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)' }}>Run Dates</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--ac-muted)', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map(s => {
                const now = new Date();
                const start = s.start_date ? new Date(s.start_date) : new Date(s.created_at);
                const end = s.end_date ? new Date(s.end_date) : new Date(s.created_at);
                let status = 'Completed';
                let stColor = 'gray';
                
                // Normalise today's date for accurate comparison
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button icon={FiIcons.FiDownload} onClick={() => window.print()} variant="outline">
          Export Ledger (PDF)
        </Button>
      </div>
    </div>
  );
}
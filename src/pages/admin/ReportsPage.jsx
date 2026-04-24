import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Card, StatusBadge } from '../../components/UI';

const { FiDownload } = FiIcons;

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('check_ins_1740395000').select('*').order('created_at', { ascending: false });
    setData(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = [['Date', 'CRN', 'Mood', 'Window', 'Status']];
    data.forEach(d => rows.push([
      new Date(d.created_at).toLocaleDateString(), 
      d.crn, 
      d.mood, 
      d.scheduled_window || '', 
      d.status
    ]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `checkins_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Clinical Reports</h1>
        <Button variant="outline" icon={FiDownload} onClick={exportCSV} disabled={!data.length}>
          Export CSV
        </Button>
      </div>
      
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>CRN</th>
                <th>Mood</th>
                <th>Window</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="ac-center" style={{ padding: 24 }}>Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="5" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No data available.</td></tr>
              ) : data.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="ac-mono ac-xs">{d.crn}</td>
                  <td>
                    <Badge tone={d.mood <= 3 ? 'red' : d.mood <= 6 ? 'amber' : 'green'}>
                      {d.mood}/10
                    </Badge>
                  </td>
                  <td className="ac-muted ac-xs">{d.scheduled_window || '—'}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
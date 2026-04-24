import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { cx, generateCode, callClaudeAI } from '../lib/utils';
import { 
  Card, StatCard, Button, 
  Field, Input, StatusBadge, Toggle
} from '../components/UI';

const { FiAlertTriangle, FiClock, FiActivity, FiHash, FiPlus, FiChevronLeft } = FiIcons;

const MOCK_PATIENTS = [
  { id: "NTH-126113-1430-7K", anon: "Patient A", region: "Northern ACS", mood: 3, status: "pending", window: "Afternoon (12–5pm)", day: "Today", concerns: "Feeling anxious about returning home", priority: "urgent", checkedIn: "2 mins ago", contacted: false },
  { id: "CAM-126112-0930-3M", anon: "Patient B", region: "Camperdown ACS", mood: 7, status: "confirmed", window: "Morning (9am–12pm)", day: "Tomorrow", concerns: "Managing well", priority: "monitor", checkedIn: "18 mins ago", contacted: true },
  { id: "MRK-126110-1600-9P", anon: "Patient C", region: "Marrickville ACS", mood: 2, status: "overdue", window: "—", day: "—", concerns: "No check-in received", priority: "urgent", checkedIn: "Overdue", contacted: false },
];

export const AdminPage = () => {
  const [patients] = useState(MOCK_PATIENTS);
  const [aiPanel, setAiPanel] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const runAI = async (p) => {
    setAiPanel(p); setAiLoading(true); setAiResult(null);
    const r = await callClaudeAI(p);
    setAiResult(r); setAiLoading(false);
  };

  return (
    <div className="ac-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="ac-h2">Admin Dashboard</h2>
        <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>● Live</div>
      </div>

      <div className="ac-grid-3">
        <StatCard label="Urgent Care" value={patients.filter(p=>p.priority==='urgent').length} sub="Clients requiring attention" tone="red" icon={FiAlertTriangle} />
        <StatCard label="Overdue" value={patients.filter(p=>p.status==='overdue').length} sub="Missed check-ins" tone="amber" icon={FiClock} />
        <StatCard label="Pending" value={patients.length} sub="Unresolved check-ins" tone="blue" icon={FiActivity} />
      </div>

      <Card title="⚠️ Urgent Care Module" subtitle="Clients requiring immediate attention based on mood">
        <div className="ac-stack">
          {patients.map((p, i) => (
            <div key={i} className="ac-urgent">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.anon} <span className="ac-muted ac-xs">({p.id})</span></div>
                  <div className="ac-muted ac-xs">{p.checkedIn}</div>
                </div>
                <StatusBadge status={p.priority === 'urgent' ? 'error' : 'pending'} />
              </div>
              <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
                <span style={{ background: "var(--ac-bg)", padding: "2px 8px", borderRadius: 8, fontSize: 12 }}>Mood: {p.mood}/10</span>
                <span style={{ background: "var(--ac-bg)", padding: "2px 8px", borderRadius: 8, fontSize: 12 }}>{p.status}</span>
                {p.contacted && <span style={{ background: "var(--ac-bg)", padding: "2px 8px", borderRadius: 8, fontSize: 12 }}>Contacted</span>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Button variant="outline" size="sm" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => runAI(p)}>🤖 AI Triage</Button>
                <Button variant="outline" size="sm" style={{ padding: '6px 12px', fontSize: 12 }}>📞 Contacted</Button>
                <Button variant="outline" size="sm" style={{ padding: '6px 12px', fontSize: 12 }}>Resolve</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {aiPanel && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 340, background: "var(--ac-surface)", borderLeft: "1px solid var(--ac-border)", zIndex: 200, boxShadow: "var(--ac-shadow-lg)", overflowY: 'auto' }}>
          <div style={{ padding: "52px 16px 12px", borderBottom: "1px solid var(--ac-border)", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700 }}>🤖 AI Triage</div>
              <div className="ac-muted ac-xs">{aiPanel.anon} · {aiPanel.region}</div>
            </div>
            <button onClick={() => setAiPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
          <div style={{ padding: 16 }}>
            {aiLoading ? <div style={{ textAlign: 'center', padding: 80 }}><div className="ac-spin" style={{ fontSize: 32 }}>⚙️</div><div style={{ marginTop: 12 }}>Analysing check-in...</div></div> : aiResult && (
              <div className="ac-stack">
                <div style={{ background: aiResult.priority === 'HIGH' ? '#FDEDEC' : '#EAFAF1', borderRadius: 14, padding: 16, border: `1px solid ${aiResult.priority === 'HIGH' ? '#F1948A' : '#ABEBC6'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', marginBottom: 4 }}>Priority</div>
                  <div style={{ fontWeight: 800, fontSize: 24, color: aiResult.priority === 'HIGH' ? '#E74C3C' : '#27AE60' }}>{aiResult.priority}</div>
                  <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{aiResult.summary}</p>
                </div>
                <div style={{ background: 'var(--ac-bg)', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Recommended Action</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>{aiResult.recommended_action}</p>
                </div>
                {aiResult.alert_flags.length > 0 && (
                  <div className="ac-stack" style={{ gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Alert Flags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiResult.alert_flags.map(f => (<span key={f} style={{ background: '#FDEDEC', color: '#E74C3C', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{f.replace('_', ' ')}</span>))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#8E8E93" }}>Confidence</div>
                  <div style={{ flex: 1, height: 4, background: "var(--ac-border)", borderRadius: 999 }}>
                    <div style={{ height: "100%", background: "var(--ac-primary)", borderRadius: 999, width: `${aiResult.confidence * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{Math.round(aiResult.confidence * 100)}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CRNPage = () => {
  const [prefix, setPrefix] = useState("CAM");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="ac-stack">
      <h2 className="ac-h2">CRN Generator</h2>
      <Card title="Generate Client Reference Number" subtitle="Format: LOC-CYYDDD-HHMM">
        <div className="ac-stack">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["CAM", "NTH", "MRK", "RDF"].map(p => (
              <button key={p} onClick={() => setPrefix(p)} style={{ padding: "8px 16px", borderRadius: 10, border: prefix === p ? "2px solid #007AFF" : "1px solid var(--ac-border)", background: prefix === p ? "#EBF5FF" : "var(--ac-surface)", color: prefix === p ? "#007AFF" : "inherit", fontWeight: 700, cursor: "pointer" }}>{p}</button>
            ))}
          </div>
          <Field label="Patient Mobile (+61...)">
            <Input placeholder="+61 4XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </Field>
          <Button icon={FiHash} onClick={() => { setCode(generateCode(prefix)); setSent(false); }}>Generate Code</Button>
          {code && (
            <div className="ac-stack" style={{ marginTop: 12 }}>
              <div style={{ background: "#EAFAF1", border: "1px solid #ABEBC6", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: 'uppercase', marginBottom: 6 }}>Generated Code</div>
                <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, color: "#27AE60", letterSpacing: 2 }}>{code}</div>
              </div>
              <Button disabled={!phone} style={{ width: '100%' }} onClick={() => setSent(true)}>{sent ? '✅ SMS Sent!' : '📱 Send SMS'}</Button>
            </div>
          )}
        </div>
      </Card>
      <div style={{ background: "#FFF9E6", borderRadius: 12, padding: 14, border: "1px solid #FFE58F", fontSize: 13, color: "#7C4B00" }}>
        ⚠️ Code expires in <strong>12 hours</strong>. Patients must check in before expiry.
      </div>
    </div>
  );
};

export const ClientsPage = () => (
  <div className="ac-stack">
    <h2 className="ac-h2">Client Management</h2>
    <Card title="Create New Client" subtitle="Register a new patient to a location">
      <div className="ac-stack">
        <Field label="Client Reference Number">
          <Input placeholder="Enter unique CRN" style={{ fontFamily: 'monospace' }} />
        </Field>
        <div className="ac-grid-2">
          <Field label="First Name"><Input placeholder="First Name" /></Field>
          <Field label="Last Name"><Input placeholder="Last Name" /></Field>
        </div>
        <Field label="Postcode"><Input placeholder="2000" /></Field>
        <Button icon={FiPlus}>Create Client Record</Button>
      </div>
    </Card>
    
    <Card title="Recent Clients">
      <div className="ac-table-container">
        <table className="ac-table">
          <thead>
            <tr><th>CRN</th><th>Region</th><th>Mood</th><th>Status</th></tr>
          </thead>
          <tbody>
            {MOCK_PATIENTS.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace' }}>{p.id}</td>
                <td>{p.region}</td>
                <td style={{ fontWeight: 700, color: p.mood <= 3 ? 'var(--ac-danger)' : 'var(--ac-success)' }}>{p.mood}/10</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);
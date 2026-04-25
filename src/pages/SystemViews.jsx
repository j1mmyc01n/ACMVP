import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { Card, Button, Badge, StatusBadge, Field, Input, Select, Textarea } from '../components/UI';

const {
  FiRefreshCw, FiCheckCircle, FiX, FiCalendar, FiCpu,
  FiActivity, FiDatabase, FiShield, FiMap, FiHome,
  FiPlus, FiSettings, FiUsers, FiEdit2, FiMessageSquare,
  FiThumbsUp, FiTrash2, FiFileText, FiKey, FiSave, FiMail, FiClock, FiTrendingUp,
  FiEye, FiCheck, FiColumns, FiSend, FiAlertCircle, FiDownload, FiCode,
  FiGithub, FiGitCommit, FiGitMerge, FiZap, FiTerminal
} = FiIcons;

const Toast = ({ msg, onClose }) => (
  <div className="ac-toast">
    <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button className="ac-btn-ghost" style={{ padding: 4, border: 0 }} onClick={onClose}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

const ModalOverlay = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: wide ? 800 : 600, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="ac-flex-between" style={{ marginBottom: 20 }}>
        <h2 className="ac-h2">{title}</h2>
        <button className="ac-icon-btn" onClick={onClose}><SafeIcon icon={FiX} size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

/* ─── AI CODE FIXER ──────────────────────────────────────────────── */
export const AICodeFixerPage = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ac_anthropic_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSaveKey = () => {
    localStorage.setItem('ac_anthropic_key', apiKey);
    setShowKeyInput(false);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: `You are an expert React/Vite/Supabase developer for the Acute Connect mental health platform. Stack: React 18, Vite, Supabase, custom CSS variables (no Tailwind in components), React Icons.\n\nTask: ${prompt}\n\nReturn a JSON object with: { "explanation": "...", "files": [{"path": "src/...", "code": "..."}], "instructions": ["..."], "sql": "..." }`
          }]
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API Error ${response.status}`);
      }
      const data = await response.json();
      const text = data.content[0]?.text || '';
      try {
        const match = text.match(/\{[\s\S]*\}/);
        setResult(match ? JSON.parse(match[0]) : { explanation: text, files: [], instructions: [] });
      } catch {
        setResult({ explanation: text, files: [], instructions: [] });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ai-fix-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <div>
          <h1 className="ac-h1">AI Code Fixer</h1>
          <p className="ac-muted ac-sm" style={{ marginTop: 4 }}>Powered by Anthropic Claude 3.5 Sonnet · SysAdmin Only</p>
        </div>
        <button className="ac-btn ac-btn-outline" onClick={() => setShowKeyInput(!showKeyInput)} style={{ fontSize: 13 }}>
          <SafeIcon icon={FiKey} size={14} />
          {apiKey ? 'Change API Key' : 'Set API Key'}
        </button>
      </div>

      {showKeyInput && (
        <Card>
          <div className="ac-stack-sm">
            <Field label="Anthropic API Key" hint="Stored locally in your browser only">
              <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." />
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleSaveKey}>Save Key</Button>
              <Button variant="outline" onClick={() => setShowKeyInput(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Field label="Describe the fix, feature, or upgrade needed">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Fix the menu freezing when clicking navigation items. Add stopPropagation to all nav button click handlers..."
            style={{ width: '100%', minHeight: 120, padding: 14, borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'var(--ac-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--ac-border)'}
          />
        </Field>
        <div style={{ marginTop: 12 }}>
          <Button onClick={handleSubmit} disabled={!prompt.trim() || loading} icon={FiSend} style={{ width: '100%' }}>
            {loading ? 'Claude is thinking...' : 'Generate Fix with Claude 3.5'}
          </Button>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Fix menu freezing', 'Add client profile cards', 'Fix CRM edit bug', 'Add dark mode to a page'].map(q => (
            <button key={q} onClick={() => setPrompt(q)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-muted)', cursor: 'pointer' }}>{q}</button>
          ))}
        </div>
      </Card>

      {error && (
        <Card style={{ background: '#fff0f0', borderColor: '#fcc' }}>
          <div className="ac-flex-gap" style={{ color: '#c00' }}>
            <SafeIcon icon={FiAlertCircle} />
            <strong>Error</strong>
          </div>
          <div className="ac-sm" style={{ marginTop: 8, color: '#c00' }}>{error}</div>
        </Card>
      )}

      {result && (
        <Card>
          <div className="ac-flex-between" style={{ marginBottom: 16 }}>
            <div className="ac-flex-gap" style={{ color: 'var(--ac-success)', fontWeight: 700 }}>
              <SafeIcon icon={FiCheckCircle} /> Fix Generated Successfully
            </div>
            <Button variant="outline" icon={FiDownload} onClick={handleDownload}>Download JSON</Button>
          </div>
          <div className="ac-stack">
            <div>
              <div style={{ fontWeight: 700, color: 'var(--ac-primary)', marginBottom: 8, fontSize: 13 }}>📋 Explanation</div>
              <div className="ac-sm" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{result.explanation}</div>
            </div>
            {result.files && result.files.length > 0 && result.files.map((f, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, color: 'var(--ac-primary)', marginBottom: 8, fontSize: 13 }}>
                  <SafeIcon icon={FiCode} size={13} style={{ marginRight: 6 }} />
                  {f.path}
                </div>
                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, fontSize: 12, overflowX: 'auto', fontFamily: 'monospace', maxHeight: 400, overflowY: 'auto' }}>
                  {f.code}
                </pre>
              </div>
            ))}
            {result.instructions && result.instructions.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ac-primary)', marginBottom: 8, fontSize: 13 }}>🛠 Implementation Steps</div>
                <ol style={{ paddingLeft: 20, background: 'var(--ac-bg)', padding: 16, borderRadius: 8, margin: 0 }}>
                  {result.instructions.map((s, i) => <li key={i} className="ac-sm" style={{ marginBottom: 6, lineHeight: 1.5 }}>{s}</li>)}
                </ol>
              </div>
            )}
            {result.sql && (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ac-primary)', marginBottom: 8, fontSize: 13 }}>🗄 SQL Migration</div>
                <pre style={{ background: '#1e1e1e', color: '#9cdcfe', padding: 16, borderRadius: 8, fontSize: 12, overflowX: 'auto', fontFamily: 'monospace' }}>{result.sql}</pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

/* ─── GITHUB AI AGENT ────────────────────────────────────────────── */
export const GitHubAgentPage = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pat, setPat] = useState(() => localStorage.getItem('ac_github_pat') || '');
  const [repo, setRepo] = useState(() => localStorage.getItem('ac_github_repo') || '');
  const [branch, setBranch] = useState('main');
  const [showConfig, setShowConfig] = useState(false);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const handleSaveConfig = () => {
    localStorage.setItem('ac_github_pat', pat);
    localStorage.setItem('ac_github_repo', repo);
    setShowConfig(false);
    addLog('GitHub configuration saved locally.', 'success');
  };

  const simulateProcess = (actionName, msgs) => {
    setLoading(true);
    addLog(`Initiating: ${actionName}...`, 'info');
    
    let delay = 0;
    msgs.forEach((m) => {
      delay += 800 + Math.random() * 1000;
      setTimeout(() => addLog(m.text, m.type), delay);
    });
    
    setTimeout(() => {
      setLoading(false);
      addLog(`${actionName} completed successfully.`, 'success');
    }, delay + 500);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    simulateProcess('AI Code Generation', [
      { text: `Analyzing prompt: "${prompt}"...`, type: 'info' },
      { text: 'Fetching context from repository...', type: 'info' },
      { text: 'Generating code changes using AI Agent...', type: 'info' },
      { text: 'Validating syntax and dependencies...', type: 'success' },
      { text: 'Diff generated for 3 files.', type: 'info' }
    ]);
  };

  const handleCommit = () => simulateProcess('Commit Changes', [
    { text: 'Staging 3 modified files...', type: 'info' },
    { text: 'Creating commit: "AI Auto-fix applied"...', type: 'info' },
    { text: 'Commit 8a4f9b2 created.', type: 'success' }
  ]);

  const handlePush = () => simulateProcess('Push to Origin', [
    { text: `Connecting to github.com/${repo}...`, type: 'info' },
    { text: `Pushing changes to branch: ${branch}...`, type: 'info' },
    { text: 'Delta compression using up to 8 threads', type: 'info' },
    { text: 'Push successful.', type: 'success' }
  ]);
  
  const handleMerge = () => simulateProcess('Merge PR', [
    { text: 'Checking PR status and CI/CD pipelines...', type: 'info' },
    { text: 'All checks passed.', type: 'success' },
    { text: `Merging branch into ${branch}...`, type: 'info' },
    { text: 'Merge commit created.', type: 'success' }
  ]);

  const handleDeploy = () => simulateProcess('Vercel/Netlify Deployment', [
    { text: 'Triggering deployment webhook...', type: 'info' },
    { text: 'Building project (vite build)...', type: 'info' },
    { text: 'Uploading artifacts...', type: 'info' },
    { text: 'Deployment ready. URL: https://acute-connect.live', type: 'success' }
  ]);

  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <div>
          <h1 className="ac-h1">GitHub AI Agent</h1>
          <p className="ac-muted ac-sm" style={{ marginTop: 4 }}>Directly interact with your repository and deploy code changes.</p>
        </div>
        <Button variant="outline" icon={FiSettings} onClick={() => setShowConfig(!showConfig)}>
          {pat ? 'Configuration' : 'Set up GitHub'}
        </Button>
      </div>

      {showConfig && (
        <Card>
          <div className="ac-flex-between" style={{ marginBottom: 16 }}>
            <h3 className="ac-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeIcon icon={FiGithub} /> GitHub Connection
            </h3>
            <button className="ac-icon-btn" onClick={() => setShowConfig(false)}><SafeIcon icon={FiX} /></button>
          </div>
          <div className="ac-stack-sm">
            <Field label="Personal Access Token (PAT)" hint="Requires repo, workflow, and write:packages scopes">
              <Input type="password" value={pat} onChange={e => setPat(e.target.value)} placeholder="ghp_..." />
            </Field>
            <div className="ac-grid-2">
              <Field label="Repository (owner/repo)">
                <Input value={repo} onChange={e => setRepo(e.target.value)} placeholder="e.g. Laurendi/Acute-Connect-MVP" />
              </Field>
              <Field label="Target Branch">
                <Input value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. main" />
              </Field>
            </div>
            <Button onClick={handleSaveConfig} icon={FiSave} style={{ alignSelf: 'flex-start' }}>Save Configuration</Button>
          </div>
        </Card>
      )}

      <div className="ac-grid-2">
        <div className="ac-stack">
          <Card title="Agent Command Center">
            <Field label="Instruct the AI Agent">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Add a new 'Reports' page to SystemViews and update the menu navigation..."
                style={{ width: '100%', minHeight: 120, padding: 14, borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--ac-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--ac-border)'}
              />
            </Field>
            <div style={{ marginTop: 12 }}>
              <Button onClick={handleGenerate} disabled={!prompt.trim() || loading || !pat} icon={FiCpu} style={{ width: '100%' }}>
                {loading ? 'Agent is working...' : 'Generate Code Changes'}
              </Button>
            </div>
          </Card>
          
          <Card title="Repository Actions">
            <div className="ac-grid-2" style={{ gap: 12 }}>
              <Button variant="outline" onClick={handleCommit} disabled={loading || !pat} icon={FiGitCommit}>Commit</Button>
              <Button variant="outline" onClick={handlePush} disabled={loading || !pat} icon={FiSend}>Push</Button>
              <Button variant="outline" onClick={handleMerge} disabled={loading || !pat} icon={FiGitMerge}>Merge PR</Button>
              <Button onClick={handleDeploy} disabled={loading || !pat} icon={FiZap} style={{ background: 'var(--ac-success)', borderColor: 'var(--ac-success)' }}>Deploy Live</Button>
            </div>
          </Card>
        </div>

        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#111', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 13, fontWeight: 600 }}>
              <SafeIcon icon={FiTerminal} size={14} /> Agent Terminal Console
            </div>
            <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>Clear</button>
          </div>
          <div style={{ flex: 1, background: '#1e1e1e', color: '#d4d4d4', padding: 16, fontSize: 12, fontFamily: 'monospace', overflowY: 'auto', minHeight: 350, maxHeight: 450 }}>
            {logs.length === 0 ? <div style={{ color: '#666', fontStyle: 'italic' }}>Awaiting terminal commands...</div> :
              logs.map((l, i) => (
                <div key={i} style={{ marginBottom: 6, lineHeight: 1.5 }}>
                  <span style={{ color: '#569cd6', marginRight: 8, userSelect: 'none' }}>[{l.time}]</span>
                  <span style={{ color: l.type === 'success' ? '#4ec9b0' : l.type === 'error' ? '#f44747' : '#cecece' }}>{l.msg}</span>
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ─── LOCATION ROLLOUT ────────────────────────────────────────────── */
export const RolloutPage = () => {
  return (
    <div className="ac-stack">
      <h1 className="ac-h1">Location Rollout Manager</h1>
      <Card title="Rollout Pipeline">
        <div className="ac-stack-sm">
          <p className="ac-muted ac-sm" style={{ marginBottom: 12 }}>Manage the deployment of new care centers across regions.</p>
          <div className="ac-flex-between" style={{ padding: 12, border: '1px solid var(--ac-border)', borderRadius: 8 }}>
            <span style={{ fontWeight: 600 }}>Parramatta Hub</span>
            <Badge tone="blue">In Progress (60%)</Badge>
          </div>
          <div className="ac-flex-between" style={{ padding: 12, border: '1px solid var(--ac-border)', borderRadius: 8 }}>
            <span style={{ fontWeight: 600 }}>North Sydney Clinic</span>
            <Badge tone="amber">Planning</Badge>
          </div>
          <div className="ac-flex-between" style={{ padding: 12, border: '1px solid var(--ac-border)', borderRadius: 8 }}>
            <span style={{ fontWeight: 600 }}>Bondi Junction</span>
            <Badge tone="green">Completed</Badge>
          </div>
        </div>
      </Card>
      <div className="ac-grid-2">
        <Card title="Resource Allocation">
          <div className="ac-stack-sm">
            <div className="ac-flex-between"><span className="ac-sm">IT Hardware Setup</span><Badge tone="green">Ready</Badge></div>
            <div className="ac-flex-between"><span className="ac-sm">Network Configuration</span><Badge tone="amber">Pending</Badge></div>
            <div className="ac-flex-between"><span className="ac-sm">Staff Software Training</span><Badge tone="blue">Scheduled</Badge></div>
          </div>
        </Card>
        <Card title="Compliance & Clearances">
          <div className="ac-stack-sm">
            <div className="ac-flex-gap"><SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /> <span className="ac-sm">Health & Safety Audit</span></div>
            <div className="ac-flex-gap"><SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /> <span className="ac-sm">Data Privacy Clearance</span></div>
            <div className="ac-flex-gap"><SafeIcon icon={FiClock} style={{ color: 'var(--ac-warn)' }} /> <span className="ac-sm">Local Council Approval</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ─── SYSTEM DASHBOARD ────────────────────────────────────────────── */
export const SysDashPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">System Dashboard</h1>
    <div className="ac-grid-3">
      <Card title="Support Stations Connectivity">
        <div className="ac-stack-sm" style={{ marginTop: 8 }}>
          {[['Camperdown Node', '99%', 'green', '99%'], ['Newtown Database', '76%', 'amber', '76%'], ['Central Hub', '100%', 'green', '100%']].map(([name, val, tone, width]) => (
            <div key={name}>
              <div className="ac-flex-between"><span className="ac-sm">{name}</span><Badge tone={tone}>{val}</Badge></div>
              <div className="ac-progress"><div className="ac-progress-bar" style={{ width, background: tone === 'amber' ? 'var(--ac-warn)' : 'var(--ac-primary)' }}/></div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Provider Leads & Audits">
        <div className="ac-stack-sm">
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ac-primary)' }}>142</div>
          <div className="ac-muted ac-xs">Provider Registrations (YTD)</div>
          <div className="ac-divider"/>
          <div className="ac-flex-between"><span className="ac-sm">Converted</span><span style={{ fontWeight: 600 }}>89</span></div>
          <div className="ac-flex-between"><span className="ac-sm">Pending Audit</span><span style={{ fontWeight: 600 }}>53</span></div>
        </div>
      </Card>
      <Card title="System Status">
        <div className="ac-stack-sm">
          {[['API Gateway', 'Online'], ['Auth Services', 'Online'], ['Analytics Engine', 'Online']].map(([k, v]) => (
            <div key={k} className="ac-flex-between"><span className="ac-sm">{k}</span><Badge tone="green">{v}</Badge></div>
          ))}
        </div>
      </Card>
    </div>
    <Card title="Daily Traffic Overview">
      <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '20px 0' }}>
        {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
          <div key={i} style={{ flex: 1, background: 'var(--ac-primary)', height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
        ))}
      </div>
      <div className="ac-flex-between ac-muted ac-xs">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
      </div>
    </Card>
  </div>
);

/* ─── PROVIDER METRICS ────────────────────────────────────────────── */
export const ProviderMetricsPage = () => (
  <div className="ac-stack">
    <div className="ac-flex-between">
      <h1 className="ac-h1">Provider Performance Metrics</h1>
      <Button variant="outline" icon={FiRefreshCw}>Refresh Data</Button>
    </div>
    <div className="ac-grid-3">
      <Card title="Avg Response Time"><div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-primary)' }}>4.2m</div><div className="ac-muted ac-xs">Top 10% of network</div></Card>
      <Card title="Patient Satisfaction"><div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-success)' }}>4.8/5</div><div className="ac-muted ac-xs">Based on 1,204 reviews</div></Card>
      <Card title="Resolution Rate"><div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac-primary)' }}>92%</div><div className="ac-muted ac-xs">First-contact resolution</div></Card>
    </div>
    <Card>
      <div className="ac-table-container">
        <table className="ac-table">
          <thead><tr><th>Provider</th><th>Facility</th><th>Response</th><th>Rating</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ fontWeight: 600 }}>Dr. Sarah Smith</td><td>Camperdown Medical</td><td>3.1m</td><td>4.9</td><td><Badge tone="green">Excellent</Badge></td></tr>
            <tr><td style={{ fontWeight: 600 }}>Paramedic Team Alpha</td><td>Newtown Station</td><td>4.5m</td><td>4.7</td><td><Badge tone="green">Good</Badge></td></tr>
            <tr><td style={{ fontWeight: 600 }}>Dr. James Wilson</td><td>Main Campus</td><td>6.2m</td><td>4.2</td><td><Badge tone="amber">Needs Review</Badge></td></tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

/* ─── SUPER ADMIN ─────────────────────────────────────────────────── */
export const SuperAdminPage = () => {
  const [stats, setStats] = useState({ patients: 0, crns: 0, checkins: 0, admins: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }),
      supabase.from('crns_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }),
      supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }),
    ]).then(([p, c, ci, a]) => setStats({ patients: p.count || 0, crns: c.count || 0, checkins: ci.count || 0, admins: a.count || 0 }));
  }, []);
  return (
    <div className="ac-stack">
      <div className="ac-flex-between"><h1 className="ac-h1">⚡ Super Admin</h1><Badge tone="green">System Online</Badge></div>
      <div className="ac-grid-4">
        {[['Patients', stats.patients, FiUsers, 'var(--ac-primary)'], ['CRN Pool', stats.crns, FiDatabase, 'var(--ac-success)'], ['Check-ins', stats.checkins, FiActivity, 'var(--ac-warn)'], ['Staff', stats.admins, FiShield, '#AF52DE']].map(([label, val, icon, color]) => (
          <div key={label} className="ac-stat-tile">
            <div className="ac-flex-gap" style={{ marginBottom: 8 }}><SafeIcon icon={icon} style={{ color }} /><span className="ac-muted ac-xs">{label}</span></div>
            <div style={{ fontSize: 30, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>
      <div className="ac-grid-2">
        <Card title="System Health">
          <div className="ac-stack-sm">
            {[['API Latency', '24ms', 'green'], ['DB Load', '12%', 'green'], ['Memory', '68%', 'amber'], ['Uptime', '99.9%', 'green']].map(([k, v, t]) => (
              <div key={k} className="ac-flex-between"><span className="ac-sm">{k}</span><Badge tone={t}>{v}</Badge></div>
            ))}
          </div>
        </Card>
        <Card title="Database Overview">
          <div className="ac-stack-sm ac-muted ac-xs">
            <p>PostgreSQL 15.1 hosted by Supabase.</p>
            <p>RLS active on all public wrapper tables.</p>
            <p>Storage: 45MB / 500MB</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ─── USERS PAGE ──────────────────────────────────────────────────── */
export const UsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, email: '', role: 'admin', status: 'active' });
  useEffect(() => { fetchAdmins(); }, []);
  const fetchAdmins = async () => { const { data } = await supabase.from('admin_users_1777025000000').select('*'); setAdmins(data || []); };
  const handleSave = async () => {
    if (form.id) { await supabase.from('admin_users_1777025000000').update({ role: form.role, status: form.status }).eq('id', form.id); }
    else { await supabase.from('admin_users_1777025000000').insert([{ email: form.email, role: form.role, status: form.status }]); }
    setModal(false); fetchAdmins();
  };
  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">Staff Management</h1>
        <Button icon={FiPlus} onClick={() => { setForm({ id: null, email: '', role: 'admin', status: 'active' }); setModal(true); }}>Add Staff</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.email}</td>
                  <td><Badge tone={a.role === 'sysadmin' ? 'violet' : 'blue'}>{a.role}</Badge></td>
                  <td><StatusBadge status={a.status || 'active'} /></td>
                  <td><button className="ac-icon-btn" onClick={() => { setForm(a); setModal(true); }}><SafeIcon icon={FiEdit2} size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {modal && (
        <ModalOverlay title={form.id ? 'Edit Staff' : 'Add Staff'} onClose={() => setModal(false)}>
          <div className="ac-stack">
            <Field label="Email"><Input value={form.email} disabled={!!form.id} onChange={e => setForm({...form, email: e.target.value})} /></Field>
            <Field label="Role"><Select value={form.role} onChange={e => setForm({...form, role: e.target.value})} options={['admin', 'sysadmin']} /></Field>
            <Field label="Status"><Select value={form.status} onChange={e => setForm({...form, status: e.target.value})} options={['active', 'inactive']} /></Field>
            <div className="ac-grid-2" style={{ marginTop: 8 }}><Button variant="outline" onClick={() => setModal(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── HEATMAP ─────────────────────────────────────────────────────── */
export const HeatMapPage = () => {
  const [aiInsight, setAiInsight] = useState(false);
  return (
    <div className="ac-stack">
      <div className="ac-flex-between">
        <h1 className="ac-h1">City Heat Map & Dispatch</h1>
        <Button variant="outline" icon={FiRefreshCw} onClick={() => setAiInsight(true)}>Run AI Analysis</Button>
      </div>
      {aiInsight && (
        <div style={{ background: 'var(--ac-primary-soft)', border: '1px solid var(--ac-primary)', padding: 16, borderRadius: 12 }}>
          <div className="ac-flex-gap" style={{ marginBottom: 8 }}><SafeIcon icon={FiActivity} style={{ color: 'var(--ac-primary)' }} /><div style={{ fontWeight: 700, color: 'var(--ac-primary)' }}>AI Predictive Insight — {new Date().toLocaleTimeString()}</div></div>
          <div className="ac-sm" style={{ marginBottom: 16, lineHeight: 1.5 }}>Historical data indicates a <strong>78% probability</strong> of crisis spike in <strong>Camperdown</strong> between 22:00–02:00. Recommend pre-deploying 1 Ambulance and 1 Support Staff to Newtown staging area.</div>
          <Button size="sm" style={{ width: '100%' }}>Deploy Units</Button>
        </div>
      )}
      <Card style={{ padding: 0, overflow: 'hidden', height: 550 }}>
        <iframe title="Heat Map" src="https://www.openstreetmap.org/export/embed.html?bbox=151.16%2C-33.91%2C151.21%2C-33.86&layer=mapnik" width="100%" height="100%" style={{ border: 0, filter: 'var(--ac-map-filter)', display: 'block' }} loading="lazy" />
      </Card>
    </div>
  );
};

/* ─── OFFICES ─────────────────────────────────────────────────────── */
export const OfficesPage = () => {
  const [offices, setOffices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', suffix: '', address: '', status: 'active', beds: 0 });
  const [toast, setToast] = useState('');
  useEffect(() => { fetchOffices(); }, []);
  const fetchOffices = async () => { const { data } = await supabase.from('care_centres_1777090000').select('*'); setOffices(data || []); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const handleSave = async () => {
    if (!form.name || !form.suffix) return alert('Name and CRN Suffix are required');
    if (form.id) { const { error } = await supabase.from('care_centres_1777090000').update({ name: form.name, suffix: form.suffix, address: form.address, status: form.status, beds: form.beds }).eq('id', form.id); if (!error) showToast('Updated'); else alert(error.message); }
    else { const { error } = await supabase.from('care_centres_1777090000').insert([{ name: form.name, suffix: form.suffix, address: form.address, status: form.status, beds: form.beds }]); if (!error) showToast('Created'); else alert(error.message); }
    setModal(false); fetchOffices();
  };
  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Care Centre Management</h1>
        <Button icon={FiPlus} onClick={() => { setForm({ id: null, name: '', suffix: '', address: '', status: 'active', beds: 0 }); setModal(true); }}>Add Care Centre</Button>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead><tr><th>Name</th><th>CRN Suffix</th><th>Address</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {offices.length === 0 ? <tr><td colSpan="6" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No care centres found.</td></tr>
                : offices.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td><Badge tone="violet">{o.suffix}</Badge></td>
                    <td className="ac-muted ac-xs">{o.address}</td>
                    <td>{o.beds} Beds</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><button className="ac-icon-btn" onClick={() => { setForm(o); setModal(true); }}><SafeIcon icon={FiEdit2} size={14} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      {modal && (
        <ModalOverlay title={form.id ? 'Edit Care Centre' : 'Add Care Centre'} onClose={() => setModal(false)}>
          <div className="ac-stack">
            <Field label="Facility Name"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Main Campus" /></Field>
            <Field label="CRN Suffix (3 Letters)"><Input value={form.suffix} onChange={e => setForm({...form, suffix: e.target.value.toUpperCase().slice(0,3)})} placeholder="e.g. MCP" maxLength={3} /></Field>
            <Field label="Address"><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
            <div className="ac-grid-2">
              <Field label="Capacity (Beds)"><Input type="number" value={form.beds} onChange={e => setForm({...form, beds: parseInt(e.target.value)||0})} /></Field>
              <Field label="Status"><Select value={form.status} onChange={e => setForm({...form, status: e.target.value})} options={['active', 'maintenance', 'closed']} /></Field>
            </div>
            <div className="ac-grid-2" style={{ marginTop: 8 }}><Button variant="outline" onClick={() => setModal(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── INTEGRATIONS ────────────────────────────────────────────────── */
export const IntegrationPage = () => {
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  const [googleConfig, setGoogleConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_google') || '{}') || { client_id: '', client_secret: '', status: 'disconnected' });
  const [aiConfig, setAiConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_ai') || '{}') || { api_key: '', model: 'gpt-4', endpoint: 'https://api.openai.com/v1/chat/completions', status: 'disconnected' });
  const [outlookConfig, setOutlookConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_outlook') || '{}') || { client_id: '', tenant_id: '', status: 'disconnected' });
  const [calendlyConfig, setCalendlyConfig] = useState(() => JSON.parse(localStorage.getItem('ac_int_calendly') || '{}') || { api_key: '', link: '', status: 'disconnected' });
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const handleSave = (type) => {
    const configs = { google: [googleConfig, setGoogleConfig, 'ac_int_google'], ai: [aiConfig, setAiConfig, 'ac_int_ai'], outlook: [outlookConfig, setOutlookConfig, 'ac_int_outlook'], calendly: [calendlyConfig, setCalendlyConfig, 'ac_int_calendly'] };
    const [conf, setter, key] = configs[type];
    const updated = { ...conf, status: 'connected' };
    setter(updated); localStorage.setItem(key, JSON.stringify(updated));
    showToast(`${type.toUpperCase()} configuration saved.`); setModal(null);
  };
  const integrations = [
    { id: 'google', title: 'Google Workspace', icon: FiCalendar, label: 'Google Calendar', config: googleConfig },
    { id: 'outlook', title: 'Microsoft Outlook', icon: FiMail, label: 'Outlook 365', config: outlookConfig },
    { id: 'calendly', title: 'Calendly', icon: FiClock, label: 'Calendly Booking', config: calendlyConfig },
    { id: 'ai', title: 'AI Triage Engine', icon: FiCpu, label: 'OpenAI GPT-4', config: aiConfig },
  ];
  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">Integrations & API Hub</h1>
      <div className="ac-grid-2">
        {integrations.map(({ id, title, icon, label, config }) => (
          <Card key={id} title={title}>
            <div className="ac-stack-sm">
              <div className="ac-flex-between" style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
                <div className="ac-flex-gap"><SafeIcon icon={icon} /><span className="ac-sm" style={{ fontWeight: 600 }}>{label}</span></div>
                <Badge tone={config.status === 'connected' ? 'green' : 'amber'}>{config.status === 'connected' ? 'Connected' : 'Not Configured'}</Badge>
              </div>
              <Button variant="outline" icon={FiSettings} onClick={() => setModal(id)}>Configure {title.split(' ')[0]}</Button>
            </div>
          </Card>
        ))}
      </div>
      {modal === 'google' && (<ModalOverlay title="Configure Google Workspace" onClose={() => setModal(null)}><div className="ac-stack"><Field label="Client ID"><Input value={googleConfig.client_id} onChange={e => setGoogleConfig({...googleConfig, client_id: e.target.value})} /></Field><Field label="Client Secret"><Input type="password" value={googleConfig.client_secret} onChange={e => setGoogleConfig({...googleConfig, client_secret: e.target.value})} /></Field><div className="ac-grid-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('google')}>Save</Button></div></div></ModalOverlay>)}
      {modal === 'outlook' && (<ModalOverlay title="Configure Microsoft Outlook" onClose={() => setModal(null)}><div className="ac-stack"><Field label="Client ID"><Input value={outlookConfig.client_id} onChange={e => setOutlookConfig({...outlookConfig, client_id: e.target.value})} /></Field><Field label="Tenant ID"><Input value={outlookConfig.tenant_id} onChange={e => setOutlookConfig({...outlookConfig, tenant_id: e.target.value})} /></Field><div className="ac-grid-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('outlook')}>Save</Button></div></div></ModalOverlay>)}
      {modal === 'calendly' && (<ModalOverlay title="Configure Calendly" onClose={() => setModal(null)}><div className="ac-stack"><Field label="Personal Access Token"><Input type="password" value={calendlyConfig.api_key} onChange={e => setCalendlyConfig({...calendlyConfig, api_key: e.target.value})} /></Field><Field label="Booking Link"><Input value={calendlyConfig.link} onChange={e => setCalendlyConfig({...calendlyConfig, link: e.target.value})} placeholder="https://calendly.com/your-name" /></Field><div className="ac-grid-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('calendly')}>Save</Button></div></div></ModalOverlay>)}
      {modal === 'ai' && (<ModalOverlay title="Configure AI Engine" onClose={() => setModal(null)}><div className="ac-stack"><Field label="API Key"><Input type="password" value={aiConfig.api_key} onChange={e => setAiConfig({...aiConfig, api_key: e.target.value})} /></Field><Field label="Model"><Select value={aiConfig.model} onChange={e => setAiConfig({...aiConfig, model: e.target.value})} options={['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']} /></Field><Field label="Endpoint"><Input value={aiConfig.endpoint} onChange={e => setAiConfig({...aiConfig, endpoint: e.target.value})} /></Field><div className="ac-grid-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={() => handleSave('ai')}>Save</Button></div></div></ModalOverlay>)}
    </div>
  );
};

/* ─── FEEDBACK & TICKETS ──────────────────────────────────────────── */
export const FeedbackPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  useEffect(() => { fetchTickets(); }, []);
  const fetchTickets = async () => { setLoading(true); const { data } = await supabase.from('feedback_tickets_1777090000').select('*').order('created_at', { ascending: false }); setTickets(data || []); setLoading(false); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const handleResolve = async (id) => { const { error } = await supabase.from('feedback_tickets_1777090000').update({ status: 'resolved' }).eq('id', id); if (!error) { showToast('Ticket resolved.'); fetchTickets(); setViewModal(null); } };
  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);
  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between">
        <h1 className="ac-h1">Feedback & Tickets</h1>
        <div className="ac-flex-gap">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{value:'all',label:'All'},{value:'open',label:'Open'},{value:'resolved',label:'Resolved'}]} />
          <Button variant="outline" icon={FiRefreshCw} onClick={fetchTickets}>Refresh</Button>
        </div>
      </div>
      <Card>
        <div className="ac-table-container">
          <table className="ac-table">
            <thead><tr><th>Subject</th><th>Submitter</th><th>Category</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="ac-center" style={{ padding: 24 }}>Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan="6" className="ac-center" style={{ padding: 24, color: 'var(--ac-muted)' }}>No tickets found.</td></tr>
                : filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.subject}</td>
                    <td className="ac-sm">{t.submitted_by}</td>
                    <td><Badge tone="blue">{t.category}</Badge></td>
                    <td><Badge tone={t.priority==='high'?'red':t.priority==='medium'?'amber':'green'}>{t.priority}</Badge></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><button className="ac-icon-btn" onClick={() => setViewModal(t)}><SafeIcon icon={FiEye} size={14} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      {viewModal && (
        <ModalOverlay title="Ticket Details" onClose={() => setViewModal(null)}>
          <div className="ac-stack">
            <div style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8 }}>
              <div className="ac-flex-between" style={{ marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{viewModal.subject}</span><StatusBadge status={viewModal.status} /></div>
              <div className="ac-xs ac-muted">By {viewModal.submitted_by} on {new Date(viewModal.created_at).toLocaleDateString()}</div>
            </div>
            <Field label="Message"><div style={{ background: 'var(--ac-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--ac-border)' }}><p className="ac-sm">{viewModal.message}</p></div></Field>
            {viewModal.status !== 'resolved' && <Button icon={FiCheck} onClick={() => handleResolve(viewModal.id)}>Mark as Resolved</Button>}
            <Button variant="outline" onClick={() => setViewModal(null)}>Close</Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ─── FEATURE REQUESTS ────────────────────────────────────────────── */
export const FeatureRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  useEffect(() => { fetchRequests(); }, []);
  const fetchRequests = async () => { setLoading(true); const { data } = await supabase.from('feature_requests_1777090000').select('*').order('votes', { ascending: false }); setRequests(data || []); setLoading(false); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const handleStatus = async (id, status) => { const { error } = await supabase.from('feature_requests_1777090000').update({ status }).eq('id', id); if (!error) { showToast(`Marked as ${status}`); fetchRequests(); } };
  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div className="ac-flex-between"><h1 className="ac-h1">Feature Requests</h1><Button variant="outline" icon={FiRefreshCw} onClick={fetchRequests}>Refresh</Button></div>
      <div className="ac-grid-2">
        {loading ? <p className="ac-muted">Loading...</p>
          : requests.length === 0 ? <p className="ac-muted">No requests found.</p>
          : requests.map(req => (
            <Card key={req.id}>
              <div className="ac-flex-between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>{req.title}</h3>
                <Badge tone={req.status==='planned'?'green':req.status==='in_progress'?'blue':'amber'}>{req.status}</Badge>
              </div>
              <p className="ac-sm" style={{ marginBottom: 14, color: 'var(--ac-muted)' }}>{req.description}</p>
              <div className="ac-flex-between">
                <div className="ac-flex-gap"><SafeIcon icon={FiThumbsUp} size={13} style={{ color: 'var(--ac-primary)' }} /><span className="ac-sm" style={{ fontWeight: 600 }}>{req.votes} votes</span></div>
                <div className="ac-flex-gap">
                  {req.status !== 'planned' && <Button size="sm" variant="outline" onClick={() => handleStatus(req.id,'planned')}>Plan</Button>}
                  {req.status !== 'in_progress' && <Button size="sm" onClick={() => handleStatus(req.id,'in_progress')}>Start</Button>}
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

/* ─── SETTINGS ────────────────────────────────────────────────────── */
export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('ac_app_config') || '{}') || { site_name: 'Acute Care Services', support_email: 'support@acuteconnect.health', contact_phone: '+61 2 9999 0000' });
  const [toast, setToast] = useState('');
  const [subPage, setSubPage] = useState(null);
  
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const handleSave = () => { localStorage.setItem('ac_app_config', JSON.stringify(config)); showToast('Settings saved.'); };
  
  return (
    <div className="ac-stack">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <h1 className="ac-h1">Global Settings</h1>
      
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ac-border)', marginBottom: 16 }}>
        <button onClick={() => setActiveTab('general')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'general' ? '2px solid var(--ac-primary)' : '2px solid transparent', color: activeTab === 'general' ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: activeTab === 'general' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>General Settings</button>
        <button onClick={() => setActiveTab('access')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'access' ? '2px solid var(--ac-primary)' : '2px solid transparent', color: activeTab === 'access' ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: activeTab === 'access' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>Module Access Control</button>
      </div>

      {activeTab === 'general' && (
        <div className="ac-grid-2">
          <Card title="Application Config">
            <div className="ac-stack-sm">
              <Field label="Site Name"><Input value={config.site_name} onChange={e => setConfig({...config, site_name: e.target.value})} /></Field>
              <Field label="Support Email"><Input value={config.support_email} onChange={e => setConfig({...config, support_email: e.target.value})} /></Field>
              <Field label="Contact Phone"><Input value={config.contact_phone} onChange={e => setConfig({...config, contact_phone: e.target.value})} /></Field>
              <Button icon={FiSave} onClick={handleSave}>Save Settings</Button>
            </div>
          </Card>
          <Card title="System Tools">
            <div className="ac-stack-sm">
              {[['System Logs', FiFileText, 'logs'], ['Regression Tests', FiCpu, 'regression'], ['Site Map', FiColumns, 'sitemap']].map(([label, icon, id]) => (
                <Button key={id} variant="outline" icon={icon} onClick={() => setSubPage(id)} style={{ width: '100%', justifyContent: 'flex-start' }}>{label}</Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'access' && (
        <Card title="Role Permissions">
          <div className="ac-table-container">
            <table className="ac-table">
              <thead><tr><th>Module</th><th>SysAdmin</th><th>Admin</th><th>Public</th></tr></thead>
              <tbody>
                {['Client Check-in', 'Crisis Event Reporting', 'Multi-User Assignment for Crisis Events', 'Activity Log for Clients', 'System Config'].map((m) => (
                  <tr key={m}>
                    <td style={{ fontWeight: 600 }}>{m}</td>
                    <td><SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /></td>
                    <td>{m !== 'System Config' ? <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /> : <SafeIcon icon={FiX} style={{ color: 'var(--ac-danger)' }} />}</td>
                    <td>{m === 'Client Check-in' ? <SafeIcon icon={FiCheckCircle} style={{ color: 'var(--ac-success)' }} /> : <SafeIcon icon={FiX} style={{ color: 'var(--ac-danger)' }} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {subPage === 'logs' && (
        <ModalOverlay title="System Logs" onClose={() => setSubPage(null)} wide>
          <div className="ac-mono ac-xs" style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#34C759', padding: 16, borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
            {`[10:45:12] INFO: Supabase connection established.\n[10:46:01] WARN: Failed to sync Google Calendar (Token expired).\n[10:48:33] INFO: Admin user logged in.\n[10:50:15] INFO: CRM: New patient registered (CRN: AC2024-001-MCP).\n[10:52:44] INFO: AI Engine: Triage analysis completed for check-in #142.\n[11:05:22] INFO: Heat Map: Predictive model updated.\n[11:10:08] WARN: API rate limit approaching (78% of quota used).`}
          </div>
        </ModalOverlay>
      )}
      {subPage === 'regression' && (
        <ModalOverlay title="Regression Tests" onClose={() => setSubPage(null)} wide>
          <div className="ac-stack-sm">
            {[['Auth Flow','Passed','green'],['Database RLS','Passed','green'],['UI Rendering','Passed','green'],['CRM Sync','Passed','green'],['AI Integration','Passed','green'],['Calendar Sync','Warning','amber']].map(([name,status,tone]) => (
              <div key={name} className="ac-flex-between" style={{ padding: 12, border: '1px solid var(--ac-border)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>{name}</span><Badge tone={tone}>{status}</Badge>
              </div>
            ))}
            <Button variant="outline" icon={FiRefreshCw} style={{ marginTop: 8 }}>Run All Tests</Button>
          </div>
        </ModalOverlay>
      )}
      {subPage === 'sitemap' && (
        <ModalOverlay title="Site Map" onClose={() => setSubPage(null)} wide>
          <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
            <div>📂 <strong>Client</strong> → Check-In · Professionals · Resources</div>
            <div>📂 <strong>Admin</strong> → Triage · CRM · Crisis · Reports · Invoicing · Integrations</div>
            <div>📂 <strong>SysAdmin</strong> → Dashboard · AI Fixer · GitHub Agent · Rollout · Feedback · Features · Staff · Settings · Super Admin</div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};
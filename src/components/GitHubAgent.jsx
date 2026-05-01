import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiGithub, FiX, FiSend, FiTerminal, FiGitCommit, FiGitMerge,
  FiGitPullRequest, FiZap, FiSettings, FiEye, FiRotateCcw,
  FiCode, FiCheckCircle, FiAlertCircle, FiSave, FiRefreshCw,
  FiGitBranch, FiInfo,
} = FiIcons;

const PANEL_WIDTH = 480;

const termColor = (type) => {
  if (type === 'success') return '#4ec9b0';
  if (type === 'error') return '#f44747';
  if (type === 'warn') return '#dcdcaa';
  if (type === 'user') return '#9cdcfe';
  return '#cecece';
};

const MsgBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10, marginBottom: 16, alignItems: 'flex-start'
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? '#0066cc' : '#1a1a2e',
        border: isUser ? 'none' : '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
      }}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: isUser ? '#0066cc' : '#1e1e2e',
          border: isUser ? 'none' : '1px solid #333',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px', color: '#e0e0e0', fontSize: 13, lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        {msg.code && (
          <pre style={{
            marginTop: 8, background: '#0d0d0d', border: '1px solid #333',
            borderRadius: 8, padding: 12, fontSize: 11, color: '#d4d4d4',
            overflowX: 'auto', fontFamily: 'monospace', maxHeight: 200, overflowY: 'auto'
          }}>{msg.code}</pre>
        )}
        <div style={{ fontSize: 10, color: '#555', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
};

const TerminalLog = ({ logs, onClear }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#111', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: 11, fontWeight: 600 }}>
          <SafeIcon icon={FiTerminal} size={12} /> Terminal Output
        </div>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 11 }}>Clear</button>
      </div>
      <div ref={ref} style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, maxHeight: 160, overflowY: 'auto', minHeight: 60 }}>
        {logs.length === 0
          ? <span style={{ color: '#444', fontStyle: 'italic' }}>No output yet...</span>
          : logs.map((l, i) => (
            <div key={i} style={{ marginBottom: 3, lineHeight: 1.5 }}>
              <span style={{ color: '#4a9eff', marginRight: 8 }}>[{l.time}]</span>
              <span style={{ color: termColor(l.type) }}>{l.msg}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
};

const PreviewPanel = ({ repo, onClose }) => (
  <div style={{ position: 'absolute', inset: 0, background: '#0a0a14', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '12px 16px', background: '#111', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 13, fontWeight: 600 }}>
        <SafeIcon icon={FiEye} size={14} /> Live Preview
        <span style={{ fontSize: 11, color: '#666', fontWeight: 400 }}>— {repo || 'No repo configured'}</span>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
        <SafeIcon icon={FiX} size={16} />
      </button>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <div style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ fontSize: 11, color: '#666', marginLeft: 8, fontFamily: 'monospace' }}>https://acute-connect.live</span>
        </div>
        <div style={{ width: '100%', height: 400, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#555' }}>
            <SafeIcon icon={FiEye} size={32} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 13 }}>Connect a Vercel/Netlify webhook<br/>to enable live preview</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a href={`https://github.com/${repo}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#ddd', fontSize: 12, textDecoration: 'none' }}>
          <SafeIcon icon={FiGithub} size={13} /> View on GitHub
        </a>
        <button onClick={onClose}
          style={{ padding: '8px 14px', background: '#0066cc', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer' }}>
          Back to Agent
        </button>
      </div>
    </div>
  </div>
);

const ConfigPanel = ({ pat, repo, branch, setPat, setRepo, setBranch, onSave, onClose, verifying }) => (
  <div style={{ padding: 20, background: '#0f0f1a', borderBottom: '1px solid #222' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SafeIcon icon={FiGithub} size={14} /> GitHub Configuration
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
        <SafeIcon icon={FiX} size={14} />
      </button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { label: 'Personal Access Token', value: pat, setter: setPat, type: 'password', placeholder: 'ghp_...' },
        { label: 'Repository (owner/repo)', value: repo, setter: setRepo, type: 'text', placeholder: 'owner/repo-name' },
        { label: 'Target Branch', value: branch, setter: setBranch, type: 'text', placeholder: 'main' },
      ].map(({ label, value, setter, type, placeholder }) => (
        <div key={label}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
          <input
            type={type} value={value}
            onChange={e => setter(e.target.value)}
            placeholder={placeholder}
            style={{ width: '100%', padding: '9px 12px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, color: '#e0e0e0', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
        </div>
      ))}
      <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, padding: '8px 0' }}>
        Token needs <code style={{ color: '#4ec9b0' }}>repo</code> scope for private repos, <code style={{ color: '#4ec9b0' }}>public_repo</code> for public. Create at github.com/settings/tokens.
      </div>
      <button onClick={onSave} disabled={verifying} style={{ padding: '9px 16px', background: '#0066cc', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <SafeIcon icon={FiSave} size={13} /> {verifying ? 'Verifying…' : 'Save & Connect'}
      </button>
    </div>
  </div>
);

export default function GitHubAgentPanel({ open, onClose, role }) {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: 'Hello! I\'m your GitHub AI Agent. I\'m connected to the GitHub API and can list PRs, branches, commits, browse files, create branches, and more.\n\nClick the ⚙ icon to configure your GitHub token, then try asking me something.',
      time: new Date().toLocaleTimeString(),
      id: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [history, setHistory] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [connectedUser, setConnectedUser] = useState(null);

  const [pat, setPat] = useState(() => localStorage.getItem('ac_github_pat') || '');
  const [repo, setRepo] = useState(() => localStorage.getItem('ac_github_repo') || '');
  const [branch, setBranch] = useState(() => localStorage.getItem('ac_github_branch') || 'main');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  }, []);

  const addMsg = useCallback((role, content, code = null) => {
    setMessages(prev => [...prev, { role, content, code, time: new Date().toLocaleTimeString(), id: Date.now() + Math.random() }]);
  }, []);

  const callAgent = useCallback(async (action, extraParams = {}) => {
    const aiConfig = (() => {
      try { return JSON.parse(localStorage.getItem('ac_int_ai') || '{}'); } catch { return {}; }
    })();
    const res = await fetch('/.netlify/functions/github-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        pat: localStorage.getItem('ac_github_pat') || pat,
        repo: localStorage.getItem('ac_github_repo') || repo,
        branch: localStorage.getItem('ac_github_branch') || branch,
        openai_key: aiConfig.status === 'connected' ? aiConfig.api_key : undefined,
        openai_model: aiConfig.model || 'gpt-4',
        ...extraParams,
      }),
    });
    return res.json();
  }, [pat, repo, branch]);

  const handleSaveConfig = async () => {
    if (!pat) {
      addMsg('agent', '⚠️ Please enter a GitHub Personal Access Token.');
      return;
    }
    setVerifying(true);
    addLog('Verifying GitHub token…', 'info');
    try {
      const result = await callAgent('verify_token');
      if (result.error) {
        addLog(`Token verification failed: ${result.error}`, 'error');
        addMsg('agent', `❌ Token verification failed: ${result.error}\n\nCheck that your PAT is valid and has the correct scopes.`);
      } else {
        localStorage.setItem('ac_github_pat', pat);
        localStorage.setItem('ac_github_repo', repo);
        localStorage.setItem('ac_github_branch', branch);
        setConnectedUser(result.user);
        setShowConfig(false);
        addLog(`Authenticated as @${result.user.login}`, 'success');
        addMsg('agent', `✅ Connected to GitHub as @${result.user.login} (${result.user.name || 'no name set'})\n\nRepo: ${repo || 'none set'}\nBranch: ${branch}\n\nI'm ready. Try "list prs", "list branches", or "latest commit".`);
      }
    } catch (err) {
      addLog(`Network error: ${err.message}`, 'error');
      addMsg('agent', `❌ Network error verifying token: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const executeAction = useCallback(async (action, params = {}) => {
    addLog(`→ ${action}${Object.keys(params).length ? ': ' + JSON.stringify(params) : ''}`, 'info');
    try {
      const result = await callAgent(action, params);
      if (result.error) {
        addLog(`Error: ${result.error}`, 'error');
        addMsg('agent', `❌ ${result.error}`);
        return;
      }

      switch (action) {
        case 'list_prs': {
          if (!result.prs?.length) {
            addMsg('agent', `No ${params.state || 'open'} pull requests found in ${repo}.`);
          } else {
            const lines = result.prs.map(pr =>
              `• #${pr.number}: ${pr.title}\n  ${pr.head} → ${pr.base}\n  ${pr.url}`
            ).join('\n\n');
            addMsg('agent', `Found ${result.prs.length} ${params.state || 'open'} PR(s):\n\n${lines}`);
          }
          result.prs?.forEach(pr => addLog(`PR #${pr.number}: ${pr.title}`, 'success'));
          break;
        }

        case 'list_branches': {
          const branches = result.branches || [];
          const currentBranch = localStorage.getItem('ac_github_branch') || branch;
          const lines = branches.map(b => `• ${b}${b === currentBranch ? ' ← current' : ''}`).join('\n');
          addMsg('agent', `Branches in ${repo} (${branches.length} total):\n\n${lines}`);
          addLog(`Found ${branches.length} branch(es)`, 'success');
          break;
        }

        case 'get_latest_commit': {
          const c = result;
          const sha = (c.sha || '').slice(0, 7);
          addLog(`Latest: ${sha} — ${c.message?.split('\n')[0]}`, 'success');
          addMsg('agent', `Latest commit on \`${branch}\`:\n\n• SHA: ${sha}\n• Message: ${c.message?.split('\n')[0]}\n• Author: ${c.author}\n• Date: ${c.date ? new Date(c.date).toLocaleString() : '—'}\n• URL: ${c.url}`);
          break;
        }

        case 'repo_info': {
          addLog(`Repo: ${result.name} ⭐${result.stars}`, 'success');
          addMsg('agent', `Repository: ${result.name}\n\n• Description: ${result.description || 'None'}\n• Default branch: ${result.default_branch}\n• Stars: ${result.stars} · Forks: ${result.forks}\n• Open issues: ${result.open_issues}\n• Last updated: ${result.updated_at ? new Date(result.updated_at).toLocaleDateString() : '—'}\n• URL: ${result.url}`);
          break;
        }

        case 'list_files': {
          const path = params.path || '/';
          const dirs = result.files?.filter(f => f.type === 'dir') || [];
          const files = result.files?.filter(f => f.type !== 'dir') || [];
          const lines = [
            ...dirs.map(f => `📁 ${f.name}/`),
            ...files.map(f => `📄 ${f.name}${f.size ? ` (${f.size}b)` : ''}`),
          ].join('\n');
          addMsg('agent', `Files in ${path}:\n\n${lines || 'Empty directory'}`);
          addLog(`Listed ${result.files?.length || 0} items in ${path}`, 'success');
          break;
        }

        case 'get_file': {
          addLog(`Loaded: ${result.path} (${result.size} bytes)`, 'success');
          const preview = result.content?.slice(0, 800);
          addMsg('agent', `File: \`${result.path}\`\nSHA: ${(result.sha || '').slice(0, 7)} · ${result.size} bytes`, preview);
          break;
        }

        case 'create_branch': {
          addLog(`Created branch: ${result.branch}`, 'success');
          addMsg('agent', `✅ Branch \`${result.branch}\` created!\n• SHA: ${(result.sha || '').slice(0, 7)}`);
          break;
        }

        case 'create_pr': {
          addLog(`PR #${result.pr?.number} created`, 'success');
          addMsg('agent', `✅ Pull Request created!\n\n• #${result.pr?.number}: ${result.pr?.title}\n• URL: ${result.pr?.url}`);
          break;
        }

        case 'merge_pr': {
          addLog(`Merged: ${(result.sha || '').slice(0, 7)}`, 'success');
          addMsg('agent', `✅ PR merged!\n• Commit SHA: ${(result.sha || '').slice(0, 7)}\n• ${result.message}`);
          break;
        }

        case 'commit_file': {
          addLog(`Committed: ${(result.commit?.sha || '').slice(0, 7)}`, 'success');
          addMsg('agent', `✅ File committed!\n• SHA: ${(result.commit?.sha || '').slice(0, 7)}\n• ${result.commit?.url}`);
          break;
        }

        case 'trigger_deploy': {
          if (result.success) {
            addLog('Deploy event dispatched', 'success');
            addMsg('agent', `🚀 Deploy event dispatched to ${repo}.\n\nIf you have a GitHub Actions workflow listening for the "deploy" event, it will start now.`);
          } else {
            addMsg('agent', `⚠️ ${result.error || result.message}`);
          }
          break;
        }

        default:
          addLog(`Action ${action} completed`, 'success');
      }
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
      addMsg('agent', `❌ Error: ${err.message}`);
    }
  }, [callAgent, addLog, addMsg, branch, repo]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMsg('user', text);

    if (!pat) {
      addMsg('agent', '⚠️ No GitHub token configured. Click the ⚙ icon to set up your connection first.');
      setShowConfig(true);
      return;
    }

    setLoading(true);
    setHistory(prev => [...prev.slice(-7), { label: text, timestamp: new Date().toLocaleTimeString() }]);

    try {
      // Keyword shortcuts for common commands (no AI key needed)
      const lower = text.toLowerCase();
      if (/^(list\s+)?(open\s+)?pr(s|ull\s+requests?)?$/.test(lower)) {
        await executeAction('list_prs');
        return;
      }
      if (/^(list\s+)?branch(es)?$/.test(lower)) {
        await executeAction('list_branches');
        return;
      }
      if (/^(latest|last|recent)\s+commit$/.test(lower)) {
        await executeAction('get_latest_commit');
        return;
      }
      if (/^repo\s+(info|stats|status)$/.test(lower)) {
        await executeAction('repo_info');
        return;
      }
      if (/^(list\s+)?files?$/.test(lower)) {
        await executeAction('list_files', { path: '' });
        return;
      }

      // Send to AI chat endpoint
      addLog(`Thinking about: "${text}"`, 'user');
      const result = await callAgent('chat', { message: text });

      if (result.error) {
        addLog(`Error: ${result.error}`, 'error');
        addMsg('agent', `❌ ${result.error}`);
        return;
      }

      if (result.reply) {
        addMsg('agent', result.reply);
        return;
      }

      if (result.ai_action) {
        const { action, params, message } = result.ai_action;
        addLog(`AI → ${action}`, 'info');
        if (message) addMsg('agent', message);
        if (action && action !== 'explain') {
          await executeAction(action, params || {});
        }
      }
    } catch (err) {
      addLog(`Network error: ${err.message}`, 'error');
      addMsg('agent', `❌ Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const QuickButton = ({ icon, label, onClick, color = '#1a1a2e', disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading || !pat}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '10px 8px', background: color, border: '1px solid #333',
        borderRadius: 10, cursor: (disabled || loading || !pat) ? 'not-allowed' : 'pointer',
        opacity: (disabled || loading || !pat) ? 0.4 : 1, flex: 1, transition: 'all 0.2s', minWidth: 0,
      }}
    >
      <SafeIcon icon={icon} size={15} style={{ color: '#e0e0e0' }} />
      <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );

  if (role !== 'sysadmin') return null;

  const isConnected = !!pat;
  const currentPat = localStorage.getItem('ac_github_pat') || pat;

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 198, backdropFilter: 'blur(2px)' }}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: PANEL_WIDTH, maxWidth: '100vw',
        background: '#0a0a14', borderLeft: '1px solid #1e1e33',
        zIndex: 199, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.6)' : 'none',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', background: '#0f0f1a', borderBottom: '1px solid #1e1e33', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a2e', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiGithub} size={16} style={{ color: '#e0e0e0' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>GitHub AI Agent</div>
            <div style={{ fontSize: 10, color: isConnected ? '#4ec9b0' : '#f44747' }}>
              {isConnected
                ? `● Live · ${repo || 'No repo set'}${connectedUser ? ` · @${connectedUser.login}` : ''}`
                : '● Not configured — click ⚙ to connect'}
            </div>
          </div>
          <button onClick={() => setShowPreview(true)} title="Live Preview"
            style={{ background: 'none', border: '1px solid #333', borderRadius: 7, padding: '6px 8px', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <SafeIcon icon={FiEye} size={13} /> Preview
          </button>
          <button onClick={() => setShowConfig(!showConfig)} title="Settings"
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 6 }}>
            <SafeIcon icon={FiSettings} size={15} />
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 6 }}>
            <SafeIcon icon={FiX} size={16} />
          </button>
        </div>

        {/* Config Panel */}
        {showConfig && (
          <ConfigPanel
            pat={pat} repo={repo} branch={branch}
            setPat={setPat} setRepo={setRepo} setBranch={setBranch}
            onSave={handleSaveConfig} onClose={() => setShowConfig(false)}
            verifying={verifying}
          />
        )}

        {/* Preview Overlay */}
        {showPreview && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            <PreviewPanel repo={repo} onClose={() => setShowPreview(false)} />
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', scrollBehavior: 'smooth' }}>
          {messages.map(msg => <MsgBubble key={msg.id} msg={msg} />)}
          {loading && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a2e', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a9eff', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Terminal */}
        <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
          <TerminalLog logs={logs} onClear={() => setLogs([])} />
        </div>

        {/* Quick Action Buttons */}
        <div style={{ padding: '8px 12px', background: '#0f0f1a', borderTop: '1px solid #1e1e33', display: 'flex', gap: 6, flexShrink: 0 }}>
          <QuickButton icon={FiGitPullRequest} label="PRs" onClick={() => { setLoading(true); executeAction('list_prs').finally(() => setLoading(false)); }} />
          <QuickButton icon={FiGitBranch} label="Branches" onClick={() => { setLoading(true); executeAction('list_branches').finally(() => setLoading(false)); }} />
          <QuickButton icon={FiGitCommit} label="Commits" onClick={() => { setLoading(true); executeAction('get_latest_commit').finally(() => setLoading(false)); }} />
          <QuickButton icon={FiCode} label="Files" onClick={() => { setLoading(true); executeAction('list_files', { path: '' }).finally(() => setLoading(false)); }} />
          <QuickButton icon={FiInfo} label="Repo Info" onClick={() => { setLoading(true); executeAction('repo_info').finally(() => setLoading(false)); }} />
          <QuickButton icon={FiZap} label="Deploy" onClick={() => { setLoading(true); executeAction('trigger_deploy').finally(() => setLoading(false)); }} color="#0a1a0a" />
        </div>

        {/* History strip */}
        {history.length > 0 && (
          <div style={{ padding: '6px 12px', background: '#060610', borderTop: '1px solid #111', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', alignSelf: 'center' }}>History:</span>
            {history.slice(-4).map((h, i) => (
              <button key={i} onClick={() => setInput(h.label)}
                style={{ fontSize: 10, padding: '3px 8px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 12, color: '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {h.label.slice(0, 24)}{h.label.length > 24 ? '…' : ''}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '10px 12px 14px', background: '#0f0f1a', borderTop: '1px solid #1e1e33', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#1a1a2e', border: '1px solid #333', borderRadius: 14, padding: '8px 8px 8px 14px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder='Ask me anything… "list prs", "show branches", "latest commit", "create branch feature/x", "merge PR #12"'
              rows={2}
              style={{ flex: 1, background: 'none', border: 'none', color: '#e0e0e0', fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() && !loading ? '#0066cc' : '#1a1a2e', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
              <SafeIcon icon={FiSend} size={15} style={{ color: input.trim() && !loading ? '#fff' : '#444' }} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 6, textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line · Add OpenAI key in Integrations for full AI support
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

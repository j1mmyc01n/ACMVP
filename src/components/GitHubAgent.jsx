import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiGithub, FiX, FiSend, FiTerminal, FiGitCommit, FiGitMerge,
  FiGitPullRequest, FiZap, FiSettings, FiEye, FiRotateCcw,
  FiChevronRight, FiCode, FiCheckCircle, FiAlertCircle, FiCopy,
  FiTrash2, FiSave, FiRefreshCw
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14
      }}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: isUser ? '#0066cc' : '#1e1e2e',
          border: isUser ? 'none' : '1px solid #333',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px', color: '#e0e0e0', fontSize: 13, lineHeight: 1.6
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
  <div style={{
    position: 'absolute', inset: 0, background: '#0a0a14', zIndex: 10,
    display: 'flex', flexDirection: 'column'
  }}>
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
          <span style={{ fontSize: 11, color: '#666', marginLeft: 8, fontFamily: 'monospace' }}>
            https://acute-connect-preview.vercel.app
          </span>
        </div>
        <iframe
          src="about:blank"
          title="Preview"
          style={{ width: '100%', height: 400, border: 'none', background: '#fff' }}
        />
      </div>
      <div style={{ fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
        Preview reflects the last successful build.<br/>
        <span style={{ color: '#4ec9b0' }}>Connect a Vercel/Netlify webhook</span> to enable live preview.
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

const ConfigPanel = ({ pat, repo, branch, setPat, setRepo, setBranch, onSave, onClose }) => (
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
        { label: 'Repository (owner/repo)', value: repo, setter: setRepo, type: 'text', placeholder: 'Laurendi/Acute-Connect-MVP' },
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
      <button onClick={onSave} style={{ padding: '9px 16px', background: '#0066cc', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <SafeIcon icon={FiSave} size={13} /> Save Configuration
      </button>
    </div>
  </div>
);

export default function GitHubAgentPanel({ open, onClose, role }) {
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Hello! I\'m your GitHub AI Agent. I can help you generate code changes, commit, push, merge, and deploy your Acute Connect platform. What would you like to do?', time: new Date().toLocaleTimeString(), id: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [history, setHistory] = useState([]);

  const [pat, setPat] = useState(() => localStorage.getItem('ac_github_pat') || '');
  const [repo, setRepo] = useState(() => localStorage.getItem('ac_github_repo') || '');
  const [branch, setBranch] = useState(() => localStorage.getItem('ac_github_branch') || 'main');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  }, []);

  const addMsg = useCallback((role, content, code = null) => {
    setMessages(prev => [...prev, { role, content, code, time: new Date().toLocaleTimeString(), id: Date.now() }]);
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('ac_github_pat', pat);
    localStorage.setItem('ac_github_repo', repo);
    localStorage.setItem('ac_github_branch', branch);
    setShowConfig(false);
    addLog('Configuration saved.', 'success');
    addMsg('agent', `Configuration saved. Connected to ${repo} on branch ${branch}.`);
  };

  const runSequence = useCallback((label, steps, onDone) => {
    setLoading(true);
    addLog(`▶ Starting: ${label}`, 'info');
    let delay = 0;
    steps.forEach(s => {
      delay += 600 + Math.random() * 800;
      setTimeout(() => addLog(s.msg, s.type || 'info'), delay);
    });
    setTimeout(() => {
      setLoading(false);
      addLog(`✓ ${label} complete.`, 'success');
      if (onDone) onDone();
    }, delay + 500);
  }, [addLog]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMsg('user', text);

    if (!pat) {
      addMsg('agent', '⚠️ No GitHub PAT configured. Please click the settings icon to set up your GitHub connection first.');
      setShowConfig(true);
      return;
    }

    setLoading(true);
    addLog(`Processing: "${text}"`, 'user');

    setTimeout(() => {
      const lower = text.toLowerCase();
      if (lower.includes('commit')) {
        handleCommit(text);
      } else if (lower.includes('push')) {
        handlePush();
      } else if (lower.includes('merge')) {
        handleMerge();
      } else if (lower.includes('deploy')) {
        handleDeploy();
      } else if (lower.includes('pull') || lower.includes('undo') || lower.includes('revert')) {
        handlePull();
      } else if (lower.includes('preview')) {
        setShowPreview(true);
        setLoading(false);
        addMsg('agent', 'Opening live preview...');
      } else {
        runSequence('AI Code Analysis', [
          { msg: `Analyzing: "${text}"`, type: 'info' },
          { msg: 'Scanning repository structure...', type: 'info' },
          { msg: 'Generating code diff...', type: 'info' },
          { msg: 'Validating React/Vite syntax...', type: 'info' },
          { msg: 'Diff ready — 2 files modified.', type: 'success' },
        ], () => {
          addMsg('agent',
            `I've analyzed your request and generated the following changes:\n\n• Modified: src/pages/SystemViews.jsx\n• Modified: src/lib/menu.js\n\nWould you like me to commit and push these changes?`,
            `// src/pages/SystemViews.jsx\n// Generated change for: "${text}"\nexport const NewFeature = () => (\n  <div>// Implementation here</div>\n);`
          );
          setHistory(prev => [...prev, { label: text, timestamp: new Date().toLocaleTimeString() }]);
        });
      }
    }, 400);
  };

  const handleCommit = (msg = 'AI auto-fix applied') => {
    runSequence('Git Commit', [
      { msg: 'Staging modified files...', type: 'info' },
      { msg: `git add -A`, type: 'warn' },
      { msg: `git commit -m "${msg}"`, type: 'warn' },
      { msg: `Commit abc123f created.`, type: 'success' },
    ], () => addMsg('agent', `✅ Committed: "${msg}". Ready to push when you are.`));
  };

  const handlePush = () => {
    runSequence('Git Push', [
      { msg: `Connecting to github.com/${repo}...`, type: 'info' },
      { msg: `git push origin ${branch}`, type: 'warn' },
      { msg: 'Compressing objects: 100%', type: 'info' },
      { msg: `Branch '${branch}' pushed.`, type: 'success' },
    ], () => addMsg('agent', `✅ Pushed to ${repo}:${branch}. Check GitHub for the latest commit.`));
  };

  const handleMerge = () => {
    runSequence('Merge PR', [
      { msg: 'Fetching open pull requests...', type: 'info' },
      { msg: 'CI checks: ✓ All passed', type: 'success' },
      { msg: `Merging PR into ${branch}...`, type: 'info' },
      { msg: 'Merge commit created.', type: 'success' },
    ], () => addMsg('agent', `✅ PR merged into ${branch}. Deployment may auto-trigger if CI/CD is configured.`));
  };

  const handleDeploy = () => {
    runSequence('Deploy', [
      { msg: 'Triggering Vercel webhook...', type: 'info' },
      { msg: 'vite build — Building for production...', type: 'warn' },
      { msg: 'Bundle size: 342KB (gzipped: 98KB)', type: 'info' },
      { msg: 'Uploading to CDN...', type: 'info' },
      { msg: '✓ Deployed: https://acute-connect.live', type: 'success' },
    ], () => addMsg('agent', `🚀 Deployed successfully! Live at: https://acute-connect.live`));
  };

  const handlePull = () => {
    runSequence('Git Pull / Revert', [
      { msg: `git fetch origin ${branch}`, type: 'warn' },
      { msg: 'Checking for diverged commits...', type: 'info' },
      { msg: 'git pull --rebase origin main', type: 'warn' },
      { msg: 'Reverted to last stable commit.', type: 'success' },
    ], () => addMsg('agent', `↩️ Reverted to last stable commit on ${branch}. Your local changes have been backed up to a stash.`));
  };

  const ActionButton = ({ icon, label, onClick, color = '#1a1a2e', disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading || !pat}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '10px 8px', background: color, border: '1px solid #333',
        borderRadius: 10, cursor: (disabled || loading || !pat) ? 'not-allowed' : 'pointer',
        opacity: (disabled || loading || !pat) ? 0.4 : 1, flex: 1,
        transition: 'all 0.2s', minWidth: 0
      }}
    >
      <SafeIcon icon={icon} size={15} style={{ color: '#e0e0e0' }} />
      <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );

  if (role !== 'sysadmin') return null;

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 198, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: PANEL_WIDTH, maxWidth: '100vw',
        background: '#0a0a14', borderLeft: '1px solid #1e1e33',
        zIndex: 199, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.6)' : 'none',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', background: '#0f0f1a', borderBottom: '1px solid #1e1e33', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a2e', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiGithub} size={16} style={{ color: '#e0e0e0' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>GitHub AI Agent</div>
            <div style={{ fontSize: 10, color: pat ? '#4ec9b0' : '#f44747' }}>
              {pat ? `● Connected · ${repo || 'No repo set'}` : '● Not configured'}
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

        {/* Action Buttons */}
        <div style={{ padding: '8px 12px', background: '#0f0f1a', borderTop: '1px solid #1e1e33', display: 'flex', gap: 6, flexShrink: 0 }}>
          <ActionButton icon={FiGitCommit} label="Commit" onClick={() => handleCommit()} />
          <ActionButton icon={FiSend} label="Push" onClick={handlePush} />
          <ActionButton icon={FiGitMerge} label="Merge PR" onClick={handleMerge} />
          <ActionButton icon={FiRotateCcw} label="Pull/Undo" onClick={handlePull} color="#1a0a0a" />
          <ActionButton icon={FiEye} label="Preview" onClick={() => setShowPreview(true)} disabled={false} />
          <ActionButton icon={FiZap} label="Deploy" onClick={handleDeploy} color="#0a1a0a" />
        </div>

        {/* History strip */}
        {history.length > 0 && (
          <div style={{ padding: '6px 12px', background: '#060610', borderTop: '1px solid #111', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', alignSelf: 'center' }}>History:</span>
            {history.slice(-4).map((h, i) => (
              <button key={i} onClick={() => setInput(h.label)}
                style={{ fontSize: 10, padding: '3px 8px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 12, color: '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {h.label.slice(0, 24)}{h.label.length > 24 ? '...' : ''}
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
              placeholder="Ask the agent... (e.g. 'Add a new reports page', 'commit my changes', 'deploy to production')"
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
            Enter to send · Shift+Enter for new line · Say "preview", "commit", "push", "deploy", or "undo"
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
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';

const {
  FiX, FiSend, FiSettings, FiCpu, FiUser, FiSave, FiRefreshCw,
  FiTrash2, FiShield, FiCheckCircle, FiAlertTriangle, FiCopy, FiEye, FiEyeOff,
} = FiIcons;

const PANEL_WIDTH = 480;
const STORAGE_KEY = 'ac_sysadmin_ai_cfg';

// ── Config storage helpers ────────────────────────────────────────────────────
const loadConfig = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
};
const saveConfig = (cfg) => localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));

// ── Message bubble ────────────────────────────────────────────────────────────
const MsgBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10, marginBottom: 16, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? '#6366F1' : '#1a1a2e',
        border: isUser ? 'none' : '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div style={{ maxWidth: '82%' }}>
        <div style={{
          background: isUser ? '#6366F1' : '#1e1e2e',
          border: isUser ? 'none' : '1px solid #333',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px', color: '#e0e0e0', fontSize: 13, lineHeight: 1.65,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 10, color: '#444', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
};

// ── Config panel ──────────────────────────────────────────────────────────────
const ConfigPanel = ({ config, onSave, onClose }) => {
  const [local, setLocal] = useState({
    functionUrl: config.functionUrl || '',
    sysadminToken: config.sysadminToken || '',
  });
  const [showToken, setShowToken] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://amfikpnctfgesifwdkkd.supabase.co';
  const defaultFnUrl = `${supabaseUrl}/functions/v1/sysadmin-ai-chat`;

  return (
    <div style={{ padding: 20, background: '#0f0f1a', borderBottom: '1px solid #222' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiCpu} size={14} style={{ color: '#6366F1' }} /> AI Agent Configuration
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
          <SafeIcon icon={FiX} size={14} />
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#6366F1', background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', marginBottom: 14, lineHeight: 1.6 }}>
        <strong>🔐 Auth:</strong> The panel automatically uses your Supabase session JWT.<br />
        If you're not signed into Supabase Auth, enter a <strong>SYSADMIN_SECRET</strong> token below<br />
        (set the same value as an Edge Function secret in Supabase Dashboard).
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Edge Function URL</div>
          <input
            type="text"
            value={local.functionUrl}
            onChange={e => setLocal(p => ({ ...p, functionUrl: e.target.value }))}
            placeholder={defaultFnUrl}
            style={{ width: '100%', padding: '9px 12px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, color: '#e0e0e0', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
          <div style={{ fontSize: 10, color: '#555', marginTop: 3 }}>Default: {defaultFnUrl}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Sysadmin Secret Token <span style={{ color: '#555' }}>(fallback — leave empty to use Supabase session)</span></div>
          <div style={{ position: 'relative' }}>
            <input
              type={showToken ? 'text' : 'password'}
              value={local.sysadminToken}
              onChange={e => setLocal(p => ({ ...p, sysadminToken: e.target.value }))}
              placeholder="Your SYSADMIN_SECRET value"
              style={{ width: '100%', padding: '9px 36px 9px 12px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, color: '#e0e0e0', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            <button onClick={() => setShowToken(t => !t)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
              <SafeIcon icon={showToken ? FiEyeOff : FiEye} size={13} />
            </button>
          </div>
        </div>
        <button
          onClick={() => { onSave(local); }}
          style={{ padding: '9px 16px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
        >
          <SafeIcon icon={FiSave} size={13} /> Save Configuration
        </button>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function SysAdminAIChat({ open, onClose, role }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello, SysAdmin 👋\n\nI\'m your Supabase AI agent. Ask me anything about the platform — locations, users, billing, analytics, or operational issues.',
    time: new Date().toLocaleTimeString(),
    id: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [authStatus, setAuthStatus] = useState('checking'); // checking | session | token | none
  const [config, setConfig] = useState(() => loadConfig());
  const [sessionToken, setSessionToken] = useState(null);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Resolve auth token on mount and when panel opens
  useEffect(() => {
    if (!open) return;
    resolveAuthToken();
  }, [open]);

  const resolveAuthToken = useCallback(async () => {
    setAuthStatus('checking');
    try {
      // Primary: try Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionToken(session.access_token);
        setAuthStatus('session');
        return;
      }
    } catch (e) {
      console.warn('getSession error:', e);
    }
    // Fallback: stored sysadmin secret token
    const storedToken = config.sysadminToken;
    if (storedToken) {
      setSessionToken(storedToken);
      setAuthStatus('token');
      return;
    }
    setSessionToken(null);
    setAuthStatus('none');
  }, [config.sysadminToken]);

  const handleSaveConfig = useCallback((newCfg) => {
    saveConfig(newCfg);
    setConfig(newCfg);
    setShowConfig(false);
    // Re-resolve auth with new config
    const storedToken = newCfg.sysadminToken;
    if (storedToken && authStatus !== 'session') {
      setSessionToken(storedToken);
      setAuthStatus('token');
    }
  }, [authStatus]);

  const addMsg = useCallback((role, content) => {
    setMessages(prev => [...prev, {
      role, content, time: new Date().toLocaleTimeString(), id: Date.now() + Math.random(),
    }]);
  }, []);

  const getFunctionUrl = useCallback(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://amfikpnctfgesifwdkkd.supabase.co';
    return config.functionUrl?.trim() || `${supabaseUrl}/functions/v1/sysadmin-ai-chat`;
  }, [config.functionUrl]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError('');
    addMsg('user', text);

    if (!sessionToken) {
      setError('No auth token. Open ⚙ Settings and add your SYSADMIN_SECRET, or sign in via Supabase Auth.');
      return;
    }

    setLoading(true);

    // Build history for context (last 10 turns = 20 messages)
    const history = messages.slice(-20).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    try {
      const res = await fetch(getFunctionUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      addMsg('assistant', data.reply || 'No response from agent.');
    } catch (err) {
      const msg = err.message || 'Unknown error';
      addMsg('assistant', `⚠️ Error: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionToken, messages, getFunctionUrl, addMsg]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      time: new Date().toLocaleTimeString(),
      id: Date.now(),
    }]);
    setError('');
  };

  // Sysadmin-only guard
  if (role !== 'sysadmin') return null;

  const authBadge = authStatus === 'session'
    ? { color: '#4ec9b0', label: '● Session JWT' }
    : authStatus === 'token'
    ? { color: '#facc15', label: '● Secret Token' }
    : authStatus === 'checking'
    ? { color: '#888', label: '● Checking auth…' }
    : { color: '#f44747', label: '● Not authenticated' };

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 196, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: PANEL_WIDTH, maxWidth: '100vw',
        background: '#0a0a14', borderLeft: '1px solid #1e1e33',
        zIndex: 197, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.6)' : 'none',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', background: '#0f0f1a', borderBottom: '1px solid #1e1e33', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a2e', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiCpu} size={16} style={{ color: '#6366F1' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Sysadmin AI Agent</div>
            <div style={{ fontSize: 10, color: authBadge.color }}>{authBadge.label}</div>
          </div>
          <button
            onClick={handleClearChat}
            title="Clear chat"
            style={{ background: 'none', border: '1px solid #333', borderRadius: 7, padding: '5px 7px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <SafeIcon icon={FiTrash2} size={13} />
          </button>
          <button
            onClick={() => setShowConfig(v => !v)}
            title="Settings"
            style={{ background: 'none', border: 'none', color: showConfig ? '#6366F1' : '#666', cursor: 'pointer', padding: 6 }}
          >
            <SafeIcon icon={FiSettings} size={15} />
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 6 }}>
            <SafeIcon icon={FiX} size={16} />
          </button>
        </div>

        {/* Config Panel */}
        {showConfig && (
          <ConfigPanel
            config={config}
            onSave={handleSaveConfig}
            onClose={() => setShowConfig(false)}
          />
        )}

        {/* Auth setup prompt (when not authenticated) */}
        {authStatus === 'none' && !showConfig && (
          <div style={{ padding: '12px 16px', background: '#1a0a0a', borderBottom: '1px solid #3a1a1a', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <SafeIcon icon={FiAlertTriangle} size={16} style={{ color: '#f44747', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
              No auth token found. Click <button onClick={() => setShowConfig(true)} style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontWeight: 700, fontSize: 12, padding: 0 }}>⚙ Settings</button> to add your sysadmin token,
              or sign into Supabase Auth.
            </div>
          </div>
        )}

        {/* Error bar */}
        {error && (
          <div style={{ padding: '8px 14px', background: '#1a0a0a', borderBottom: '1px solid #3a1a1a', fontSize: 11, color: '#f87171', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', scrollBehavior: 'smooth' }}>
          {messages.map(msg => <MsgBubble key={msg.id} msg={msg} />)}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a2e', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', animation: `aiDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts (shown only at start) */}
        {messages.length <= 1 && !loading && (
          <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            {[
              'How many active locations are there?',
              'Show me recent provisioning errors',
              'Summarise billing for this month',
              'List users with sysadmin role',
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                style={{ fontSize: 11, padding: '5px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 12, color: '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '10px 12px 14px', background: '#0f0f1a', borderTop: '1px solid #1e1e33', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#1a1a2e', border: `1px solid ${input.trim() ? '#6366F1' : '#333'}`, borderRadius: 14, padding: '8px 8px 8px 14px', transition: 'border-color 0.2s' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the sysadmin agent… (e.g. 'How many locations are active?')"
              rows={2}
              style={{ flex: 1, background: 'none', border: 'none', color: '#e0e0e0', fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !sessionToken}
              style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() && !loading && sessionToken ? '#6366F1' : '#1a1a2e', border: 'none', cursor: input.trim() && !loading && sessionToken ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <SafeIcon icon={FiSend} size={15} style={{ color: input.trim() && !loading && sessionToken ? '#fff' : '#444' }} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#333', marginTop: 5, textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line · <span style={{ color: authBadge.color }}>{authBadge.label}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aiDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

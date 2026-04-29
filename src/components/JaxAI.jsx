import React, { useState, useEffect, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMessageCircle, FiX, FiSend, FiZap, FiTrash2, FiMinus, FiNavigation } = FiIcons;

// Navigation intent map: keywords → page ID
const NAV_MAP = [
  { keys: ['care centre', 'care center', 'locations', 'offices'],           page: 'offices',          label: 'Care Centres' },
  { keys: ['staff management', 'staff', 'users', 'team'],                   page: 'users',            label: 'Staff Management' },
  { keys: ['audit log', 'audit', 'activity log'],                           page: 'audit_log',        label: 'Audit Log' },
  { keys: ['dashboard', 'system dashboard', 'sysdash'],                     page: 'sysdash',          label: 'System Dashboard' },
  { keys: ['admin dashboard', 'triage', 'admin'],                           page: 'admin',            label: 'Admin Dashboard' },
  { keys: ['crisis', 'emergency'],                                           page: 'crisis',           label: 'Crisis Management' },
  { keys: ['patient', 'crm', 'client directory', 'patient directory'],      page: 'crm',              label: 'Patient Directory' },
  { keys: ['report', 'clinical report'],                                     page: 'reports',          label: 'Clinical Reports' },
  { keys: ['heat map', 'heatmap', 'dispatch'],                              page: 'heatmap',          label: 'Heat Map & Dispatch' },
  { keys: ['integration', 'integrations'],                                  page: 'integrations',     label: 'Integrations' },
  { keys: ['check-in', 'checkin', 'check in'],                              page: 'checkin',          label: 'Check-In' },
  { keys: ['invoic', 'billing'],                                            page: 'invoicing',        label: 'Invoicing & Billing' },
  { keys: ['settings', 'config'],                                           page: 'settings',         label: 'Settings' },
  { keys: ['feedback', 'ticket'],                                           page: 'feedback',         label: 'Feedback & Tickets' },
  { keys: ['feature', 'feature request'],                                   page: 'features',         label: 'Feature Requests' },
  { keys: ['provider metric', 'provider'],                                  page: 'provider_metrics', label: 'Provider Metrics' },
  { keys: ['location rollout', 'rollout'],                                  page: 'rollout',          label: 'Location Rollout' },
  { keys: ['resource hub', 'resources'],                                    page: 'resource_hub',     label: 'Resource Hub' },
  { keys: ['multi-centre', 'multicentre', 'multi centre'],                  page: 'multicentre',      label: 'Multi-Centre Management' },
  { keys: ['sponsor ledger', 'sponsor'],                                    page: 'sponsor_ledger',   label: 'Sponsor Ledger' },
];

function detectNavIntent(text) {
  const q = text.toLowerCase();
  const isNavIntent = q.includes('go to') || q.includes('navigate to') || q.includes('open ') || q.includes('show me') || q.includes('take me to');
  if (!isNavIntent) return null;
  for (const entry of NAV_MAP) {
    if (entry.keys.some(k => q.includes(k))) return entry;
  }
  return null;
}

const SYSTEM_PROMPT = `You are Jax, the AI assistant built into the Acute Care Services platform — a mental health and crisis management system operating in Camperdown, NSW, Australia.

PLATFORM NAVIGATION:
You can navigate the platform on behalf of the user. When a user says "go to X", "show me X", or "navigate to X", respond with a navigation action and a brief confirmation. You can navigate to: Care Centres, Staff Management, Audit Log, System Dashboard, Admin Dashboard, Crisis Management, Patient Directory/CRM, Clinical Reports, Integrations, Check-In, Invoicing, Settings, Feedback, Feature Requests, Provider Metrics, Location Rollout, Resource Hub, Multi-Centre Management, Sponsor Ledger.

PLATFORM KNOWLEDGE:
- Client Check-In: Clients use their CRN to check in and schedule call-back windows (morning/afternoon/evening)
- CRN System: Clinical Reference Numbers are auto-generated unique IDs for each patient
- Care Centres: Manage facility locations, capacity, and activation status — in SYSADMIN menu
- Staff Management: Add/edit staff with roles (staff, admin, sysadmin) — in SYSADMIN menu
- Triage Dashboard: Clinicians see pending check-ins, mood scores, and AI-prioritised patient queues
- Crisis Management: Admins can raise crisis events, request police/ambulance, assign team members
- Audit Log: Compliance-grade activity log with AI insights for pattern detection
- Clinical Reports: Check-in data with mood scores, editable clinical notes, CSV export
- Integrations: Google Workspace, Outlook 365, Calendly, and OpenAI GPT-4 configuration

ROLES:
- Public: Can use Check-In, Get CRN, view Professionals and Resources
- Admin: Full patient/crisis/CRM/invoicing/integration management
- SysAdmin: Everything + system config, staff, care centres, settings, super admin

Be concise, professional, and helpful. Give clear step-by-step instructions when asked how to do something.`;

const INITIAL_MSG = {
  role: 'assistant',
  content: "Hi! I'm **Jax**, your AI platform assistant. I can help you navigate the platform, manage patients, handle crises, and more.\n\nWhat can I help you with today?"
};

const MAX_HISTORY = 12;

export default function JaxAI({ role, goto }) {
  if (!role || (role !== 'admin' && role !== 'sysadmin')) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [hasTasks, setHasTasks] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setHasTasks(hour >= 8 && hour <= 20);
    const interval = setInterval(() => {
      const h = new Date().getHours();
      setHasTasks(h >= 8 && h <= 20);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) inputRef.current.focus();
  }, [isOpen, isMinimized]);

  const clearChat = () => setMessages([INITIAL_MSG]);

  const formatMsg = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Check for navigation intent first
    const navIntent = detectNavIntent(userMsg.content);
    if (navIntent && goto) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: `Navigating to **${navIntent.label}**…` }]);
        setTimeout(() => goto(navIntent.page), 400);
      }, 600);
      return;
    }

    const aiConfig = JSON.parse(localStorage.getItem('ac_int_ai') || '{}');

    if (aiConfig.api_key && aiConfig.status === 'connected') {
      try {
        const historySlice = newMessages.slice(-MAX_HISTORY).map(m => ({ role: m.role, content: m.content }));
        const response = await fetch(aiConfig.endpoint || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.api_key}` },
          body: JSON.stringify({
            model: aiConfig.model || 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historySlice],
            max_tokens: 600,
            temperature: 0.7
          })
        });
        const data = await response.json();
        setIsTyping(false);
        if (data.choices?.[0]?.message?.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } else if (data.error) {
          setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ API Error: ${data.error.message}` }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Unexpected response. Check your API key in Integrations.' }]);
        }
      } catch {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not connect to AI provider. Check your network or API config in Integrations.' }]);
      }
    } else {
      // Smart fallback responses
      setTimeout(() => {
        setIsTyping(false);
        const q = userMsg.content.toLowerCase();
        let reply = '🔑 I\'m in demo mode. To unlock full AI capabilities, go to **Admin → Integrations → AI Engine** and enter your OpenAI API key.';

        if (q.includes('crn') || q.includes('clinical reference')) {
          reply = 'To get a CRN:\n\n**For clients:** Use the "Get CRN" tab on the Check-In page — enter your name, mobile, and email.\n\n**For staff:** Go to **CRM → Register Patient** or use the Patient Registry module.';
        } else if (q.includes('care centre') || q.includes('assign')) {
          reply = 'To assign a care centre:\n\n1. Go to **Client CRM**\n2. Click the ✏️ edit button on a patient\n3. Select a care centre from the dropdown\n4. Save changes\n\nTo add new care centres, go to **Care Centres** in the SYSADMIN menu. (Say "go to Care Centres" and I\'ll navigate there for you!)';
        } else if (q.includes('crisis')) {
          reply = 'To raise a crisis event:\n\n1. Go to **Crisis Management** in the ADMIN menu\n2. Click **Raise Event**\n3. Fill in client details, location, and severity\n4. Use the dispatch buttons to request Police or Ambulance';
        } else if (q.includes('patient') || q.includes('client') || q.includes('register')) {
          reply = 'To register a new patient:\n\n1. Go to **Client CRM** → click **Register Patient**\n2. Fill in name, email, phone, category, and care centre\n3. A CRN is auto-generated and saved';
        } else if (q.includes('report') || q.includes('export')) {
          reply = 'Clinical reports are in **Clinical Reports** (ADMIN menu).\n\nYou can:\n- View all check-ins with mood scores\n- Add/edit clinical notes per check-in\n- Export all data as **CSV**';
        } else if (q.includes('integrat') || q.includes('api') || q.includes('openai')) {
          reply = 'To configure integrations:\n\n1. Go to **Admin → Integrations**\n2. Click **Configure AI Engine**\n3. Enter your OpenAI API key, select model (GPT-4 recommended)\n4. Save — I\'ll be fully operational!';
        } else if (q.includes('staff') || q.includes('user management')) {
          reply = 'Staff management is in the **SYSADMIN** menu. Say "go to staff management" and I\'ll navigate there for you!\n\nYou can:\n- Add/edit staff members\n- Change roles (staff, admin, sysadmin)\n- Activate or deactivate accounts';
        } else if (q.includes('audit')) {
          reply = 'The Audit Log tracks all platform activity with compliance-grade detail.\n\nClick **"Analyse with AI"** in the Audit Log to automatically detect patterns and anomalies across all logged events.\n\nSay "go to audit log" and I\'ll navigate there!';
        } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
          reply = `Hello, ${role}! I'm Jax. I can navigate the platform for you — just say "go to [page name]". I also know workflows for patient registration, crisis management, reports, and integrations.`;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }, 800);
    }
  };

  const quickPrompts = [
    { label: 'Go to Care Centres', action: () => { if (goto) goto('offices'); setMessages(prev => [...prev, { role: 'user', content: 'Go to Care Centres' }, { role: 'assistant', content: 'Navigating to **Care Centres**…' }]); setTimeout(() => goto('offices'), 400); } },
    { label: 'Go to Staff Management', action: () => { if (goto) goto('users'); setMessages(prev => [...prev, { role: 'user', content: 'Go to Staff Management' }, { role: 'assistant', content: 'Navigating to **Staff Management**…' }]); setTimeout(() => goto('users'), 400); } },
    { label: 'How do I raise a crisis?', action: () => setInput('How do I raise a crisis event?') },
    { label: 'Show AI Audit insights', action: () => { if (goto) goto('audit_log'); setMessages(prev => [...prev, { role: 'user', content: 'Show me the audit log' }, { role: 'assistant', content: 'Navigating to **Audit Log**…' }]); setTimeout(() => goto('audit_log'), 400); } },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none', cursor: 'pointer',
          display: isOpen && !isMinimized ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          boxShadow: hasTasks
            ? '0 0 0 0 rgba(102,126,234,0.7), 0 8px 24px rgba(102,126,234,0.4)'
            : '0 8px 24px rgba(102,126,234,0.4)',
          animation: hasTasks ? 'jax-pulse 2s infinite' : 'none',
          transition: 'transform 0.2s', zIndex: 999
        }}
        title="Chat with Jax AI"
      >
        <SafeIcon icon={FiMessageCircle} size={24} />
        {hasTasks && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#ff4757', border: '2px solid #fff', animation: 'jax-bounce 1.5s infinite' }} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 'min(400px, calc(100vw - 32px))',
          maxHeight: isMinimized ? 'auto' : 'min(540px, calc(100vh - 100px))',
          height: isMinimized ? 'auto' : 'min(540px, calc(100vh - 100px))',
          background: 'var(--ac-surface)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid var(--ac-border)',
          transition: 'height 0.3s ease, max-height 0.3s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '12px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', color: '#fff', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafeIcon icon={FiZap} size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Jax AI</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>
                  {hasTasks ? '🟢 Monitoring active tasks' : '🔵 Platform online'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={clearChat} title="Clear chat" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <SafeIcon icon={FiTrash2} size={12} />
              </button>
              <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <SafeIcon icon={FiMinus} size={12} />
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <SafeIcon icon={FiX} size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '88%', padding: '8px 12px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--ac-bg)',
                      color: msg.role === 'user' ? '#fff' : 'var(--ac-text)',
                      fontSize: 13, lineHeight: 1.55,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.07)'
                    }}
                      dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
                    />
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '8px 12px', borderRadius: '14px 14px 14px 4px', background: 'var(--ac-bg)', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 0.2, 0.4].map((d, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ac-muted)', animation: `jax-dot 1s ${d}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 1 && (
                <div style={{ padding: '0 10px 6px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {quickPrompts.map((p, i) => (
                    <button key={i}
                      onClick={() => {
                        if (p.action) p.action();
                        else { setInput(p.label); inputRef.current?.focus(); }
                      }}
                      style={{ fontSize: 11, padding: '5px 10px', borderRadius: 20, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {p.label.startsWith('Go to') && <SafeIcon icon={FiNavigation} size={10} />}
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '8px 10px 12px', borderTop: '1px solid var(--ac-border)', display: 'flex', gap: 7, flexShrink: 0 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder='Ask Jax or say "go to [page]"…'
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 0 }}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !input.trim()}
                  style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', color: '#fff', cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isTyping || !input.trim() ? 0.5 : 1, transition: 'opacity 0.2s', flexShrink: 0 }}
                >
                  <SafeIcon icon={FiSend} size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes jax-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(102,126,234,0.7), 0 8px 24px rgba(102,126,234,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(102,126,234,0), 0 8px 24px rgba(102,126,234,0.4); }
        }
        @keyframes jax-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes jax-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

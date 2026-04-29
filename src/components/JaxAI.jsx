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
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

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
      {/* Floating Toggle Button (bottom-right when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 'clamp(20px, 3vw, 28px)',
            right: 'clamp(20px, 3vw, 28px)',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: hasTasks
              ? '0 0 0 0 rgba(102,126,234,0.7), 0 8px 24px rgba(102,126,234,0.4)'
              : '0 8px 24px rgba(102,126,234,0.4)',
            animation: hasTasks ? 'jax-pulse 2s infinite' : 'none',
            transition: 'transform 0.2s',
            zIndex: 998
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Open Jax AI Assistant"
        >
          <SafeIcon icon={FiMessageCircle} size={26} />
          {hasTasks && (
            <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#ff4757', border: '2px solid #fff', animation: 'jax-bounce 1.5s infinite' }} />
          )}
        </button>
      )}

      {/* Slide-out Panel from Right */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 999,
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.3s ease',
              backdropFilter: 'blur(2px)',
            }}
          />
          
          {/* Side Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'min(480px, 90vw)',
            background: 'var(--ac-surface)',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              flexShrink: 0,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SafeIcon icon={FiZap} size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Jax AI Assistant</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>
                    {hasTasks ? '🟢 Active & Monitoring' : '🔵 Platform Online'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={clearChat} 
                  title="Clear chat"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <SafeIcon icon={FiTrash2} size={14} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  title="Close panel"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <SafeIcon icon={FiX} size={16} />
                </button>
              </div>
            </div>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--ac-bg)',
                    color: msg.role === 'user' ? '#fff' : 'var(--ac-text)',
                    fontSize: 14, lineHeight: 1.6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                    dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
                  />
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--ac-bg)', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ac-muted)', animation: `jax-dot 1.2s ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts (when chat is fresh) */}
            {messages.length <= 1 && (
              <div style={{ padding: '0 12px 10px', display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid var(--ac-border)', paddingTop: 12 }}>
                {quickPrompts.map((p, i) => (
                  <button key={i}
                    onClick={() => {
                      if (p.action) p.action();
                      else { setInput(p.label); inputRef.current?.focus(); }
                    }}
                    style={{ fontSize: 12, padding: '7px 12px', borderRadius: 20, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text)', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ac-primary-soft)'; e.currentTarget.style.borderColor = 'var(--ac-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ac-surface)'; e.currentTarget.style.borderColor = 'var(--ac-border)'; }}
                  >
                    {p.label.startsWith('Go to') && <SafeIcon icon={FiNavigation} size={11} />}
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--ac-border)', display: 'flex', gap: 10, flexShrink: 0, background: 'var(--ac-surface)' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder='Ask Jax or say "go to [page]"…'
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', minWidth: 0, transition: 'border-color 0.2s' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ac-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ac-border)'}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', color: '#fff', cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isTyping || !input.trim() ? 0.5 : 1, transition: 'opacity 0.2s, transform 0.2s', flexShrink: 0 }}
                onMouseEnter={(e) => !isTyping && input.trim() && (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SafeIcon icon={FiSend} size={16} />
              </button>
            </div>
          </div>
        </>
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

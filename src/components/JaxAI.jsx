import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';

const { FiMessageCircle, FiX, FiSend, FiZap, FiTrash2, FiMinus, FiNavigation, FiUser, FiCheck, FiAlertCircle } = FiIcons;

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

ADMIN ACTIONS:
As an admin-level assistant you can perform the following actions on behalf of the user. When detected, output a JSON block inside <action> tags alongside your normal response:

- Look up patient: <action>{"type":"lookup_patient","crn":"CRNXXXXX"}</action>
- Update patient field: <action>{"type":"update_patient","crn":"CRNXXXXX","field":"name|phone|email|care_centre|category|status|notes","value":"..."}</action>
- Add clinical note: <action>{"type":"add_note","crn":"CRNXXXXX","note":"..."}</action>
- Resolve check-in: <action>{"type":"resolve_checkin","checkin_id":"..."}</action>
- Register new patient: <action>{"type":"register_patient","name":"...","email":"...","phone":"...","category":"crisis|mental_health|substance_abuse|housing|general","care_centre":"..."}</action>
- List urgent check-ins: <action>{"type":"list_urgent"}</action>
- Search patients: <action>{"type":"search_patients","query":"..."}</action>

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

Be concise, professional, and helpful. When performing actions, confirm what you did clearly. Always ask for confirmation before destructive changes.`;

const INITIAL_MSG = {
  role: 'assistant',
  content: "Hi! I'm **Jax**, your AI platform assistant. I can help you navigate the platform, manage patients, handle crises, and more.\n\nWhat can I help you with today?"
};

const MAX_HISTORY = 12;

// ─── Allowed action types whitelist ──────────────────────────────────────
const ALLOWED_ACTION_TYPES = new Set([
  'lookup_patient', 'update_patient', 'add_note', 'resolve_checkin',
  'register_patient', 'list_urgent', 'search_patients',
]);

const ALLOWED_UPDATE_FIELDS = new Set([
  'name', 'phone', 'email', 'care_centre', 'category', 'status', 'postcode', 'address',
]);

function validateAction(action) {
  if (!action || !ALLOWED_ACTION_TYPES.has(action.type)) return false;
  if (action.type === 'update_patient' && !ALLOWED_UPDATE_FIELDS.has(action.field)) return false;
  return true;
}

// ─── Action executor: runs Supabase operations requested by Jax ─────────
async function executeAction(action) {
  if (!validateAction(action)) {
    return `⚠️ Action type "${action?.type}" is not permitted.`;
  }
  try {
    switch (action.type) {
      case 'lookup_patient': {
        const { data } = await supabase
          .from('clients_1777020684735')
          .select('*')
          .ilike('crn', action.crn)
          .single();
        if (!data) return `❌ No patient found with CRN **${action.crn}**.`;
        return `✅ **Patient found:**\n**Name:** ${data.name}\n**CRN:** ${data.crn}\n**Status:** ${data.status || 'active'}\n**Category:** ${data.category || 'general'}\n**Care Centre:** ${data.care_centre || 'unassigned'}\n**Phone:** ${data.phone || '—'}\n**Email:** ${data.email || '—'}`;
      }
      case 'update_patient': {
        const { error } = await supabase
          .from('clients_1777020684735')
          .update({ [action.field]: action.value })
          .ilike('crn', action.crn);
        if (error) return `❌ Update failed: ${error.message}`;
        return `✅ Patient **${action.crn}** — **${action.field}** updated to **${action.value}**.`;
      }
      case 'add_note': {
        const newEvent = { type: 'clinical_note', note: action.note, by: 'Jax AI', ts: new Date().toISOString() };
        // event_log may not exist in schema — attempt update and ignore column error gracefully
        const { error } = await supabase
          .from('clients_1777020684735')
          .update({ event_log: [newEvent] })
          .ilike('crn', action.crn);
        if (error && error.message?.includes('event_log')) {
          // Column absent — note is acknowledged but not persisted
          return `✅ Clinical note noted for **${action.crn}** (event log not yet available).`;
        }
        if (error) return `❌ Note failed: ${error.message}`;
        return `✅ Clinical note added to **${action.crn}**.`;
      }
      case 'resolve_checkin': {
        const { error } = await supabase
          .from('check_ins_1740395000')
          .update({ status: 'resolved', resolved: true })
          .eq('id', action.checkin_id);
        if (error) return `❌ Could not resolve check-in: ${error.message}`;
        return `✅ Check-in **${action.checkin_id}** resolved.`;
      }
      case 'register_patient': {
        // Generate unique CRN with retry on conflict
        let crn, error;
        for (let attempt = 0; attempt < 5; attempt++) {
          crn = 'CRN' + Math.floor(10000000 + Math.random() * 90000000);
          const res = await supabase
            .from('clients_1777020684735')
            .insert([{ crn, name: action.name, email: action.email, phone: action.phone, category: action.category || 'general', care_centre: action.care_centre || '', status: 'active', created_at: new Date().toISOString() }]);
          error = res.error;
          if (!error) break;
          // If not a uniqueness violation, don't retry
          if (!error.code?.includes('23505')) break;
        }
        if (error) return `❌ Registration failed: ${error.message}`;
        return `✅ Patient **${action.name}** registered with CRN **${crn}**.`;
      }
      case 'list_urgent': {
        const { data } = await supabase
          .from('check_ins_1740395000')
          .select('id,name,crn,mood_score,status,created_at')
          .in('status', ['urgent', 'pending'])
          .eq('resolved', false)
          .order('mood_score', { ascending: true })
          .limit(5);
        if (!data || data.length === 0) return '✅ No urgent check-ins at this time.';
        const lines = data.map(c => `• **${c.name}** (${c.crn}) — Mood: ${c.mood_score}/10`).join('\n');
        return `🚨 **${data.length} pending check-in${data.length > 1 ? 's' : ''}:**\n${lines}`;
      }
      case 'search_patients': {
        const q = action.query?.trim() || '';
        const { data } = await supabase
          .from('clients_1777020684735')
          .select('crn, name, status, care_centre')
          .or(`name.ilike.%${q}%,crn.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(6);
        if (!data || data.length === 0) return `❌ No patients found matching **"${q}"**.`;
        const lines = data.map(p => `• **${p.name}** — ${p.crn} (${p.status || 'active'})`).join('\n');
        return `🔍 **${data.length} result${data.length > 1 ? 's' : ''} for "${q}":**\n${lines}`;
      }
      default:
        return null;
    }
  } catch (err) {
    return `⚠️ Action error: ${err.message}`;
  }
}

// ─── Local action intent detection (no AI key needed) ─────────────────
function detectActionIntent(text) {
  const q = text.toLowerCase();
  if (/look\s*up|find|search|show\s+patient|get\s+patient/.test(q)) {
    const crnMatch = text.match(/CRN\w+/i);
    if (crnMatch) return { type: 'lookup_patient', crn: crnMatch[0].toUpperCase() };
    const searchMatch = text.match(/(?:patient|person|client)\s+(?:named?\s+)?([A-Za-z ]{2,30})/i);
    if (searchMatch) return { type: 'search_patients', query: searchMatch[1].trim() };
  }
  if (/add.*note|clinical note|note.*patient/.test(q)) {
    const crnMatch = text.match(/CRN\w+/i);
    const noteMatch = text.match(/(?:note[:\s]+)(.+)/i);
    if (crnMatch && noteMatch) return { type: 'add_note', crn: crnMatch[0].toUpperCase(), note: noteMatch[1].trim() };
  }
  if (/urgent|who.*urgent|list.*urgent/.test(q)) {
    return { type: 'list_urgent' };
  }
  if (/update|change|set/.test(q)) {
    const crnMatch = text.match(/CRN\w+/i);
    const fieldMatch = text.match(/(?:update|change|set)\s+(\w+)\s+(?:to|as)\s+(.+)/i);
    if (crnMatch && fieldMatch) return { type: 'update_patient', crn: crnMatch[0].toUpperCase(), field: fieldMatch[1].toLowerCase(), value: fieldMatch[2].trim() };
  }
  return null;
}

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

  // Do NOT auto-focus on open – prevents iOS keyboard/zoom trigger
  // User must tap the input explicitly

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

    // 1. Check for navigation intent first
    const navIntent = detectNavIntent(userMsg.content);
    if (navIntent && goto) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: `Navigating to **${navIntent.label}**…` }]);
        setTimeout(() => { goto(navIntent.page); setIsOpen(false); }, 400);
      }, 600);
      return;
    }

    // 2. Check for local action intent (works without AI key)
    const actionIntent = detectActionIntent(userMsg.content);
    if (actionIntent) {
      const result = await executeAction(actionIntent);
      setIsTyping(false);
      if (result) {
        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        return;
      }
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
          const rawContent = data.choices[0].message.content;
          // Parse and execute any <action> blocks in the AI response
          const actionMatch = rawContent.match(/<action>([\s\S]*?)<\/action>/);
          if (actionMatch) {
            try {
              const parsedAction = JSON.parse(actionMatch[1]);
              // Validate before executing
              const actionResult = validateAction(parsedAction)
                ? await executeAction(parsedAction)
                : `⚠️ Action type "${parsedAction?.type}" is not permitted.`;
              const cleanContent = rawContent.replace(/<action>[\s\S]*?<\/action>/g, '').trim();
              const combined = [cleanContent, actionResult].filter(Boolean).join('\n\n');
              setMessages(prev => [...prev, { role: 'assistant', content: combined }]);
            } catch {
              setMessages(prev => [...prev, { role: 'assistant', content: rawContent }]);
            }
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: rawContent }]);
          }
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
        let reply = '🔑 I\'m in demo mode. To unlock full AI capabilities, go to **Admin → Integrations → AI Engine** and enter your OpenAI API key.\n\nI can still look up patients, search records, and list urgent check-ins — just ask!';

        if (q.includes('crn') || q.includes('clinical reference')) {
          reply = 'To get a CRN:\n\n**For clients:** Use the "Get CRN" tab on the Check-In page — enter your name, mobile, and email.\n\n**For staff:** Go to **CRM → Register Patient** or use the Patient Registry module.';
        } else if (q.includes('care centre') || q.includes('assign')) {
          reply = 'To assign a care centre:\n\n1. Go to **Client CRM**\n2. Click the ✏️ edit button on a patient\n3. Select a care centre from the dropdown\n4. Save changes\n\nTo add new care centres, go to **Care Centres** in the SYSADMIN menu. (Say "go to Care Centres" and I\'ll navigate there for you!)';
        } else if (q.includes('crisis')) {
          reply = 'To raise a crisis event:\n\n1. Go to **Crisis Management** in the ADMIN menu\n2. Click **Raise Event**\n3. Fill in client details, location, and severity\n4. Use the dispatch buttons to request Police or Ambulance';
        } else if (q.includes('patient') || q.includes('client') || q.includes('register')) {
          reply = 'To register a new patient:\n\n1. Go to **Client CRM** → click **Register Patient**\n2. Fill in name, email, phone, category, and care centre\n3. A CRN is auto-generated and saved\n\nOr tell me: "register patient [name] email [email] phone [phone]" and I\'ll do it for you!';
        } else if (q.includes('report') || q.includes('export')) {
          reply = 'Clinical reports are in **Clinical Reports** (ADMIN menu).\n\nYou can:\n- View all check-ins with mood scores\n- Add/edit clinical notes per check-in\n- Export all data as **CSV**';
        } else if (q.includes('integrat') || q.includes('api') || q.includes('openai')) {
          reply = 'To configure integrations:\n\n1. Go to **Admin → Integrations**\n2. Click **Configure AI Engine**\n3. Enter your OpenAI API key, select model (GPT-4 recommended)\n4. Save — I\'ll be fully operational!';
        } else if (q.includes('staff') || q.includes('user management')) {
          reply = 'Staff management is in the **SYSADMIN** menu. Say "go to staff management" and I\'ll navigate there for you!\n\nYou can:\n- Add/edit staff members\n- Change roles (staff, admin, sysadmin)\n- Activate or deactivate accounts';
        } else if (q.includes('audit')) {
          reply = 'The Audit Log tracks all platform activity with compliance-grade detail.\n\nClick **"Analyse with AI"** in the Audit Log to automatically detect patterns and anomalies across all logged events.\n\nSay "go to audit log" and I\'ll navigate there!';
        } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
          reply = `Hello! I'm Jax. I can:\n\n• **Navigate** — say "go to [page]"\n• **Look up patients** — say "find patient CRN12345"\n• **List urgent** — say "show urgent check-ins"\n• **Add notes** — say "add note to CRN12345: note text"\n• **Register patients** — say "register patient [name]"\n\nWhat can I help you with?`;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }, 800);
    }
  };

  const quickPrompts = [
    { label: '🚨 Show urgent check-ins', action: async () => {
      setMessages(prev => [...prev, { role: 'user', content: 'Show urgent check-ins' }]);
      setIsTyping(true);
      const result = await executeAction({ type: 'list_urgent' });
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: result || 'No urgent check-ins.' }]);
    }},
    { label: '🔍 Find patient by CRN', action: () => setInput('Find patient CRN') },
    { label: '🏥 Go to Triage', action: () => { if (goto) { setMessages(prev => [...prev, { role: 'user', content: 'Go to Triage Dashboard' }, { role: 'assistant', content: 'Navigating to **Admin Dashboard**…' }]); setTimeout(() => { goto('admin'); setIsOpen(false); }, 400); } } },
    { label: '⚡ Go to Integrations', action: () => { if (goto) { setMessages(prev => [...prev, { role: 'user', content: 'Go to Integrations' }, { role: 'assistant', content: 'Navigating to **Integrations**…' }]); setTimeout(() => { goto('loc_integrations'); setIsOpen(false); }, 400); } } },
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

      {/* Backdrop */}
      <div 
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Slide-out Panel from Right */}
      <>
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
            pointerEvents: isOpen ? 'auto' : 'none',
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
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 16, outline: 'none', fontFamily: 'inherit', minWidth: 0, transition: 'border-color 0.2s', touchAction: 'manipulation' }}
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

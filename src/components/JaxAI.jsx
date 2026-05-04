/*
  Run in Supabase SQL editor to set up Jax AI tables:

  CREATE TABLE IF NOT EXISTS jax_documents ( ... );
  CREATE TABLE IF NOT EXISTS agent_conversations ( ... );
  CREATE TABLE IF NOT EXISTS jax_form_registry ( ... );
  CREATE TABLE IF NOT EXISTS jax_notifications ( ... );
  ALTER TABLE clients_1777020684735 ADD COLUMN IF NOT EXISTS clinical_notes jsonb DEFAULT '[]';

  See supabase/migrations/20260504000000_jax_tables.sql for full SQL.
*/

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';
import { appendClientEvent, logActivity } from '../lib/audit';

const {
  FiMessageCircle, FiX, FiSend, FiZap, FiTrash2, FiMinus, FiNavigation,
  FiUser, FiCheck, FiAlertCircle, FiMic, FiVolume2, FiVolumeX, FiSettings,
  FiChevronRight, FiDownload, FiThumbsUp, FiThumbsDown, FiCopy, FiSave,
  FiFileText, FiBell,
} = FiIcons;

// ─── Form Context ─────────────────────────────────────────────────────────────
export const JaxFormContext = createContext(null);

if (!window.__jaxFormRegistry) {
  window.__jaxFormRegistry = new Map();
}

export function useJaxFormFill(formId, formName, fields) {
  useEffect(() => {
    const registry = window.__jaxFormRegistry;
    const entry = {
      formId,
      formName,
      fields,
      fillField: (fieldName, value) => {
        const field = fields.find(f => f.name === fieldName || f.label === fieldName);
        if (field && field.setter) field.setter(value);
      },
      submitForm: () => {
        const field = fields.find(f => f.isSubmit);
        if (field && field.setter) field.setter(true);
      },
    };
    registry.set(formId, entry);
    return () => registry.delete(formId);
  }, [formId, formName, fields]);
}

// ─── Navigation map ───────────────────────────────────────────────────────────
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

// ─── Allowed actions whitelist ────────────────────────────────────────────────
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

// ─── Action executor ──────────────────────────────────────────────────────────
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
        const { data: target } = await supabase
          .from('clients_1777020684735')
          .select('id, name')
          .ilike('crn', action.crn)
          .maybeSingle();
        if (!target) return `❌ No patient found with CRN **${action.crn}**.`;
        const newEvent = { summary: `Clinical note: ${action.note}`, who: 'Claude AI', time: new Date().toLocaleString() };
        const { error } = await appendClientEvent(target.id, newEvent);
        if (error) return `❌ Note failed: ${error.message}`;
        await logActivity({
          action: 'update',
          resource: 'client',
          detail: `Clinical note added to ${target.name || action.crn} via Claude AI`,
          actor: 'jax_ai',
          actor_role: 'admin',
          source_type: 'client',
        });
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
        let crn, error;
        for (let attempt = 0; attempt < 5; attempt++) {
          crn = 'CRN' + Math.floor(10000000 + Math.random() * 90000000);
          const res = await supabase
            .from('clients_1777020684735')
            .insert([{ crn, name: action.name, email: action.email, phone: action.phone, category: action.category || 'general', care_centre: action.care_centre || '', status: 'active', created_at: new Date().toISOString() }]);
          error = res.error;
          if (!error) break;
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

// ─── Local action intent detection ───────────────────────────────────────────
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

// ─── Clinical language detection ──────────────────────────────────────────────
const CLINICAL_EXPLICIT = /update notes|add to notes|clinical note|progress note/i;
const CLINICAL_TERMS = /\b(assessment|presenting|MSE|risk|medication|session|intervention|diagnosis|symptoms|deterioration|improvement|engagement|compliance|affect|mood|cognition|behaviour|behavior)\b/i;

function detectClinicalContent(text) {
  if (CLINICAL_EXPLICIT.test(text)) return true;
  if (CLINICAL_TERMS.test(text)) return true;
  return false;
}

// ─── Form fill intent ─────────────────────────────────────────────────────────
function detectFormFillIntent(text) {
  return /fill\s+(this\s+)?form|auto[\s-]?fill|complete\s+form/i.test(text);
}

// ─── Skills data ──────────────────────────────────────────────────────────────
const SKILLS = [
  {
    category: 'Navigation',
    icon: '🧭',
    minRole: 'staff',
    items: [
      { name: 'Go to page', desc: 'Navigate to any platform page by name', example: 'Go to Crisis Management' },
      { name: 'Open patient directory', desc: 'Jump straight to the CRM', example: 'Show me the Patient Directory' },
    ],
  },
  {
    category: 'Clinical',
    icon: '🩺',
    minRole: 'staff',
    items: [
      { name: 'Add clinical note', desc: 'Append a note to a patient record', example: 'Add note to CRN12345: patient showed improvement' },
      { name: 'Look up patient', desc: 'Retrieve patient info by CRN', example: 'Find patient CRN12345' },
      { name: 'Search patients', desc: 'Search by name or CRN', example: 'Search patients named John Smith' },
      { name: 'List urgent', desc: 'Show high-priority check-ins', example: 'Show urgent check-ins' },
    ],
  },
  {
    category: 'Scheduling',
    icon: '📅',
    minRole: 'staff',
    items: [
      { name: 'Book appointment', desc: 'Initiate appointment booking flow', example: 'Book appointment for CRN12345' },
      { name: 'Check schedule', desc: 'View today\'s schedule', example: 'What\'s on my schedule today?' },
    ],
  },
  {
    category: 'Form',
    icon: '📝',
    minRole: 'staff',
    items: [
      { name: 'Fill form', desc: 'Auto-fill the current form with AI suggestions', example: 'Fill this form' },
      { name: 'Validate form', desc: 'Check form for errors before submission', example: 'Validate this form' },
    ],
  },
  {
    category: 'Alert',
    icon: '🚨',
    minRole: 'staff',
    items: [
      { name: 'Urgent alerts', desc: 'Show all unresolved urgent items', example: 'Show urgent alerts' },
      { name: 'Crisis summary', desc: 'Get a summary of active crisis events', example: 'What crises are active?' },
    ],
  },
  {
    category: 'Document',
    icon: '📄',
    minRole: 'staff',
    items: [
      { name: 'Generate report', desc: 'Create a clinical or admin report', example: 'Generate a daily summary report' },
      { name: 'Write referral letter', desc: 'Draft a referral for a patient', example: 'Write referral letter for CRN12345' },
      { name: 'Progress note', desc: 'Generate a progress note template', example: 'Write progress note for CRN12345' },
    ],
  },
  {
    category: 'Admin',
    icon: '⚙️',
    minRole: 'admin',
    items: [
      { name: 'Register patient', desc: 'Register a new patient in the system', example: 'Register patient Jane Doe email jane@example.com phone 0412345678' },
      { name: 'Resolve check-in', desc: 'Mark a check-in as resolved', example: 'Resolve check-in [ID]' },
      { name: 'Update patient', desc: 'Update a patient field by CRN', example: 'Update CRN12345 status to active' },
    ],
  },
  {
    category: 'Sysadmin',
    icon: '🛠',
    minRole: 'sysadmin',
    items: [
      { name: 'System stats', desc: 'Get platform health and stats', example: 'Show system stats' },
      { name: 'Audit summary', desc: 'Summarise recent audit log entries', example: 'Summarise audit log' },
      { name: 'DB health check', desc: 'Check database connection status', example: 'DB health check' },
    ],
  },
];

function roleLevel(role) {
  const levels = { staff: 1, field_agent: 1, admin: 2, sysadmin: 3 };
  return levels[role] || 0;
}

function skillAllowed(skill, role) {
  const required = { staff: 1, field_agent: 1, admin: 2, sysadmin: 3 };
  return roleLevel(role) >= (required[skill.minRole] || 1);
}

// ─── Context chips by page ────────────────────────────────────────────────────
function getContextChips(currentPage) {
  if (currentPage === 'admin') {
    return ["📊 Today's summary", '🚨 Urgent alerts', '📋 Fill daily report', '⏳ Pending referrals'];
  }
  if (currentPage === 'crm' || currentPage === 'client_profile') {
    return ['📝 Update notes', '📅 Book appointment', '📄 Write progress note', '🔗 Generate referral'];
  }
  if (currentPage === 'provider_metrics') {
    return ['✅ Check credentials', '📬 Pending applications', '📄 Approval letter'];
  }
  if (['register', 'edit_patient', 'new_referral'].includes(currentPage)) {
    return ['✨ Fill this form', '✔️ Validate form', '💾 Save draft'];
  }
  if (currentPage === 'sysdash') {
    return ['🗄️ DB health check', '📊 System stats', '🔍 Audit log', '📈 Generate report'];
  }
  if (currentPage === 'field_agent_dash') {
    return ['📍 Log visit', '📝 Update notes', '🚨 Report incident', '📅 My schedule'];
  }
  return ['🚨 Show urgent check-ins', '🔍 Find patient by CRN', '🏥 Go to Triage', '⚡ Go to Integrations'];
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Claude, the AI assistant built into the Acute Care Services platform — a mental health and crisis management system operating in Camperdown, NSW, Australia.

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
  content: "Hi! I'm **Claude**, your AI platform assistant. I can help you navigate the platform, manage clients, handle crises, and more.\n\nWhat can I help you with today?",
};

const MAX_HISTORY = 12;

const PLACEHOLDER_CYCLE = [
  "Ask Claude anything…",
  "Say 'fill this form'…",
  "Try 'update client notes'…",
  "Ask 'what's urgent today?'",
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JaxAI({ role, goto, currentPage }) {
  const ALLOWED_ROLES = ['sysadmin', 'admin', 'staff', 'field_agent'];
  if (!role || !ALLOWED_ROLES.includes(role)) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle'|'thinking'|'processing'|'speaking'|'listening'
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Voice
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle'|'listening'|'processing'
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Notifications
  const [jaxNotifications, setJaxNotifications] = useState([]);

  // UI
  const [showSkills, setShowSkills] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [hoveredMsgIdx, setHoveredMsgIdx] = useState(null);
  const [clinicalDetection, setClinicalDetection] = useState(null); // { text, msgIdx }

  const transcriptRef = useRef('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const monitorIntervalRef = useRef(null);
  const ttsSourceRef = useRef(null);
  const canvasRef = useRef(null);
  const proactiveShownRef = useRef(false);
  const firstOpenRef = useRef(true);

  // ── Placeholder cycling ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_CYCLE.length), 4000);
    return () => clearInterval(t);
  }, []);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, streamingContent]);

  // ── Monitor interval (every 10 min) ──────────────────────────────────────
  useEffect(() => {
    const doMonitor = async () => {
      try {
        const res = await fetch('/.netlify/functions/jax-monitor');
        if (!res.ok) return;
        const data = await res.json();
        if (data.notifications?.length) {
          setJaxNotifications(prev => {
            const ids = new Set(prev.map(n => n.id));
            const fresh = data.notifications.filter(n => !ids.has(n.id));
            return [...prev, ...fresh];
          });
        }
      } catch (_) {}
    };
    doMonitor();
    monitorIntervalRef.current = setInterval(doMonitor, 10 * 60 * 1000);
    return () => clearInterval(monitorIntervalRef.current);
  }, []);

  // ── Panel open side-effects ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // First open upgrade message
    if (firstOpenRef.current) {
      firstOpenRef.current = false;
      if (!localStorage.getItem('jax_upgraded_v2')) {
        localStorage.setItem('jax_upgraded_v2', '1');
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I've been upgraded! ⚡ I can now fill forms, update clinical notes by voice, generate documents, and alert your team to urgent issues. Try saying **'Hey Jax, what can you do?'**",
          }]);
        }, 800);
      }
    }

    // Proactive check
    if (!proactiveShownRef.current) {
      proactiveShownRef.current = true;
      const criticals = jaxNotifications.filter(n => !n.dismissed && n.urgency === 'critical');
      const warnings = jaxNotifications.filter(n => !n.dismissed && n.urgency === 'warning');
      const hour = new Date().getHours();
      let proactiveMsg = null;
      if (hour >= 6 && hour < 12) {
        const count = criticals.length + warnings.length;
        proactiveMsg = count > 0
          ? `Good morning! 🌅 I've checked your platform — **${count} alert${count > 1 ? 's' : ''} need attention today.**`
          : `Good morning! 🌅 Your platform looks healthy — no critical alerts right now.`;
      } else if (criticals.length > 0) {
        proactiveMsg = `🚨 There's a **high-priority alert** requiring your attention right now.`;
      }
      if (proactiveMsg) {
        setTimeout(() => {
          setMessages(prev => {
            if (prev.length > 1) return prev;
            return [...prev, { role: 'assistant', content: proactiveMsg }];
          });
        }, 600);
      }
    }

    // Show unread notifications in chat
    const unread = jaxNotifications.filter(n => !n.dismissed && !n.shown);
    if (unread.length > 0) {
      setJaxNotifications(prev => prev.map(n => ({ ...n, shown: true })));
      unread.forEach((n, idx) => {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: `${urgencyBadge(n.urgency)} **${n.title}**\n${n.message}`, notification: n }]);
        }, 200 * idx);
      });
    }
  }, [isOpen]);

  function urgencyBadge(urgency) {
    if (urgency === 'critical') return '🔴';
    if (urgency === 'warning') return '🟡';
    return '🔵';
  }

  const unreadCount = jaxNotifications.filter(n => !n.dismissed).length;

  // ── Format message (HTML-escape first to prevent XSS, then apply safe markdown) ──
  const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  const formatMsg = (text) =>
    escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

  const clearChat = () => {
    setMessages([INITIAL_MSG]);
    setClinicalDetection(null);
  };

  // ── Voice: start ──────────────────────────────────────────────────────────
  const startVoice = useCallback(async () => {
    if (voiceActive) { stopVoice(); return; }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-AU';
      rec.onstart = () => { setVoiceActive(true); setVoiceStatus('listening'); setStatus('listening'); setTranscript(''); };
      rec.onresult = (e) => {
        const t = Array.from(e.results).map(r => r[0].transcript).join('');
        setTranscript(t);
        transcriptRef.current = t;
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => { rec.stop(); }, 2500);
      };
      rec.onend = () => {
        setVoiceActive(false);
        setVoiceStatus('processing');
        setStatus('thinking');
        const currentTranscript = transcriptRef.current;
        transcriptRef.current = '';
        setTimeout(() => {
          if (currentTranscript.trim()) {
            setInput(currentTranscript.trim());
            setTimeout(() => handleSendText(currentTranscript.trim()), 100);
          }
          setVoiceStatus('idle');
          setTranscript('');
        }, 300);
      };
      rec.onerror = () => { setVoiceActive(false); setVoiceStatus('idle'); setStatus('idle'); };
      recognitionRef.current = rec;
      rec.start();
      startWaveform();
    } else {
      // Fallback: MediaRecorder → jax-whisper
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          setVoiceStatus('processing');
          setStatus('thinking');
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const form = new FormData();
          form.append('audio', blob, 'audio.webm');
          try {
            const res = await fetch('/.netlify/functions/jax-whisper', { method: 'POST', body: form });
            const data = await res.json();
            if (data.text) {
              setInput(data.text);
              handleSendText(data.text);
            }
          } catch (_) {}
          setVoiceStatus('idle');
          setVoiceActive(false);
          setStatus('idle');
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setVoiceActive(true);
        setVoiceStatus('listening');
        setStatus('listening');
        setTimeout(() => recorder.stop(), 10000);
      } catch (_) {
        setVoiceActive(false);
        setVoiceStatus('idle');
      }
    }
  }, [voiceActive, transcript]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setVoiceActive(false);
    setVoiceStatus('idle');
    setStatus('idle');
    setTranscript('');
    clearWaveform();
  }, []);

  // ── Waveform ──────────────────────────────────────────────────────────────
  const startWaveform = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      const draw = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(avg);
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const w = canvas.width, h = canvas.height;
          const ctx2 = canvas.getContext('2d');
          ctx2.clearRect(0, 0, w, h);
          const barCount = data.length;
          const barW = w / barCount;
          data.forEach((val, i) => {
            const barH = (val / 255) * h;
            const hue = 250 + (val / 255) * 60;
            ctx2.fillStyle = `hsla(${hue},70%,60%,0.9)`;
            ctx2.fillRect(i * barW, h - barH, barW - 1, barH);
          });
        }
        animFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (_) {}
  };

  const clearWaveform = () => {
    cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speakText = async (text) => {
    try {
      const res = await fetch('/.netlify/functions/jax-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const arrayBuf = await res.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ctx.decodeAudioData(arrayBuf);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      ttsSourceRef.current = src;
      setIsSpeaking(true);
      setStatus('speaking');
      src.onended = () => { setIsSpeaking(false); setStatus('idle'); };
      src.start();
    } catch (_) {}
  };

  const stopSpeaking = () => {
    ttsSourceRef.current?.stop();
    setIsSpeaking(false);
    setStatus('idle');
  };

  // ── Streaming handler ─────────────────────────────────────────────────────
  const handleStream = async (msgHistory) => {
    try {
      const res = await fetch('/.netlify/functions/jax-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgHistory, role, currentPage }),
      });
      if (!res.ok || !res.body) throw new Error('Stream failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      setIsStreaming(true);
      setStreamingContent('');
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') { done = true; break; }
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                accumulated += delta;
                setStreamingContent(accumulated);
              } catch (_) {}
            }
          }
        }
      }
      setIsStreaming(false);
      setStreamingContent('');
      return accumulated;
    } catch (_) {
      setIsStreaming(false);
      setStreamingContent('');
      return null;
    }
  };

  // ── Main send handler ─────────────────────────────────────────────────────
  const handleSendText = useCallback(async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || status === 'thinking' || status === 'processing') return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStatus('thinking');

    // Clinical note detection
    if (detectClinicalContent(text)) {
      setTimeout(() => {
        setClinicalDetection({ text, msgIdx: newMessages.length - 1 });
      }, 300);
    }

    // Form fill intent
    if (detectFormFillIntent(text)) {
      const registry = window.__jaxFormRegistry;
      if (registry.size > 0) {
        const [formId, formEntry] = registry.entries().next().value;
        setStatus('processing');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I'm filling the **${formEntry.formName || formId}** now…`,
        }]);
        const fields = formEntry.fields || [];
        for (let i = 0; i < fields.length; i++) {
          await new Promise(r => setTimeout(r, 150));
          if (fields[i].setter && fields[i].sampleValue) {
            fields[i].setter(fields[i].sampleValue);
          }
        }
        setStatus('idle');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Form filled! Please review and confirm to submit.`,
        }]);
        return;
      }
    }

    // Nav intent
    const navIntent = detectNavIntent(text);
    if (navIntent && goto) {
      setTimeout(() => {
        setStatus('idle');
        setMessages(prev => [...prev, { role: 'assistant', content: `Navigating to **${navIntent.label}**…` }]);
        setTimeout(() => { goto(navIntent.page); setIsOpen(false); }, 400);
      }, 600);
      return;
    }

    // Local action
    const actionIntent = detectActionIntent(text);
    if (actionIntent) {
      const result = await executeAction(actionIntent);
      setStatus('idle');
      if (result) {
        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        return;
      }
    }

    // Try streaming via Netlify function first
    const historySlice = newMessages.slice(-MAX_HISTORY).map(m => ({ role: m.role, content: m.content }));
    const streamResult = await handleStream([{ role: 'system', content: SYSTEM_PROMPT }, ...historySlice]);
    if (streamResult) {
      // Parse action tags from streamed result
      const actionMatch = streamResult.match(/<action>([\s\S]*?)<\/action>/);
      let finalContent = streamResult.replace(/<action>[\s\S]*?<\/action>/g, '').trim();
      if (actionMatch) {
        try {
          const parsedAction = JSON.parse(actionMatch[1]);
          if (validateAction(parsedAction)) {
            const actionResult = await executeAction(parsedAction);
            if (actionResult) finalContent = [finalContent, actionResult].filter(Boolean).join('\n\n');
          }
        } catch (_) {}
      }
      setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
      setStatus('idle');
      if (voiceActive) speakText(finalContent.replace(/\*\*/g, '').replace(/[<>]/g, ''));
      return;
    }

    // Fallback: local AI config
    const aiConfig = JSON.parse(localStorage.getItem('ac_int_ai') || '{}');
    if (aiConfig.api_key && aiConfig.status === 'connected') {
      try {
        const response = await fetch(aiConfig.endpoint || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.api_key}` },
          body: JSON.stringify({
            model: aiConfig.model || 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historySlice],
            max_tokens: 600,
            temperature: 0.7,
          }),
        });
        const data = await response.json();
        setStatus('idle');
        if (data.choices?.[0]?.message?.content) {
          const rawContent = data.choices[0].message.content;
          const actionMatch = rawContent.match(/<action>([\s\S]*?)<\/action>/);
          if (actionMatch) {
            try {
              const parsedAction = JSON.parse(actionMatch[1]);
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
        }
      } catch {
        setStatus('idle');
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not connect to AI provider.' }]);
      }
    } else {
      // Demo mode smart fallback
      setTimeout(() => {
        setStatus('idle');
        const q = text.toLowerCase();
        let reply = '🔑 I\'m in demo mode. To unlock full AI capabilities, go to **Admin → Integrations → AI Engine** and enter your OpenAI API key.\n\nI can still look up patients, search records, and list urgent check-ins — just ask!';
        if (q.includes('what can you do') || q.includes('help')) {
          reply = 'I can:\n\n• **Navigate** — say "go to [page]"\n• **Look up patients** — "find patient CRN12345"\n• **List urgent** — "show urgent check-ins"\n• **Add notes** — "add note to CRN12345: ..."\n• **Register patients** — "register patient [name]"\n• **Fill forms** — "fill this form"\n• **Generate documents** — "write progress note"\n• **Voice commands** — tap the 🎤 mic';
        } else if (q.includes('crn') || q.includes('clinical reference')) {
          reply = 'To get a CRN:\n\n**For clients:** Use "Get CRN" on the Check-In page.\n\n**For staff:** Go to **CRM → Register Patient**.';
        } else if (q.includes('care centre') || q.includes('assign')) {
          reply = 'To assign a care centre:\n\n1. Go to **Client CRM**\n2. Click ✏️ edit on a patient\n3. Select care centre\n4. Save\n\nSay "go to Care Centres" and I\'ll navigate there!';
        } else if (q.includes('crisis')) {
          reply = 'To raise a crisis event:\n\n1. Go to **Crisis Management**\n2. Click **Raise Event**\n3. Fill client details and severity\n4. Dispatch Police/Ambulance as needed';
        } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
          reply = `Hello! I'm Jax. Say "go to [page]", "find patient CRN...", "show urgent check-ins", or ask me anything!`;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }, 800);
    }
  }, [input, messages, status, voiceActive, goto]);

  const handleSend = () => handleSendText();

  // ── Clinical note save ────────────────────────────────────────────────────
  const saveClinicalNote = async (text) => {
    setClinicalDetection(null);
    setMessages(prev => [...prev, { role: 'assistant', content: '💾 Saving clinical note…' }]);
    try {
      await logActivity({
        action: 'create',
        resource: 'clinical_note',
        detail: `Clinical note recorded via Claude AI: ${text.slice(0, 200)}`,
        actor: 'jax_ai',
        actor_role: role,
        source_type: 'client',
      });
      setMessages(prev => [...prev, { role: 'assistant', content: '✅ Clinical note saved to audit log. Attach to a patient by saying "add note to CRN[number]: [your note]".' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Could not save note: ${err.message}` }]);
    }
  };

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text.replace(/\*\*(.*?)\*\*/g, '$1')).catch(() => {});
  };

  // ── Header status text ────────────────────────────────────────────────────
  const headerStatusText = () => {
    if (status === 'listening') return '🎤 Listening…';
    if (status === 'thinking' || status === 'processing') return '💭 Thinking…';
    if (status === 'speaking') return '🔊 Speaking…';
    return '🟢 Active & Monitoring';
  };

  // ── Context chips for current page ────────────────────────────────────────
  const chips = getContextChips(currentPage);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* CSS Animations */}
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
        @keyframes jax-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes jax-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes jax-green-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes jax-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes jax-glow-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.6); }
          50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }
        .jax-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.2); }
        .jax-chip { transition: transform 0.2s, box-shadow 0.2s; }
        .jax-msg-action-row { opacity: 0; transition: opacity 0.2s; }
        .jax-msg-wrap:hover .jax-msg-action-row { opacity: 1; }
      `}</style>

      {/* Floating Toggle Button */}
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
            boxShadow: '0 0 0 0 rgba(102,126,234,0.7), 0 8px 24px rgba(102,126,234,0.4)',
            animation: 'jax-pulse 2s infinite',
            transition: 'transform 0.2s',
            zIndex: 998,
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Open Claude AI Assistant"
        >
          <SafeIcon icon={FiMessageCircle} size={26} />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: unreadCount > 0 ? '#ff4757' : '#ffa502',
              border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: '#fff', fontWeight: 700,
              animation: 'jax-bounce 1.5s infinite',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      )}

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 999, opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s ease', backdropFilter: 'blur(2px)',
        }}
      />

      {/* Side Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(480px, 90vw)',
        background: '#ffffff',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}>

        {/* Skills Panel Overlay */}
        {showSkills && (
          <div style={{
            position: 'absolute', inset: 0, background: '#fff', zIndex: 10,
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '16px 20px', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>🛠 Jax Skills</div>
              <button onClick={() => setShowSkills(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafeIcon icon={FiX} size={16} />
              </button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto' }}>
              {SKILLS.filter(cat => skillAllowed(cat, role)).map((cat) => (
                <div key={cat.category} style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#667eea', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{cat.icon}</span> {cat.category}
                  </div>
                  {cat.items.map((skill) => (
                    <div key={skill.name} style={{
                      background: '#f8f9fa', borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                      border: '1px solid #e9ecef', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#333', marginBottom: 2 }}>{skill.name}</div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{skill.desc}</div>
                        <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>e.g. "{skill.example}"</div>
                      </div>
                      <button
                        onClick={() => { setInput(skill.example); setShowSkills(false); inputRef.current?.focus(); }}
                        style={{
                          padding: '5px 10px', borderRadius: 8, border: '1px solid #667eea',
                          background: 'rgba(102,126,234,0.08)', color: '#667eea',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        Try it
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: '#fff', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar with glow ring when thinking */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: (status === 'thinking' || status === 'processing') ? 'jax-glow-ring 1.2s infinite' : 'none',
              boxShadow: (status === 'thinking' || status === 'processing') ? '0 0 0 3px rgba(255,255,255,0.4)' : 'none',
              transition: 'box-shadow 0.3s',
            }}>
              <SafeIcon icon={FiZap} size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Claude AI Assistant</div>
              <div style={{ fontSize: 11, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: status === 'listening' ? '#ffa502' : '#2ed573',
                  display: 'inline-block',
                  animation: 'jax-green-pulse 2s infinite',
                }} />
                {headerStatusText()}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Skills button */}
            <button
              onClick={() => setShowSkills(true)}
              title="Skills"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 10px', borderRadius: 16, cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: 600, transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              🛠 Skills
            </button>
            {/* Mic button */}
            <button
              onClick={startVoice}
              title={voiceActive ? 'Stop listening' : 'Voice input'}
              style={{
                background: voiceActive ? 'rgba(255,69,58,0.3)' : 'rgba(255,255,255,0.15)',
                border: voiceActive ? '1px solid rgba(255,69,58,0.6)' : 'none',
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => !voiceActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={(e) => !voiceActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              <SafeIcon icon={voiceActive ? FiVolumeX : FiMic} size={14} />
            </button>
            {/* Clear chat */}
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <SafeIcon icon={FiTrash2} size={14} />
            </button>
            {/* Close */}
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

        {/* Animated gradient line under header */}
        <div style={{
          height: 4, flexShrink: 0,
          background: (status === 'thinking' || status === 'processing')
            ? 'linear-gradient(90deg, #667eea, #764ba2, #f9a8d4, #667eea)'
            : 'linear-gradient(90deg, #667eea, #764ba2)',
          backgroundSize: '200% 200%',
          animation: (status === 'thinking' || status === 'processing') ? 'jax-gradient-shift 1.5s ease infinite' : 'none',
        }} />

        {/* ── Messages Area ── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 16px 12px',
          display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0,
          background: '#f8f9fa', position: 'relative',
        }}>

          {/* Watermark */}
          {messages.length <= 1 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontSize: 80, fontWeight: 900, color: 'rgba(102,126,234,0.05)',
              userSelect: 'none', pointerEvents: 'none', letterSpacing: -2,
            }}>
              Jax
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className="jax-msg-wrap"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'jax-fade-up 0.3s ease',
              }}
              onMouseEnter={() => setHoveredMsgIdx(i)}
              onMouseLeave={() => setHoveredMsgIdx(null)}
            >
              {/* Bubble */}
              <div style={{
                maxWidth: '85%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ffffff',
                color: msg.role === 'user' ? '#fff' : '#1a1a2e',
                fontSize: 14, lineHeight: 1.6,
                boxShadow: msg.role === 'user' ? '0 2px 8px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                borderLeft: msg.role === 'assistant' ? '3px solid #667eea' : 'none',
              }}
                dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
              />

              {/* Notification action buttons */}
              {msg.notification && !msg.notification.dismissed && (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {msg.notification.route && (
                    <button
                      onClick={() => { goto(msg.notification.route); setIsOpen(false); }}
                      style={{ padding: '4px 10px', borderRadius: 8, background: '#667eea', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Take Action
                    </button>
                  )}
                  <button
                    onClick={() => setJaxNotifications(prev => prev.map(n => n.id === msg.notification.id ? { ...n, dismissed: true } : n))}
                    style={{ padding: '4px 10px', borderRadius: 8, background: '#f0f0f0', color: '#666', border: 'none', fontSize: 11, cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Micro-actions below Jax messages */}
              {msg.role === 'assistant' && (
                <div className="jax-msg-action-row" style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    title="Copy"
                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '2px 7px', fontSize: 11, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <SafeIcon icon={FiCopy} size={10} /> Copy
                  </button>
                  <button
                    title="Helpful"
                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '2px 7px', fontSize: 11, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <SafeIcon icon={FiThumbsUp} size={10} />
                  </button>
                  <button
                    title="Not helpful"
                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '2px 7px', fontSize: 11, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <SafeIcon icon={FiThumbsDown} size={10} />
                  </button>
                  <button
                    title="Save"
                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '2px 7px', fontSize: 11, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <SafeIcon icon={FiSave} size={10} /> Save
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Clinical content detection card */}
          {clinicalDetection && (
            <div style={{
              border: '2px solid #667eea', borderRadius: 12, padding: 12, background: 'rgba(102,126,234,0.06)',
              animation: 'jax-fade-up 0.3s ease',
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#667eea', marginBottom: 8 }}>📋 Clinical content detected</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 10, fontStyle: 'italic' }}>
                "{clinicalDetection.text.slice(0, 120)}{clinicalDetection.text.length > 120 ? '…' : ''}"
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => saveClinicalNote(clinicalDetection.text)}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#667eea', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  ✅ Save to Notes
                </button>
                <button
                  onClick={() => { setInput(clinicalDetection.text); setClinicalDetection(null); inputRef.current?.focus(); }}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f0f0', color: '#444', border: 'none', fontSize: 12, cursor: 'pointer' }}
                >
                  ✏️ Edit First
                </button>
                <button
                  onClick={() => setClinicalDetection(null)}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f0f0', color: '#444', border: 'none', fontSize: 12, cursor: 'pointer' }}
                >
                  ❌ Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Streaming bubble */}
          {isStreaming && streamingContent && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              animation: 'jax-fade-up 0.3s ease',
            }}>
              <div style={{
                maxWidth: '85%', padding: '10px 14px',
                borderRadius: '16px 16px 16px 4px',
                background: '#ffffff', color: '#1a1a2e',
                fontSize: 14, lineHeight: 1.6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderLeft: '3px solid #667eea',
              }}>
                <span dangerouslySetInnerHTML={{ __html: formatMsg(streamingContent) }} />
                <span style={{ animation: 'jax-cursor 0.8s infinite', display: 'inline-block', marginLeft: 2, color: '#667eea' }}>▋</span>
              </div>
            </div>
          )}

          {/* Thinking dots */}
          {(status === 'thinking' || status === 'processing') && !isStreaming && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                background: '#ffffff', display: 'flex', gap: 5, alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '3px solid #667eea',
              }}>
                {[0, 0.2, 0.4].map((d, j) => (
                  <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#667eea', animation: `jax-dot 1.2s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Stop speaking button */}
          {isSpeaking && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <button
                onClick={stopSpeaking}
                style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #ff4757', background: 'rgba(255,71,87,0.08)', color: '#ff4757', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <SafeIcon icon={FiVolumeX} size={12} /> Stop speaking
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Context Chips ── */}
        <div style={{
          padding: '8px 12px 0', borderTop: '1px solid #e9ecef',
          overflowX: 'auto', whiteSpace: 'nowrap', background: '#fff',
          flexShrink: 0,
        }}>
          <div style={{ display: 'inline-flex', gap: 6, paddingBottom: 8 }}>
            {chips.map((chip, i) => (
              <button
                key={i}
                className="jax-chip"
                onClick={() => handleSendText(chip.replace(/^[^\s]+ /, ''))}
                style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 20,
                  border: '1px solid #dee2e6', background: '#fff',
                  color: '#495057', cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* ── Voice Transcript Overlay ── */}
        {voiceActive && transcript && (
          <div style={{
            padding: '8px 16px', background: 'rgba(102,126,234,0.08)',
            borderTop: '1px solid rgba(102,126,234,0.2)',
            fontSize: 13, color: '#667eea', fontStyle: 'italic', flexShrink: 0,
          }}>
            🎤 {transcript}
          </div>
        )}

        {/* ── Input Area ── */}
        <div style={{
          padding: '10px 16px 14px', borderTop: '1px solid #e9ecef',
          display: 'flex', gap: 8, flexShrink: 0, background: '#fff',
          alignItems: 'center',
        }}>
          {voiceActive ? (
            /* Waveform visualizer */
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <canvas
                ref={canvasRef}
                width={260} height={40}
                style={{ flex: 1, borderRadius: 10, background: 'rgba(102,126,234,0.06)', maxWidth: '100%' }}
              />
              <button
                onClick={stopVoice}
                style={{ padding: '8px 14px', borderRadius: 10, background: '#ff4757', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Stop
              </button>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={PLACEHOLDER_CYCLE[placeholderIdx]}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  style={{
                    width: '100%', padding: '12px 44px 12px 16px',
                    borderRadius: 12, border: '1.5px solid #dee2e6',
                    background: '#f8f9fa', color: '#1a1a2e',
                    fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#dee2e6'}
                />
                {/* Mic inside input bar */}
                <button
                  onClick={startVoice}
                  title="Voice input"
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#adb5bd', padding: 4, display: 'flex', alignItems: 'center',
                  }}
                >
                  <SafeIcon icon={FiMic} size={16} />
                </button>
              </div>
              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={status === 'thinking' || status === 'processing' || !input.trim()}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none', color: '#fff',
                  cursor: (status === 'thinking' || !input.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: (status === 'thinking' || !input.trim()) ? 0.5 : 1,
                  transition: 'opacity 0.2s, transform 0.15s', flexShrink: 0,
                }}
                onMouseEnter={(e) => status === 'idle' && input.trim() && (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SafeIcon icon={FiSend} size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

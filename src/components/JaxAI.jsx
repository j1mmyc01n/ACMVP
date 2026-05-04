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
  // Patient / CRM
  'lookup_patient', 'update_patient', 'add_note', 'register_patient',
  'list_urgent', 'search_patients', 'list_patients', 'discharge_patient',
  // Check-in
  'resolve_checkin', 'list_checkins', 'get_checkin_stats',
  // Crisis management
  'list_crisis_events', 'create_crisis_event', 'resolve_crisis_event',
  'dispatch_police', 'dispatch_ambulance', 'assign_crisis_team',
  // Scheduling
  'list_appointments', 'create_appointment',
  // System / admin
  'list_staff', 'get_system_stats', 'list_audit_events',
  // Navigation
  'navigate',
]);
const ALLOWED_UPDATE_FIELDS = new Set([
  'name', 'phone', 'email', 'care_centre', 'category', 'status',
  'postcode', 'address', 'notes', 'clinical_note', 'mood_score',
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

      // ── Patient / CRM ──────────────────────────────────────────────
      case 'lookup_patient': {
        const { data } = await supabase
          .from('clients_1777020684735')
          .select('*')
          .ilike('crn', action.crn)
          .single();
        if (!data) return `❌ No client found with CRN **${action.crn}**.`;
        return `✅ **Client found:**\n**Name:** ${data.name}\n**CRN:** ${data.crn}\n**Status:** ${data.status || 'active'}\n**Category:** ${data.category || 'general'}\n**Care Centre:** ${data.care_centre || 'unassigned'}\n**Phone:** ${data.phone || '—'}\n**Email:** ${data.email || '—'}`;
      }
      case 'update_patient': {
        const { error } = await supabase
          .from('clients_1777020684735')
          .update({ [action.field]: action.value })
          .ilike('crn', action.crn);
        if (error) return `❌ Update failed: ${error.message}`;
        return `✅ Client **${action.crn}** — **${action.field}** updated to **${action.value}**.`;
      }
      case 'add_note': {
        const { data: target } = await supabase
          .from('clients_1777020684735')
          .select('id, name')
          .ilike('crn', action.crn)
          .maybeSingle();
        if (!target) return `❌ No client found with CRN **${action.crn}**.`;
        const newEvent = { summary: `Clinical note: ${action.note}`, who: 'Jax AI', time: new Date().toLocaleString() };
        const { error } = await appendClientEvent(target.id, newEvent);
        if (error) return `❌ Note failed: ${error.message}`;
        await logActivity({
          action: 'update',
          resource: 'client',
          detail: `Clinical note added to ${target.name || action.crn} via Jax AI`,
          actor: 'jax_ai',
          actor_role: 'admin',
          source_type: 'client',
        });
        return `✅ Clinical note added to **${action.crn}**.`;
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
        await logActivity({ action: 'create', resource: 'client', detail: `Registered ${action.name} (${crn}) via Jax AI`, actor: 'jax_ai', actor_role: 'admin', source_type: 'client' });
        return `✅ Client **${action.name}** registered with CRN **${crn}**.`;
      }
      case 'discharge_patient': {
        const { error } = await supabase
          .from('clients_1777020684735')
          .update({ status: 'discharged' })
          .ilike('crn', action.crn);
        if (error) return `❌ Discharge failed: ${error.message}`;
        return `✅ Client **${action.crn}** discharged from active caseload.`;
      }
      case 'list_patients': {
        const { data } = await supabase
          .from('clients_1777020684735')
          .select('crn, name, status, care_centre, category')
          .eq('status', 'active')
          .order('name')
          .limit(action.limit || 10);
        if (!data || data.length === 0) return '📋 No active clients found.';
        const lines = data.map(p => `• **${p.name}** (${p.crn}) — ${p.category || 'general'} · ${p.care_centre || 'unassigned'}`).join('\n');
        return `📋 **${data.length} active client${data.length > 1 ? 's' : ''}:**\n${lines}`;
      }
      case 'search_patients': {
        const q = action.query?.trim() || '';
        const { data } = await supabase
          .from('clients_1777020684735')
          .select('crn, name, status, care_centre')
          .or(`name.ilike.%${q}%,crn.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(8);
        if (!data || data.length === 0) return `❌ No clients found matching **"${q}"**.`;
        const lines = data.map(p => `• **${p.name}** — ${p.crn} (${p.status || 'active'})`).join('\n');
        return `🔍 **${data.length} result${data.length > 1 ? 's' : ''} for "${q}":**\n${lines}`;
      }

      // ── Check-in ────────────────────────────────────────────────────
      case 'resolve_checkin': {
        const { error } = await supabase
          .from('check_ins_1740395000')
          .update({ status: 'resolved', resolved: true })
          .eq('id', action.checkin_id);
        if (error) return `❌ Could not resolve check-in: ${error.message}`;
        return `✅ Check-in **${action.checkin_id}** resolved.`;
      }
      case 'list_urgent': {
        const { data } = await supabase
          .from('check_ins_1740395000')
          .select('id,name,crn,mood_score,status,created_at')
          .in('status', ['urgent', 'pending'])
          .eq('resolved', false)
          .order('mood_score', { ascending: true })
          .limit(8);
        if (!data || data.length === 0) return '✅ No urgent check-ins at this time.';
        const lines = data.map(c => `• **${c.name}** (${c.crn}) — Mood: ${c.mood_score}/10 · ${c.status}`).join('\n');
        return `🚨 **${data.length} pending check-in${data.length > 1 ? 's' : ''}:**\n${lines}`;
      }
      case 'list_checkins': {
        const { data } = await supabase
          .from('check_ins_1740395000')
          .select('id,name,crn,mood_score,status,created_at')
          .order('created_at', { ascending: false })
          .limit(action.limit || 10);
        if (!data || data.length === 0) return '📋 No check-ins found.';
        const lines = data.map(c => `• **${c.name}** (${c.crn}) — Mood: ${c.mood_score}/10 · ${c.status}`).join('\n');
        return `📋 **${data.length} check-in${data.length > 1 ? 's' : ''}:**\n${lines}`;
      }
      case 'get_checkin_stats': {
        const { data } = await supabase.from('check_ins_1740395000').select('status, mood_score, resolved');
        if (!data) return '❌ Could not fetch stats.';
        const total = data.length;
        const urgent = data.filter(c => c.status === 'urgent').length;
        const pending = data.filter(c => !c.resolved).length;
        const avgMood = data.length ? (data.reduce((a, c) => a + (c.mood_score || 5), 0) / data.length).toFixed(1) : '—';
        return `📊 **Check-in Stats:**\n• **Total:** ${total}\n• **Urgent:** ${urgent}\n• **Pending resolution:** ${pending}\n• **Avg mood score:** ${avgMood}/10`;
      }

      // ── Crisis Management ───────────────────────────────────────────
      case 'list_crisis_events': {
        const query = supabase.from('crisis_events_1777090000').select('id,client_name,client_crn,severity,status,location,crisis_type,created_at').order('created_at', { ascending: false }).limit(8);
        if (action.status) query.eq('status', action.status);
        const { data } = await query;
        if (!data || data.length === 0) return '✅ No crisis events found.';
        const lines = data.map(e => `• **${e.client_name}** — ${e.severity?.toUpperCase()} · ${e.crisis_type?.replace(/_/g, ' ')} · ${e.status}`).join('\n');
        return `🚨 **${data.length} crisis event${data.length > 1 ? 's' : ''}:**\n${lines}`;
      }
      case 'create_crisis_event': {
        const { error } = await supabase.from('crisis_events_1777090000').insert([{
          client_name: action.client_name,
          client_crn: action.client_crn || '',
          location: action.location || '',
          severity: action.severity || 'high',
          crisis_type: action.crisis_type || 'mental_health',
          notes: action.notes || '',
          status: 'active',
          created_at: new Date().toISOString(),
        }]);
        if (error) return `❌ Failed to create crisis event: ${error.message}`;
        await logActivity({ action: 'create', resource: 'crisis_event', detail: `Crisis event raised for ${action.client_name} via Jax AI`, actor: 'jax_ai', actor_role: 'admin', source_type: 'crisis' });
        return `🚨 Crisis event raised for **${action.client_name}** (${action.severity} · ${action.crisis_type?.replace(/_/g, ' ')}).`;
      }
      case 'resolve_crisis_event': {
        const { error } = await supabase.from('crisis_events_1777090000')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', action.event_id);
        if (error) return `❌ Could not resolve: ${error.message}`;
        return `✅ Crisis event **${action.event_id}** resolved.`;
      }
      case 'dispatch_police': {
        const { error } = await supabase.from('crisis_events_1777090000')
          .update({ police_requested: true })
          .eq('id', action.event_id);
        if (error) return `❌ Dispatch failed: ${error.message}`;
        return `🚔 Police dispatched to crisis event **${action.event_id}**.`;
      }
      case 'dispatch_ambulance': {
        const { error } = await supabase.from('crisis_events_1777090000')
          .update({ ambulance_requested: true })
          .eq('id', action.event_id);
        if (error) return `❌ Dispatch failed: ${error.message}`;
        return `🚑 Ambulance dispatched to crisis event **${action.event_id}**.`;
      }
      case 'assign_crisis_team': {
        const { error } = await supabase.from('crisis_events_1777090000')
          .update({ assigned_team: action.team || [] })
          .eq('id', action.event_id);
        if (error) return `❌ Assignment failed: ${error.message}`;
        return `✅ Team assigned to crisis event **${action.event_id}**: ${(action.team || []).join(', ')}.`;
      }

      // ── System / Admin ──────────────────────────────────────────────
      case 'list_staff': {
        const { data } = await supabase
          .from('admin_users_1777025000000')
          .select('name, email, role, status')
          .eq('status', 'active')
          .order('name')
          .limit(20);
        if (!data || data.length === 0) return '📋 No staff found.';
        const lines = data.map(u => `• **${u.name || u.email}** — ${u.role}`).join('\n');
        return `👤 **${data.length} staff member${data.length > 1 ? 's' : ''}:**\n${lines}`;
      }
      case 'get_system_stats': {
        const [clients, checkins, events, staff] = await Promise.all([
          supabase.from('clients_1777020684735').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('check_ins_1740395000').select('*', { count: 'exact', head: true }).eq('resolved', false),
          supabase.from('crisis_events_1777090000').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('admin_users_1777025000000').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        ]);
        return `📊 **System Stats:**\n• **Active Clients:** ${clients.count ?? '—'}\n• **Pending Check-ins:** ${checkins.count ?? '—'}\n• **Active Crisis Events:** ${events.count ?? '—'}\n• **Active Staff:** ${staff.count ?? '—'}`;
      }
      case 'list_audit_events': {
        const { data } = await supabase
          .from('audit_log_1777090000')
          .select('action, resource, detail, actor, created_at')
          .order('created_at', { ascending: false })
          .limit(action.limit || 8);
        if (!data || data.length === 0) return '📋 No audit events found.';
        const lines = data.map(e => `• **${e.action}** ${e.resource} by ${e.actor} — ${e.detail?.slice(0, 60)}`).join('\n');
        return `🔍 **Recent audit events:**\n${lines}`;
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

  // Patient lookup
  if (/look\s*up|find|search|show\s+patient|get\s+patient/.test(q)) {
    const crnMatch = text.match(/CRN\w+/i);
    if (crnMatch) return { type: 'lookup_patient', crn: crnMatch[0].toUpperCase() };
    const searchMatch = text.match(/(?:patient|person|client)\s+(?:named?\s+)?([A-Za-z ]{2,30})/i);
    if (searchMatch) return { type: 'search_patients', query: searchMatch[1].trim() };
  }
  // Clinical notes
  if (/add.*note|clinical note|note.*patient/.test(q)) {
    const crnMatch = text.match(/CRN\w+/i);
    const noteMatch = text.match(/(?:note[:\s]+)(.+)/i);
    if (crnMatch && noteMatch) return { type: 'add_note', crn: crnMatch[0].toUpperCase(), note: noteMatch[1].trim() };
  }
  // Urgent check-ins
  if (/urgent|who.*urgent|list.*urgent|show.*urgent/.test(q)) {
    return { type: 'list_urgent' };
  }
  // System stats
  if (/system\s+stats|platform\s+stats|how.*system|health\s+check|db.*health/.test(q)) {
    return { type: 'get_system_stats' };
  }
  // Check-in stats
  if (/check.?in\s+stats|checkin\s+summary/.test(q)) {
    return { type: 'get_checkin_stats' };
  }
  // List crisis events
  if (/list.*crisis|show.*crisis|active\s+crisis|crisis\s+events/.test(q)) {
    return { type: 'list_crisis_events', status: q.includes('resolved') ? 'resolved' : 'active' };
  }
  // List staff
  if (/list\s+staff|show\s+staff|who.*staff|team\s+members/.test(q)) {
    return { type: 'list_staff' };
  }
  // Update patient field
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
    category: 'Crisis',
    icon: '🚨',
    minRole: 'staff',
    items: [
      { name: 'Urgent alerts', desc: 'Show all unresolved urgent check-ins', example: 'Show urgent check-ins' },
      { name: 'Active crises', desc: 'List all active crisis events', example: 'List active crisis events' },
      { name: 'Raise crisis', desc: 'Create a new crisis event', example: 'Raise crisis event for John Doe at Camperdown' },
      { name: 'Dispatch police', desc: 'Send police to a crisis event', example: 'Dispatch police to event [id]' },
      { name: 'Dispatch ambulance', desc: 'Send ambulance to a crisis event', example: 'Dispatch ambulance to event [id]' },
      { name: 'Resolve crisis', desc: 'Mark a crisis event as resolved', example: 'Resolve crisis event [id]' },
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
      { name: 'Discharge patient', desc: 'Discharge a patient from active caseload', example: 'Discharge patient CRN12345' },
      { name: 'Check-in stats', desc: 'Get check-in summary statistics', example: 'Show check-in stats' },
      { name: 'List staff', desc: 'Show all active staff members', example: 'List all staff' },
    ],
  },
  {
    category: 'Sysadmin',
    icon: '🛠',
    minRole: 'sysadmin',
    items: [
      { name: 'System stats', desc: 'Get live platform health and stats', example: 'Get system stats' },
      { name: 'Audit log', desc: 'View recent audit log entries', example: 'Show audit log' },
      { name: 'List staff', desc: 'Show all staff members and roles', example: 'List all staff members' },
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
const SYSTEM_PROMPT = `You are Jax, the AI staff assistant built into the Acute Care Services platform — a mental health and crisis management system in Camperdown, NSW, Australia. You are powered by OpenAI and have full staff-level access to the platform.

You can do ANYTHING a staff member can do, including:

PLATFORM NAVIGATION:
Navigate on behalf of the user. When they say "go to X" / "show me X" / "open X", respond and navigate. Pages: Care Centres, Staff Management, Audit Log, System Dashboard, Admin Dashboard, Crisis Management, Patient Directory/CRM, Clinical Reports, Integrations, Check-In, Invoicing, Settings, Feedback, Feature Requests, Provider Metrics, Location Rollout, Resource Hub, Multi-Centre, Sponsor Ledger, Heatmap.

ACTIONS — output JSON inside <action> tags alongside your response:

PATIENT / CRM:
- Look up client:        <action>{"type":"lookup_patient","crn":"CRNXXXXX"}</action>
- Search clients:        <action>{"type":"search_patients","query":"..."}</action>
- List active clients:   <action>{"type":"list_patients","limit":10}</action>
- Update client field:   <action>{"type":"update_patient","crn":"CRNXXXXX","field":"name|phone|email|care_centre|category|status|notes","value":"..."}</action>
- Add clinical note:     <action>{"type":"add_note","crn":"CRNXXXXX","note":"..."}</action>
- Register new client:   <action>{"type":"register_patient","name":"...","email":"...","phone":"...","category":"crisis|mental_health|substance_abuse|housing|general","care_centre":"..."}</action>
- Discharge client:      <action>{"type":"discharge_patient","crn":"CRNXXXXX"}</action>

CHECK-IN:
- List urgent check-ins: <action>{"type":"list_urgent"}</action>
- List all check-ins:    <action>{"type":"list_checkins","limit":10}</action>
- Check-in stats:        <action>{"type":"get_checkin_stats"}</action>
- Resolve check-in:      <action>{"type":"resolve_checkin","checkin_id":"..."}</action>

CRISIS MANAGEMENT:
- List crisis events:    <action>{"type":"list_crisis_events","status":"active"}</action>
- Raise crisis event:    <action>{"type":"create_crisis_event","client_name":"...","client_crn":"...","location":"...","severity":"critical|high|medium|low","crisis_type":"mental_health|medical|violence|substance|suicide_risk|domestic|other","notes":"..."}</action>
- Resolve crisis event:  <action>{"type":"resolve_crisis_event","event_id":"..."}</action>
- Dispatch police:       <action>{"type":"dispatch_police","event_id":"..."}</action>
- Dispatch ambulance:    <action>{"type":"dispatch_ambulance","event_id":"..."}</action>
- Assign team:           <action>{"type":"assign_crisis_team","event_id":"...","team":["Name 1","Name 2"]}</action>

SYSTEM / ADMIN:
- System stats:          <action>{"type":"get_system_stats"}</action>
- List staff:            <action>{"type":"list_staff"}</action>
- Audit log:             <action>{"type":"list_audit_events","limit":8}</action>

PLATFORM KNOWLEDGE:
- Clients use CRN (Clinical Reference Number) to check in; mood score 1-10 drives triage priority
- Care Centres: Camperdown, Newtown, Surry Hills, Redfern
- Crisis severity: critical (police/ambulance), high (urgent response), medium, low
- Kanban board: Incoming → Assigned → Dispatched → Resolved
- Pop Out: opens kanban in a dedicated window
- Roles: staff (basic), admin (full CRM/crisis/invoicing), sysadmin (platform config)

Always be concise, professional, and action-oriented. Execute actions immediately when intent is clear. Ask for confirmation only before irreversible destructive changes (e.g. discharge, resolve crisis).`;

const INITIAL_MSG = {
  role: 'assistant',
  content: "Hi! I'm **Jax**, your AI staff assistant for Acute Care Services. I can help you manage clients, handle crisis events, dispatch services, run reports, and navigate the platform.\n\nWhat can I help you with today?",
};

const MAX_HISTORY = 12;

const PLACEHOLDER_CYCLE = [
  "Ask Jax anything…",
  "Try 'raise crisis event'…",
  "Say 'show urgent check-ins'…",
  "Ask 'what crises are active?'",
  "Try 'dispatch police to event X'…",
  "Say 'find patient CRN12345'…",
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

    // First open message
    if (firstOpenRef.current) {
      firstOpenRef.current = false;
      if (!localStorage.getItem('jax_v3_opened')) {
        localStorage.setItem('jax_v3_opened', '1');
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I'm Jax — your AI staff assistant powered by OpenAI. I can manage patients, raise and resolve crisis events, dispatch services, run reports, and navigate the platform.\n\nTry: **'Show active crisis events'**, **'List urgent check-ins'**, or **'Raise a crisis event'**.",
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
        let reply = '🔑 Connect an OpenAI API key to unlock my full AI capabilities. Go to **Admin → Integrations → AI Engine**.\n\nI can already execute actions directly — try: **"show urgent check-ins"**, **"list active crisis events"**, **"system stats"**, or **"find patient [name]"**.';
        if (q.includes('what can you do') || q.includes('help')) {
          reply = '**Jax can do everything a staff member can:**\n\n• **Navigate** — "go to Crisis Management"\n• **Patients** — "find patient CRN12345", "register patient Jane Doe"\n• **Check-ins** — "show urgent check-ins", "resolve check-in [id]"\n• **Crisis** — "list active crisis events", "raise crisis event for [name]"\n• **Dispatch** — "dispatch police to event [id]"\n• **Reports** — "system stats", "audit log"\n• **Voice** — tap 🎤 to speak\n• **Forms** — "fill this form"';
        } else if (q.includes('crisis')) {
          reply = '**Crisis Management via Jax:**\n\n• Say "list active crisis events" to see current crises\n• Say "raise crisis event for [name] at [location]" to create one\n• Say "dispatch police to event [id]" or "dispatch ambulance"\n• Say "go to Crisis Management" to open the full dashboard';
        } else if (q.includes('crn') || q.includes('clinical reference')) {
          reply = 'CRN = Clinical Reference Number, auto-generated for each patient.\n\n**Get a CRN:** Check-In page → "Get CRN"\n**Find by CRN:** Say "find patient CRN12345"\n**Register new:** Say "register patient [name] email [email]"';
        } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
          reply = `Hi! I'm **Jax**, your AI staff assistant. I can manage patients, handle crisis events, dispatch services, and navigate the platform. What do you need?`;
        } else if (q.includes('stat') || q.includes('how many') || q.includes('system')) {
          reply = '📊 I can fetch live system stats. Say **"get system stats"** and I\'ll pull active clients, pending check-ins, active crisis events, and staff count right now.';
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
        detail: `Clinical note recorded via Jax AI: ${text.slice(0, 200)}`,
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
          title="Open Jax AI Assistant"
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
              <div style={{ fontWeight: 800, fontSize: 16 }}>Jax Skills</div>
              <button onClick={() => setShowSkills(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafeIcon icon={FiX} size={16} />
              </button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto' }}>
              {SKILLS.filter(cat => skillAllowed(cat, role)).map((cat) => (
                <div key={cat.category} style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#667eea', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {cat.icon} {cat.category}
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
              <div style={{ fontWeight: 800, fontSize: 16 }}>Jax AI Assistant</div>
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

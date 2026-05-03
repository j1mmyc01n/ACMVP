import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Button, Field, Textarea, Badge } from '../../components/UI';

const {
  FiAlertTriangle, FiCheckCircle, FiX, FiShield, FiPhone,
  FiClock, FiUser, FiRefreshCw, FiAlertCircle, FiEdit2,
  FiMessageSquare, FiChevronDown, FiChevronUp,
} = FiIcons;

// ── Priority config ────────────────────────────────────────────────
const PRIORITY = {
  critical: { label: 'CRITICAL', color: '#EF4444', bg: '#FEE2E2', order: 0, pulse: true },
  high:     { label: 'HIGH',     color: '#F59E0B', bg: '#FEF3C7', order: 1, pulse: false },
  medium:   { label: 'MEDIUM',   color: '#3B82F6', bg: '#DBEAFE', order: 2, pulse: false },
  low:      { label: 'LOW',      color: '#10B981', bg: '#D1FAE5', order: 3, pulse: false },
};

function fmt(iso) {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ── Priority badge ─────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const p = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
      background: p.bg, color: p.color,
    }}>
      {p.label}
    </span>
  );
};

// ── Notes modal ────────────────────────────────────────────────────
const NotesModal = ({ patient, onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const newNote = `[${fmt(new Date().toISOString())} — Field Agent] ${note.trim()}`;
    const updated = patient.field_notes
      ? `${patient.field_notes}\n${newNote}`
      : newNote;
    await onSave(patient.id, updated);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafeIcon icon={FiMessageSquare} size={18} style={{ color: 'var(--ac-primary)' }} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Add Note — {patient.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiX} size={18} />
          </button>
        </div>
        {patient.field_notes && (
          <div style={{ background: 'var(--ac-bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: 'var(--ac-text-secondary)', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {patient.field_notes}
          </div>
        )}
        <Field label="New note *">
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Describe observations, actions taken, or case updates…"
            style={{ minHeight: 100 }}
          />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !note.trim()}>
            {saving ? 'Saving…' : 'Save Note'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Emergency Request modal ────────────────────────────────────────
const EmergencyModal = ({ patient, onClose, onRequest }) => {
  const [type, setType] = useState('ambulance');
  const [notes, setNotes] = useState('');
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    await onRequest(patient.id, type, notes);
    setRequesting(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🚨</span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Request Emergency Provider</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiX} size={18} />
          </button>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ac-text-secondary)', marginBottom: 18 }}>
          Patient: <strong>{patient.name}</strong> · CRN: <span style={{ fontFamily: 'monospace' }}>{patient.crn}</span>
        </div>
        <Field label="Provider Type">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { value: 'ambulance', label: '🚑 Ambulance' },
              { value: 'police',    label: '🚔 Police' },
              { value: 'mental_health', label: '🧠 Mental Health' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                style={{
                  padding: '10px 8px', borderRadius: 10, border: `2px solid ${type === opt.value ? '#EF4444' : 'var(--ac-border)'}`,
                  background: type === opt.value ? '#FEE2E2' : 'var(--ac-bg)',
                  color: type === opt.value ? '#991B1B' : 'var(--ac-text)',
                  fontSize: 12, fontWeight: type === opt.value ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s', textAlign: 'center',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Additional details (optional)">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Location details, patient condition, any urgent notes…" style={{ minHeight: 80 }} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <button
            onClick={handleRequest}
            disabled={requesting}
            style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: requesting ? 'not-allowed' : 'pointer', opacity: requesting ? 0.7 : 1, fontFamily: 'inherit',
            }}
          >
            {requesting ? 'Requesting…' : '🚨 Request Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Case card ──────────────────────────────────────────────────────
const CaseCard = ({ patient, onAddNote, onRequestEmergency, onUpdateStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const p = PRIORITY[patient.priority] || PRIORITY.medium;

  return (
    <div style={{
      background: 'var(--ac-surface)',
      border: `2px solid ${p.color}`,
      borderRadius: 14,
      overflow: 'hidden',
      animation: p.pulse ? 'crisis-pulse 2.5s ease-in-out infinite' : 'none',
    }}>
      {/* Priority stripe */}
      <div style={{ height: 4, background: p.color }} />

      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ac-text)', marginBottom: 4 }}>{patient.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ac-muted)', background: 'var(--ac-bg)', display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>
              {patient.crn || 'No CRN'}
            </div>
          </div>
          <PriorityBadge priority={patient.priority} />
        </div>

        {/* Location + support category */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          {patient.care_centre && (
            <span style={{ fontSize: 12, color: 'var(--ac-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              📍 {patient.care_centre}
            </span>
          )}
          {patient.support_category && (
            <span style={{ fontSize: 12, color: 'var(--ac-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              🏷️ {patient.support_category.replace(/_/g, ' ')}
            </span>
          )}
          {patient.updated_at && (
            <span style={{ fontSize: 11, color: 'var(--ac-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SafeIcon icon={FiClock} size={10} /> Updated {fmt(patient.updated_at)}
            </span>
          )}
        </div>

        {/* Requirements / notes preview */}
        {patient.requirements && (
          <div style={{ background: 'var(--ac-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: 'var(--ac-text)', marginBottom: 10, borderLeft: `3px solid ${p.color}`, lineHeight: 1.5 }}>
            <strong>Requirements:</strong> {patient.requirements}
          </div>
        )}

        {/* Emergency provider status */}
        {patient.emergency_provider_requested && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 12px', background: '#FEE2E2', borderRadius: 8, fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
            <span>🚨</span> Emergency provider requested
            {patient.emergency_provider_type && ` — ${patient.emergency_provider_type}`}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <button
            onClick={() => onAddNote(patient)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <SafeIcon icon={FiEdit2} size={12} /> Add Note
          </button>
          {!patient.emergency_provider_requested && (
            <button
              onClick={() => onRequestEmergency(patient)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #EF4444', background: '#FEE2E2', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <SafeIcon icon={FiPhone} size={12} /> Emergency
            </button>
          )}
          {patient.status !== 'resolved' && (
            <button
              onClick={() => onUpdateStatus(patient.id, 'resolved')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #10B981', background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <SafeIcon icon={FiCheckCircle} size={12} /> Mark Resolved
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-muted)', fontSize: 12, cursor: 'pointer' }}
          >
            <SafeIcon icon={expanded ? FiChevronUp : FiChevronDown} size={14} />
          </button>
        </div>

        {/* Expanded field notes */}
        {expanded && patient.field_notes && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ac-bg)', borderRadius: 10, border: '1px solid var(--ac-border)', fontSize: 12, color: 'var(--ac-text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--ac-text)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Case Notes</div>
            {patient.field_notes}
          </div>
        )}
        {expanded && !patient.field_notes && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ac-bg)', borderRadius: 10, fontSize: 12, color: 'var(--ac-muted)', textAlign: 'center', fontStyle: 'italic' }}>
            No notes yet — add the first note above.
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main FieldAgentDashboard ───────────────────────────────────────
export default function FieldAgentDashboard({ agentEmail, agentLocation }) {
  const [cases, setCases]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState('');
  const [noteTarget, setNoteTarget]   = useState(null);
  const [emergTarget, setEmergTarget] = useState(null);
  const [agentGeo, setAgentGeo]       = useState(null); // { lat, lng, accuracy }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  // ── Request & report agent location on mount ─────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setAgentGeo({ lat, lng, accuracy });
        if (!agentEmail) return;
        // Save latest location to agent's admin_users record
        try {
          await supabase
            .from('admin_users_1777025000000')
            .update({
              last_location_lat: lat,
              last_location_lng: lng,
              last_location_at: new Date().toISOString(),
            })
            .ilike('email', agentEmail);
        } catch (err) {
          console.warn('Could not update agent location:', err);
        }
      },
      (err) => console.warn('Geolocation denied or unavailable:', err.message),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, [agentEmail]);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients_1777020684735')
        .select('*')
        .neq('status', 'resolved')
        .order('created_at', { ascending: false });

      // If agent is assigned to a location, filter by it
      if (agentLocation) {
        query = query.eq('care_centre', agentLocation);
      }
      // If agent email is known, filter to assigned cases
      if (agentEmail) {
        query = query.eq('assigned_agent', agentEmail);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Sort by priority order
      const sorted = (data || []).sort((a, b) => {
        const pa = PRIORITY[a.priority]?.order ?? 2;
        const pb = PRIORITY[b.priority]?.order ?? 2;
        return pa - pb;
      });
      setCases(sorted);
    } catch (e) {
      console.error('FieldAgentDashboard load error:', e);
      setCases([]);
    }
    setLoading(false);
  }, [agentEmail, agentLocation]);

  useEffect(() => { loadCases(); }, [loadCases]);

  const handleSaveNote = async (id, fieldNotes) => {
    try {
      await supabase
        .from('clients_1777020684735')
        .update({ field_notes: fieldNotes, updated_at: new Date().toISOString() })
        .eq('id', id);
      setCases(prev => prev.map(c => c.id === id ? { ...c, field_notes: fieldNotes, updated_at: new Date().toISOString() } : c));
      showToast('✅ Note saved');
    } catch (err) { console.error('Failed to save note:', err); showToast('⚠️ Failed to save note'); }
  };

  const handleEmergencyRequest = async (id, providerType, notes) => {
    try {
      await supabase
        .from('clients_1777020684735')
        .update({
          emergency_provider_requested: true,
          emergency_provider_type: providerType,
          emergency_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      setCases(prev => prev.map(c => c.id === id ? {
        ...c,
        emergency_provider_requested: true,
        emergency_provider_type: providerType,
        updated_at: new Date().toISOString(),
      } : c));
      showToast(`🚨 ${providerType} emergency request sent`);
    } catch (err) { console.error('Failed to send emergency request:', err); showToast('⚠️ Failed to send request'); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await supabase
        .from('clients_1777020684735')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      setCases(prev => prev.filter(c => c.id !== id));
      showToast('✅ Case marked resolved');
    } catch (err) { console.error('Failed to update status:', err); showToast('⚠️ Failed to update status'); }
  };

  const critical = cases.filter(c => c.priority === 'critical').length;
  const high     = cases.filter(c => c.priority === 'high').length;

  return (
    <div style={{ padding: '0 0 48px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 76, right: 16, zIndex: 999, padding: '12px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderLeft: '4px solid var(--ac-success)', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', fontSize: 14, fontWeight: 600, animation: 'slideIn 0.3s ease', maxWidth: 360 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>🚑</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>My Assigned Cases</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            {agentLocation ? `📍 ${agentLocation}` : 'All assigned cases'} · Sorted by priority
          </div>
          {agentGeo && (
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10B981', fontWeight: 600, background: '#D1FAE5', padding: '3px 10px', borderRadius: 20 }}>
              📡 GPS active · {agentGeo.lat.toFixed(4)}, {agentGeo.lng.toFixed(4)}
              {agentGeo.accuracy && <span style={{ opacity: 0.7 }}>±{Math.round(agentGeo.accuracy)}m</span>}
            </div>
          )}
        </div>
        <button
          onClick={loadCases}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}
        >
          <SafeIcon icon={FiRefreshCw} size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {cases.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Assigned', value: cases.length, color: 'var(--ac-text)' },
            { label: 'Critical', value: critical, color: '#EF4444' },
            { label: 'High', value: high, color: '#F59E0B' },
            { label: 'Emergency Requested', value: cases.filter(c => c.emergency_provider_requested).length, color: '#EF4444' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cases */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)', fontSize: 14 }}>Loading cases…</div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No active cases assigned</div>
          <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>Your admin will assign cases to you. Check back soon.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cases.map(c => (
            <CaseCard
              key={c.id}
              patient={c}
              onAddNote={setNoteTarget}
              onRequestEmergency={setEmergTarget}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {noteTarget && (
        <NotesModal
          patient={noteTarget}
          onClose={() => setNoteTarget(null)}
          onSave={handleSaveNote}
        />
      )}
      {emergTarget && (
        <EmergencyModal
          patient={emergTarget}
          onClose={() => setEmergTarget(null)}
          onRequest={handleEmergencyRequest}
        />
      )}
    </div>
  );
}

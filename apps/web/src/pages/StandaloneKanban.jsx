import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/supabase';
import { useDarkMode } from '../lib/utils';
import CrisisKanban from '../components/CrisisKanban';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiX, FiRefreshCw, FiMapPin, FiUser, FiActivity, FiClock } = FiIcons;

const Toast = ({ msg, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', top: 16, right: 16, zIndex: 9999,
    background: 'var(--ac-surface)', borderRadius: 12, padding: '12px 16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center',
    gap: 10, fontSize: 13, maxWidth: 340, border: '1px solid var(--ac-border)',
  }}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle}
      style={{ color: type === 'error' ? '#EF4444' : '#34C759', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--ac-muted)' }}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;
  const rows = [
    { icon: FiActivity, label: 'Type',        val: event.crisis_type?.replace(/_/g, ' ') || '—' },
    { icon: FiMapPin,   label: 'Location',    val: event.location || '—' },
    { icon: FiUser,     label: 'Assigned',    val: event.assigned_team?.join(', ') || 'Unassigned' },
    { icon: FiClock,    label: 'Created',     val: new Date(event.created_at).toLocaleString() },
  ];
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ac-text)', marginBottom: 2 }}>{event.client_name}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{event.client_crn || '—'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', padding: 4 }}>
            <SafeIcon icon={FiX} size={16} />
          </button>
        </div>
        {rows.map(({ icon, label, val }) => (
          <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--ac-border)' }}>
            <SafeIcon icon={icon} size={13} style={{ color: 'var(--ac-muted)', marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--ac-muted)', minWidth: 60 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ac-text)' }}>{val}</span>
          </div>
        ))}
        {event.description && (
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ac-text)', lineHeight: 1.55, background: 'var(--ac-bg)', borderRadius: 8, padding: '10px 12px' }}>
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default function StandaloneKanban() {
  const [dark] = useDarkMode();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crisis_events_1777090008')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) { showToast(error.message, 'error'); }
      else { setEvents(data || []); }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setAuthed(true); fetchEvents(); }
      else { setAuthed(false); setLoading(false); }
    });
  }, [fetchEvents]);

  if (authed === null) return null;

  if (!authed) {
    return (
      <div className={dark ? 'ac-dark' : ''} style={{ minHeight: '100vh', background: 'var(--ac-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <SafeIcon icon={FiAlertTriangle} size={36} style={{ color: '#EF4444', marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ac-text)', marginBottom: 8 }}>Not Authenticated</div>
        <div style={{ fontSize: 13, color: 'var(--ac-muted)', maxWidth: 340 }}>
          Please log in via the main Acute Connect platform first, then click Pop Out again.
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? 'ac-dark' : ''} style={{ minHeight: '100vh', background: 'var(--ac-bg)', padding: '16px 20px 40px', boxSizing: 'border-box' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SafeIcon icon={FiAlertTriangle} size={22} style={{ color: '#EF4444' }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ac-text)' }}>Crisis Kanban</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Acute Connect · Live Board</div>
          </div>
        </div>
        <button
          onClick={fetchEvents}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1px solid var(--ac-border)', background: 'transparent', color: 'var(--ac-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <SafeIcon icon={FiRefreshCw} size={12} />Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ac-muted)' }}>Loading events…</div>
      ) : (
        <CrisisKanban
          events={events}
          onRefresh={fetchEvents}
          onViewEvent={setSelectedEvent}
          showToast={showToast}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/supabase';
import { useDarkMode } from '../lib/utils';
import CrisisKanban from '../components/CrisisKanban';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiX, FiRefreshCw } = FiIcons;

const Toast = ({ msg, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', top: 16, right: 16, zIndex: 9999,
    background: 'var(--ac-surface)', borderRadius: 12, padding: '12px 16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center',
    gap: 10, fontSize: 13, maxWidth: 340, border: '1px solid var(--ac-border)',
  }}>
    <SafeIcon icon={type === 'error' ? FiAlertCircle : FiCheckCircle}
      style={{ color: type === 'error' ? 'var(--ac-danger)' : 'var(--ac-success)', flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--ac-muted)' }}>
      <SafeIcon icon={FiX} size={14} />
    </button>
  </div>
);

export default function StandaloneKanban() {
  const [dark] = useDarkMode();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from('crisis_events_1777090008')
      .select('*')
      .order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <div className={dark ? 'ac-dark' : ''} style={{ minHeight: '100vh', background: 'var(--ac-bg)', padding: '16px 20px 40px', boxSizing: 'border-box' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Minimal header */}
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
          onViewEvent={() => {}}
          showToast={showToast}
        />
      )}
    </div>
  );
}

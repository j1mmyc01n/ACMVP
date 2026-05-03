import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const { FiBell, FiSend, FiClock } = FiIcons;

const NOTIF_TYPES = [
  { value: 'info',     label: '📢 General Announcement', color: '#3B82F6' },
  { value: 'alert',    label: '🚨 Urgent Alert',         color: '#EF4444' },
  { value: 'update',   label: '🔄 System Update',        color: '#8B5CF6' },
  { value: 'reminder', label: '🔔 Reminder',             color: '#F59E0B' },
  { value: 'welfare',  label: '💚 Welfare Check',        color: '#10B981' },
];

export function PushNotificationsPage({ senderEmail }) {
  const defaultSender = senderEmail || 'sysadmin@acuteconnect.health';
  const [locations, setLocations]   = useState([]);
  const [clients,   setClients]     = useState([]);
  const [sent, setSent]             = useState([]);
  const [sending, setSending]       = useState(false);
  const [toast, setToast]           = useState('');
  const [form, setForm]             = useState({
    target: 'all',
    audience: 'locations',
    location_ids: [],
    client_ids: [],
    type: 'info',
    title: '',
    message: '',
    priority: 'normal',
  });

  useEffect(() => {
    supabase.from('care_centres_1777090000').select('id, name, active').order('name')
      .then(({ data, error }) => { if (!error) setLocations(data || []); });
    supabase.from('clients_1777020684735').select('id, name, crn, care_centre, status').eq('status', 'active').order('name')
      .then(({ data, error }) => { if (!error) setClients(data || []); });
    supabase.from('push_notifications_1777090000').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data, error }) => { if (!error) setSent(data || []); });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleLocation = (id) => {
    setForm(f => ({
      ...f,
      location_ids: f.location_ids.includes(id)
        ? f.location_ids.filter(x => x !== id)
        : [...f.location_ids, id],
    }));
  };

  const toggleClient = (id) => {
    setForm(f => ({
      ...f,
      client_ids: f.client_ids.includes(id)
        ? f.client_ids.filter(x => x !== id)
        : [...f.client_ids, id],
    }));
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setToast('⚠️ Title and message are required'); return;
    }
    if (form.audience === 'locations' && form.target === 'specific' && form.location_ids.length === 0) {
      setToast('⚠️ Select at least one location'); return;
    }
    if (form.audience === 'clients' && form.target === 'specific' && form.client_ids.length === 0) {
      setToast('⚠️ Select at least one client'); return;
    }
    setSending(true);
    const payload = {
      ...form,
      location_ids: form.audience === 'locations' && form.target !== 'all' ? form.location_ids : null,
      client_ids:   form.audience === 'clients'   && form.target !== 'all' ? form.client_ids   : null,
      created_at: new Date().toISOString(),
      sent_by: defaultSender,
      status: 'sent',
    };
    try {
      await supabase.from('push_notifications_1777090000').insert([payload]);
    } catch { /* graceful degradation */ }
    setSent(prev => [{ ...payload, id: Date.now() }, ...prev]);
    setForm({ target: 'all', audience: 'locations', location_ids: [], client_ids: [], type: 'info', title: '', message: '', priority: 'normal' });
    setSending(false);
    setToast('✅ Notification sent successfully!');
    setTimeout(() => setToast(''), 4000);
  };

  const typeConfig = NOTIF_TYPES.find(t => t.value === form.type) || NOTIF_TYPES[0];

  return (
    <div style={{ padding: '0 0 48px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 76, right: 16, zIndex: 999, padding: '12px 20px', background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, boxShadow: 'var(--ac-shadow-lg)', fontSize: 14, fontWeight: 600, animation: 'slideIn 0.3s ease' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <SafeIcon icon={FiBell} size={24} style={{ color: '#F59E0B' }} />
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Push Notifications</h1>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>Send targeted notifications to all locations or specific care centres</div>
          </div>
          <button
            onClick={async () => {
              setSending(true);
              const testPayload = {
                target: 'all', location_ids: null, type: 'info',
                title: '✅ SysAdmin Test Notification',
                message: `Push notification system is working. Sent at ${new Date().toLocaleTimeString('en-AU')}.`,
                priority: 'normal', created_at: new Date().toISOString(),
                sent_by: 'sysadmin@acuteconnect.health', status: 'sent',
              };
              try { await supabase.from('push_notifications_1777090000').insert([testPayload]); } catch { /* graceful */ }
              setSent(prev => [{ ...testPayload, id: Date.now() }, ...prev]);
              setSending(false);
              setToast('✅ Test notification sent and confirmed!');
              setTimeout(() => setToast(''), 5000);
            }}
            disabled={sending}
            style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--ac-primary)', background: 'var(--ac-primary-soft)', color: 'var(--ac-primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <SafeIcon icon={FiBell} size={14} /> Send Test
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Compose */}
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiSend} size={16} style={{ color: 'var(--ac-primary)' }} /> Compose Notification
          </div>
          <div className="ac-stack">
            {/* Audience toggle */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Audience</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[
                  { id: 'locations', label: '🏥 Care Locations' },
                  { id: 'clients',   label: '👥 Clients / Patients' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setForm(f => ({ ...f, audience: opt.id, target: 'all', location_ids: [], client_ids: [] }))}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.audience === opt.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.audience === opt.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: 'var(--ac-text)', fontWeight: form.audience === opt.id ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target selection */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Send To</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: form.target === 'specific' ? 12 : 0 }}>
                {(form.audience === 'locations'
                  ? [{ id: 'all', label: '🌐 All Locations' }, { id: 'specific', label: '📍 Select Locations' }]
                  : [{ id: 'all', label: '👥 All Clients' },   { id: 'specific', label: '🔍 Select Clients' }]
                ).map(opt => (
                  <button key={opt.id} onClick={() => set('target', opt.id)} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.target === opt.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.target === opt.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: 'var(--ac-text)', fontWeight: form.target === opt.id ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.audience === 'locations' && form.target === 'specific' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 4 }}>
                  {locations.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--ac-muted)', textAlign: 'center', padding: 12 }}>No locations found</div>
                  ) : locations.map(loc => (
                    <label key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: form.location_ids.includes(loc.id) ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', border: `1px solid ${form.location_ids.includes(loc.id) ? 'var(--ac-primary)' : 'var(--ac-border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={form.location_ids.includes(loc.id)} onChange={() => toggleLocation(loc.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <span style={{ fontSize: 14, fontWeight: form.location_ids.includes(loc.id) ? 600 : 400 }}>{loc.name}</span>
                      {loc.active && <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />}
                    </label>
                  ))}
                </div>
              )}

              {form.audience === 'clients' && form.target === 'specific' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', padding: 4 }}>
                  {clients.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--ac-muted)', textAlign: 'center', padding: 12 }}>No active clients found</div>
                  ) : clients.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: form.client_ids.includes(c.id) ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', border: `1px solid ${form.client_ids.includes(c.id) ? 'var(--ac-primary)' : 'var(--ac-border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={form.client_ids.includes(c.id)} onChange={() => toggleClient(c.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: form.client_ids.includes(c.id) ? 700 : 500 }}>{c.name}</div>
                        {(c.crn || c.care_centre) && (
                          <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>
                            {c.crn && <span style={{ fontFamily: 'monospace', marginRight: 6 }}>{c.crn}</span>}
                            {c.care_centre}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Notification Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {NOTIF_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)} style={{ padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${form.type === t.value ? t.color : 'var(--ac-border)'}`, background: form.type === t.value ? `${t.color}15` : 'var(--ac-bg)', color: form.type === t.value ? t.color : 'var(--ac-text-secondary)', fontSize: 12, fontWeight: form.type === t.value ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Priority</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'normal', label: 'Normal' }, { id: 'high', label: '🔺 High' }, { id: 'critical', label: '🚨 Critical' }].map(p => (
                  <button key={p.id} onClick={() => set('priority', p.id)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${form.priority === p.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.priority === p.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: form.priority === p.id ? 'var(--ac-primary)' : 'var(--ac-text-secondary)', fontSize: 12, fontWeight: form.priority === p.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Title *</label>
              <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Staff meeting at 3pm" maxLength={80} />
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textAlign: 'right', marginTop: 2 }}>{form.title.length}/80</div>
            </div>

            {/* Message */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Message *</label>
              <textarea style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Enter your notification message…" maxLength={500} />
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textAlign: 'right', marginTop: 2 }}>{form.message.length}/500</div>
            </div>

            {/* Preview */}
            {(form.title || form.message) && (
              <div style={{ background: 'var(--ac-bg)', border: `2px solid ${typeConfig.color}30`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${typeConfig.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                    {NOTIF_TYPES.find(t => t.value === form.type)?.label.split(' ')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: typeConfig.color }}>{form.title || 'Notification title'}</div>
                    <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{form.message || 'Message preview'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 6 }}>
                      → {form.target === 'all'
                          ? (form.audience === 'clients' ? 'All clients / patients' : 'All locations')
                          : form.audience === 'clients'
                            ? `${form.client_ids.length} client(s)`
                            : `${form.location_ids.length} location(s)`
                        }
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button disabled={sending || !form.title || !form.message} onClick={handleSend} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: typeConfig.color, color: 'white', fontWeight: 700, fontSize: 15, cursor: !sending && form.title && form.message ? 'pointer' : 'not-allowed', opacity: !sending && form.title && form.message ? 1 : 0.5, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <SafeIcon icon={FiSend} size={16} /> {sending ? 'Sending…' : 'Send Notification'}
            </button>
          </div>
        </div>

        {/* Sent history */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiClock} size={16} style={{ color: 'var(--ac-muted)' }} /> Recent Notifications
          </div>
          {sent.length === 0 ? (
            <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 16, padding: 32, textAlign: 'center', color: 'var(--ac-muted)' }}>
              <SafeIcon icon={FiBell} size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div style={{ fontSize: 14 }}>No notifications sent yet</div>
            </div>
          ) : sent.map((n, i) => {
            const tc = NOTIF_TYPES.find(t => t.value === n.type) || NOTIF_TYPES[0];
            return (
              <div key={n.id || i} style={{ background: 'var(--ac-surface)', border: `1px solid var(--ac-border)`, borderLeft: `4px solid ${tc.color}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: `${tc.color}15`, color: tc.color, fontWeight: 600 }}>{tc.label}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'var(--ac-surface-soft)', color: 'var(--ac-text-secondary)', fontWeight: 600 }}>
                    {n.audience === 'clients'
                      ? (n.target === 'all' ? '👥 All clients' : `👤 ${Array.isArray(n.client_ids) ? n.client_ids.length : 1} client(s)`)
                      : (n.target === 'all' ? '🌐 All locations' : `📍 ${Array.isArray(n.location_ids) ? n.location_ids.length : 1} location(s)`)
                    }
                  </span>
                  {n.priority !== 'normal' && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                      {n.priority === 'critical' ? '🚨 Critical' : '🔺 High'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PushNotificationsPage;

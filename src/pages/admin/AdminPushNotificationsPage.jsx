/**
 * AdminPushNotificationsPage
 *
 * Admin-facing push notifications page. Scoped to the admin's assigned care
 * centre. Enforces a monthly quota (3 free / month; purchasable upgrade adds
 * +5 via integration request). Admins cannot broadcast to all locations —
 * they can only target clients within their own care centre.
 */
import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { safeErrMsg } from '../../lib/utils';
import { logActivity } from '../../lib/audit';

const {
  FiBell, FiSend, FiClock, FiAlertCircle, FiCheckCircle,
  FiRefreshCw, FiX, FiUser, FiZap,
} = FiIcons;

const FREE_PUSH_LIMIT  = 3;
const PACK_PUSH_EXTRA  = 5;
const PUSH_PACK_FEE    = 75;
const INTG_TABLE       = 'location_integration_requests_1777090015';
const PUSH_TABLE       = 'push_notifications_1777090000';
const CENTRES_TABLE    = 'care_centres_1777090000';
const CLIENTS_TABLE    = 'clients_1777020684735';

const NOTIF_TYPES = [
  { value: 'info',     label: '📢 General Announcement', color: '#3B82F6' },
  { value: 'reminder', label: '🔔 Reminder',             color: '#F59E0B' },
  { value: 'welfare',  label: '💚 Welfare Check',        color: '#10B981' },
  { value: 'alert',    label: '🚨 Urgent Alert',         color: '#EF4444' },
];

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function AdminPushNotificationsPage({ senderEmail, adminCentre }) {
  const [locationId,     setLocationId]     = useState(null);
  const [clients,        setClients]        = useState([]);
  const [sent,           setSent]           = useState([]);
  const [packStatus,     setPackStatus]     = useState(null);
  const [sentThisMonth,  setSentThisMonth]  = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [subscribing,    setSubscribing]    = useState(false);
  const [toast,          setToast]          = useState(null);

  const [form, setForm] = useState({
    target:     'all',
    client_ids: [],
    type:       'info',
    title:      '',
    message:    '',
    priority:   'normal',
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const toggleClient = useCallback((id) => {
    setForm(f => ({
      ...f,
      client_ids: f.client_ids.includes(id)
        ? f.client_ids.filter(x => x !== id)
        : [...f.client_ids, id],
    }));
  }, []);

  // Load centre record, pack status, clients, and sent history
  const load = useCallback(async () => {
    if (!adminCentre) { setLoading(false); return; }
    setLoading(true);
    try {
      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Look up centre record to get its UUID
      const { data: centreData } = await supabase
        .from(CENTRES_TABLE)
        .select('id')
        .eq('name', adminCentre)
        .maybeSingle();

      const cid = centreData?.id ?? null;
      setLocationId(cid);

      const queries = [
        // Active clients at this centre
        supabase.from(CLIENTS_TABLE)
          .select('id, name, crn')
          .eq('care_centre', adminCentre)
          .eq('status', 'active')
          .order('name'),
        // Sent notifications for this centre this month
        supabase.from(PUSH_TABLE)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
      ];

      if (cid) {
        queries.push(
          // Pack status
          supabase.from(INTG_TABLE)
            .select('*')
            .eq('type', 'push_notification_pack')
            .eq('location_id', cid)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          // Count sent this month for this location
          supabase.from(PUSH_TABLE)
            .select('id', { count: 'exact', head: true })
            .contains('location_ids', [cid])
            .gte('created_at', monthStart)
            .lte('created_at', monthEnd),
        );
      }

      const results = await Promise.all(queries);
      setClients(results[0].data || []);

      // Filter sent history to only items related to this centre
      const allSent = results[1].data || [];
      setSent(cid
        ? allSent.filter(n =>
            !n.location_ids ||
            (Array.isArray(n.location_ids) && n.location_ids.includes(cid)) ||
            n.sent_by === senderEmail
          )
        : allSent.filter(n => n.sent_by === senderEmail)
      );

      if (cid) {
        setPackStatus(results[2]?.data || null);
        setSentThisMonth(results[3]?.count || 0);
      }
    } catch (e) {
      console.error('AdminPushNotificationsPage load error:', e);
    }
    setLoading(false);
  }, [adminCentre, senderEmail]);

  useEffect(() => { load(); }, [load]);

  const packActive  = packStatus?.status === 'active';
  const packPending = packStatus?.status === 'pending';
  const monthlyLimit = packActive ? FREE_PUSH_LIMIT + PACK_PUSH_EXTRA : FREE_PUSH_LIMIT;
  const remaining   = Math.max(0, monthlyLimit - sentThisMonth);
  const usagePct    = Math.min(100, (sentThisMonth / monthlyLimit) * 100);
  const overQuota   = remaining === 0;

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('Title and message are required', 'error'); return;
    }
    if (overQuota) {
      showToast('Monthly quota reached — upgrade to send more', 'error'); return;
    }
    if (form.target === 'specific' && form.client_ids.length === 0) {
      showToast('Select at least one client', 'error'); return;
    }
    setSending(true);
    try {
      const payload = {
        target:      form.target,
        audience:    'clients',
        location_ids: locationId ? [locationId] : null,
        client_ids:  form.target === 'specific' ? form.client_ids : null,
        type:        form.type,
        title:       form.title,
        message:     form.message,
        priority:    form.priority,
        sent_by:     senderEmail || 'admin@acuteconnect.health',
        status:      'sent',
        created_at:  new Date().toISOString(),
      };
      await supabase.from(PUSH_TABLE).insert([payload]);
      await logActivity({
        action: 'create',
        resource: 'push_notification',
        detail: `Sent ${form.type} "${form.title}" to ${form.target === 'all' ? `all clients (${clients.length})` : `${form.client_ids.length} client(s)`} at ${adminCentre}`,
        actor: senderEmail || 'admin',
        actor_role: 'admin',
        source_type: 'client',
        location: adminCentre,
        level: form.priority === 'critical' ? 'warning' : 'info',
      });
      setSent(prev => [{ ...payload, id: Date.now() }, ...prev]);
      setSentThisMonth(n => n + 1);
      setForm({ target: 'all', client_ids: [], type: 'info', title: '', message: '', priority: 'normal' });
      showToast('✅ Notification sent successfully!');
    } catch (e) {
      showToast('Failed to send: ' + safeErrMsg(e), 'error');
    }
    setSending(false);
  };

  const handleSubscribe = async () => {
    if (!locationId) { showToast('Care centre not found', 'error'); return; }
    setSubscribing(true);
    try {
      const { error } = await supabase.from(INTG_TABLE).insert([{
        type:       'push_notification_pack',
        location_id: locationId,
        status:     'pending',
        payload:    { fee: PUSH_PACK_FEE, extra_notifications: PACK_PUSH_EXTRA },
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      showToast('Request sent to SysAdmin for review.');
      setPackStatus({ status: 'pending', created_at: new Date().toISOString() });
    } catch (e) {
      showToast('Failed to submit request: ' + safeErrMsg(e), 'error');
    }
    setSubscribing(false);
  };

  const typeConfig = NOTIF_TYPES.find(t => t.value === form.type) || NOTIF_TYPES[0];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
        <SafeIcon icon={FiRefreshCw} size={24} style={{ color: 'var(--ac-muted)', opacity: 0.5 }} />
      </div>
    );
  }

  if (!adminCentre) {
    return (
      <div style={{ padding: '0 0 48px' }}>
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No care centre assigned</div>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Contact your SysAdmin to assign you to a care centre.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 48px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 76, right: 16, zIndex: 999,
          padding: '12px 20px', background: 'var(--ac-surface)',
          border: '1px solid var(--ac-border)',
          borderLeft: `4px solid ${toast.type === 'error' ? '#EF4444' : '#10B981'}`,
          borderRadius: 12, boxShadow: 'var(--ac-shadow-lg)',
          fontSize: 14, fontWeight: 600, maxWidth: 340,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiBell} size={18} style={{ color: '#F59E0B' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.4 }}>Push Notifications</h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', marginLeft: 46 }}>
          Send notifications to clients at <strong>{adminCentre}</strong>
        </div>
      </div>

      {/* Quota bar */}
      <div style={{ background: 'var(--ac-surface)', border: `1px solid ${overQuota ? '#FECACA' : 'var(--ac-border)'}`, borderRadius: 16, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Monthly Quota — {adminCentre}</div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: overQuota ? '#FEE2E2' : packActive ? '#D1FAE5' : '#FEF3C7',
            color: overQuota ? '#991B1B' : packActive ? '#065F46' : '#92400E',
          }}>
            {overQuota ? '🚫 Quota reached' : packActive ? '📦 Pack active' : '🔔 Free tier'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ac-text-secondary)', marginBottom: 6 }}>
          <span>{sentThisMonth} sent this month</span>
          <span style={{ fontWeight: 700 }}>{monthlyLimit} total</span>
        </div>
        <div style={{ height: 8, background: 'var(--ac-bg)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%', width: `${usagePct}%`,
            background: overQuota ? '#EF4444' : usagePct >= 75 ? '#F59E0B' : '#10B981',
            borderRadius: 4, transition: 'width 0.4s',
          }} />
        </div>
        <div style={{ fontSize: 12, color: overQuota ? '#DC2626' : 'var(--ac-muted)' }}>
          {overQuota
            ? packActive
              ? 'Monthly quota reached. Contact SysAdmin for a higher tier.'
              : `Free quota reached. Subscribe to the extra pack for +${PACK_PUSH_EXTRA} more/month.`
            : `${remaining} notification${remaining === 1 ? '' : 's'} remaining this month`
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Compose */}
        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiSend} size={16} style={{ color: 'var(--ac-primary)' }} /> Compose Notification
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Target */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Send To</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: form.target === 'specific' ? 10 : 0 }}>
                {[
                  { id: 'all',      label: `👥 All Clients (${clients.length})` },
                  { id: 'specific', label: '🔍 Select Clients' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setForm(f => ({ ...f, target: opt.id, client_ids: [] }))}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.target === opt.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.target === opt.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: 'var(--ac-text)', fontWeight: form.target === opt.id ? 700 : 400, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.target === 'specific' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto', padding: 4, border: '1px solid var(--ac-border)', borderRadius: 10 }}>
                  {clients.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--ac-muted)', textAlign: 'center', padding: 16 }}>No active clients at {adminCentre}</div>
                  ) : clients.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: form.client_ids.includes(c.id) ? 'var(--ac-primary-soft)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}>
                      <input type="checkbox" checked={form.client_ids.includes(c.id)} onChange={() => toggleClient(c.id)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: form.client_ids.includes(c.id) ? 700 : 400 }}>{c.name}</div>
                        {c.crn && <div style={{ fontSize: 10, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{c.crn}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', marginBottom: 8 }}>Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {NOTIF_TYPES.map(t => (
                  <button key={t.value} onClick={() => set('type', t.value)}
                    style={{ padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${form.type === t.value ? t.color : 'var(--ac-border)'}`, background: form.type === t.value ? `${t.color}18` : 'var(--ac-bg)', color: form.type === t.value ? t.color : 'var(--ac-text-secondary)', fontSize: 11, fontWeight: form.type === t.value ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s' }}>
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
                  <button key={p.id} onClick={() => set('priority', p.id)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${form.priority === p.id ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: form.priority === p.id ? 'var(--ac-primary-soft)' : 'var(--ac-bg)', color: form.priority === p.id ? 'var(--ac-primary)' : 'var(--ac-text-secondary)', fontSize: 12, fontWeight: form.priority === p.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Title *</label>
              <input
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Appointment reminder"
                maxLength={80}
                onFocus={e => e.target.style.borderColor = 'var(--ac-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--ac-border)'}
              />
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textAlign: 'right', marginTop: 2 }}>{form.title.length}/80</div>
            </div>

            {/* Message */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac-text-secondary)', display: 'block', marginBottom: 6 }}>Message *</label>
              <textarea
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, transition: 'border-color 0.15s' }}
                rows={4} value={form.message} onChange={e => set('message', e.target.value)}
                placeholder="Enter your notification message…"
                maxLength={500}
                onFocus={e => e.target.style.borderColor = 'var(--ac-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--ac-border)'}
              />
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', textAlign: 'right', marginTop: 2 }}>{form.message.length}/500</div>
            </div>

            {/* Preview */}
            {(form.title || form.message) && (
              <div style={{ background: 'var(--ac-bg)', border: `2px solid ${typeConfig.color}30`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Preview</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${typeConfig.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                    {NOTIF_TYPES.find(t => t.value === form.type)?.label.split(' ')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: typeConfig.color }}>{form.title || 'Notification title'}</div>
                    <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.5 }}>{form.message || 'Message preview'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 5 }}>
                      → {form.target === 'all' ? `All ${clients.length} client(s) at ${adminCentre}` : `${form.client_ids.length} selected client(s)`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quota warning */}
            {overQuota && (
              <div style={{ padding: '12px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#991B1B' }}>
                <SafeIcon icon={FiAlertCircle} size={16} />
                Monthly quota reached. Upgrade to send more notifications.
              </div>
            )}

            <button
              disabled={sending || !form.title || !form.message || overQuota}
              onClick={handleSend}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: overQuota ? '#9CA3AF' : typeConfig.color, color: 'white', fontWeight: 700, fontSize: 15, cursor: sending || !form.title || !form.message || overQuota ? 'not-allowed' : 'pointer', opacity: sending || !form.title || !form.message ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s' }}>
              <SafeIcon icon={FiSend} size={16} />
              {sending ? 'Sending…' : overQuota ? 'Quota Reached' : 'Send Notification'}
            </button>
          </div>
        </div>

        {/* Right column: history + upgrade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upgrade CTA */}
          {!packActive && (
            <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiZap} size={16} style={{ color: '#7C3AED' }} /> Extra Push Pack
              </div>
              <p style={{ fontSize: 13, color: 'var(--ac-text-secondary)', lineHeight: 1.6, margin: '0 0 14px' }}>
                Your location gets <strong>{FREE_PUSH_LIMIT} free notifications/month</strong>. Subscribe to the extra pack and get <strong>+{PACK_PUSH_EXTRA} more</strong> — for <strong>${PUSH_PACK_FEE}/month</strong>.
              </p>
              {packPending ? (
                <div style={{ padding: '12px 14px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, fontSize: 13, color: '#92400E' }}>
                  ⏳ Request pending SysAdmin review.
                </div>
              ) : packStatus?.status === 'rejected' ? (
                <div style={{ padding: '12px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, color: '#991B1B' }}>
                  ❌ Request was not approved. Contact SysAdmin.
                </div>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#7C3AED', color: 'white', fontWeight: 700, fontSize: 14, cursor: subscribing ? 'not-allowed' : 'pointer', opacity: subscribing ? 0.7 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <SafeIcon icon={FiBell} size={15} />
                  {subscribing ? 'Sending Request…' : `Subscribe — $${PUSH_PACK_FEE}/mo`}
                </button>
              )}
            </div>
          )}

          {/* Sent history */}
          <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 20, padding: 22, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeIcon icon={FiClock} size={15} style={{ color: 'var(--ac-muted)' }} /> Sent from {adminCentre}
            </div>
            {sent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--ac-muted)' }}>
                <SafeIcon icon={FiBell} size={32} style={{ opacity: 0.25, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>No notifications sent yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {sent.map((n, i) => {
                  const tc = NOTIF_TYPES.find(t => t.value === n.type) || NOTIF_TYPES[0];
                  return (
                    <div key={n.id || i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderLeft: `3px solid ${tc.color}`, borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${tc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17 }}>
                        {tc.label.split(' ')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: tc.color, marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--ac-text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 4 }}>{fmtDate(n.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CallerScreen — active call overlay for the CRM.
 *
 * Features:
 *  - Dial animation → Active timer (pauses on hold)
 *  - Mute / Hold / End Call controls
 *  - Call Bridge panel (conference a third party in)
 *  - Notes field (saved to Supabase on end)
 *  - Maximize: pops the call out to a new browser window so the agent
 *    can see both the caller and the client profile at the same time.
 *  - All calls persisted to call_logs_1777090000
 *  - Abandoned dialing rows cleaned up on unmount / page unload
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const {
  FiPhoneOff, FiMic, FiMicOff, FiPause, FiPlay,
  FiUsers, FiUserPlus, FiX, FiMaximize2, FiMinimize2,
  FiEdit3, FiLink, FiChevronDown, FiAlertCircle,
} = FiIcons;

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDuration = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const initials = (name = '') =>
  (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const PALETTE = ['#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#059669', '#0284C7'];
const avatarColor = (name = '') =>
  PALETTE[Math.abs(((name || '').charCodeAt(0) || 0) + (name || '').length) % PALETTE.length];

/** Escape a value for safe insertion into HTML strings. */
const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── small ctrl button ────────────────────────────────────────────────────────

function CtrlBtn({ icon: Icon, label, onClick, active, color, bg, textColor, large, disabled }) {
  const size = large ? 56 : 48;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg || (active ? `${color}22` : 'rgba(255,255,255,0.07)'),
        border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
        color: textColor || (active ? color : '#94a3b8'),
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s', gap: 0,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      <SafeIcon icon={Icon} size={large ? 22 : 18} />
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CallerScreen({ client, careTeam, initiatedBy, onClose }) {
  const [status, setStatus] = useState('dialing'); // dialing | active | on_hold | ended
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [notes, setNotes] = useState('');
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeName, setBridgeName] = useState('');
  const [bridgePhone, setBridgePhone] = useState('');
  const [bridgedTo, setBridgedTo] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [popOut, setPopOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const startedAt = useRef(new Date());
  const timerRef = useRef(null);
  const popWinRef = useRef(null);
  const logIdRef = useRef(null);
  // Resolves with the inserted row id once the initial INSERT completes.
  const insertPromiseRef = useRef(null);
  // Mirror of status for use inside event listeners / cleanup.
  const statusRef = useRef('dialing');
  const elapsedRef = useRef(0);
  const notesRef = useRef('');

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // ── connect → active after 2s dial simulation ─────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setStatus('active'), 2000);
    return () => clearTimeout(t);
  }, []);

  // ── insert initial call log row ───────────────────────────────────────────
  useEffect(() => {
    insertPromiseRef.current = supabase
      .from('call_logs_1777090000')
      .insert([{
        client_id: client?.id || null,
        client_name: client?.name || null,
        client_phone: client?.phone || client?.mobile || null,
        care_centre: careTeam || null,
        initiated_by: initiatedBy || null,
        status: 'dialing',
        started_at: startedAt.current.toISOString(),
      }])
      .select('id')
      .single()
      .then(({ data }) => {
        if (data?.id) logIdRef.current = data.id;
        return data?.id ?? null;
      });

    // Clean up abandoned dialing rows on unmount (route change) and page unload.
    const markAbandoned = () => {
      if (!logIdRef.current || statusRef.current === 'ended') return;
      supabase
        .from('call_logs_1777090000')
        .update({ status: 'abandoned', ended_at: new Date().toISOString() })
        .eq('id', logIdRef.current)
        .eq('status', 'dialing');
    };

    window.addEventListener('beforeunload', markAbandoned);
    return () => {
      window.removeEventListener('beforeunload', markAbandoned);
      markAbandoned();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── timer — only ticks during 'active' (pauses on hold) ───────────────────
  useEffect(() => {
    if (status === 'active' && !held) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, held]);

  // ── sync state to pop-out window via postMessage ──────────────────────────
  useEffect(() => {
    if (popWinRef.current && !popWinRef.current.closed) {
      try {
        popWinRef.current.postMessage(
          { type: 'call-state', status, elapsed, muted, held, notes, bridgedTo },
          '*',
        );
      } catch {}
    }
  }, [status, elapsed, muted, held, notes, bridgedTo]);

  // ── listen for actions coming from the pop-out (attached to parent window) -
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || e.data.type !== 'call-action') return;
      const { action } = e.data;
      if (action === 'mute') setMuted(v => !v);
      if (action === 'hold') {
        setHeld(v => {
          const newHeld = !v;
          setStatus(newHeld ? 'on_hold' : 'active');
          return newHeld;
        });
      }
      if (action === 'end') endCall();
      if (action === 'notes') setNotes(e.data.notes ?? '');
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const endCall = useCallback(async () => {
    if (statusRef.current === 'ended') return;
    setStatus('ended');
    statusRef.current = 'ended';
    clearInterval(timerRef.current);
    setSaving(true);
    setSaveError(false);

    // Resolve the log id — wait for the insert if it hasn't landed yet.
    let id = logIdRef.current;
    if (!id && insertPromiseRef.current) {
      id = await insertPromiseRef.current;
    }

    if (id) {
      const { error } = await supabase
        .from('call_logs_1777090000')
        .update({
          status: bridgedTo ? 'bridged' : 'ended',
          ended_at: new Date().toISOString(),
          // Use the actual active talk time (elapsed), not wall-clock diff, so
          // ringing and hold periods are excluded from duration_seconds.
          duration_seconds: elapsedRef.current,
          notes: notesRef.current || null,
          bridged_to_name: bridgedTo?.name || null,
          bridged_to_phone: bridgedTo?.phone || null,
        })
        .eq('id', id);
      if (error) setSaveError(true);
    }
    setSaving(false);

    if (popWinRef.current && !popWinRef.current.closed) {
      popWinRef.current.close();
    }

    setTimeout(() => onClose?.(), 800);
  }, [bridgedTo, onClose]); // elapsedRef / notesRef are refs, no dep needed

  const handleBridge = () => {
    if (!bridgeName.trim()) return;
    setBridgedTo({ name: bridgeName.trim(), phone: bridgePhone.trim() });
    setBridgeOpen(false);
    setBridgeName('');
    setBridgePhone('');
  };

  const openPopOut = () => {
    const w = window.open('', '_blank', 'width=520,height=720,resizable=yes,menubar=no,toolbar=no,location=no');
    if (!w) return;
    popWinRef.current = w;
    setPopOut(true);

    // Build the pop-out page. All dynamic values are HTML-escaped to prevent XSS.
    const clientName = esc(client?.name || 'Unknown');
    const clientPhone = esc(client?.phone || client?.mobile || 'No phone on file');
    const clientCrn = client?.crn ? `<span style="margin-left:12px;font-size:11px;color:#64748b">#${esc(client.crn)}</span>` : '';
    const bgColor = esc(avatarColor(client?.name));
    const clientInitials = esc(initials(client?.name));
    const startElapsed = elapsedRef.current;

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Call — ${clientName}</title>
      <meta charset="utf-8"/>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f172a;font-family:system-ui,-apple-system,sans-serif;color:#f1f5f9;min-height:100vh}</style>
    </head><body>
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;gap:24px">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#64748b">Active Call</div>
        <div style="width:90px;height:90px;border-radius:50%;background:${bgColor};display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;color:#fff;border:3px solid rgba(255,255,255,0.15)">${clientInitials}</div>
        <div style="text-align:center">
          <div style="font-size:26px;font-weight:800">${clientName}</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:4px">${clientPhone}${clientCrn}</div>
        </div>
        <div id="timer" style="font-size:40px;font-weight:900;letter-spacing:2px;color:#10b981;font-variant-numeric:tabular-nums">${fmtDuration(startElapsed)}</div>
        <div id="status-line" style="font-size:12px;color:#94a3b8;letter-spacing:1px">Active</div>
        <div id="bridge-badge" style="display:none;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:8px 16px;font-size:12px;color:#94a3b8"></div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          <button id="mute-btn" style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;font-size:20px" title="Mute">🎙</button>
          <button id="hold-btn" style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;font-size:20px" title="Hold">⏸</button>
          <button id="end-btn" style="width:56px;height:56px;border-radius:50%;background:#ef4444;border:none;color:#fff;cursor:pointer;font-size:22px" title="End Call">📵</button>
        </div>
        <textarea id="notes-area" placeholder="Call notes…" rows="4" style="width:100%;max-width:440px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px 14px;color:#f1f5f9;font-size:13px;resize:vertical;outline:none;line-height:1.6"></textarea>
      </div>
      <script>
        var sec = ${startElapsed};
        var timerRunning = true;
        var timerInterval = setInterval(function() {
          if (timerRunning) {
            sec++;
            var el = document.getElementById('timer');
            if (el) el.textContent = ('0'+Math.floor(sec/60)).slice(-2)+':'+('0'+(sec%60)).slice(-2);
          }
        }, 1000);

        // Receive state updates from parent
        window.addEventListener('message', function(e) {
          if (!e.data || e.data.type !== 'call-state') return;
          var d = e.data;
          var statusEl = document.getElementById('status-line');
          var muteBtn = document.getElementById('mute-btn');
          var holdBtn = document.getElementById('hold-btn');
          var bridgeBadge = document.getElementById('bridge-badge');
          var notesArea = document.getElementById('notes-area');

          if (statusEl) {
            statusEl.textContent = d.status === 'on_hold' ? 'On Hold' : d.status === 'active' ? 'Active' : d.status;
            statusEl.style.color = d.status === 'on_hold' ? '#f59e0b' : '#94a3b8';
          }
          timerRunning = d.status === 'active' && !d.held;
          if (muteBtn) { muteBtn.textContent = d.muted ? '🔇' : '🎙'; muteBtn.style.borderColor = d.muted ? '#f59e0b' : 'rgba(255,255,255,0.12)'; }
          if (holdBtn) { holdBtn.textContent = d.held ? '▶' : '⏸'; holdBtn.style.borderColor = d.held ? '#3b82f6' : 'rgba(255,255,255,0.12)'; }
          if (bridgeBadge && d.bridgedTo) { bridgeBadge.style.display = 'block'; bridgeBadge.textContent = '👥 Bridged · ' + d.bridgedTo.name + (d.bridgedTo.phone ? ' · ' + d.bridgedTo.phone : ''); }
          if (notesArea && document.activeElement !== notesArea) notesArea.value = d.notes || '';
        });

        document.getElementById('mute-btn').onclick = function() { window.opener.postMessage({type:'call-action',action:'mute'}, '*'); };
        document.getElementById('hold-btn').onclick = function() { window.opener.postMessage({type:'call-action',action:'hold'}, '*'); };
        document.getElementById('end-btn').onclick  = function() { window.opener.postMessage({type:'call-action',action:'end'},  '*'); };
        // Use oninput for real-time note sync so notes aren't lost if End is
        // clicked without blurring the textarea first.
        document.getElementById('notes-area').oninput = function() {
          window.opener.postMessage({type:'call-action',action:'notes',notes:this.value}, '*');
        };
      </script>
    </body></html>`);
    w.document.close();
  };

  const closePopOut = () => {
    if (popWinRef.current && !popWinRef.current.closed) popWinRef.current.close();
    setPopOut(false);
  };

  const statusColor = status === 'active' ? '#10b981' : status === 'on_hold' ? '#f59e0b' : status === 'dialing' ? '#3b82f6' : '#ef4444';
  const statusLabel = status === 'dialing' ? 'Connecting…' : status === 'active' ? 'Active' : status === 'on_hold' ? 'On hold' : 'Call ended';

  const footerMsg = saving
    ? 'Saving…'
    : status === 'ended'
      ? saveError ? '⚠ Save failed — check connection' : '✓ Call saved'
      : 'Call in progress';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#0f172a', borderRadius: 24, width: '100%', maxWidth: 460,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden', color: '#f1f5f9',
      }}>

        {/* ── header bar ────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`, flexShrink: 0,
            animation: status === 'dialing' ? 'pulse-ring 1.2s ease infinite' : 'none',
          }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{statusLabel}</span>
          <button
            onClick={popOut ? closePopOut : openPopOut}
            title={popOut ? 'Bring back' : 'Pop out to new window'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'flex' }}
          >
            <SafeIcon icon={popOut ? FiMinimize2 : FiMaximize2} size={14} />
          </button>
          <button
            onClick={status !== 'ended' ? endCall : onClose}
            title="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'flex' }}
          >
            <SafeIcon icon={FiX} size={14} />
          </button>
        </div>

        {/* ── client avatar + info ───────────────────────────────── */}
        <div style={{ padding: '28px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: client?.avatar_url ? 'transparent' : avatarColor(client?.name),
            overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: status === 'active'
              ? '0 0 0 8px rgba(16,185,129,0.12), 0 0 0 18px rgba(16,185,129,0.06)'
              : 'none',
            transition: 'box-shadow 0.5s',
          }}>
            {client?.avatar_url
              ? <img src={client.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(client?.name)}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 3 }}>{client?.name || 'Unknown client'}</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {client?.phone || client?.mobile || 'No phone on file'}
              {client?.crn && (
                <span style={{ marginLeft: 10, fontSize: 11, color: '#475569', background: '#1e293b', padding: '2px 7px', borderRadius: 6 }}>
                  #{client.crn}
                </span>
              )}
            </div>
            {careTeam && <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{careTeam}</div>}
          </div>

          <div style={{
            fontSize: 44, fontWeight: 900, letterSpacing: 3,
            fontVariantNumeric: 'tabular-nums',
            color: statusColor, transition: 'color 0.4s', marginTop: 4,
          }}>
            {status === 'dialing'
              ? <span style={{ fontSize: 20, letterSpacing: 1, fontWeight: 600 }}>Ringing…</span>
              : fmtDuration(elapsed)}
          </div>
        </div>

        {/* ── bridge badge ──────────────────────────────────────── */}
        {bridgedTo && (
          <div style={{ margin: '0 24px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
            <SafeIcon icon={FiUsers} size={13} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>Bridged · <strong style={{ color: '#f1f5f9' }}>{bridgedTo.name}</strong>{bridgedTo.phone && ` · ${bridgedTo.phone}`}</span>
          </div>
        )}

        {/* ── controls ──────────────────────────────────────────── */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center' }}>
          <CtrlBtn
            icon={muted ? FiMicOff : FiMic}
            label={muted ? 'Unmute' : 'Mute'}
            active={muted} color="#f59e0b"
            onClick={() => setMuted(v => !v)}
            disabled={status === 'ended' || status === 'dialing'}
          />
          <CtrlBtn
            icon={held ? FiPlay : FiPause}
            label={held ? 'Resume' : 'Hold'}
            active={held} color="#3b82f6"
            onClick={() => {
              const newHeld = !held;
              setHeld(newHeld);
              setStatus(newHeld ? 'on_hold' : 'active');
            }}
            disabled={status === 'ended' || status === 'dialing'}
          />
          <CtrlBtn
            icon={FiPhoneOff} label="End Call"
            bg="#ef4444" textColor="#fff"
            onClick={endCall} disabled={status === 'ended'} large
          />
          <CtrlBtn
            icon={FiUsers} label="Bridge"
            active={bridgeOpen} color="#8b5cf6"
            onClick={() => setBridgeOpen(v => !v)}
            disabled={status === 'ended' || status === 'dialing'}
          />
          <CtrlBtn
            icon={notesOpen ? FiChevronDown : FiEdit3}
            label="Notes" active={notesOpen} color="#06b6d4"
            onClick={() => setNotesOpen(v => !v)}
          />
        </div>

        {/* ── bridge panel ──────────────────────────────────────── */}
        {bridgeOpen && (
          <div style={{ margin: '0 16px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <SafeIcon icon={FiUserPlus} size={14} style={{ color: '#8b5cf6' }} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Bridge a third party</span>
              <button onClick={() => setBridgeOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                <SafeIcon icon={FiX} size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={bridgeName} onChange={e => setBridgeName(e.target.value)} placeholder="Name (e.g. Specialist, Family member)" style={inputStyle} />
              <input value={bridgePhone} onChange={e => setBridgePhone(e.target.value)} placeholder="Phone number (optional)" style={inputStyle} />
              <button
                onClick={handleBridge}
                disabled={!bridgeName.trim()}
                style={{ height: 38, border: 'none', borderRadius: 10, cursor: bridgeName.trim() ? 'pointer' : 'not-allowed', background: bridgeName.trim() ? '#8b5cf6' : '#334155', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: bridgeName.trim() ? 1 : 0.5 }}
              >
                <SafeIcon icon={FiLink} size={13} />Add to Call
              </button>
            </div>
          </div>
        )}

        {/* ── notes panel ───────────────────────────────────────── */}
        {notesOpen && (
          <div style={{ margin: '0 16px 16px' }}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes for this call (auto-saved on end)…"
              rows={4}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.6, paddingTop: 10, paddingBottom: 10 }}
            />
          </div>
        )}

        {/* ── footer ────────────────────────────────────────────── */}
        <div style={{
          padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 11,
        }}>
          <span style={{ color: saveError ? '#ef4444' : '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
            {saveError && <SafeIcon icon={FiAlertCircle} size={11} />}
            {footerMsg}
          </span>
          {status === 'ended' && (
            <button onClick={onClose} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Dismiss
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%', height: 38, padding: '0 12px',
  background: '#0f172a', border: '1px solid #334155',
  borderRadius: 10, color: '#f1f5f9', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};

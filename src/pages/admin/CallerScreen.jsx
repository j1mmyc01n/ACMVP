/**
 * CallerScreen — active call overlay for the CRM.
 *
 * Features:
 *  - Dial animation → Active timer
 *  - Mute / Hold / End Call controls
 *  - Call Bridge panel (conference a third party in)
 *  - Notes field (saved to Supabase on end)
 *  - Maximize: pops the call out to a new browser window so the agent
 *    can see both the caller and the client profile at the same time.
 *  - All calls persisted to call_logs_1777090000
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const {
  FiPhone, FiPhoneOff, FiPhoneMissed, FiPhoneCall,
  FiMic, FiMicOff, FiPause, FiPlay,
  FiUsers, FiUserPlus, FiX, FiMaximize2, FiMinimize2,
  FiMessageSquare, FiEdit3, FiCheck, FiLink, FiChevronDown,
  FiChevronUp,
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

// ─── pop-out window content (rendered when maximized) ────────────────────────

function PopOutContent({ client, elapsed, status, muted, held, notes, onNoteChange, onEnd, onMute, onHold, bridgedTo }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', color: '#f1f5f9',
      fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, gap: 24,
    }}>
      <div style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b' }}>
        Active Call
      </div>

      {/* avatar */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: client?.avatar_url ? 'transparent' : avatarColor(client?.name),
        overflow: 'hidden', border: '3px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 38, fontWeight: 800, color: '#fff',
        boxShadow: status === 'active' ? '0 0 0 8px rgba(16,185,129,0.15), 0 0 0 20px rgba(16,185,129,0.07)' : 'none',
        transition: 'box-shadow 0.5s',
      }}>
        {client?.avatar_url
          ? <img src={client.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials(client?.name)}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{client?.name || 'Unknown'}</div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
          {client?.phone || client?.mobile || 'No phone on file'}
          {client?.crn && <span style={{ marginLeft: 12, fontSize: 11, color: '#64748b' }}>#{client.crn}</span>}
        </div>
      </div>

      <div style={{
        fontSize: 42, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
        color: status === 'active' ? '#10b981' : status === 'on_hold' ? '#f59e0b' : '#94a3b8',
        letterSpacing: 2,
      }}>
        {status === 'dialing' ? 'Calling…' : fmtDuration(elapsed)}
      </div>

      {bridgedTo && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '10px 18px', fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafeIcon icon={FiUsers} size={14} style={{ color: '#10b981' }} />
          Bridged · {bridgedTo.name}{bridgedTo.phone ? ` · ${bridgedTo.phone}` : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <CtrlBtn icon={muted ? FiMicOff : FiMic} label={muted ? 'Unmute' : 'Mute'} active={muted} onClick={onMute} color="#f59e0b" />
        <CtrlBtn icon={held ? FiPlay : FiPause} label={held ? 'Resume' : 'Hold'} active={held} onClick={onHold} color="#3b82f6" />
        <CtrlBtn icon={FiPhoneOff} label="End Call" onClick={onEnd} color="#ef4444" bg="#ef4444" textColor="#fff" large />
      </div>

      <textarea
        value={notes}
        onChange={e => onNoteChange(e.target.value)}
        placeholder="Call notes (saved on end)…"
        rows={4}
        style={{
          width: '100%', maxWidth: 480, background: '#1e293b', border: '1px solid #334155',
          borderRadius: 12, padding: '12px 14px', color: '#f1f5f9', fontSize: 13,
          resize: 'vertical', outline: 'none', lineHeight: 1.6,
        }}
      />
    </div>
  );
}

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
  const [bridgedTo, setBridgedTo] = useState(null);  // {name, phone} once bridged
  const [notesOpen, setNotesOpen] = useState(false);
  const [popOut, setPopOut] = useState(false);
  const [saving, setSaving] = useState(false);

  const startedAt = useRef(new Date());
  const timerRef = useRef(null);
  const popWinRef = useRef(null);
  const logIdRef = useRef(null);

  // ── connect → active after 2s dial simulation ─────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setStatus('active'), 2000);
    return () => clearTimeout(t);
  }, []);

  // ── insert initial call log row ───────────────────────────────────────────
  useEffect(() => {
    const insert = async () => {
      const { data } = await supabase
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
        .single();
      if (data?.id) logIdRef.current = data.id;
    };
    insert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'active' && !held) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, held]);

  // ── sync notes/status to pop-out window ──────────────────────────────────
  useEffect(() => {
    if (popWinRef.current && !popWinRef.current.closed) {
      try {
        popWinRef.current.postMessage({ type: 'call-state', status, elapsed, muted, held, notes, bridgedTo }, '*');
      } catch {}
    }
  }, [status, elapsed, muted, held, notes, bridgedTo]);

  const endCall = useCallback(async () => {
    if (status === 'ended') return;
    setStatus('ended');
    clearInterval(timerRef.current);
    setSaving(true);

    const endedAt = new Date();
    const duration = Math.round((endedAt - startedAt.current) / 1000);

    if (logIdRef.current) {
      await supabase
        .from('call_logs_1777090000')
        .update({
          status: bridgedTo ? 'bridged' : 'ended',
          ended_at: endedAt.toISOString(),
          duration_seconds: duration,
          notes: notes || null,
          bridged_to_name: bridgedTo?.name || null,
          bridged_to_phone: bridgedTo?.phone || null,
        })
        .eq('id', logIdRef.current);
    }
    setSaving(false);

    if (popWinRef.current && !popWinRef.current.closed) {
      popWinRef.current.close();
    }

    setTimeout(() => onClose?.(), 800);
  }, [status, notes, bridgedTo, onClose]);

  const handleBridge = () => {
    if (!bridgeName.trim()) return;
    setBridgedTo({ name: bridgeName.trim(), phone: bridgePhone.trim() });
    setBridgeOpen(false);
    setBridgeName('');
    setBridgePhone('');
    setStatus('active');
  };

  const openPopOut = () => {
    const w = window.open('', '_blank', 'width=520,height=720,resizable=yes,menubar=no,toolbar=no,location=no');
    if (!w) return;
    popWinRef.current = w;
    setPopOut(true);

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Call — ${client?.name || 'Client'}</title>
      <meta charset="utf-8"/>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f172a;font-family:system-ui,-apple-system,sans-serif;color:#f1f5f9}</style>
    </head><body><div id="root"></div></body></html>`);
    w.document.close();

    w.addEventListener('message', (e) => {
      if (e.data?.type === 'call-action') {
        const { action } = e.data;
        if (action === 'mute') setMuted(v => !v);
        if (action === 'hold') { setHeld(v => !v); setStatus(s => s === 'on_hold' ? 'active' : 'on_hold'); }
        if (action === 'end') endCall();
        if (action === 'notes') setNotes(e.data.notes ?? notes);
      }
    });

    // write a simple static HTML into the pop-out (no React re-render)
    const render = () => {
      if (!w || w.closed) return;
      const el = w.document.getElementById('root');
      if (!el) return;
      el.innerHTML = `
        <div style="min-height:100vh;background:#0f172a;color:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;gap:24px;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#64748b">Active Call</div>
          <div style="width:90px;height:90px;border-radius:50%;background:${avatarColor(client?.name)};display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;color:#fff;border:3px solid rgba(255,255,255,0.15)">
            ${initials(client?.name)}
          </div>
          <div style="text-align:center">
            <div style="font-size:26px;font-weight:800">${client?.name || 'Unknown'}</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:4px">${client?.phone || client?.mobile || 'No phone on file'}</div>
          </div>
          <div id="timer" style="font-size:40px;font-weight:900;letter-spacing:2px;color:#10b981">Calling…</div>
          <div id="bridge-badge" style="display:none;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:8px 16px;font-size:12px;color:#94a3b8">
            👥 Bridged · ${bridgedTo ? `${bridgedTo.name}${bridgedTo.phone ? ' · ' + bridgedTo.phone : ''}` : ''}
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
            <button id="mute-btn" onclick="window.opener.postMessage({type:'call-action',action:'mute'},'*')" style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;font-size:20px">🎙</button>
            <button id="hold-btn" onclick="window.opener.postMessage({type:'call-action',action:'hold'},'*')" style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;font-size:20px">⏸</button>
            <button onclick="window.opener.postMessage({type:'call-action',action:'end'},'*')" style="width:56px;height:56px;border-radius:50%;background:#ef4444;border:none;color:#fff;cursor:pointer;font-size:22px">📵</button>
          </div>
          <textarea id="notes-area" placeholder="Call notes…" rows="4" onchange="window.opener.postMessage({type:'call-action',action:'notes',notes:this.value},'*')" style="width:100%;max-width:440px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px 14px;color:#f1f5f9;font-size:13px;resize:vertical;outline:none;line-height:1.6"></textarea>
        </div>`;

      let sec = 0;
      setInterval(() => {
        sec++;
        const el2 = w.document.getElementById('timer');
        if (el2) el2.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      }, 1000);

      if (bridgedTo) {
        const bb = w.document.getElementById('bridge-badge');
        if (bb) bb.style.display = 'block';
      }
    };
    setTimeout(render, 100);
  };

  const closePopOut = () => {
    if (popWinRef.current && !popWinRef.current.closed) popWinRef.current.close();
    setPopOut(false);
  };

  // ── status color ──────────────────────────────────────────────────────────
  const statusColor = status === 'active' ? '#10b981' : status === 'on_hold' ? '#f59e0b' : status === 'dialing' ? '#3b82f6' : '#ef4444';
  const statusLabel = status === 'dialing' ? 'Connecting…' : status === 'active' ? 'Active' : status === 'on_hold' ? 'On hold' : 'Call ended';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#0f172a', borderRadius: 24, width: '100%', maxWidth: 460,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
        color: '#f1f5f9',
      }}>

        {/* ── header bar ─────────────────────────────────────────── */}
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

        {/* ── client avatar + info ────────────────────────────────── */}
        <div style={{ padding: '28px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: client?.avatar_url ? 'transparent' : avatarColor(client?.name),
            overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: status === 'active'
              ? `0 0 0 8px rgba(16,185,129,0.12), 0 0 0 18px rgba(16,185,129,0.06)`
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
            {careTeam && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{careTeam}</div>
            )}
          </div>

          {/* timer */}
          <div style={{
            fontSize: 44, fontWeight: 900, letterSpacing: 3,
            fontVariantNumeric: 'tabular-nums',
            color: statusColor, transition: 'color 0.4s',
            marginTop: 4,
          }}>
            {status === 'dialing' ? (
              <span style={{ fontSize: 20, letterSpacing: 1, fontWeight: 600 }}>Ringing…</span>
            ) : fmtDuration(elapsed)}
          </div>
        </div>

        {/* ── bridge badge (when bridged) ─────────────────────────── */}
        {bridgedTo && (
          <div style={{ margin: '0 24px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
            <SafeIcon icon={FiUsers} size={13} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>Bridged · <strong style={{ color: '#f1f5f9' }}>{bridgedTo.name}</strong>{bridgedTo.phone && ` · ${bridgedTo.phone}`}</span>
          </div>
        )}

        {/* ── controls ────────────────────────────────────────────── */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center' }}>
          <CtrlBtn
            icon={muted ? FiMicOff : FiMic}
            label={muted ? 'Unmute' : 'Mute'}
            active={muted}
            color="#f59e0b"
            onClick={() => setMuted(v => !v)}
            disabled={status === 'ended' || status === 'dialing'}
          />
          <CtrlBtn
            icon={held ? FiPlay : FiPause}
            label={held ? 'Resume' : 'Hold'}
            active={held}
            color="#3b82f6"
            onClick={() => {
              const newHeld = !held;
              setHeld(newHeld);
              setStatus(newHeld ? 'on_hold' : 'active');
            }}
            disabled={status === 'ended' || status === 'dialing'}
          />
          <CtrlBtn
            icon={FiPhoneOff}
            label="End Call"
            bg="#ef4444"
            textColor="#fff"
            onClick={endCall}
            disabled={status === 'ended'}
            large
          />
          <CtrlBtn
            icon={FiUsers}
            label="Bridge"
            active={bridgeOpen}
            color="#8b5cf6"
            onClick={() => setBridgeOpen(v => !v)}
            disabled={status === 'ended' || status === 'dialing'}
          />
          <CtrlBtn
            icon={notesOpen ? FiChevronDown : FiEdit3}
            label="Notes"
            active={notesOpen}
            color="#06b6d4"
            onClick={() => setNotesOpen(v => !v)}
          />
        </div>

        {/* ── bridge panel ─────────────────────────────────────────── */}
        {bridgeOpen && (
          <div style={{
            margin: '0 16px 16px', background: '#1e293b',
            border: '1px solid #334155', borderRadius: 16, padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <SafeIcon icon={FiUserPlus} size={14} style={{ color: '#8b5cf6' }} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Bridge a third party</span>
              <button onClick={() => setBridgeOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                <SafeIcon icon={FiX} size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={bridgeName}
                onChange={e => setBridgeName(e.target.value)}
                placeholder="Name (e.g. Specialist, Family member)"
                style={inputStyle}
              />
              <input
                value={bridgePhone}
                onChange={e => setBridgePhone(e.target.value)}
                placeholder="Phone number (optional)"
                style={inputStyle}
              />
              <button
                onClick={handleBridge}
                disabled={!bridgeName.trim()}
                style={{
                  height: 38, border: 'none', borderRadius: 10, cursor: bridgeName.trim() ? 'pointer' : 'not-allowed',
                  background: bridgeName.trim() ? '#8b5cf6' : '#334155',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  opacity: bridgeName.trim() ? 1 : 0.5,
                }}
              >
                <SafeIcon icon={FiLink} size={13} />
                Add to Call
              </button>
            </div>
          </div>
        )}

        {/* ── notes panel ──────────────────────────────────────────── */}
        {notesOpen && (
          <div style={{ margin: '0 16px 16px' }}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes for this call (auto-saved on end)…"
              rows={4}
              style={{
                ...inputStyle,
                width: '100%', resize: 'vertical', lineHeight: 1.6, paddingTop: 10, paddingBottom: 10,
              }}
            />
          </div>
        )}

        {/* ── footer ───────────────────────────────────────────────── */}
        <div style={{
          padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 11, color: '#475569',
        }}>
          <span>{saving ? 'Saving…' : status === 'ended' ? '✓ Call saved' : 'Call in progress'}</span>
          {status === 'ended' && (
            <button
              onClick={onClose}
              style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
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

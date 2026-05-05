import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { escalationBand } from './PatientCard';

const {
  FiX, FiPhone, FiFileText, FiClock, FiActivity, FiZap,
  FiCheckCircle, FiAlertCircle, FiUser, FiMapPin, FiMail,
  FiCalendar, FiHeart, FiEdit2, FiMessageSquare,
} = FiIcons;

const TABS = [
  { id: 'overview',  label: 'Overview',       icon: FiUser },
  { id: 'clinical',  label: 'Clinical Notes', icon: FiFileText },
  { id: 'calls',     label: 'Call History',   icon: FiPhone },
  { id: 'ai',        label: 'AI Insights',    icon: FiZap },
];

function StatBadge({ label, value, color = '#4F46E5', bg = '#EEF2FF' }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 12, padding: '10px 14px', textAlign: 'center', minWidth: 80 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function CallRow({ log }) {
  const statusColor = log.status === 'completed' ? '#10B981' : log.status === 'missed' ? '#EF4444' : '#F59E0B';
  const dt = log.created_at ? new Date(log.created_at) : null;
  const dur = log.duration_seconds ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s` : '—';
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>{log.status || 'unknown'}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
          {dt ? dt.toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'} · {dur}
        </div>
        {log.notes && <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>{log.notes}</div>}
      </div>
    </div>
  );
}

function NoteRow({ note }) {
  const dt = note.created_at ? new Date(note.created_at) : null;
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, display: 'flex', gap: 8 }}>
        <span>{dt ? dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
        {note.author && <span>· {note.author}</span>}
      </div>
      <div style={{ fontSize: 12, color: '#0F172A', lineHeight: 1.6 }}>{note.note || note.notes || note.content || ''}</div>
    </div>
  );
}

export default function PatientDrawer({ patient, onClose, onCall }) {
  const [tab, setTab] = useState('overview');
  const [callLogs, setCallLogs] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);

  const band = escalationBand(patient?.escalation_score ?? 0);
  const aiPct = Math.round((patient?.ai_probability ?? 0) * 100);
  const callCount = callLogs.length;

  const fetchData = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    const [logsRes, checkRes] = await Promise.all([
      supabase.from('call_logs_1777090000').select('*').eq('client_id', patient.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('check_ins_1740395000').select('*').eq('client_id', patient.id).order('created_at', { ascending: false }).limit(30),
    ]);
    setCallLogs(logsRes.data || []);
    setCheckIns(checkRes.data || []);
    setLoading(false);
  }, [patient?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!patient) return null;

  const name = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown';

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 490, backdropFilter: 'blur(3px)' }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 520,
        background: '#fff', zIndex: 491, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.16)',
      }}>
        {/* header */}
        <div style={{ padding: '20px 22px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: band.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{name}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{patient.concern || 'General Support'}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: '#F1F5F9', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
              <SafeIcon icon={FiX} size={15} />
            </button>
          </div>

          {/* stat badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <StatBadge label="Risk Score" value={patient.escalation_score ?? 0} color={band.color} bg={band.bg} />
            <StatBadge label="AI Prob." value={`${aiPct}%`} color="#4F46E5" bg="#EEF2FF" />
            <StatBadge label="Calls" value={callCount} color="#0284C7" bg="#E0F2FE" />
            <StatBadge label="Status" value={band.label} color={band.color} bg={band.bg} />
          </div>

          {/* call button */}
          <button
            onClick={() => onCall && onCall(patient)}
            style={{ width: '100%', height: 38, border: 'none', borderRadius: 10, background: band.color, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <SafeIcon icon={FiPhone} size={14} />Call Now
          </button>

          {/* tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, height: 36, border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, color: tab === t.id ? band.color : '#94A3B8',
                borderBottom: `2px solid ${tab === t.id ? band.color : 'transparent'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s',
              }}>
                <SafeIcon icon={t.icon} size={12} />{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>
          {loading && <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Loading…</div>}

          {!loading && tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: FiMail, label: 'Email', value: patient.email },
                { icon: FiPhone, label: 'Phone', value: patient.phone || patient.mobile },
                { icon: FiMapPin, label: 'Location', value: patient.location || patient.suburb },
                { icon: FiCalendar, label: 'Joined', value: patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-AU') : null },
                { icon: FiCalendar, label: 'Next Appointment', value: patient.next_appt ? new Date(patient.next_appt).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null },
                { icon: FiHeart, label: 'Support Category', value: patient.concern },
                { icon: FiActivity, label: 'Stage', value: patient.stage },
              ].filter(r => r.value).map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                  <SafeIcon icon={row.icon} size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{row.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{row.value}</div>
                  </div>
                </div>
              ))}

              {checkIns.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Recent Check-ins</div>
                  {checkIns.slice(0, 5).map((ci, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>Mood: {ci.mood}/10</span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{ci.created_at ? new Date(ci.created_at).toLocaleDateString('en-AU') : ''}</span>
                      </div>
                      {ci.notes && <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>{ci.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && tab === 'clinical' && (
            <div>
              {checkIns.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>No clinical notes.</div>
              ) : (
                checkIns.map((n, i) => <NoteRow key={i} note={n} />)
              )}
            </div>
          )}

          {!loading && tab === 'calls' && (
            <div>
              {callLogs.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>No call history.</div>
              ) : (
                callLogs.map((log, i) => <CallRow key={i} log={log} />)
              )}
            </div>
          )}

          {!loading && tab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: band.bg, borderRadius: 14, padding: 16, border: `1px solid ${band.color}33` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: band.color, marginBottom: 6 }}>Risk Assessment</div>
                <div style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.6 }}>
                  This patient has a risk score of <strong>{patient.escalation_score}</strong> ({band.label}) with an AI-calculated escalation probability of <strong>{aiPct}%</strong>.
                  {patient.escalation_score > 50 && ' Prioritise outreach and consider scheduling an urgent check-in.'}
                  {patient.escalation_score <= 25 && ' Patient appears stable. Continue regular monitoring schedule.'}
                </div>
              </div>
              <div style={{ background: '#F0FDF4', borderRadius: 14, padding: 16, border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', marginBottom: 6 }}>Recommendations</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#0F172A', lineHeight: 1.8 }}>
                  {patient.escalation_score > 75 && <li>Immediate welfare check recommended.</li>}
                  {patient.escalation_score > 50 && <li>Schedule follow-up call within 24 hours.</li>}
                  <li>Review last {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''} for mood trends.</li>
                  {callLogs.length === 0 && <li>No previous calls — initiate first outreach.</li>}
                  <li>Update support category if circumstances have changed.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

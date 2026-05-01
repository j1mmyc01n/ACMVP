import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Badge, Button, Field, Input, Select, Textarea, StatusBadge } from '../../components/UI';

const {
  FiX, FiSave, FiUser, FiFileText, FiUsers, FiShield,
  FiAlertCircle, FiClock, FiPlusCircle, FiChevronDown,
  FiChevronUp, FiEdit2, FiActivity, FiMapPin, FiPhone, FiMail, FiKey, FiZap
} = FiIcons;

const TABS = [
  { id: 'details', label: 'Details', icon: FiUser },
  { id: 'notes', label: 'Notes & Reports', icon: FiFileText },
  { id: 'team', label: 'Team & Emergency', icon: FiUsers },
  { id: 'log', label: 'Event Log', icon: FiClock },
];

const MoodDot = ({ val }) => {
  const color = val <= 3 ? 'var(--ac-danger)' : val <= 6 ? 'var(--ac-warn)' : 'var(--ac-success)';
  return (
    <div title={`Mood: ${val}/10`} style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
  );
};

const MoodTrend = ({ reports }) => {
  if (!reports || reports.length === 0) return <span style={{ fontSize: 11, color: 'var(--ac-muted)' }}>No mood data</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {reports.slice(0, 10).map((r, i) => <MoodDot key={i} val={r.mood || 5} />)}
      <span style={{ fontSize: 11, color: 'var(--ac-muted)', marginLeft: 4 }}>last {Math.min(reports.length, 10)} visits</span>
    </div>
  );
};

const EventLog = ({ events }) => (
  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
    {events.length === 0
      ? <div style={{ color: 'var(--ac-muted)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 20 }}>No events recorded yet.</div>
      : events.map((ev, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4F46E5', marginTop: 5, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.summary}</div>
            <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
              <span>👤 {ev.who}</span>
              <span>🕐 {ev.time}</span>
            </div>
          </div>
        </div>
      ))
    }
  </div>
);

export default function ClientProfileCard({ client, onClose, onSaved, currentUserRole, currentUserCareTeam }) {
  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || client.mobile || '',
    support_category: client.support_category || 'general',
    care_centre: client.care_centre || '',
    notes: client.notes || '',
    otp_enabled: client.otp_enabled || false,
  });
  const [assignedTeam, setAssignedTeam] = useState(client.assigned_team || []);
  const [emergencyServices, setEmergencyServices] = useState(
    client.emergency_services || { police: '', ambulance: '', hospital: '' }
  );
  const [failoverCentre, setFailoverCentre] = useState(client.failover_centre || '');
  const [clinicalReports, setClinicalReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [centres, setCentres] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState('');
  const [newReport, setNewReport] = useState('');

  const hasAccess = currentUserRole === 'sysadmin' ||
    (currentUserRole === 'admin' && (
      !client.care_centre ||
      currentUserCareTeam === client.care_centre ||
      (assignedTeam || []).includes(currentUserCareTeam)
    ));

  useEffect(() => {
    supabase.from('care_centres_1777090000').select('*').order('name')
      .then(({ data }) => setCentres(data || []));
    supabase.from('check_ins_1740395000').select('*')
      .eq('crn', client.crn).order('created_at', { ascending: false })
      .then(({ data }) => setClinicalReports(data || []));
    // Log profile view — fire-and-forget, silently skipped if event_log column absent
    const accessEvent = { summary: 'Profile viewed', who: currentUserRole || 'Admin', time: new Date().toLocaleString() };
    setEvents([accessEvent]);
    supabase.from('clients_1777020684735')
      .update({ event_log: [accessEvent] })
      .eq('id', client.id)
      .then(() => {});
  }, [client.id, client.crn, currentUserRole]);

  const logEvent = (summary) => {
    const ev = { summary, who: currentUserRole || 'Admin', time: new Date().toLocaleString() };
    setEvents(prev => [ev, ...prev]);
  };

  const addTeamMember = () => {
    if (!newTeamMember.trim()) return;
    setAssignedTeam(prev => [...prev, newTeamMember.trim()]);
    logEvent(`Team member added: ${newTeamMember.trim()}`);
    setNewTeamMember('');
  };

  const removeTeamMember = (m) => {
    setAssignedTeam(prev => prev.filter(x => x !== m));
    logEvent(`Team member removed: ${m}`);
  };

  const addReport = () => {
    if (!newReport.trim()) return;
    logEvent(`Clinical report attached: "${newReport.trim()}"`);
    setNewReport('');
  };

  const handleSave = async () => {
    if (!hasAccess) return;
    setSaving(true);
    const { error } = await supabase.from('clients_1777020684735').update({
      name: form.name, email: form.email, phone: form.phone,
      support_category: form.support_category,
      care_centre: form.care_centre || null,
      notes: form.notes,
      otp_enabled: form.otp_enabled,
      assigned_team: assignedTeam,
      emergency_services: emergencyServices,
      failover_centre: failoverCentre || null,
    }).eq('id', client.id);
    setSaving(false);
    if (!error) { onSaved?.('Profile saved successfully.'); onClose(); }
    else alert(error.message);
  };

  const centreOptions = [
    { value: '', label: '— No Centre —' },
    ...centres.map(c => ({ value: c.name, label: c.name }))
  ];
  const categories = ['general', 'crisis', 'mental_health', 'substance_abuse', 'housing']
    .map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));

  if (!hasAccess) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16, backdropFilter: 'blur(6px)' }}>
        <div style={{ background: 'var(--ac-surface)', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <SafeIcon icon={FiShield} size={40} style={{ color: 'var(--ac-danger)', marginBottom: 16 }} />
          <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Access Restricted</h2>
          <p style={{ color: 'var(--ac-muted)', fontSize: 13, marginBottom: 20 }}>You must be assigned to this client's care team to view their profile.</p>
          <Button onClick={onClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, width: '100%', maxWidth: 760, boxShadow: 'var(--ac-shadow-lg)', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header — indigo gradient matching CRM brand */}
        <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: '20px 22px', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Colored avatar matching CRM row style */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
            }}>
              {(client.name || '').trim().split(/\s+/).filter(w => w).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: -0.3 }}>{client.name}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(255,255,255,0.22)', color: '#fff', padding: '3px 9px', borderRadius: 7, fontWeight: 600 }}>{client.crn}</span>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.22)', color: '#fff', padding: '3px 9px', borderRadius: 7, fontWeight: 600, textTransform: 'capitalize' }}>{client.status || 'active'}</span>
                {client.care_centre && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '3px 9px', borderRadius: 7 }}>📍 {client.care_centre}</span>}
              </div>
              <div style={{ marginTop: 8 }}>
                <MoodTrend reports={clinicalReports} />
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SafeIcon icon={FiX} size={16} />
            </button>
          </div>
        </div>

        {/* Tabs — matching CRM underline tab style */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-surface)', flexShrink: 0, padding: '0 8px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === t.id ? '2px solid #4F46E5' : '2px solid transparent',
              color: activeTab === t.id ? '#4F46E5' : 'var(--ac-muted)',
              fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s',
              marginBottom: -1,
            }}>
              <SafeIcon icon={t.icon} size={13} />{t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ac-grid-2">
                <Field label="Full Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Support Category">
                  <Select value={form.support_category} onChange={e => setForm({ ...form, support_category: e.target.value })} options={categories} />
                </Field>
                <Field label="Email">
                  <div style={{ position: 'relative' }}>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: 36 }} />
                    <SafeIcon icon={FiMail} size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
                  </div>
                </Field>
                <Field label="Phone">
                  <div style={{ position: 'relative' }}>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ paddingLeft: 36 }} />
                    <SafeIcon icon={FiPhone} size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
                  </div>
                </Field>
                <Field label="Primary Care Centre">
                  <Select value={form.care_centre} onChange={e => setForm({ ...form, care_centre: e.target.value })} options={centreOptions} />
                </Field>
                <Field label="Failover Centre" hint="Used during staff shortages or system failures">
                  <Select value={failoverCentre} onChange={e => setFailoverCentre(e.target.value)} options={centreOptions} />
                </Field>
              </div>

              {/* OTP Access Toggle — admin/staff only */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: form.otp_enabled ? '#EEF2FF' : 'var(--ac-bg)', border: `1.5px solid ${form.otp_enabled ? '#A5B4FC' : 'var(--ac-border)'}`, borderRadius: 12, transition: 'all 0.15s' }}>
                <input
                  id="otp_enabled"
                  type="checkbox"
                  checked={form.otp_enabled}
                  onChange={e => { setForm({ ...form, otp_enabled: e.target.checked }); logEvent(e.target.checked ? 'OTP access enabled' : 'OTP access disabled'); }}
                  style={{ width: 18, height: 18, accentColor: '#4F46E5', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}
                />
                <label htmlFor="otp_enabled" style={{ cursor: 'pointer', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: form.otp_enabled ? '#4F46E5' : 'var(--ac-text)' }}>
                    <SafeIcon icon={FiKey} size={13} style={{ color: form.otp_enabled ? '#4F46E5' : 'var(--ac-muted)' }} />
                    Allow OTP Access
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 3 }}>
                    When enabled, this client can use OTP to log in and access resources. Only location admins and staff may change this setting.
                  </div>
                </label>
              </div>

              {/* Mark as Crisis */}
              {form.support_category !== 'crisis' ? (
                <button
                  onClick={() => { setForm({ ...form, support_category: 'crisis' }); logEvent('Status changed to Crisis'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', border: '1.5px solid #FECACA', background: '#FEF2F2', borderRadius: 12, cursor: 'pointer', textAlign: 'left' }}
                >
                  <SafeIcon icon={FiZap} size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Mark as Crisis</div>
                    <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 1 }}>Changes support category to Crisis and logs the event.</div>
                  </div>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: '1.5px solid #FECACA', background: '#FEF2F2', borderRadius: 12 }}>
                  <SafeIcon icon={FiZap} size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>⚠ Crisis Status Active</div>
                    <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 1 }}>This client is currently flagged as Crisis support.</div>
                  </div>
                  <button
                    onClick={() => { setForm({ ...form, support_category: 'general' }); logEvent('Crisis status cleared — set back to General'); }}
                    style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', border: '1px solid #FECACA', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: '#DC2626' }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NOTES & REPORTS TAB */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Clinical Notes">
                <Textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  onBlur={() => logEvent('Clinical notes updated')}
                  placeholder="Write clinical notes, observations, treatment plans, risk assessments..."
                  rows={6}
                />
              </Field>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Attach Report Reference</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input value={newReport} onChange={e => setNewReport(e.target.value)} placeholder="Report ID, title or reference..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addReport()} />
                  <Button onClick={addReport} icon={FiPlusCircle}>Attach</Button>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Check-In History ({clinicalReports.length})</div>
                {clinicalReports.length === 0
                  ? <div style={{ fontSize: 12, color: 'var(--ac-muted)', fontStyle: 'italic', padding: '16px 0' }}>No check-in records found for this CRN.</div>
                  : clinicalReports.slice(0, 8).map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--ac-bg)', border: '1px solid var(--ac-border)', borderRadius: 10, marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString()} — Mood {r.mood}/10</div>
                        {r.clinical_notes && <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 2 }}>{r.clinical_notes.slice(0, 90)}{r.clinical_notes.length > 90 ? '…' : ''}</div>}
                      </div>
                      <Badge tone={r.mood <= 3 ? 'red' : r.mood <= 6 ? 'amber' : 'green'}>{r.mood}/10</Badge>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* TEAM & EMERGENCY TAB */}
          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SafeIcon icon={FiUsers} size={14} style={{ color: '#4F46E5' }} /> Assigned Team Members
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <Input value={newTeamMember} onChange={e => setNewTeamMember(e.target.value)} placeholder="Name or email of staff member" style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addTeamMember()} />
                  <Button onClick={addTeamMember} icon={FiPlusCircle}>Add</Button>
                </div>
                {assignedTeam.length === 0
                  ? <div style={{ fontSize: 12, color: 'var(--ac-muted)', fontStyle: 'italic' }}>No team members assigned.</div>
                  : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {assignedTeam.map(m => (
                      <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '5px 12px', fontSize: 12 }}>
                        <SafeIcon icon={FiUser} size={11} style={{ color: '#4F46E5' }} />
                        <span style={{ color: '#4F46E5', fontWeight: 600 }}>{m}</span>
                        <button onClick={() => removeTeamMember(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                      </div>
                    ))}
                  </div>
                }
              </div>

              <div style={{ height: 1, background: 'var(--ac-border)' }} />

              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SafeIcon icon={FiAlertCircle} size={14} style={{ color: 'var(--ac-danger)' }} /> Police & Emergency Assignments
                </div>
                <div className="ac-grid-2" style={{ gap: 10 }}>
                  <Field label="Police Contact">
                    <Input value={emergencyServices.police} onChange={e => setEmergencyServices({ ...emergencyServices, police: e.target.value })} placeholder="e.g. Newtown Police" />
                  </Field>
                  <Field label="Ambulance Service">
                    <Input value={emergencyServices.ambulance} onChange={e => setEmergencyServices({ ...emergencyServices, ambulance: e.target.value })} placeholder="e.g. NSW Ambulance" />
                  </Field>
                  <Field label="Hospital" style={{ gridColumn: '1 / -1' }}>
                    <Input value={emergencyServices.hospital} onChange={e => setEmergencyServices({ ...emergencyServices, hospital: e.target.value })} placeholder="e.g. RPA Hospital" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* EVENT LOG TAB */}
          {activeTab === 'log' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <SafeIcon icon={FiActivity} size={14} style={{ color: '#4F46E5' }} />
                Event Log — {events.length} entries
              </div>
              <EventLog events={events} />
            </div>
          )}
        </div>

        {/* Footer — matching CRM button styles */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--ac-border)', display: 'flex', gap: 10, background: 'var(--ac-surface)', borderRadius: '0 0 20px 20px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, height: 42, border: '1.5px solid var(--ac-border)', background: 'transparent', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--ac-text)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, height: 42, border: 'none', background: '#4F46E5', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.3)', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <SafeIcon icon={FiSave} size={15} />{saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
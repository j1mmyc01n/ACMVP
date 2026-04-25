import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';
import { Card, Button, Badge } from '../../components/UI';

const { FiCalendar, FiHeart, FiFileText, FiPhone, FiLogOut, FiUser, FiMapPin, FiClock } = FiIcons;

const LIFELINE = '13 11 14';
const EMERGENCY = '000';

export default function ClientPortal({ account, goto }) {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('home');

  useEffect(() => {
    if (!account?.crn) { setLoading(false); return; }
    supabase
      .from('check_ins_1740395000')
      .select('*')
      .eq('crn', account.crn)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { setCheckIns(data || []); setLoading(false); });
  }, [account]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const avgMood = checkIns.length
    ? Math.round(checkIns.reduce((s, c) => s + (c.mood || 5), 0) / checkIns.length)
    : null;

  const moodEmoji = (m) => m <= 2 ? '😔' : m <= 4 ? '😟' : m <= 6 ? '😐' : m <= 8 ? '🙂' : '😄';
  const moodColor = (m) => m <= 3 ? '#FF3B30' : m <= 5 ? '#FF9500' : m <= 7 ? '#FFCC00' : '#34C759';

  const upcoming = checkIns.find(c => c.status === 'pending');

  return (
    <div className="ac-stack" style={{ paddingBottom: 100 }}>

      {/* Header card */}
      <div style={{ background: 'var(--ac-primary)', borderRadius: 20, padding: '24px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            👤
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              {account?.first_name ? `Hi, ${account.first_name}` : 'My Portal'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {account?.crn ? `CRN: ${account.crn}` : account?.email}
            </div>
          </div>
        </div>
        {upcoming && (
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 3 }}>UPCOMING APPOINTMENT</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {upcoming.scheduled_day} · {upcoming.scheduled_window}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Clinician will call you during this window</div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--ac-bg)', borderRadius: 12, padding: 4 }}>
        {[
          { id: 'home', label: 'Home', icon: FiHeart },
          { id: 'history', label: 'History', icon: FiCalendar },
          { id: 'resources', label: 'Support', icon: FiPhone },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '9px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', background: tab === t.id ? 'var(--ac-surface)' : 'transparent', color: tab === t.id ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: tab === t.id ? 700 : 400, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <SafeIcon icon={t.icon} size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* HOME TAB */}
      {tab === 'home' && (
        <div className="ac-stack">
          {avgMood !== null && (
            <Card title="Your Mood Trend">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                <div style={{ fontSize: 48 }}>{moodEmoji(avgMood)}</div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: moodColor(avgMood) }}>{avgMood}<span style={{ fontSize: 16, color: 'var(--ac-muted)', fontWeight: 400 }}>/10</span></div>
                  <div style={{ fontSize: 13, color: 'var(--ac-muted)' }}>Average across {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              {/* Simple mood bar chart */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48, marginTop: 12 }}>
                {checkIns.slice(0, 10).reverse().map((c, i) => (
                  <div key={i} style={{ flex: 1, background: moodColor(c.mood || 5), borderRadius: 4, height: `${((c.mood || 5) / 10) * 100}%`, opacity: 0.8 }} title={`Mood: ${c.mood}`} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 6 }}>Last {Math.min(checkIns.length, 10)} sessions — oldest to newest</div>
            </Card>
          )}

          <Card title="Quick Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button style={{ width: '100%' }} onClick={() => goto('checkin')}>
                📋 New Check-In
              </Button>
              <Button variant="outline" style={{ width: '100%' }} onClick={() => goto('resources')}>
                📚 Browse Resources
              </Button>
              <Button variant="outline" style={{ width: '100%' }} onClick={() => goto('professionals')}>
                👩‍⚕️ Find a Professional
              </Button>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Sign out</div>
                <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>You can sign back in with a magic link anytime</div>
              </div>
              <button onClick={handleSignOut}
                style={{ background: 'none', border: '1px solid var(--ac-border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--ac-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SafeIcon icon={FiLogOut} size={14} /> Sign out
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="ac-stack">
          <div style={{ fontSize: 17, fontWeight: 700 }}>Your Check-In History</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)' }}>Loading...</div>
          ) : checkIns.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No check-ins yet</div>
                <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 16 }}>Your check-in history will appear here</div>
                <Button onClick={() => goto('checkin')}>Start a Check-In</Button>
              </div>
            </Card>
          ) : (
            checkIns.map((c, i) => (
              <Card key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.scheduled_day} · {c.scheduled_window}</div>
                    <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>{new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 20 }}>{moodEmoji(c.mood || 5)}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: moodColor(c.mood || 5) }}>{c.mood || 5}</span>
                  </div>
                </div>
                {c.concerns && (
                  <div style={{ fontSize: 13, color: 'var(--ac-muted)', background: 'var(--ac-bg)', borderRadius: 8, padding: '8px 12px' }}>
                    {c.concerns}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <Badge tone={c.status === 'completed' ? 'green' : c.status === 'reviewed' ? 'blue' : 'amber'}>
                    {c.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* RESOURCES TAB */}
      {tab === 'resources' && (
        <div className="ac-stack">
          <div style={{ fontSize: 17, fontWeight: 700 }}>Support & Resources</div>

          {/* Crisis contacts */}
          <Card>
            <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 15 }}>🆘 Emergency Contacts</div>
            <a href={`tel:${EMERGENCY}`} style={{ display: 'block', background: '#FF3B30', color: '#fff', padding: '14px', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
              Emergency — 000
            </a>
            <a href={`tel:${LIFELINE}`} style={{ display: 'block', background: '#007AFF', color: '#fff', padding: '14px', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
              Lifeline — 13 11 14
            </a>
            <a href="tel:1800512348" style={{ display: 'block', background: 'var(--ac-bg)', color: 'var(--ac-text)', border: '1px solid var(--ac-border)', padding: '14px', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
              Beyond Blue — 1800 512 348
            </a>
          </Card>

          <Card title="Your Clinic">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Camperdown Acute Care Service</div>
            <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 8 }}>100 Mallett St, Camperdown NSW 2050</div>
            <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 12 }}>Monday–Friday: 8am – 5pm</div>
            <a href="tel:0295551234" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#007AFF', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              <SafeIcon icon={FiPhone} size={15} /> 02 9555 1234
            </a>
          </Card>

          <Card title="Online Resources">
            {[
              { name: 'Headspace', desc: 'Youth mental health 12–25', url: 'https://headspace.org.au', phone: '(02) 9114 4100' },
              { name: 'SANE Australia', desc: 'Mental health support & info', url: 'https://sane.org', phone: '1800 187 263' },
              { name: 'MindSpot', desc: 'Free online mental health treatment', url: 'https://mindspot.org.au', phone: '1800 614 434' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--ac-border)' : 'none' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginBottom: 4 }}>{r.desc}</div>
                <div style={{ fontSize: 13, color: '#007AFF' }}>{r.phone}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--ac-surface)', borderTop: '1px solid var(--ac-border)', padding: '10px 16px 20px', textAlign: 'center', fontSize: 13, color: 'var(--ac-muted)', zIndex: 50 }}>
        Need help now? <a href="tel:131114" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>Lifeline 13 11 14</a> · <a href="tel:000" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>Emergency 000</a>
      </div>
    </div>
  );
}

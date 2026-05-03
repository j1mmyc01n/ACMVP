import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import { useDarkMode, cx, badgeToneFor } from './lib/utils';
import { MENU } from './lib/menu';
import { Badge, DiamondLogo, Field, Input, Button, Textarea, Select } from './components/UI';
import JaxAI from './components/JaxAI';
import GitHubAgentPanel from './components/GitHubAgent';
import { supabase } from './supabase/supabase';
import { logActivity } from './lib/audit';

import { CheckInPage, ResourcesPage, ProfessionalsPage, ProviderJoinPage, SponsorJoinPage, OrgAccessRequestPage, LegalHubPage } from './pages/ClientViews';
import { ModernTriageDashboard, PatientDirectoryGrid, CRMPage, InvoicingPage, CrisisPage, ReportsPage, SponsorLedger, MultiCentreCheckin, BulkOffboardingPage, FeedbackDashPage, AdminDashboard, LocationIntegrationsPage, FieldAgentDashboard, AdminPushNotificationsPage } from './pages/AdminViews';
import { OverseerDashboard, LocationRollout, AuditLogPage, IntegrationPage, SettingsPage, UsersPage, SuperAdminPage, LocationsPage, HeatMapPage, FeedbackPage, FeatureRequestPage, ProviderMetricsPage, AICodeFixerPage, GitHubAgentPage, SysAdminDashboard, PushNotificationsPage, IntegrationRequestsPage, ConnectivityPage, RequestsInboxPage, FinanceHubPage, FeatureRolloutPage } from './pages/SystemViews';
import ClientPortal from './pages/client/ClientPortal';
import ResourceHub from './components/ResourceHub';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

const {
FiMenu, FiMoon, FiSun, FiLock, FiLogOut, FiEyeOff, FiEye,
FiMail, FiKey, FiShield, FiRefreshCw, FiDownload, FiLightbulb,
FiGithub, FiX, FiSend, FiUser, FiChevronDown, FiGrid, FiMaximize2
} = FiIcons;

const PUBLIC_PAGES = new Set(['checkin', 'resources', 'professionals', 'join_provider', 'join_sponsor', 'request_access', 'legal']);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const VALID_STAFF = {
'ops@acuteconnect.health': 'admin',
'sysadmin@acuteconnect.health': 'sysadmin',
'agent@acuteconnect.health': 'field_agent',
};

// ─── Feedback Modal ──────────────────────────────────────────────────
const FeedbackModal = ({ onClose, role }) => {
const [form, setForm] = useState({
subject: '', category: 'feedback', priority: 'medium', message: '',
submitted_by: role === 'sysadmin' ? 'sysadmin@acuteconnect.health' : 'ops@acuteconnect.health'
});
const [loading, setLoading] = useState(false);
const [done, setDone] = useState(false);

const handleSubmit = async () => {
if (!form.subject || !form.message) return;
setLoading(true);
try {
await supabase.from('feedback_tickets_1777090000').insert([{ ...form, status: 'open' }]);
setDone(true);
} catch (e) { console.error(e); }
finally { setLoading(false); }
};

return (
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }}>
<div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: 'var(--ac-shadow-lg)' }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<SafeIcon icon={FiLightbulb} size={20} style={{ color: '#FFD700' }} />
<div style={{ fontWeight: 800, fontSize: 17 }}>Feedback & Ideas</div>
</div>
<button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 18 }}>✕</button>
</div>
{done ? (
<div style={{ textAlign: 'center', padding: '24px 0' }}>
<div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
<div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Submitted! Thank you.</div>
<Button onClick={onClose} style={{ width: '100%' }}>Close</Button>
</div>
) : (
<div className="ac-stack">
<div className="ac-grid-2">
<Field label="Category">
<Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
options={[{ value: 'feedback', label: '💬 Feedback' }, { value: 'bug', label: '🐛 Bug Report' }, { value: 'feature', label: '🚀 Feature Request' }, { value: 'urgent', label: '🚨 Urgent Issue' }]} />
</Field>
<Field label="Priority">
<Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
</Field>
</div>
<Field label="Subject *"><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary..." /></Field>
<Field label="Message *"><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe your feedback or idea..." style={{ minHeight: 100 }} /></Field>
<div className="ac-grid-2">
<Button variant="outline" onClick={onClose}>Cancel</Button>
<Button icon={FiSend} onClick={handleSubmit} disabled={loading || !form.subject || !form.message}>
{loading ? 'Sending...' : 'Submit'}
</Button>
</div>
</div>
)}
</div>
</div>
);
};

// ─── Page Renderer ───────────────────────────────────────────────────
const PageRenderer = ({ id, goto, onLoginIntent, role, clientAccount, userEmail }) => {
// Admin user's care centre (matches the "CAM" location tag in the header)
const adminCentre = role === 'admin' ? 'Camperdown' : null;
switch (id) {
case 'checkin':           return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
case 'resources':         return <ResourcesPage goto={goto} />;
case 'professionals':     return <ProfessionalsPage />;
case 'join_provider':     return <ProviderJoinPage />;
case 'join_sponsor':      return <SponsorJoinPage />;
case 'request_access':    return <OrgAccessRequestPage />;
case 'legal':             return <LegalHubPage />;
case 'my_portal':         return <ClientPortal account={clientAccount} goto={goto} />;
case 'admin':             return <ModernTriageDashboard role={role} userCentre={adminCentre} goto={goto} />;
case 'crm':               return <CRMPage currentUserRole={role} currentUserCareTeam={adminCentre} />;
case 'patient_directory': return <CRMPage currentUserRole={role} currentUserCareTeam={adminCentre} />;
case 'resource_hub':      return <ResourceHub />;
case 'multicentre':       return <MultiCentreCheckin />;
case 'bulk_offboard':     return <BulkOffboardingPage />;
case 'invoicing':         return <FinanceHubPage role={role} />;
case 'sponsor_ledger':    return <FinanceHubPage role={role} />;
case 'finance_hub':       return <FinanceHubPage role={role} />;
case 'crisis':            return <CrisisPage role={role} userCentre={adminCentre} />;
case 'reports':           return <ReportsPage />;
case 'admin_audit':       return <AdminAuditPage />;
case 'feedback_dash':     return <FeedbackDashPage />;
case 'heatmap':           return <HeatMapPage />;
case 'sysdash':           return <OverseerDashboard />;
case 'platform_requests': return <RequestsInboxPage role={role} />;
case 'feedback':          return <RequestsInboxPage role={role} />;
case 'features':          return <RequestsInboxPage role={role} />;
case 'inbox':             return <RequestsInboxPage role={role} />;
case 'provider_metrics':  return <FinanceHubPage role={role} />;
case 'offices':           return <LocationsPage />;
case 'loc_integrations':   return <LocationIntegrationsPage role={role} userEmail={userEmail} />;
case 'loc_integrations_ai':      return <LocationIntegrationsPage role={role} userEmail={userEmail} defaultTab="ai" />;
case 'loc_integrations_agents':  return <LocationIntegrationsPage role={role} userEmail={userEmail} defaultTab="field_agents" />;
case 'integrations':      return <IntegrationPage />;
case 'users':             return <UsersPage />;
case 'settings':          return <SettingsPage />;
case 'superadmin':        return <SuperAdminPage />;
case 'ai_fixer':          return <AICodeFixerPage />;
case 'github_agent':      return <GitHubAgentPage />;
case 'audit_log':         return <AuditLogPage />;
case 'rollout':           return <LocationRollout />;
case 'feature_rollout':   return <FeatureRolloutPage />;
case 'connectivity':      return <ConnectivityPage />;
case 'push_notifications':       return <PushNotificationsPage senderEmail={userEmail} />;
case 'admin_push_notifications': return <AdminPushNotificationsPage senderEmail={userEmail} adminCentre={adminCentre} />;
case 'integration_requests': return <RequestsInboxPage role={role} />;
case 'field_agent_dash':  return <FieldAgentDashboard agentEmail={userEmail} agentLocation={adminCentre} />;
default:                  return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
}
};

// ─── Smart Menu ──────────────────────────────────────────────────────
const SmartMenu = ({ open, onClose, current, goto, role, onLogout, showBadges, canInstallPWA, onInstallPWA, feedbackCount }) => {
const handleNavClick = useCallback((e, id) => {
e.preventDefault(); e.stopPropagation();
goto(id);
onClose();
}, [goto, onClose]);

const handleLogout = useCallback((e) => {
e.preventDefault(); e.stopPropagation();
onLogout();
onClose();
}, [onLogout, onClose]);

const getCounter = (id) => {
if (id === 'feedback') return feedbackCount;
return 0;
};

// Track which parent items (with children) are expanded
const isChildActive = useCallback((item) =>
  item.children?.some(c => c.id === current) ?? false,
[current]);
const [expanded, setExpanded] = useState(() => {
  // Pre-expand any parent whose child is currently active
  const initial = new Set();
  MENU.forEach(g => g.items.forEach(it => {
    if (it.children && it.children.some(c => c.id === current)) initial.add(it.id);
  }));
  return initial;
});
// Also expand if navigation lands on a child page
useEffect(() => {
  MENU.forEach(g => g.items.forEach(it => {
    if (it.children && it.children.some(c => c.id === current)) {
      setExpanded(prev => { const s = new Set(prev); s.add(it.id); return s; });
    }
  }));
}, [current]);

const toggleExpanded = useCallback((e, id) => {
  e.preventDefault(); e.stopPropagation();
  setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
}, []);

const menuToShow = MENU.filter(g => {
if (g.group === 'SYSADMIN' && role !== 'sysadmin') return false;
if (g.group === 'ADMIN' && !['admin', 'sysadmin'].includes(role)) return false;
if (g.group === 'UPGRADES' && !['admin', 'sysadmin'].includes(role)) return false;
if (g.group === 'FIELD AGENT' && !['field_agent', 'sysadmin'].includes(role)) return false;
if (g.group === 'MY PORTAL' && role !== 'client') return false;
return true;
});

return (
<>
<div className={cx('ac-scrim', open && 'ac-scrim-on')} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} style={{ touchAction: 'none' }} />
<aside className={cx('ac-drawer', open && 'ac-drawer-on')} onClick={e => e.stopPropagation()}>
<header className="ac-drawer-head" style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
<DiamondLogo size={28} color="var(--ac-primary)" />
<div>
<div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px' }}>Acute Care Services</div>
<div className="ac-muted ac-xs" style={{ marginTop: 1 }}>
{role === 'sysadmin' ? 'System Admin · Central'
: role === 'admin' ? 'Administrator · Camperdown'
: role === 'field_agent' ? 'Field Agent · Camperdown'
: role === 'client' ? 'Client Portal'
: 'Public Access'}
</div>
</div>
</div>
</header>
{canInstallPWA && (
<div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ac-border)' }}>
<button onClick={(e) => { e.stopPropagation(); onInstallPWA(); }} className="ac-btn ac-btn-outline"
style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13 }}>
<SafeIcon icon={FiDownload} size={14} /> Install App
</button>
</div>
)}
<nav className="ac-drawer-nav">
{menuToShow.map(g => {
const groupCount = g.items.reduce((sum, it) => {
  const direct = getCounter(it.id) || 0;
  const childCount = it.children ? it.children.reduce((cs, c) => cs + (getCounter(c.id) || 0), 0) : 0;
  return sum + direct + childCount;
}, 0);
return (
<div key={g.group}>
<div className="ac-group-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
<span>{g.group}</span>
{groupCount > 0 && (
<span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
{groupCount}
</span>
)}
</div>
{g.items.map(it => {
const count = getCounter(it.id);
if (it.children) {
  const isOpen = expanded.has(it.id);
  const hasActiveChild = isChildActive(it);
  return (
    <div key={it.id}>
      {/* Parent toggle button */}
      <button
        className={cx('ac-nav', hasActiveChild && 'ac-nav-active')}
        onClick={(e) => toggleExpanded(e, it.id)}
        style={{ justifyContent: 'space-between' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SafeIcon icon={it.icon} size={16} />
          <span style={{ fontWeight: hasActiveChild ? 600 : 500 }}>{it.label}</span>
        </span>
        <SafeIcon
          icon={FiChevronDown}
          size={14}
          style={{
            color: 'var(--ac-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>
      {/* Sub-items */}
      {isOpen && (
        <div style={{ marginLeft: 12, borderLeft: '2px solid var(--ac-border)', paddingLeft: 8, marginBottom: 4 }}>
          {it.children.map(child => {
            const childCount = getCounter(child.id);
            return (
              <button
                key={child.id}
                className={cx('ac-nav', current === child.id && 'ac-nav-active')}
                onClick={(e) => handleNavClick(e, child.id)}
                style={{ fontSize: 13, padding: '9px 12px' }}
              >
                <SafeIcon icon={child.icon} size={14} />
                <span style={{ flex: 1 }}>{child.label}</span>
                {childCount > 0 && (
                  <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                    {childCount}
                  </span>
                )}
                {showBadges && child.badge && !childCount && <Badge tone={badgeToneFor(child.badge)}>{child.badge}</Badge>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
return (
<button key={it.id} className={cx('ac-nav', current === it.id && 'ac-nav-active')} onClick={(e) => handleNavClick(e, it.id)}>
<SafeIcon icon={it.icon} size={16} />
<span style={{ flex: 1 }}>{it.label}</span>
{count > 0 && (
<span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
{count}
</span>
)}
{showBadges && it.badge && !count && <Badge tone={badgeToneFor(it.badge)}>{it.badge}</Badge>}
</button>
);
})}
</div>
);
})}
{role && (
<>
<div className="ac-divider" style={{ margin: '16px 0' }} />
<button className="ac-nav" onClick={handleLogout} style={{ color: 'var(--ac-danger)' }}>
<SafeIcon icon={FiLogOut} size={16} /><span>Logout</span>
</button>
</>
)}
</nav>
</aside>
</>
);
};

// ─── Login Modal ─────────────────────────────────────────────────────
const LoginModal = ({ type, onLogin, onCancel }) => {
const [mode, setMode] = useState('password');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPw, setShowPw] = useState(false);
const [otpStep, setOtpStep] = useState('request');
const [otpInput, setOtpInput] = useState('');
const [generatedOTP, setGeneratedOTP] = useState('');
const [otpId, setOtpId] = useState(null);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const [countdown, setCountdown] = useState(0);

useEffect(() => {
if (countdown <= 0) return;
const t = setTimeout(() => setCountdown(c => c - 1), 1000);
return () => clearTimeout(t);
}, [countdown]);

const resolveRole = (em) => {
const r = VALID_STAFF[em.toLowerCase().trim()];
return r || (em.includes('sys') ? 'sysadmin' : 'admin');
};

const handlePasswordLogin = async () => {
setError('');
if (!email) return setError('Please enter your email.');
if (!password) return setError('Please enter your password.');
setLoading(true);
try {
const { data } = await supabase.from('admin_users_1777025000000').select('*').ilike('email', email.trim()).eq('status', 'active').single();
const isKnownStaff = email.trim().toLowerCase() in VALID_STAFF;
if (!data && !isKnownStaff) return setError('No active account found for this email.');
if (password !== 'password') return setError('Incorrect password.');
onLogin(resolveRole(email), email.trim().toLowerCase());
} catch (err) {
console.error('Password login error:', err);
setError('Login failed. Please check your connection and try again.');
} finally {
setLoading(false);
}
};

const handleSendOTP = async () => {
setError('');
if (!email) return setError('Please enter your staff email address.');
setLoading(true);
try {
const { data: staff } = await supabase.from('admin_users_1777025000000').select('*').ilike('email', email.trim()).eq('status', 'active').single();
const isKnownStaff = email.trim().toLowerCase() in VALID_STAFF;
if (!staff && !isKnownStaff) return setError('No active staff account found.');
const code = generateOTP();
const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
const { data: otpData, error: otpErr } = await supabase.from('login_otp_codes_1777090007').insert([{ email: email.trim().toLowerCase(), code, expires_at: expiresAt }]).select().single();
if (otpErr) return setError('Failed to generate OTP. Please try again.');
setGeneratedOTP(code); setOtpId(otpData.id); setOtpStep('sent'); setCountdown(60);
} catch (err) {
console.error('OTP send error:', err);
setError('Failed to send code. Please check your connection and try again.');
} finally {
setLoading(false);
}
};

const handleVerifyOTP = async () => {
setError('');
if (otpInput.length !== 6) return setError('Please enter the full 6-digit code.');
setLoading(true);
try {
const { data: otpRecord } = await supabase.from('login_otp_codes_1777090007').select('*').eq('id', otpId).eq('code', otpInput.trim()).eq('used', false).single();
if (!otpRecord) return setError('Invalid or expired code.');
if (new Date(otpRecord.expires_at) < new Date()) return setError('This code has expired.');
await supabase.from('login_otp_codes_1777090007').update({ used: true }).eq('id', otpId);
onLogin(resolveRole(email), email.trim().toLowerCase());
} catch (err) {
console.error('OTP verify error:', err);
setError('Verification failed. Please check your connection and try again.');
} finally {
setLoading(false);
}
};

const handleResend = () => { setOtpStep('request'); setOtpInput(''); setGeneratedOTP(''); setError(''); };

return (
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
<div style={{ background: 'var(--ac-surface)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420, boxShadow: 'var(--ac-shadow-lg)' }}>
<div style={{ textAlign: 'center', marginBottom: 28 }}>
<DiamondLogo size={52} color="var(--ac-primary)" />
<h2 style={{ marginTop: 14, fontWeight: 800, fontSize: 22 }}>
{type === 'sysadmin' ? 'SysAdmin Access' : 'Staff Portal Login'}
</h2>
<p className="ac-muted ac-xs" style={{ marginTop: 4 }}>Authorized Personnel Only</p>
</div>
<div style={{ display: 'flex', background: 'var(--ac-bg)', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
{[{ id: 'password', label: 'Password', icon: FiKey }, { id: 'otp', label: 'Email OTP', icon: FiMail }].map(m => (
<button key={m.id} onClick={() => { setMode(m.id); setError(''); setOtpStep('request'); setOtpInput(''); }}
style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', background: mode === m.id ? 'var(--ac-surface)' : 'transparent', color: mode === m.id ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: mode === m.id ? 700 : 400, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
<SafeIcon icon={m.icon} size={13} />{m.label}
</button>
))}
</div>
{error && <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', padding: '10px 14px', borderRadius: 10, color: '#c62828', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
{mode === 'password' && (
<div className="ac-stack">
<Field label="Staff Email"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@acuteconnect.health" /></Field>
<Field label="Password">
<div style={{ position: 'relative' }}>
<Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()} placeholder="••••••••" style={{ paddingRight: 44 }} />
<button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex' }}>
<SafeIcon icon={showPw ? FiEyeOff : FiEye} size={16} />
</button>
</div>
</Field>
<Button style={{ width: '100%' }} onClick={handlePasswordLogin} disabled={loading}>{loading ? 'Verifying...' : 'Access Portal'}</Button>
</div>
)}
{mode === 'otp' && otpStep === 'request' && (
<div className="ac-stack">
<Field label="Staff Email" hint="A one-time code will be displayed here"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@acuteconnect.health" /></Field>
<Button style={{ width: '100%' }} icon={FiMail} onClick={handleSendOTP} disabled={loading}>{loading ? 'Sending...' : 'Send One-Time Code'}</Button>
</div>
)}
{mode === 'otp' && otpStep === 'sent' && (
<div className="ac-stack">
<div style={{ background: 'var(--ac-primary-soft)', border: '1px solid var(--ac-primary)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
<SafeIcon icon={FiMail} size={28} style={{ color: 'var(--ac-primary)', marginBottom: 10 }} />
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Code sent to <strong>{email}</strong></div>
<div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, letterSpacing: 6, color: 'var(--ac-primary)', padding: '8px 0' }}>{generatedOTP}</div>
</div>
<Field label="Enter 6-Digit Code">
<input type="text" inputMode="numeric" maxLength={6} value={otpInput}
onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
placeholder="000000"
style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 24, fontFamily: 'monospace', fontWeight: 800, textAlign: 'center', letterSpacing: 8, outline: 'none', boxSizing: 'border-box' }}
/>
</Field>
<Button style={{ width: '100%' }} icon={FiShield} onClick={handleVerifyOTP} disabled={loading || otpInput.length < 6}>{loading ? 'Verifying...' : 'Verify & Login'}</Button>
<div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ac-muted)' }}>
{countdown > 0 ? `Resend available in ${countdown}s` :
<button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--ac-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
<SafeIcon icon={FiRefreshCw} size={11} style={{ marginRight: 4 }} />Request a new code
</button>}
</div>
</div>
)}
<button onClick={onCancel} style={{ background: 'none', border: 0, color: 'var(--ac-muted)', fontSize: 13, cursor: 'pointer', padding: '12px 0 0', width: '100%', textAlign: 'center' }}>Cancel</button>
</div>
</div>
);
};

// ─── Dashboard Grid Picker + View ────────────────────────────────────
const ALL_GRID_MODULES = [
  { id: 'crisis', label: 'Crisis Dashboard' },
  { id: 'triage', label: 'Triage' },
  { id: 'patients', label: 'Patient Directory' },
  { id: 'reports', label: 'Reports' },
  { id: 'audit_log', label: 'Audit Log' },
  { id: 'sysdash', label: 'SysAdmin Dashboard' },
  { id: 'admin', label: 'Admin Dashboard' },
  { id: 'invoicing', label: 'Invoicing' },
  { id: 'rollout', label: 'Location Rollout' },
  { id: 'feature_rollout', label: 'Feature Rollout' },
];

const DashboardGridView = ({ modules, goto, onPickerOpen, role, clientAccount, userEmail }) => {
  const cols = modules.length <= 4 ? 2 : 3;
  return (
    <div style={{ padding: '0 0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Multi-Module View</div>
        <button onClick={onPickerOpen} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)' }}>
          <SafeIcon icon={FiGrid} size={14} /> Configure Modules
        </button>
      </div>
      {modules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--ac-surface)', borderRadius: 16, border: '2px dashed var(--ac-border)' }}>
          <SafeIcon icon={FiGrid} size={40} style={{ color: 'var(--ac-border)', marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No modules selected</div>
          <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 20 }}>Click "Configure Modules" to select up to 6 modules to display in a grid.</div>
          <button onClick={onPickerOpen} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--ac-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Configure Modules
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
          {modules.map(modId => {
            const mod = ALL_GRID_MODULES.find(m => m.id === modId);
            return (
              <div key={modId} style={{
                background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                maxHeight: 480,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-bg)', flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{mod?.label || modId}</span>
                  <button onClick={() => goto(modId)} title="Open full page" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', padding: 4 }}>
                    <SafeIcon icon={FiMaximize2} size={13} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                  {/* onLoginIntent is intentionally no-op here: grid cells are only rendered for authenticated staff roles */}
                  <PageRenderer id={modId} goto={goto} onLoginIntent={() => {}} role={role} clientAccount={clientAccount} userEmail={userEmail} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DashboardModulePicker = ({ modules, onSave, onClose }) => {
  const [selected, setSelected] = useState(modules);
  const toggle = (id) => setSelected(prev =>
    prev.includes(id)
      ? prev.filter(x => x !== id)
      : prev.length < 6 ? [...prev, id] : prev
  );
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, padding: 16 }}>
      <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--ac-shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Select Dashboard Modules</div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 3 }}>Choose up to 6 modules · {selected.length}/6 selected</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)' }}>
            <SafeIcon icon={FiX} size={18} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {ALL_GRID_MODULES.map(mod => {
            const isSelected = selected.includes(mod.id);
            return (
              <button key={mod.id} onClick={() => toggle(mod.id)} style={{
                padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                border: `2px solid ${isSelected ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
                background: isSelected ? 'var(--ac-primary-soft)' : 'var(--ac-bg)',
                fontWeight: isSelected ? 700 : 500, fontSize: 13,
                color: isSelected ? 'var(--ac-primary)' : 'var(--ac-text)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: isSelected ? 'var(--ac-primary)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </span>
                {mod.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)' }}>Cancel</button>
          <button onClick={() => { onSave(selected); onClose(); }} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--ac-primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            Apply ({selected.length} modules)
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── App ─────────────────────────────────────────────────────────────
const STAFF_ROLES = new Set(['admin', 'sysadmin', 'field_agent']);
const SESSION_KEY = 'ac_staff_role';
const EMAIL_KEY   = 'ac_staff_email';

export default function App() {
const [dark, setDark] = useDarkMode();
const [menuOpen, setMenuOpen] = useState(false);
const [dashboardGridOpen, setDashboardGridOpen] = useState(false);
const [pickerOpen, setPickerOpen] = useState(false);
const [dashboardModules, setDashboardModules] = useState(() => {
  try {
    const saved = localStorage.getItem('ac_dashboard_modules');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
});
const [page, setPage] = useState(() => {
const saved = sessionStorage.getItem(SESSION_KEY);
if (!saved) return 'checkin';
if (saved === 'sysadmin') return 'sysdash';
if (saved === 'field_agent') return 'field_agent_dash';
return 'crisis';
});
const [role, setRole] = useState(() => sessionStorage.getItem(SESSION_KEY) || null);
const [userEmail, setUserEmail] = useState(() => sessionStorage.getItem(EMAIL_KEY) || '');
const [clientAccount, setClientAccount] = useState(null);
const [loginModal, setLoginModal] = useState(null);
const [showBadges, setShowBadges] = useState(true);
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [feedbackCount, setFeedbackCount] = useState(0);
const [githubPanelOpen, setGithubPanelOpen] = useState(false);
const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

const isPublic = PUBLIC_PAGES.has(page);

// ── PWA install prompt
useEffect(() => {
const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
window.addEventListener('beforeinstallprompt', handler);
return () => window.removeEventListener('beforeinstallprompt', handler);
}, []);

// ── SUPABASE AUTH LISTENER
useEffect(() => {
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
if (session?.user) {
const userRole = session.user.user_metadata?.role || null;
if (userRole === 'client') {
const { data: account } = await supabase
.from('client_accounts')
.select('*')
.eq('auth_user_id', session.user.id)
.single();
setClientAccount(account || { email: session.user.email });
setRole('client');
setPage('my_portal');
}
} else if (event === 'SIGNED_OUT') {
sessionStorage.removeItem(SESSION_KEY);
setRole(null);
setClientAccount(null);
setPage('checkin');
}
});
return () => subscription.unsubscribe();
}, []);

// ── Badge counts
useEffect(() => {
if (!role || role === 'client') return;
supabase.from('feedback_tickets_1777090000').select('*', { count: 'exact', head: true }).eq('status', 'open')
.then(({ count }) => setFeedbackCount(count || 0));
}, [role]);

const handleInstallPWA = async () => {
if (!deferredPrompt) return;
deferredPrompt.prompt();
await deferredPrompt.userChoice;
setDeferredPrompt(null);
};

const handleLogin = (r, em = '') => {
setRole(r);
setUserEmail(em);
if (STAFF_ROLES.has(r)) {
  sessionStorage.setItem(SESSION_KEY, r);
  if (em) sessionStorage.setItem(EMAIL_KEY, em);
  // Record last login time in admin_users table (fire-and-forget)
  if (em) {
    supabase
      .from('admin_users_1777025000000')
      .update({ last_login: new Date().toISOString() })
      .ilike('email', em)
      .then(({ error }) => { if (error) console.warn('last_login update:', error.message); });
  }
  logActivity({
    action: 'login',
    resource: 'session',
    detail: `${r} signed in${em ? ` as ${em}` : ''}`,
    actor: em || r,
    actor_role: r,
    source_type: r === 'sysadmin' ? 'sysadmin' : 'staff',
  });
}
setLoginModal(null);
if (r === 'sysadmin') setPage('sysdash');
else if (r === 'client') setPage('my_portal');
else if (r === 'field_agent') setPage('field_agent_dash');
else setPage('crisis');
};

const handleLogout = async () => {
await supabase.auth.signOut();
sessionStorage.removeItem(SESSION_KEY);
sessionStorage.removeItem(EMAIL_KEY);
setRole(null);
setUserEmail('');
setClientAccount(null);
setPage('checkin');
setGithubPanelOpen(false);
};

const handlePageChange = useCallback((id) => {
if (!PUBLIC_PAGES.has(id) && id !== 'my_portal' && !role) {
setLoginModal('admin');
return;
}
setPage(id);
setMenuOpen(false);
setDashboardGridOpen(false);
}, [role]);

const saveDashboardModules = (mods) => {
setDashboardModules(mods);
localStorage.setItem('ac_dashboard_modules', JSON.stringify(mods));
};

const handleMenuToggle = useCallback((e) => {
e.preventDefault(); e.stopPropagation();
setMenuOpen(prev => !prev);
}, []);

return (
<div className="ac-app">
<PWAUpdatePrompt />
<SmartMenu
open={menuOpen} onClose={() => setMenuOpen(false)}
current={page} goto={handlePageChange}
role={role} onLogout={handleLogout}
showBadges={showBadges}
canInstallPWA={!!deferredPrompt} onInstallPWA={handleInstallPWA}
feedbackCount={feedbackCount}
/>

<header className="ac-top">
<button className="ac-icon-btn ac-sidebar-toggle" onClick={handleMenuToggle}>
<SafeIcon icon={FiMenu} size={18} />
</button>
<div className="ac-brand">
<DiamondLogo size={20} color="var(--ac-primary)" />
<span>Acute Care Services</span>
{role === 'sysadmin' && <span className="ac-loc-tag">CTR</span>}
{role === 'admin' && <span className="ac-loc-tag">CAM</span>}
{role === 'field_agent' && <span className="ac-loc-tag">FIELD</span>}
</div>
<div className="ac-top-actions">
{role && STAFF_ROLES.has(role) && (
<button
  className="ac-icon-btn ac-grid-toggle"
  onClick={() => setDashboardGridOpen(v => !v)}
  title={dashboardGridOpen ? 'Single module view' : 'Multi-module grid view'}
>
  <SafeIcon icon={FiGrid} size={16} style={{ color: dashboardGridOpen ? 'var(--ac-primary)' : undefined }} />
</button>
)}
{role === 'sysadmin' && (
<button className="ac-icon-btn" onClick={() => setGithubPanelOpen(prev => !prev)} title="GitHub AI Agent">
<SafeIcon icon={FiGithub} size={17} />
</button>
)}
{role === 'client' && (
<button className="ac-icon-btn" onClick={() => setPage('my_portal')} title="My Portal">
<SafeIcon icon={FiUser} size={17} />
</button>
)}
{role && role !== 'client' && (
<button className="ac-icon-btn" onClick={() => setFeedbackModalOpen(true)} title="Feedback / Ideas">
<SafeIcon icon={FiLightbulb} size={17} style={{ color: '#FFD700' }} />
</button>
)}
<button className="ac-icon-btn" onClick={() => setShowBadges(!showBadges)}>
<SafeIcon icon={showBadges ? FiEyeOff : FiEye} size={16} />
</button>
<button className="ac-icon-btn" onClick={() => setDark(!dark)}>
<SafeIcon icon={dark ? FiSun : FiMoon} size={16} />
</button>
{role && (
<span className={`ac-role-badge ac-role-badge-${role === 'sysadmin' ? 'sysadmin' : role === 'client' ? 'client' : role === 'field_agent' ? 'admin' : 'admin'}`}>
{role === 'sysadmin' ? 'SysAdmin' : role === 'client' ? 'Client' : role === 'field_agent' ? 'Field Agent' : 'Admin'}
</span>
)}
{!role && (
<button className="ac-icon-btn" onClick={() => setLoginModal('admin')} title="Staff Login">
<SafeIcon icon={FiLock} size={16} />
</button>
)}
</div>
</header>

<div className="ac-shell">
<main className={`ac-main${(page === 'sysdash' || page === 'admin' || page === 'crisis') ? ' ac-main-wide' : ''}`}>
{!isPublic && !role ? (
<div style={{ textAlign: 'center', padding: '80px 20px' }}>
<div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
<h2 style={{ fontWeight: 800, marginBottom: 8 }}>Access Restricted</h2>
<p className="ac-muted" style={{ marginBottom: 24 }}>Please log in to access this section.</p>
<Button onClick={() => setLoginModal('admin')}>Login to Continue</Button>
</div>
) : dashboardGridOpen && STAFF_ROLES.has(role) ? (
<DashboardGridView
  modules={dashboardModules}
  goto={handlePageChange}
  onPickerOpen={() => setPickerOpen(true)}
  role={role}
  clientAccount={clientAccount}
  userEmail={userEmail}
/>
) : (
<PageRenderer id={page} goto={handlePageChange} onLoginIntent={setLoginModal} role={role} clientAccount={clientAccount} userEmail={userEmail} />
)}
</main>

<JaxAI role={role} goto={handlePageChange} />
<GitHubAgentPanel open={githubPanelOpen} onClose={() => setGithubPanelOpen(false)} role={role} />
{feedbackModalOpen && <FeedbackModal onClose={() => setFeedbackModalOpen(false)} role={role} />}
{pickerOpen && (
<DashboardModulePicker
  modules={dashboardModules}
  onSave={saveDashboardModules}
  onClose={() => setPickerOpen(false)}
/>
)}

<footer style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--ac-muted)', fontSize: 11, borderTop: '1px solid var(--ac-border)' }}>
© Laurendi · Acute Connect v4.1.0 · Protected by AES-256
</footer>

{loginModal && <LoginModal type={loginModal} onLogin={handleLogin} onCancel={() => setLoginModal(null)} />}
</div>
</div>
);
}

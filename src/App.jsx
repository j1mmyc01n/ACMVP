import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import { useDarkMode, cx, badgeToneFor } from './lib/utils';
import { MENU } from './lib/menu';
import { Badge, DiamondLogo, Field, Input, Button, Textarea, Select } from './components/UI';
import JaxAI from './components/JaxAI';
import GitHubAgentPanel from './components/GitHubAgent';
import { supabase } from './supabase/supabase';

import { CheckInPage, ResourcesPage, ProfessionalsPage, ProviderJoinPage, SponsorJoinPage, OrgAccessRequestPage } from './pages/ClientViews';
import { ModernTriageDashboard, PatientDirectoryGrid, CRMPage, InvoicingPage, CrisisPage, ReportsPage, SponsorLedger, MultiCentreCheckin, BulkOffboardingPage, FeedbackDashPage, AdminDashboard, LocationIntegrationsPage } from './pages/AdminViews';
import { OverseerDashboard, LocationRollout, AuditLogPage, IntegrationPage, SettingsPage, UsersPage, SuperAdminPage, LocationsPage, HeatMapPage, FeedbackPage, FeatureRequestPage, ProviderMetricsPage, AICodeFixerPage, GitHubAgentPage, SysAdminDashboard, PushNotificationsPage } from './pages/SystemViews';
import ClientPortal from './pages/client/ClientPortal';
import ResourceHub from './components/ResourceHub';

const {
FiMenu, FiMoon, FiSun, FiLock, FiLogOut, FiEyeOff, FiEye,
FiMail, FiKey, FiShield, FiRefreshCw, FiDownload, FiLightbulb,
FiGithub, FiX, FiSend, FiUser
} = FiIcons;

const PUBLIC_PAGES = new Set(['checkin', 'resources', 'professionals', 'join_provider', 'join_sponsor', 'request_access']);
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const VALID_STAFF = {
'ops@acuteconnect.health': 'admin',
'sysadmin@acuteconnect.health': 'sysadmin',
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
const PageRenderer = ({ id, goto, onLoginIntent, role, clientAccount }) => {
// Admin user's care centre (matches the "CAM" location tag in the header)
const adminCentre = role === 'admin' ? 'Camperdown' : null;
switch (id) {
case 'checkin':           return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
case 'resources':         return <ResourcesPage goto={goto} />;
case 'professionals':     return <ProfessionalsPage />;
case 'join_provider':     return <ProviderJoinPage />;
case 'join_sponsor':      return <SponsorJoinPage />;
case 'request_access':    return <OrgAccessRequestPage />;
case 'my_portal':         return <ClientPortal account={clientAccount} goto={goto} />;
case 'admin':             return <ModernTriageDashboard role={role} userCentre={adminCentre} />;
case 'crm':               return <CRMPage currentUserRole={role} currentUserCareTeam={adminCentre} />;
case 'patient_directory': return <CRMPage currentUserRole={role} currentUserCareTeam={adminCentre} />;
case 'resource_hub':      return <ResourceHub />;
case 'multicentre':       return <MultiCentreCheckin />;
case 'bulk_offboard':     return <BulkOffboardingPage />;
case 'invoicing':         return <InvoicingPage />;
case 'sponsor_ledger':    return <SponsorLedger role={role} />;
case 'crisis':            return <CrisisPage role={role} userCentre={adminCentre} />;
case 'reports':           return <ReportsPage />;
case 'feedback_dash':     return <FeedbackDashPage />;
case 'heatmap':           return <HeatMapPage />;
case 'sysdash':           return <OverseerDashboard />;
case 'feedback':          return <FeedbackPage />;
case 'features':          return <FeatureRequestPage />;
case 'provider_metrics':  return <ProviderMetricsPage />;
case 'offices':           return <LocationsPage />;
case 'loc_integrations':   return <LocationIntegrationsPage role={role} />;
case 'integrations':      return <IntegrationPage />;
case 'users':             return <UsersPage />;
case 'settings':          return <SettingsPage />;
case 'superadmin':        return <SuperAdminPage />;
case 'ai_fixer':          return <AICodeFixerPage />;
case 'github_agent':      return <GitHubAgentPage />;
case 'audit_log':         return <AuditLogPage />;
case 'rollout':           return <LocationRollout />;
case 'push_notifications':return <PushNotificationsPage />;
default:                  return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
}
};

// ─── Smart Menu ──────────────────────────────────────────────────────
const SmartMenu = ({ open, onClose, current, goto, role, onLogout, showBadges, canInstallPWA, onInstallPWA, feedbackCount, pendingCRNCount }) => {
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
if (id === 'crm') return pendingCRNCount;
return 0;
};

const menuToShow = MENU.filter(g => {
if (g.group === 'SYSADMIN' && role !== 'sysadmin') return false;
if (g.group === 'ADMIN' && !['admin', 'sysadmin'].includes(role)) return false;
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
const groupCount = g.items.reduce((sum, it) => sum + (getCounter(it.id) || 0), 0);
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
onLogin(resolveRole(email));
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
onLogin(resolveRole(email));
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

// ─── App ─────────────────────────────────────────────────────────────
const STAFF_ROLES = new Set(['admin', 'sysadmin']);
const SESSION_KEY = 'ac_staff_role';

export default function App() {
const [dark, setDark] = useDarkMode();
const [menuOpen, setMenuOpen] = useState(false);
const [page, setPage] = useState(() => {
const saved = sessionStorage.getItem(SESSION_KEY);
if (!saved) return 'checkin';
return saved === 'sysadmin' ? 'sysdash' : 'crisis';
});
const [role, setRole] = useState(() => sessionStorage.getItem(SESSION_KEY) || null);
const [clientAccount, setClientAccount] = useState(null);
const [loginModal, setLoginModal] = useState(null);
const [showBadges, setShowBadges] = useState(true);
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [feedbackCount, setFeedbackCount] = useState(0);
const [pendingCRNCount, setPendingCRNCount] = useState(0);
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
supabase.from('crn_requests_1777090006').select('*', { count: 'exact', head: true })
.not('status', 'in', '("approved","rejected")')
.then(({ count }) => setPendingCRNCount(count || 0));
}, [role]);

const handleInstallPWA = async () => {
if (!deferredPrompt) return;
deferredPrompt.prompt();
await deferredPrompt.userChoice;
setDeferredPrompt(null);
};

const handleLogin = (r) => {
setRole(r);
if (STAFF_ROLES.has(r)) sessionStorage.setItem(SESSION_KEY, r);
setLoginModal(null);
setPage(r === 'sysadmin' ? 'sysdash' : r === 'client' ? 'my_portal' : 'crisis');
};

const handleLogout = async () => {
await supabase.auth.signOut();
sessionStorage.removeItem(SESSION_KEY);
setRole(null);
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
}, [role]);

const handleMenuToggle = useCallback((e) => {
e.preventDefault(); e.stopPropagation();
setMenuOpen(prev => !prev);
}, []);

return (
<div className="ac-app">
<SmartMenu
open={menuOpen} onClose={() => setMenuOpen(false)}
current={page} goto={handlePageChange}
role={role} onLogout={handleLogout}
showBadges={showBadges}
canInstallPWA={!!deferredPrompt} onInstallPWA={handleInstallPWA}
feedbackCount={feedbackCount} pendingCRNCount={pendingCRNCount}
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
</div>
<div className="ac-top-actions">
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
<span className={`ac-role-badge ac-role-badge-${role === 'sysadmin' ? 'sysadmin' : role === 'client' ? 'client' : 'admin'}`}>
{role === 'sysadmin' ? 'SysAdmin' : role === 'client' ? 'Client' : 'Admin'}
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
) : (
<PageRenderer id={page} goto={handlePageChange} onLoginIntent={setLoginModal} role={role} clientAccount={clientAccount} />
)}
</main>

<JaxAI role={role} goto={handlePageChange} />
<GitHubAgentPanel open={githubPanelOpen} onClose={() => setGithubPanelOpen(false)} role={role} />
{feedbackModalOpen && <FeedbackModal onClose={() => setFeedbackModalOpen(false)} role={role} />}

<footer style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--ac-muted)', fontSize: 11, borderTop: '1px solid var(--ac-border)' }}>
© Laurendi · Acute Connect v4.1.0 · Protected by AES-256
</footer>

{loginModal && <LoginModal type={loginModal} onLogin={handleLogin} onCancel={() => setLoginModal(null)} />}
</div>
</div>
);
}

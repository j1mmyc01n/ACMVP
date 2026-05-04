import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import { useDarkMode, cx, badgeToneFor } from './lib/utils';
import { useFocusTrap } from './lib/focusTrap';
import { MENU } from './lib/menu';
import { Badge, DiamondLogo, Field, Input, Button, Textarea, Select } from './components/UI';
import JaxAI from './components/JaxAI';
import GitHubAgentPanel from './components/GitHubAgent';
import { supabase } from './supabase/supabase';
import { logActivity } from './lib/audit';

import { CheckInPage, ResourcesPage, ProfessionalsPage, ProviderJoinPage, ProviderStatusPage, SponsorJoinPage, OrgAccessRequestPage, LegalHubPage } from './pages/ClientViews';
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

const PUBLIC_PAGES = new Set(['checkin', 'resources', 'professionals', 'join_provider', 'provider_status', 'join_sponsor', 'request_access', 'legal']);

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
const [error, setError] = useState('');
const dialogRef = useFocusTrap({ active: true, onEscape: onClose });

const handleSubmit = async () => {
if (!form.subject || !form.message) return;
setLoading(true);
setError('');
try {
const { error: e } = await supabase.from('feedback_tickets_1777090000').insert([{ ...form, status: 'open' }]);
if (e) throw e;
setDone(true);
} catch (e) { console.error(e); setError('Could not submit feedback. Please try again.'); }
finally { setLoading(false); }
};

return (
<div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 16 }} onClick={onClose}>
<div
ref={dialogRef}
role="dialog"
aria-modal="true"
aria-labelledby="feedback-modal-title"
tabIndex={-1}
onClick={e => e.stopPropagation()}
style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: 'var(--ac-shadow-lg)' }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<SafeIcon icon={FiLightbulb} size={20} style={{ color: '#FFD700' }} />
<h2 id="feedback-modal-title" style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Feedback & Ideas</h2>
</div>
<button type="button" onClick={onClose} aria-label="Close feedback dialog" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', fontSize: 18, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<span aria-hidden="true">✕</span>
</button>
</div>
{done ? (
<div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '24px 0' }}>
<div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">✅</div>
<div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Submitted! Thank you.</div>
<Button onClick={onClose} style={{ width: '100%' }}>Close</Button>
</div>
) : (
<div className="ac-stack">
{error && (
<div role="alert" style={{ background: '#fff0f0', border: '1px solid #ffcdd2', padding: '10px 14px', borderRadius: 10, color: '#c62828', fontSize: 13 }}>
<span aria-hidden="true">⚠️ </span>{error}
</div>
)}
<div className="ac-grid-2">
<Field label="Category" htmlFor="feedback-category">
<Select id="feedback-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
options={[{ value: 'feedback', label: '💬 Feedback' }, { value: 'bug', label: '🐛 Bug Report' }, { value: 'feature', label: '🚀 Feature Request' }, { value: 'urgent', label: '🚨 Urgent Issue' }]} />
</Field>
<Field label="Priority" htmlFor="feedback-priority">
<Select id="feedback-priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
</Field>
</div>
<Field label="Subject" htmlFor="feedback-subject" required><Input id="feedback-subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary..." /></Field>
<Field label="Message" htmlFor="feedback-message" required><Textarea id="feedback-message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe your feedback or idea..." style={{ minHeight: 100 }} /></Field>
<div className="ac-grid-2">
<Button variant="outline" onClick={onClose}>Cancel</Button>
<Button icon={FiSend} onClick={handleSubmit} disabled={loading || !form.subject || !form.message} aria-busy={loading}>
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
case 'provider_status':   return <ProviderStatusPage />;
case 'join_sponsor':      return <SponsorJoinPage />;
case 'request_access':    return <OrgAccessRequestPage />;
case 'legal':             return <LegalHubPage />;
case 'my_portal':         return <ClientPortal account={clientAccount} goto={goto} />;
case 'admin':             return <ModernTriageDashboard goto={goto} role={role} userCentre={adminCentre} />;
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
<div className={cx('ac-scrim', open && 'ac-scrim-on')} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} style={{ touchAction: 'none' }} aria-hidden="true" />
<aside
  id="ac-drawer-nav"
  className={cx('ac-drawer', open && 'ac-drawer-on')}
  onClick={e => e.stopPropagation()}
  onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
  aria-label="Primary navigation drawer"
  aria-hidden={!open}
  inert={!open ? '' : undefined}
>
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
<button type="button" onClick={(e) => { e.stopPropagation(); onInstallPWA(); }} className="ac-btn ac-btn-outline"
style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13, minHeight: 44 }}>
<SafeIcon icon={FiDownload} size={14} /> Install App
</button>
</div>
)}
<nav className="ac-drawer-nav" aria-label="Main navigation">
{menuToShow.map(g => {
const groupCount = g.items.reduce((sum, it) => {
  const direct = getCounter(it.id) || 0;
  const childCount = it.children ? it.children.reduce((cs, c) => cs + (getCounter(c.id) || 0), 0) : 0;
  return sum + direct + childCount;
}, 0);
return (
<div key={g.group} role="group" aria-labelledby={`nav-group-${g.group.replace(/\s+/g,'-').toLowerCase()}`}>
<div className="ac-group-h" id={`nav-group-${g.group.replace(/\s+/g,'-').toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
<span>{g.group}</span>
{groupCount > 0 && (
<span aria-label={`${groupCount} pending`} style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
{groupCount}
</span>
)}
</div>
{g.items.map(it => {
const count = getCounter(it.id);
if (it.children) {
  const isOpen = expanded.has(it.id);
  const hasActiveChild = isChildActive(it);
  const submenuId = `nav-submenu-${it.id}`;
  return (
    <div key={it.id}>
      {/* Parent toggle button */}
      <button
        type="button"
        className={cx('ac-nav', hasActiveChild && 'ac-nav-active')}
        onClick={(e) => toggleExpanded(e, it.id)}
        aria-expanded={isOpen}
        aria-controls={submenuId}
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
        <div id={submenuId} role="group" aria-label={`${it.label} submenu`} style={{ marginLeft: 12, borderLeft: '2px solid var(--ac-border)', paddingLeft: 8, marginBottom: 4 }}>
          {it.children.map(child => {
            const childCount = getCounter(child.id);
            const isActive = current === child.id;
            return (
              <button
                key={child.id}
                type="button"
                className={cx('ac-nav', isActive && 'ac-nav-active')}
                onClick={(e) => handleNavClick(e, child.id)}
                aria-current={isActive ? 'page' : undefined}
                style={{ fontSize: 13, padding: '9px 12px' }}
              >
                <SafeIcon icon={child.icon} size={14} />
                <span style={{ flex: 1 }}>{child.label}</span>
                {childCount > 0 && (
                  <span aria-label={`${childCount} pending`} style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
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
const isActive = current === it.id;
return (
<button key={it.id} type="button" className={cx('ac-nav', isActive && 'ac-nav-active')} onClick={(e) => handleNavClick(e, it.id)} aria-current={isActive ? 'page' : undefined}>
<SafeIcon icon={it.icon} size={16} />
<span style={{ flex: 1 }}>{it.label}</span>
{count > 0 && (
<span aria-label={`${count} pending`} style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
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
<div className="ac-divider" style={{ margin: '16px 0' }} role="separator" aria-orientation="horizontal" />
<button type="button" className="ac-nav" onClick={handleLogout} style={{ color: 'var(--ac-danger)' }}>
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
const dialogRef = useFocusTrap({ active: true, onEscape: onCancel });

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
<div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }} onClick={onCancel}>
<div
ref={dialogRef}
role="dialog"
aria-modal="true"
aria-labelledby="login-modal-title"
tabIndex={-1}
onClick={e => e.stopPropagation()}
style={{ background: 'var(--ac-surface)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420, boxShadow: 'var(--ac-shadow-lg)' }}>
<div style={{ textAlign: 'center', marginBottom: 28 }}>
<DiamondLogo size={52} color="var(--ac-primary)" />
<h2 id="login-modal-title" style={{ marginTop: 14, fontWeight: 800, fontSize: 22 }}>
{type === 'sysadmin' ? 'SysAdmin Access' : 'Staff Portal Login'}
</h2>
<p className="ac-muted ac-xs" style={{ marginTop: 4 }}>Authorized Personnel Only</p>
</div>
<div role="tablist" aria-label="Authentication method" style={{ display: 'flex', background: 'var(--ac-bg)', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
{[{ id: 'password', label: 'Password', icon: FiKey }, { id: 'otp', label: 'Email OTP', icon: FiMail }].map(m => (
<button
key={m.id}
type="button"
role="tab"
aria-selected={mode === m.id}
aria-controls={`login-tabpanel-${m.id}`}
id={`login-tab-${m.id}`}
tabIndex={mode === m.id ? 0 : -1}
onClick={() => { setMode(m.id); setError(''); setOtpStep('request'); setOtpInput(''); }}
style={{ flex: 1, padding: '9px 12px', minHeight: 44, borderRadius: 9, border: 'none', cursor: 'pointer', background: mode === m.id ? 'var(--ac-surface)' : 'transparent', color: mode === m.id ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: mode === m.id ? 700 : 400, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
<SafeIcon icon={m.icon} size={13} />{m.label}
</button>
))}
</div>
{error && <div role="alert" aria-live="assertive" style={{ background: '#fff0f0', border: '1px solid #ffcdd2', padding: '10px 14px', borderRadius: 10, color: '#c62828', fontSize: 13, marginBottom: 16 }}><span aria-hidden="true">⚠️ </span>{error}</div>}
{mode === 'password' && (
<div role="tabpanel" id="login-tabpanel-password" aria-labelledby="login-tab-password" className="ac-stack">
<Field label="Staff Email" htmlFor="login-email" required><Input id="login-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@acuteconnect.health" /></Field>
<Field label="Password" htmlFor="login-password" required>
<div style={{ position: 'relative' }}>
<Input id="login-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()} placeholder="••••••••" style={{ paddingRight: 44 }} />
<button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}>
<SafeIcon icon={showPw ? FiEyeOff : FiEye} size={16} />
</button>
</div>
</Field>
<Button style={{ width: '100%' }} onClick={handlePasswordLogin} disabled={loading} aria-busy={loading}>{loading ? 'Verifying...' : 'Access Portal'}</Button>
</div>
)}
{mode === 'otp' && otpStep === 'request' && (
<div role="tabpanel" id="login-tabpanel-otp" aria-labelledby="login-tab-otp" className="ac-stack">
<Field label="Staff Email" htmlFor="login-otp-email" hint="A one-time code will be displayed here" required><Input id="login-otp-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@acuteconnect.health" /></Field>
<Button style={{ width: '100%' }} icon={FiMail} onClick={handleSendOTP} disabled={loading} aria-busy={loading}>{loading ? 'Sending...' : 'Send One-Time Code'}</Button>
</div>
)}
{mode === 'otp' && otpStep === 'sent' && (
<div role="tabpanel" id="login-tabpanel-otp" aria-labelledby="login-tab-otp" className="ac-stack">
<div role="status" aria-live="polite" style={{ background: 'var(--ac-primary-soft)', border: '1px solid var(--ac-primary)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
<SafeIcon icon={FiMail} size={28} style={{ color: 'var(--ac-primary)', marginBottom: 10 }} />
<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Code sent to <strong>{email}</strong></div>
<div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, letterSpacing: 6, color: 'var(--ac-primary)', padding: '8px 0' }} aria-label={`One-time code: ${generatedOTP.split('').join(' ')}`}>{generatedOTP}</div>
</div>
<Field label="Enter 6-Digit Code" htmlFor="login-otp-input" required>
<input id="login-otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpInput}
onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
placeholder="000000"
style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 24, fontFamily: 'monospace', fontWeight: 800, textAlign: 'center', letterSpacing: 8, outline: 'none', boxSizing: 'border-box' }}
/>
</Field>
<Button style={{ width: '100%' }} icon={FiShield} onClick={handleVerifyOTP} disabled={loading || otpInput.length < 6} aria-busy={loading}>{loading ? 'Verifying...' : 'Verify & Login'}</Button>
<div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ac-muted)' }}>
{countdown > 0 ? <span aria-live="polite">{`Resend available in ${countdown}s`}</span> :
<button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--ac-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 12, minHeight: 44, padding: '8px 12px' }}>
<SafeIcon icon={FiRefreshCw} size={11} style={{ marginRight: 4 }} />Request a new code
</button>}
</div>
</div>
)}
<button type="button" onClick={onCancel} style={{ background: 'none', border: 0, color: 'var(--ac-muted)', fontSize: 13, cursor: 'pointer', padding: '12px 0 0', width: '100%', textAlign: 'center', minHeight: 44 }}>Cancel</button>
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
  const dialogRef = useFocusTrap({ active: true, onEscape: onClose });
  const toggle = (id) => setSelected(prev =>
    prev.includes(id)
      ? prev.filter(x => x !== id)
      : prev.length < 6 ? [...prev, id] : prev
  );
  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, padding: 16 }} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        aria-describedby="picker-description"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--ac-shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 id="picker-title" style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Select Dashboard Modules</h2>
            <div id="picker-description" style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 3 }}>Choose up to 6 modules · {selected.length}/6 selected</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close module picker" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-muted)', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon icon={FiX} size={18} />
          </button>
        </div>
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="ac-sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Available dashboard modules</legend>
          <div role="group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {ALL_GRID_MODULES.map(mod => {
              const isSelected = selected.includes(mod.id);
              return (
                <button key={mod.id} type="button" role="checkbox" aria-checked={isSelected} onClick={() => toggle(mod.id)} style={{
                  padding: '12px 14px', minHeight: 44, borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${isSelected ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
                  background: isSelected ? 'var(--ac-primary-soft)' : 'var(--ac-bg)',
                  fontWeight: isSelected ? 700 : 500, fontSize: 13,
                  color: isSelected ? 'var(--ac-primary)' : 'var(--ac-text)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--ac-primary)' : 'var(--ac-border)'}`, background: isSelected ? 'var(--ac-primary)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </span>
                  {mod.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', minHeight: 44, borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ac-text)' }}>Cancel</button>
          <button type="button" onClick={() => { onSave(selected); onClose(); }} style={{ flex: 2, padding: '10px', minHeight: 44, borderRadius: 10, border: 'none', background: 'var(--ac-primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
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
return 'admin';
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
else setPage('admin');
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
<a
  href="#main-content"
  className="ac-skip-link"
  style={{
    position: 'absolute', left: 8, top: -40, zIndex: 1000,
    background: 'var(--ac-primary, #4F46E5)', color: '#fff',
    padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontWeight: 600,
    transition: 'top 0.15s ease',
  }}
  onFocus={(e) => { e.currentTarget.style.top = '8px'; }}
  onBlur={(e) => { e.currentTarget.style.top = '-40px'; }}
>
  Skip to main content
</a>
<PWAUpdatePrompt />
<SmartMenu
open={menuOpen} onClose={() => setMenuOpen(false)}
current={page} goto={handlePageChange}
role={role} onLogout={handleLogout}
showBadges={showBadges}
canInstallPWA={!!deferredPrompt} onInstallPWA={handleInstallPWA}
feedbackCount={feedbackCount}
/>

<header className="ac-top" role="banner">
<button
  type="button"
  className="ac-icon-btn ac-sidebar-toggle"
  onClick={handleMenuToggle}
  aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
  aria-expanded={menuOpen}
  aria-controls="ac-drawer-nav"
>
<SafeIcon icon={FiMenu} size={18} />
</button>
<div className="ac-brand">
<DiamondLogo size={20} color="var(--ac-primary)" />
<span>Acute Care Services</span>
{role === 'sysadmin' && <span className="ac-loc-tag" aria-label="Central location">CTR</span>}
{role === 'admin' && <span className="ac-loc-tag" aria-label="Camperdown location">CAM</span>}
{role === 'field_agent' && <span className="ac-loc-tag" aria-label="Field agent">FIELD</span>}
</div>
<div className="ac-top-actions">
{role && STAFF_ROLES.has(role) && (
<button
  type="button"
  className="ac-icon-btn ac-grid-toggle"
  onClick={() => setDashboardGridOpen(v => !v)}
  aria-label={dashboardGridOpen ? 'Switch to single module view' : 'Switch to multi-module grid view'}
  aria-pressed={dashboardGridOpen}
>
  <SafeIcon icon={FiGrid} size={16} style={{ color: dashboardGridOpen ? 'var(--ac-primary)' : undefined }} />
</button>
)}
{role === 'sysadmin' && (
<button type="button" className="ac-icon-btn" onClick={() => setGithubPanelOpen(prev => !prev)} aria-label="Open GitHub AI Agent" aria-expanded={githubPanelOpen}>
<SafeIcon icon={FiGithub} size={17} />
</button>
)}
{role === 'client' && (
<button type="button" className="ac-icon-btn" onClick={() => setPage('my_portal')} aria-label="Open my portal">
<SafeIcon icon={FiUser} size={17} />
</button>
)}
{role && role !== 'client' && (
<button type="button" className="ac-icon-btn" onClick={() => setFeedbackModalOpen(true)} aria-label="Submit feedback or ideas">
<SafeIcon icon={FiLightbulb} size={17} style={{ color: '#FFD700' }} />
</button>
)}
<button type="button" className="ac-icon-btn" onClick={() => setShowBadges(!showBadges)} aria-label={showBadges ? 'Hide notification badges' : 'Show notification badges'} aria-pressed={showBadges}>
<SafeIcon icon={showBadges ? FiEyeOff : FiEye} size={16} />
</button>
<button type="button" className="ac-icon-btn" onClick={() => setDark(!dark)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={dark}>
<SafeIcon icon={dark ? FiSun : FiMoon} size={16} />
</button>
{role && (
<span className={`ac-role-badge ac-role-badge-${role === 'sysadmin' ? 'sysadmin' : role === 'client' ? 'client' : role === 'field_agent' ? 'admin' : 'admin'}`} role="status" aria-label={`Signed in as ${role === 'sysadmin' ? 'SysAdmin' : role === 'client' ? 'Client' : role === 'field_agent' ? 'Field Agent' : 'Admin'}`}>
{role === 'sysadmin' ? 'SysAdmin' : role === 'client' ? 'Client' : role === 'field_agent' ? 'Field Agent' : 'Admin'}
</span>
)}
{!role && (
<button type="button" className="ac-icon-btn" onClick={() => setLoginModal('admin')} aria-label="Staff login">
<SafeIcon icon={FiLock} size={16} />
</button>
)}
</div>
</header>

<div className="ac-shell">
<main id="main-content" tabIndex={-1} className={`ac-main${(page === 'sysdash' || page === 'admin' || page === 'crisis') ? ' ac-main-wide' : ''}`} role="main">
{!isPublic && !role ? (
<div role="alert" style={{ textAlign: 'center', padding: '80px 20px' }}>
<div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🔒</div>
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

<JaxAI role={role} goto={handlePageChange} currentPage={page} />
<GitHubAgentPanel open={githubPanelOpen} onClose={() => setGithubPanelOpen(false)} role={role} />
{feedbackModalOpen && <FeedbackModal onClose={() => setFeedbackModalOpen(false)} role={role} />}
{pickerOpen && (
<DashboardModulePicker
  modules={dashboardModules}
  onSave={saveDashboardModules}
  onClose={() => setPickerOpen(false)}
/>
)}

<footer style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--ac-muted)', fontSize: 11, borderTop: '1px solid var(--ac-border)' }} role="contentinfo">
© Laurendi · Acute Connect v4.1.0 · Protected by AES-256
</footer>

{loginModal && <LoginModal type={loginModal} onLogin={handleLogin} onCancel={() => setLoginModal(null)} />}
</div>
</div>
);
}

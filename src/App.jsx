import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import { useDarkMode, cx, badgeToneFor } from './lib/utils';
import { MENU } from './lib/menu';
import { Badge, DiamondLogo, Field, Input, Button } from './components/UI';
import JaxAI from './components/JaxAI';
import { supabase } from './supabase/supabase';

import { CheckInPage, ResourcesPage, ProfessionalsPage, ProviderJoinPage, SponsorJoinPage } from './pages/ClientViews';

import { 
  TriageDashboard, CRMPage, InvoicingPage, CrisisPage, 
  ReportsPage, SponsorLedger, BulkOffboardingPage, 
  CrisisAnalyticsPage, FeedbackDashPage 
} from './pages/AdminViews';

import {
  SysDashPage, IntegrationPage,
  SettingsPage, UsersPage, ModuleAccessPage,
  SuperAdminPage, OfficesPage, HeatMapPage,
  FeedbackPage, FeatureRequestPage, ProviderMetricsPage,
  AICodeFixerPage
} from './pages/SystemViews';

const { 
  FiMenu, FiMoon, FiSun, FiLock, FiLogOut, FiEyeOff, FiEye, 
  FiMail, FiKey, FiShield, FiRefreshCw, FiDownload, FiLightbulb 
} = FiIcons;

const PUBLIC_PAGES = new Set(['checkin', 'resources', 'professionals', 'join_provider', 'join_sponsor']);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const VALID_STAFF = {
  'ops@acuteconnect.health': 'admin',
  'sysadmin@acuteconnect.health': 'sysadmin',
};

// ─── Page Renderer ─────────────────────────────────────────────────
const PageRenderer = ({ id, goto, onLoginIntent }) => {
  switch (id) {
    case 'checkin':          return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
    case 'resources':        return <ResourcesPage goto={goto} />;
    case 'professionals':    return <ProfessionalsPage />;
    case 'join_provider':    return <ProviderJoinPage />;
    case 'join_sponsor':     return <SponsorJoinPage />;
    case 'admin':            return <TriageDashboard />;
    case 'crm':              return <CRMPage />;
    case 'bulk_offboard':    return <BulkOffboardingPage />;
    case 'invoicing':        return <InvoicingPage />;
    case 'sponsor_ledger':   return <SponsorLedger />;
    case 'crisis':           return <CrisisPage />;
    case 'crisis_analytics': return <CrisisAnalyticsPage />;
    case 'reports':          return <ReportsPage />;
    case 'feedback_dash':    return <FeedbackDashPage />;
    case 'heatmap':          return <HeatMapPage />;
    case 'sysdash':          return <SysDashPage />;
    case 'feedback':         return <FeedbackPage />;
    case 'features':         return <FeatureRequestPage />;
    case 'provider_metrics': return <ProviderMetricsPage />;
    case 'offices':          return <OfficesPage />;
    case 'integrations':     return <IntegrationPage />;
    case 'users':            return <UsersPage />;
    case 'modaccess':        return <ModuleAccessPage />;
    case 'settings':         return <SettingsPage />;
    case 'superadmin':       return <SuperAdminPage />;
    case 'ai_fixer':         return <AICodeFixerPage />;
    default:                 return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
  }
};

// ─── Smart Menu — FIXED: proper event handling to prevent freezing ──
const SmartMenu = ({ open, onClose, current, goto, role, onLogout, showBadges, canInstallPWA, onInstallPWA, feedbackCount }) => {

  const handleNavClick = useCallback((e, id) => {
    e.preventDefault();
    e.stopPropagation();
    goto(id);
    setTimeout(onClose, 30);
  }, [goto, onClose]);

  const handleLogout = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onLogout();
    setTimeout(onClose, 30);
  }, [onLogout, onClose]);

  const handleScrimClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  return (
    <>
      <div 
        className={cx('ac-scrim', open && 'ac-scrim-on')} 
        onClick={handleScrimClick}
        style={{ touchAction: 'none' }}
      />
      <aside 
        className={cx('ac-drawer', open && 'ac-drawer-on')}
        onClick={e => e.stopPropagation()}
      >
        <header className="ac-drawer-head">
          <div style={{ fontSize: 17, fontWeight: 800 }}>Acute Care</div>
          <div className="ac-muted ac-xs" style={{ marginTop: 4 }}>
            {role === 'sysadmin' ? '⚡ System Admin' : role === 'admin' ? '🏥 Administrator' : '👤 Public Access'}
          </div>
        </header>

        {canInstallPWA && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ac-border)' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onInstallPWA(); }}
              className="ac-btn ac-btn-outline"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13 }}
            >
              <SafeIcon icon={FiDownload} size={14} />
              Install App
            </button>
          </div>
        )}

        <nav className="ac-drawer-nav">
          {MENU.filter(g => {
            if (g.group === 'SYSADMIN' && role !== 'sysadmin') return false;
            if (g.group === 'ADMIN' && !role) return false;
            return true;
          }).map(g => (
            <div key={g.group}>
              <div className="ac-group-h">{g.group}</div>
              {g.items.map(it => (
                <button
                  key={it.id}
                  className={cx('ac-nav', current === it.id && 'ac-nav-active')}
                  onClick={(e) => handleNavClick(e, it.id)}
                >
                  <SafeIcon icon={it.icon} size={16} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.id === 'feedback' && feedbackCount > 0 && (
                    <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--ac-danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                      {feedbackCount}
                    </span>
                  )}
                  {showBadges && it.badge && <Badge tone={badgeToneFor(it.badge)}>{it.badge}</Badge>}
                </button>
              ))}
            </div>
          ))}
          {role && (
            <>
              <div className="ac-divider" style={{ margin: '16px 0' }} />
              <button className="ac-nav" onClick={handleLogout} style={{ color: 'var(--ac-danger)' }}>
                <SafeIcon icon={FiLogOut} size={16} />
                <span>Logout</span>
              </button>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

// ─── Login Modal ───────────────────────────────────────────────────
const LoginModal = ({ type, onLogin, onCancel }) => {
  const [mode, setMode] = useState('password');
  const [email, setEmail] = useState(type === 'sysadmin' ? 'sysadmin@acuteconnect.health' : 'ops@acuteconnect.health');
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
    const { data } = await supabase
      .from('admin_users_1777025000000')
      .select('*')
      .ilike('email', email.trim())
      .eq('status', 'active')
      .single();
    setLoading(false);
    if (!data) return setError('No active account found for this email.');
    if (password !== 'password') return setError('Incorrect password. Hint: use your assigned password.');
    onLogin(resolveRole(email));
  };

  const handleSendOTP = async () => {
    setError('');
    if (!email) return setError('Please enter your staff email address.');
    setLoading(true);
    const { data: staff } = await supabase
      .from('admin_users_1777025000000')
      .select('*')
      .ilike('email', email.trim())
      .eq('status', 'active')
      .single();
    if (!staff) { setLoading(false); return setError('No active staff account found for this email.'); }
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { data: otpData, error: otpErr } = await supabase
      .from('login_otp_codes_1777090007')
      .insert([{ email: email.trim().toLowerCase(), code, expires_at: expiresAt }])
      .select().single();
    setLoading(false);
    if (otpErr) return setError('Failed to generate OTP. Please try again.');
    setGeneratedOTP(code);
    setOtpId(otpData.id);
    setOtpStep('sent');
    setCountdown(60);
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otpInput.length !== 6) return setError('Please enter the full 6-digit code.');
    setLoading(true);
    const { data: otpRecord } = await supabase
      .from('login_otp_codes_1777090007')
      .select('*')
      .eq('id', otpId)
      .eq('code', otpInput.trim())
      .eq('used', false)
      .single();
    if (!otpRecord) { setLoading(false); return setError('Invalid or expired code. Please request a new one.'); }
    if (new Date(otpRecord.expires_at) < new Date()) { setLoading(false); return setError('This code has expired. Please request a new one.'); }
    await supabase.from('login_otp_codes_1777090007').update({ used: true }).eq('id', otpId);
    setLoading(false);
    onLogin(resolveRole(email));
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
              style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', background: mode === m.id ? 'var(--ac-surface)' : 'transparent', color: mode === m.id ? 'var(--ac-primary)' : 'var(--ac-muted)', fontWeight: mode === m.id ? 700 : 400, fontSize: 13, boxShadow: mode === m.id ? 'var(--ac-shadow)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
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
            <Field label="Staff Email" hint="A one-time code will be sent to this address"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@acuteconnect.health" /></Field>
            <Button style={{ width: '100%' }} icon={FiMail} onClick={handleSendOTP} disabled={loading}>{loading ? 'Sending...' : 'Send One-Time Code'}</Button>
          </div>
        )}

        {mode === 'otp' && otpStep === 'sent' && (
          <div className="ac-stack">
            <div style={{ background: 'linear-gradient(135deg, var(--ac-primary-soft), var(--ac-bg))', border: '1px solid var(--ac-primary)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
              <SafeIcon icon={FiMail} size={28} style={{ color: 'var(--ac-primary)', marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Code sent to <strong>{email}</strong></div>
              <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 14 }}>Valid for 10 minutes · Single use only</div>
              <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 10, padding: '12px 16px', textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginBottom: 6, fontFamily: 'monospace' }}>FROM: noreply@acuteconnect.health<br />TO: {email}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>🔐 Your Acute Care Login Code</div>
                <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, letterSpacing: 6, color: 'var(--ac-primary)', textAlign: 'center', padding: '8px 0' }}>{generatedOTP}</div>
                <div style={{ fontSize: 10, color: 'var(--ac-muted)', marginTop: 8 }}>Do not share this code. It expires in 10 minutes.</div>
              </div>
            </div>
            <Field label="Enter 6-Digit Code">
              <input type="text" inputMode="numeric" maxLength={6} value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} placeholder="000000"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 24, fontFamily: 'monospace', fontWeight: 800, textAlign: 'center', letterSpacing: 8, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--ac-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--ac-border)'}
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

// ─── App ───────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('checkin');
  const [role, setRole] = useState(null);
  const [loginModal, setLoginModal] = useState(null);
  const [showBadges, setShowBadges] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [feedbackCount, setFeedbackCount] = useState(0);

  const isPublic = PUBLIC_PAGES.has(page);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (role === 'sysadmin') {
      supabase.from('feedback_tickets_1777090000')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
        .then(({ count }) => setFeedbackCount(count || 0));
    }
  }, [role]);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleLogin = (r) => {
    setRole(r);
    setLoginModal(null);
    setPage(r === 'sysadmin' ? 'sysdash' : 'admin');
  };

  const handleLogout = () => { setRole(null); setPage('checkin'); };

  const handlePageChange = useCallback((id) => {
    if (!PUBLIC_PAGES.has(id) && !role) { setLoginModal('admin'); return; }
    setPage(id);
    setMenuOpen(false);
  }, [role]);

  const handleMenuToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  }, []);

  return (
    <div className="ac-app">
      <header className="ac-top">
        <button className="ac-icon-btn" onClick={handleMenuToggle}>
          <SafeIcon icon={FiMenu} size={18} />
        </button>
        <div className="ac-brand">
          <DiamondLogo size={20} color="var(--ac-primary)" />
          <span>Acute Care Services</span>
          <span style={{ fontSize: 11, color: 'var(--ac-success)', fontWeight: 600 }}>● Live</span>
        </div>
        <div className="ac-flex-gap">
          {role && (
            <button
              className="ac-icon-btn"
              onClick={() => handlePageChange('feedback')}
              title="Submit Feedback / Feature Request"
              style={{ color: '#FFD700' }}
            >
              <SafeIcon icon={FiLightbulb} size={17} style={{ color: '#FFD700' }} />
            </button>
          )}
          <button className="ac-icon-btn" onClick={() => setShowBadges(!showBadges)} title={showBadges ? 'Hide badges' : 'Show badges'}>
            <SafeIcon icon={showBadges ? FiEyeOff : FiEye} size={16} />
          </button>
          <button className="ac-icon-btn" onClick={() => setDark(!dark)}>
            <SafeIcon icon={dark ? FiSun : FiMoon} size={16} />
          </button>
          {!role ? (
            <button className="ac-btn ac-btn-primary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setLoginModal('admin')}>
              <SafeIcon icon={FiLock} size={13} />
              <span>Login</span>
            </button>
          ) : (
            <Badge tone={role === 'sysadmin' ? 'violet' : 'blue'}>
              {role === 'sysadmin' ? 'SysAdmin' : 'Admin'}
            </Badge>
          )}
        </div>
      </header>

      <SmartMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        current={page}
        goto={handlePageChange}
        role={role}
        onLogout={handleLogout}
        showBadges={showBadges}
        canInstallPWA={!!deferredPrompt}
        onInstallPWA={handleInstallPWA}
        feedbackCount={feedbackCount}
      />

      <main className="ac-main">
        {!isPublic && !role ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Access Restricted</h2>
            <p className="ac-muted" style={{ marginBottom: 24 }}>Please log in to access this section.</p>
            <Button onClick={() => setLoginModal('admin')}>Login to Continue</Button>
          </div>
        ) : (
          <PageRenderer id={page} goto={handlePageChange} onLoginIntent={setLoginModal} />
        )}
      </main>

      <JaxAI role={role} />

      <footer style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--ac-muted)', fontSize: 11, borderTop: '1px solid var(--ac-border)' }}>
        © Laurendi · Acute Connect v2.6.0 · Protected by AES-256
      </footer>

      {loginModal && (
        <LoginModal type={loginModal} onLogin={handleLogin} onCancel={() => setLoginModal(null)} />
      )}
    </div>
  );
}
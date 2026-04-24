import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import { useDarkMode, cx, badgeToneFor } from './lib/utils';
import { MENU } from './lib/menu';
import { Badge, DiamondLogo, Card, Field, Input, Button } from './components/UI';
import { CheckInPage, ResourcesPage, ProfessionalsPage, ProviderJoinPage } from './pages/ClientViews';
import { AdminPage, ClientsPage, CRNPage, ReportsPage } from './pages/AdminViews';
import {
  LogsPage, SysDashPage, IntegrationPage,
  RegressionPage, SettingsPage,
  UsersPage, ModuleAccessPage, SiteMapPage,
  SuperAdminPage, OfficesPage, HeatMapPage
} from './pages/SystemViews';

const { FiMenu, FiMoon, FiSun, FiLock } = FiIcons;

const PUBLIC_PAGES = new Set(['checkin', 'resources', 'professionals', 'join_provider']);

const PageRenderer = ({ id, goto, onLoginIntent }) => {
  switch (id) {
    case 'checkin':       return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
    case 'resources':     return <ResourcesPage goto={goto} />;
    case 'professionals': return <ProfessionalsPage />;
    case 'join_provider': return <ProviderJoinPage />;
    case 'admin':         return <AdminPage />;
    case 'clients':       return <ClientsPage />;
    case 'crn':           return <CRNPage />;
    case 'reports':       return <ReportsPage />;
    case 'offices':       return <OfficesPage />;
    case 'integrations':  return <IntegrationPage />;
    case 'logs':          return <LogsPage />;
    case 'sysdash':       return <SysDashPage />;
    case 'heatmap':       return <HeatMapPage />;
    case 'users':         return <UsersPage />;
    case 'modaccess':     return <ModuleAccessPage />;
    case 'sitemap':       return <SiteMapPage />;
    case 'regression':    return <RegressionPage />;
    case 'settings':      return <SettingsPage />;
    case 'superadmin':    return <SuperAdminPage />;
    default:              return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
  }
};

const SmartMenu = ({ open, onClose, current, goto, role, onLogout }) => (
  <>
    <div className={cx('ac-scrim', open && 'ac-scrim-on')} onClick={onClose} />
    <aside className={cx('ac-drawer', open && 'ac-drawer-on')}>
      <header className="ac-drawer-head">
        <div style={{ fontSize: 17, fontWeight: 800 }}>Acute Care</div>
        <div className="ac-muted ac-xs" style={{ marginTop: 4 }}>
          {role === 'sysadmin' ? '⚡ System Admin' : role === 'admin' ? '🏥 Administrator' : '👤 Public Access'}
        </div>
      </header>
      <nav className="ac-drawer-nav">
        {MENU.filter(g => {
          if (g.group === 'SYSADMIN' && role !== 'sysadmin') return false;
          if (g.group === 'ADMINISTRATOR' && !role) return false;
          return true;
        }).map(g => (
          <div key={g.group}>
            <div className="ac-group-h">{g.group}</div>
            {g.items.map(it => (
              <button
                key={it.id}
                className={cx('ac-nav', current === it.id && 'ac-nav-active')}
                onClick={() => { goto(it.id); onClose(); }}
              >
                <SafeIcon icon={it.icon} size={16} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.badge && <Badge tone={badgeToneFor(it.badge)}>{it.badge}</Badge>}
              </button>
            ))}
          </div>
        ))}
        {role && (
          <>
            <div className="ac-divider" style={{ margin: '16px 0' }} />
            <button
              className="ac-nav"
              onClick={() => { onLogout(); onClose(); }}
              style={{ color: 'var(--ac-danger)' }}
            >
              <SafeIcon icon={FiIcons.FiLogOut} size={16} />
              <span>Logout</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  </>
);

const LoginModal = ({ type, onLogin, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: 'var(--ac-shadow-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <DiamondLogo size={48} color="var(--ac-primary)" />
        <h2 style={{ marginTop: 12, fontWeight: 800, fontSize: 20 }}>
          {type === 'sysadmin' ? 'SysAdmin Login' : 'Admin Login'}
        </h2>
        <p className="ac-muted ac-xs" style={{ marginTop: 4 }}>Authorized Personnel Only</p>
      </div>
      <div className="ac-stack">
        <Field label="Staff Email">
          <Input
            id="loginEmail"
            defaultValue={type === 'sysadmin' ? 'sysadmin@acuteconnect.health' : 'ops@acuteconnect.health'}
            placeholder="staff@acuteconnect.health"
          />
        </Field>
        <Field label="Password">
          <Input type="password" defaultValue="password" placeholder="••••••••" />
        </Field>
        <Button
          style={{ width: '100%' }}
          onClick={() => {
            const email = document.getElementById('loginEmail').value;
            onLogin(email.includes('sys') ? 'sysadmin' : 'admin');
          }}
        >
          Access Portal
        </Button>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 0, color: 'var(--ac-muted)', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default function App() {
  const [dark, setDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('checkin');
  const [role, setRole] = useState(null);
  const [loginModal, setLoginModal] = useState(null);

  const isPublic = PUBLIC_PAGES.has(page);

  const handleLogin = (r) => {
    setRole(r);
    setLoginModal(null);
    setPage(r === 'sysadmin' ? 'sysdash' : 'admin');
  };

  const handleLogout = () => {
    setRole(null);
    setPage('checkin');
  };

  const handlePageChange = (id) => {
    if (!PUBLIC_PAGES.has(id) && !role) {
      setLoginModal('admin');
      return;
    }
    setPage(id);
  };

  return (
    <div className="ac-app">
      <header className="ac-top">
        <button className="ac-icon-btn" onClick={() => setMenuOpen(true)}>
          <SafeIcon icon={FiMenu} size={18} />
        </button>
        <div className="ac-brand">
          <DiamondLogo size={20} color="var(--ac-primary)" />
          <span>Acute Care Services</span>
          <span style={{ fontSize: 11, color: 'var(--ac-success)', fontWeight: 600 }}>● Live</span>
        </div>
        <div className="ac-flex-gap">
          <button className="ac-icon-btn" onClick={() => setDark(!dark)}>
            <SafeIcon icon={dark ? FiSun : FiMoon} size={16} />
          </button>
          {!role ? (
            <button
              className="ac-btn ac-btn-primary"
              style={{ padding: '7px 14px', fontSize: 13 }}
              onClick={() => setLoginModal('admin')}
            >
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

      <footer style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--ac-muted)', fontSize: 11, borderTop: '1px solid var(--ac-border)' }}>
        © Laurendi · Acute Connect v2.4.2 · Protected by AES-256
      </footer>

      {loginModal && (
        <LoginModal
          type={loginModal}
          onLogin={handleLogin}
          onCancel={() => setLoginModal(null)}
        />
      )}
    </div>
  );
}
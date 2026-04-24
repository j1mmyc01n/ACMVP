import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import { useDarkMode, cx, badgeToneFor } from './lib/utils';
import { MENU } from './lib/menu';
import { Badge, DiamondLogo, Card, Field, Input, Button } from './components/UI';
import { CheckInPage, ResourcesPage, ProfessionalsPage, ProviderJoinPage } from './pages/ClientViews';
import { AdminPage, ClientsPage, CRNPage } from './pages/AdminViews';
import { 
  LogsPage, SysDashPage, IntegrationPage, 
  ReportsPage, RegressionPage, SettingsPage,
  UsersPage, ModuleAccessPage, SiteMapPage,
  SuperAdminPage, OfficesPage, HeatMapPage
} from './pages/SystemViews';

const { FiMenu, FiMoon, FiSun, FiLock, FiUser } = FiIcons;

const PageRenderer = ({ id, goto, onLoginIntent }) => {
  switch (id) {
    case "checkin":         return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
    case "resources":       return <ResourcesPage goto={goto} />;
    case "professionals":   return <ProfessionalsPage />;
    case "join_provider":   return <ProviderJoinPage />;
    case "admin":           return <AdminPage />;
    case "clients":         return <ClientsPage />;
    case "offices":         return <OfficesPage />;
    case "integrations":    return <IntegrationPage />;
    case "crn":             return <CRNPage />;
    case "reports":         return <ReportsPage />;
    case "logs":            return <LogsPage />;
    case "sysdash":         return <SysDashPage />;
    case "heatmap":         return <HeatMapPage />;
    case "users":           return <UsersPage />;
    case "modaccess":       return <ModuleAccessPage />;
    case "sitemap":         return <SiteMapPage />;
    case "regression":      return <RegressionPage />;
    case "settings":        return <SettingsPage />;
    case "superadmin":      return <SuperAdminPage />;
    default:                return <CheckInPage goto={goto} onLoginIntent={onLoginIntent} />;
  }
};

const SmartMenu = ({ open, onClose, current, goto, onLogout, role }) => (
  <>
    <div className={cx("ac-scrim", open && "ac-scrim-on")} onClick={onClose} />
    <aside className={cx("ac-drawer", open && "ac-drawer-on")}>
      <header className="ac-drawer-head">
        <div style={{ fontSize: 17, fontWeight: 700 }}>Acute Care</div>
        <p className="ac-muted ac-xs" style={{ marginTop: '4px' }}>
          {role ? `Logged in as: ${role === 'sysadmin' ? 'System Admin' : 'Admin'}` : 'Public Access'}
        </p>
      </header>
      <nav className="ac-drawer-nav">
        {MENU.filter(g => {
           if (g.group === "SYSADMIN" && role !== "sysadmin") return false;
           if (g.group === "ADMINISTRATOR" && !role) return false;
           return true;
        }).map((g) => (
          <div key={g.group}>
            <h4 className="ac-group-h">{g.group}</h4>
            {g.items.map((it) => (
              <button
                key={it.id}
                className={cx("ac-nav", current === it.id && "ac-nav-active")}
                onClick={() => { goto(it.id); onClose(); }}
              >
                <SafeIcon icon={it.icon} size={18} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.badge && <Badge tone={badgeToneFor(it.badge)}>{it.badge}</Badge>}
              </button>
            ))}
          </div>
        ))}
        {role && (
          <>
            <div style={{ height: 40 }} />
            <button className="ac-nav" onClick={onLogout} style={{ color: 'var(--ac-danger)', borderTop: '1px solid var(--ac-border)' }}>
              <SafeIcon icon={FiIcons.FiLogOut} size={18} />
              <span>Logout</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  </>
);

const LoginPage = ({ onLogin, type, onCancel }) => (
  <div className="ac-app">
    <div className="ac-login">
      <div className="ac-login-logo">
        <DiamondLogo size={60} color="var(--ac-primary)" />
      </div>
      <Card title={type === 'sysadmin' ? "SysAdmin Login" : "Admin Login"} subtitle="Enter your credentials to access the dashboard">
        <div className="ac-stack">
          <Field label="Staff Email">
            <Input id="loginEmail" placeholder={type === 'sysadmin' ? "sysadmin@acuteconnect.health" : "ops@acuteconnect.health"} defaultValue={type === 'sysadmin' ? "sysadmin@acuteconnect.health" : "ops@acuteconnect.health"} />
          </Field>
          <Field label="Password">
            <Input type="password" placeholder="••••••••" defaultValue="password" />
          </Field>
          <Button style={{ width: '100%' }} onClick={() => {
             const email = document.getElementById('loginEmail').value;
             onLogin(email.includes('sys') ? 'sysadmin' : 'admin');
          }}>Access Portal</Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <a href="#" className="ac-muted ac-xs" style={{ textDecoration: 'none' }}>Forgot password?</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onCancel(); }} className="ac-muted ac-xs" style={{ textDecoration: 'none', color: 'var(--ac-primary)' }}>Cancel</a>
          </div>
        </div>
      </Card>
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--ac-muted)' }}>
        Authorized Personnel Only · Protected by AES-256
      </div>
    </div>
  </div>
);

export default function App() {
  const [dark, setDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState("checkin");
  const [role, setRole] = useState(null);
  const [pendingLogin, setPendingLogin] = useState(null);

  const isPublic = page === "checkin" || page === "resources" || page === "professionals" || page === "join_provider";

  if (pendingLogin) {
    return <LoginPage type={pendingLogin} onCancel={() => setPendingLogin(null)} onLogin={(r) => { setRole(r); setPendingLogin(null); setPage(r === 'sysadmin' ? 'sysdash' : 'admin'); }} />;
  }

  if (!isPublic && !role) {
    return <LoginPage type="admin" onCancel={() => setPage('checkin')} onLogin={(r) => { setRole(r); setPage(r === 'sysadmin' ? 'sysdash' : 'admin'); }} />;
  }

  return (
    <div className="ac-app">
      <header className="ac-top">
        <button className="ac-icon-btn" onClick={() => setMenuOpen(true)}>
          <SafeIcon icon={FiMenu} size={20} />
        </button>
        <div className="ac-brand">
          <DiamondLogo size={20} color="var(--ac-primary)" />
          <span>Acute Care Services</span>
          <span style={{ fontSize: 12, color: '#34C759', fontWeight: 500, marginLeft: 8 }}>● Online</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ac-icon-btn" onClick={() => setDark(!dark)}>
            {dark ? <SafeIcon icon={FiSun} size={18} /> : <SafeIcon icon={FiMoon} size={18} />}
          </button>
          {!role && (
            <button className="ac-btn ac-btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setPendingLogin('admin')}>
              <SafeIcon icon={FiLock} size={14} />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      <SmartMenu 
        open={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        current={page} 
        goto={setPage} 
        role={role}
        onLogout={() => { setRole(null); setPage("checkin"); }}
      />

      <main className="ac-main">
        <PageRenderer id={page} goto={setPage} onLoginIntent={setPendingLogin} />
      </main>

      <footer style={{ textAlign: "center", padding: "20px", color: "var(--ac-muted)", fontSize: "12px" }}>
        © Laurendi · Acute Connect v2.4.2
      </footer>
    </div>
  );
}
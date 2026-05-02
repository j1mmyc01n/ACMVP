import * as FiIcons from 'react-icons/fi';

const {
  FiClipboard, FiBookOpen, FiGrid, FiZap, FiUsers, FiHome,
  FiBarChart2, FiSettings, FiUser, FiFileText, FiShield,
  FiColumns, FiActivity, FiCpu, FiTerminal, FiMap, FiUserPlus,
  FiMessageSquare, FiAlertCircle, FiUserMinus, FiTrendingUp,
  FiAward, FiDatabase, FiGithub, FiGlobe, FiRefreshCw, FiList,
  FiBell, FiLock, FiStar, FiDollarSign, FiInbox
} = FiIcons;

export const MENU = [
  {
    group: "CLIENT",
    items: [
      { id: "checkin", label: "Check-In", icon: FiClipboard, badge: null },
      { id: "professionals", label: "Professionals", icon: FiMap, badge: "New" },
      { id: "resources", label: "Resources", icon: FiBookOpen, badge: null },
      { id: "request_access", label: "Request Platform Access", icon: FiLock, badge: "Apply" },
    ],
  },
  {
    group: "ADMIN",
    items: [
      { id: "admin", label: "Triage Dashboard", icon: FiGrid, badge: null },
      { id: "crm", label: "Patient Directory & CRM", icon: FiUsers, badge: null },
      { id: "resource_hub", label: "Resource Hub", icon: FiBookOpen, badge: "New" },
      { id: "multicentre", label: "Multi-Centre Management", icon: FiRefreshCw, badge: null },
      { id: "bulk_offboard", label: "Bulk Offboarding", icon: FiUserMinus, badge: null },
      { id: "crisis", label: "Crisis Management", icon: FiAlertCircle, badge: null },
      { id: "reports", label: "Clinical Reports", icon: FiBarChart2, badge: null },
      { id: "admin_audit", label: "Audit Dashboard", icon: FiList, badge: "NEW" },
      { id: "admin_push_notifications", label: "Push Notifications", icon: FiBell, badge: "New" },
      { id: "loc_integrations", label: "Integrations", icon: FiZap, badge: "NEW" },
    ],
  },
  {
    group: "UPGRADES",
    items: [
      { id: "loc_integrations_ai",     label: "AI Engine",    icon: FiCpu,  badge: null },
      { id: "loc_integrations_agents", label: "Field Agents", icon: FiUser, badge: null },
    ],
  },
  {
    group: "FIELD AGENT",
    items: [
      { id: "field_agent_dash", label: "My Assigned Cases", icon: FiClipboard, badge: null },
    ],
  },
  {
    group: "SYSADMIN",
    items: [
      { id: "sysdash", label: "System Dashboard", icon: FiActivity, badge: null },
      { id: "offices", label: "Care Centres", icon: FiHome, badge: null },
      { id: "users", label: "Staff Management", icon: FiUser, badge: null },
      { id: "platform_requests", label: "Platform Requests", icon: FiInbox, badge: "NEW" },
      { id: "push_notifications", label: "Push Notifications", icon: FiBell, badge: "NEW" },
      { id: "finance_hub", label: "Finance & Partners", icon: FiDollarSign, badge: null },
      { id: "rollout", label: "Location Rollout", icon: FiGlobe, badge: "NEW" },
      {
        id: "settings", label: "Settings", icon: FiSettings, badge: null,
        children: [
          { id: "integrations",  label: "Integrations",       icon: FiZap,      badge: null },
          { id: "connectivity",  label: "Connectivity Tests",  icon: FiDatabase, badge: null },
          { id: "audit_log",     label: "Audit Log",           icon: FiList,     badge: null },
        ],
      },
      { id: "superadmin", label: "⚡ Super Admin", icon: FiTerminal, badge: null },
    ],
  },
  {
    group: "PROCEDURES & PARTNERS",
    items: [
      { id: "legal", label: "Legal Hub", icon: FiShield, badge: null },
      { id: "join_provider", label: "Join as Provider", icon: FiUserPlus, badge: "$250/mo" },
      { id: "join_sponsor", label: "Become a Sponsor", icon: FiAward, badge: "$15k" },
    ]
  }
];

export const ALL_PAGES = MENU.flatMap((g) =>
  g.items.flatMap((item) => (item.children ? [item, ...item.children] : [item]))
);
export const findPage = (id) => ALL_PAGES.find((p) => p.id === id);
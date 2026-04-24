import * as FiIcons from 'react-icons/fi';

const { 
  FiClipboard, FiBookOpen, FiGrid, FiZap, FiUsers, FiHome, 
  FiBarChart2, FiSettings, FiUser, FiFileText, FiShield, 
  FiColumns, FiActivity, FiCpu, FiTerminal, FiMap, FiUserPlus,
  FiMessageSquare, FiAlertCircle, FiUserMinus, FiPieChart, FiTrendingUp
} = FiIcons;

export const MENU = [
  {
    group: "CLIENT",
    items: [
      { id: "checkin", label: "Check-In", icon: FiClipboard, badge: null },
      { id: "professionals", label: "Professionals", icon: FiMap, badge: "New" },
      { id: "resources", label: "Resources", icon: FiBookOpen, badge: null },
    ],
  },
  {
    group: "ADMIN",
    items: [
      { id: "admin", label: "Triage Dashboard", icon: FiGrid, badge: null },
      { id: "crm", label: "Client CRM", icon: FiUsers, badge: null },
      { id: "bulk_offboard", label: "Bulk Offboarding", icon: FiUserMinus, badge: null },
      { id: "crisis", label: "Crisis Management", icon: FiAlertCircle, badge: null },
      { id: "heatmap", label: "Heat Map & Dispatch", icon: FiMap, badge: null },
      { id: "reports", label: "Clinical Reports", icon: FiBarChart2, badge: null },
      { id: "invoicing", label: "Invoicing & Billing", icon: FiFileText, badge: null },
      { id: "integrations", label: "Integrations", icon: FiZap, badge: null },
    ],
  },
  {
    group: "SYSADMIN",
    items: [
      { id: "sysdash", label: "System Dashboard", icon: FiActivity, badge: null },
      { id: "feedback", label: "Feedback & Tickets", icon: FiMessageSquare, badge: null },
      { id: "features", label: "Feature Requests", icon: FiColumns, badge: null },
      { id: "crisis_analytics", label: "Crisis Analytics", icon: FiPieChart, badge: null },
      { id: "provider_metrics", label: "Provider Metrics", icon: FiTrendingUp, badge: null },
      { id: "offices", label: "Care Centres", icon: FiHome, badge: null },
      { id: "users", label: "Staff Management", icon: FiUser, badge: null },
      { id: "modaccess", label: "Module Access", icon: FiShield, badge: null },
      { id: "settings", label: "Settings", icon: FiSettings, badge: null },
      { id: "superadmin", label: "⚡ Super Admin", icon: FiTerminal, badge: null },
    ],
  },
  {
    group: "PROVIDER",
    items: [
      { id: "join_provider", label: "Join as Provider", icon: FiUserPlus, badge: "$250/mo" },
    ]
  }
];

export const ALL_PAGES = MENU.flatMap((g) => g.items);
export const findPage = (id) => ALL_PAGES.find((p) => p.id === id);
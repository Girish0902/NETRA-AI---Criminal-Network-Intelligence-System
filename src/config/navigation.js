import {
  BellRing,
  BookMarked,
  Bot,
  BrainCircuit,
  Building2,
  ClipboardList,
  Database,
  FileLock2,
  FileSearch,
  FileText,
  KeyRound,
  LayoutDashboard,
  Map,
  Network,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserSearch,
} from "lucide-react";

export const primaryNavigation = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    key: "aiAssistant",
    label: "AI Crime Assistant",
    path: "/assistant",
    icon: Bot,
  },
  {
    key: "hotspotMap",
    label: "Hotspot Map",
    path: "/hotspots",
    icon: Map,
  },
  {
    key: "crimeTrends",
    label: "Crime Trends",
    path: "/trends",
    icon: TrendingUp,
  },
  {
    key: "patternLibrary",
    label: "Pattern Library",
    path: "/pattern-library",
    icon: BookMarked,
  },
  {
    key: "criminalNetwork",
    label: "Criminal Network",
    path: "/network",
    icon: Network,
  },
  {
    key: "repeatOffenders",
    label: "Repeat Offenders",
    path: "/repeat-records",
    icon: UserSearch,
  },
  {
    key: "predictiveIntelligence",
    label: "Predictive Intelligence",
    path: "/predictions",
    icon: BrainCircuit,
  },
  {
    key: "caseSearch",
    label: "Case Search",
    path: "/cases",
    icon: Search,
  },
  {
    key: "districtAnalysis",
    label: "District Analysis",
    path: "/districts",
    icon: Building2,
  },
  {
    key: "alerts",
    label: "Alerts",
    path: "/alerts",
    icon: BellRing,
  },
];

export const secondaryNavigation = [
  {
    key: "caseAccessRequests",
    label: "Case Access Requests",
    path: "/access-requests",
    icon: KeyRound,
  },
  {
    key: "adminConsole",
    label: "Admin Console",
    path: "/admin",
    icon: ShieldCheck,
  },
  {
    key: "reports",
    label: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    key: "auditLogs",
    label: "Audit Logs",
    path: "/audit",
    icon: ClipboardList,
  },
  {
    key: "resources",
    label: "Resources",
    path: "/resources",
    icon: Database,
  },
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export const unusedIcons = {
  ShieldAlert,
  FileSearch,
  FileLock2,
};
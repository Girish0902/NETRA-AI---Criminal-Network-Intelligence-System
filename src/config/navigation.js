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
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "AI Crime Assistant",
    path: "/assistant",
    icon: Bot,
  },
  {
    label: "Hotspot Map",
    path: "/hotspots",
    icon: Map,
  },
  {
    label: "Crime Trends",
    path: "/trends",
    icon: TrendingUp,
  },
  {
    label: "Pattern Library",
    path: "/pattern-library",
    icon: BookMarked,
  },
  {
    label: "Criminal Network",
    path: "/network",
    icon: Network,
  },
  {
    label: "Repeat Offenders",
    path: "/repeat-records",
    icon: UserSearch,
  },
  {
    label: "Predictive Intelligence",
    path: "/predictions",
    icon: BrainCircuit,
  },
  {
    label: "Case Search",
    path: "/cases",
    icon: Search,
  },
  {
    label: "District Analysis",
    path: "/districts",
    icon: Building2,
  },
  {
    label: "Alerts",
    path: "/alerts",
    icon: BellRing,
  },
];

export const secondaryNavigation = [
  {
    label: "Case Access Requests",
    path: "/access-requests",
    icon: KeyRound,
  },
  {
    label: "Admin Console",
    path: "/admin",
    icon: ShieldCheck,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    label: "Audit Logs",
    path: "/audit",
    icon: ClipboardList,
  },
  {
    label: "Resources",
    path: "/resources",
    icon: Database,
  },
  {
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
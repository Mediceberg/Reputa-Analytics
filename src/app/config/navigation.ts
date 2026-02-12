import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  PieChart,
  Settings,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';
import { FUTURE_TASKS_CONFIG } from '../protocol/futureTasks';

export type NavSection = 'pages' | 'transaction' | 'tools';

export interface NavItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  section: NavSection;
  showInMobileBottomNav?: boolean;
  isEnabled?: () => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'sidebar.dashboard',
    icon: LayoutDashboard,
    section: 'pages',
    showInMobileBottomNav: true,
  },
  {
    id: 'analytics',
    labelKey: 'sidebar.analytics',
    icon: LineChart,
    section: 'pages',
    showInMobileBottomNav: true,
  },
  {
    id: 'transactions',
    labelKey: 'sidebar.transactions',
    icon: Activity,
    section: 'pages',
  },
  {
    id: 'audit',
    labelKey: 'sidebar.audit',
    icon: FileText,
    section: 'pages',
  },
  {
    id: 'earn-points',
    labelKey: 'sidebar.earnPoints',
    icon: Sparkles,
    section: 'pages',
    showInMobileBottomNav: true,
    isEnabled: () => FUTURE_TASKS_CONFIG.enabled,
  },
  {
    id: 'portfolio',
    labelKey: 'sidebar.portfolio',
    icon: PieChart,
    section: 'transaction',
  },
  {
    id: 'wallet',
    labelKey: 'sidebar.wallet',
    icon: Wallet,
    section: 'transaction',
    showInMobileBottomNav: true,
  },
  {
    id: 'network',
    labelKey: 'Network',
    icon: Globe,
    section: 'transaction',
    showInMobileBottomNav: true,
  },
  {
    id: 'profile',
    labelKey: 'sidebar.profile',
    icon: User,
    section: 'transaction',
  },
  {
    id: 'settings',
    labelKey: 'sidebar.settings',
    icon: Settings,
    section: 'tools',
  },
  {
    id: 'feedback',
    labelKey: 'sidebar.feedback',
    icon: MessageSquare,
    section: 'tools',
  },
  {
    id: 'help',
    labelKey: 'sidebar.help',
    icon: HelpCircle,
    section: 'tools',
  },
];

const MOBILE_BOTTOM_ORDER = ['dashboard', 'wallet', 'network', 'analytics', 'earn-points'];

export const getNavItems = () =>
  NAV_ITEMS.filter((item) => (item.isEnabled ? item.isEnabled() : true));

export const getNavItemsBySection = (section: NavSection) =>
  getNavItems().filter((item) => item.section === section);

export const getMobileBottomNavItems = () => {
  const items = getNavItems().filter((item) => item.showInMobileBottomNav);
  return items.sort(
    (a, b) => MOBILE_BOTTOM_ORDER.indexOf(a.id) - MOBILE_BOTTOM_ORDER.indexOf(b.id),
  );
};

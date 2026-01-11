import type { View, TestType } from '@/types/navigation';

// Base properties shared by all nav items
interface NavItemBase {
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeAriaLabel?: string;
}

// Internal navigation item (routes within the app)
interface InternalNavItem extends NavItemBase {
  id: View;
  disabled?: boolean;
  external?: never;
}

// External navigation item (opens in new tab)
interface ExternalNavItem extends NavItemBase {
  id: string;
  external: string;
  disabled?: never;
}

// Discriminated union: either internal or external nav item
export type NavItem = InternalNavItem | ExternalNavItem;

export interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

export interface UserInfo {
  displayName: string | null;
  email: string | null;
  forumUsername: string | null;
}

export interface DashboardSidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onSignOut: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  weakQuestionCount: number;
  bookmarkCount: number;
  isTestAvailable: boolean;
  userInfo?: UserInfo;
  userId?: string;
  onProfileUpdate?: () => void;
  selectedTest: TestType;
  onTestChange: (test: TestType) => void;
  onSearch?: () => void;
}

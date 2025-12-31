import type { View, TestType } from '@/types/navigation';

export interface NavItem {
  id: View;
  label: string;
  icon: React.ElementType;
  badge?: number;
  disabled?: boolean;
}

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
  mobileMenuOpen?: boolean;
  onMobileMenuChange?: (open: boolean) => void;
  isTourActive?: boolean;
}

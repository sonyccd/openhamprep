import {
  Play,
  Zap,
  AlertTriangle,
  Bookmark,
  BarChart3,
  Menu,
  BookText,
  MapPin,
  GraduationCap,
  Book,
  Search,
  Route,
  Brain,
  FileText,
  LayoutGrid,
  Square,
  Wrench,
  Users,
} from 'lucide-react';
import { getModifierKey } from '@/lib/searchUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ProfileModal } from '@/components/ProfileModal';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { View } from '@/types/navigation';
import { SidebarNavContent } from '@/components/sidebar/SidebarNavContent';
import { LicenseSelectModal } from '@/components/LicenseSelectModal';
import {
  SidebarHeader,
  SidebarLicenseSelector,
  SidebarNavItem,
  SidebarStudyGroup,
  SidebarLearnGroup,
  SidebarFooter,
  type NavItem,
  type NavGroup,
  type DashboardSidebarProps,
} from './sidebar';

export function DashboardSidebar({
  currentView,
  onViewChange,
  onSignOut,
  isCollapsed,
  onToggleCollapse,
  weakQuestionCount,
  bookmarkCount,
  isTestAvailable,
  userInfo,
  userId,
  onProfileUpdate,
  selectedTest,
  onTestChange,
  onSearch,
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [studyExpanded, setStudyExpanded] = useState(false);
  const [learnExpanded, setLearnExpanded] = useState(false);

  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAdminPage = location.pathname === '/admin';

  // Top-level nav items (before Learn group)
  const topNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'practice-test', label: 'Practice Test', icon: Play, disabled: !isTestAvailable },
  ];

  // Learn group items (Lessons and Topics)
  const learnGroup: NavGroup = {
    id: 'learn',
    label: 'Learn',
    icon: GraduationCap,
    items: [
      { id: 'lessons', label: 'Lessons', icon: Route },
      { id: 'topics', label: 'Topics', icon: FileText },
    ],
  };

  // Study group items
  const studyGroup: NavGroup = {
    id: 'study',
    label: 'Study',
    icon: Brain,
    items: [
      { id: 'random-practice', label: 'Random Practice', icon: Zap, disabled: !isTestAvailable },
      {
        id: 'subelement-practice',
        label: 'By Subelement',
        icon: LayoutGrid,
        disabled: !isTestAvailable,
      },
      {
        id: 'chapter-practice',
        label: 'By Chapter',
        icon: Book,
        disabled: !isTestAvailable,
      },
      {
        id: 'weak-questions',
        label: 'Weak Areas',
        icon: AlertTriangle,
        badge: weakQuestionCount,
        badgeAriaLabel: weakQuestionCount === 1 ? '1 weak question' : `${weakQuestionCount} weak questions`,
        disabled: !isTestAvailable || weakQuestionCount === 0,
      },
      { id: 'bookmarks', label: 'Bookmarked', icon: Bookmark, badge: userId ? bookmarkCount : undefined, badgeAriaLabel: bookmarkCount === 1 ? '1 bookmark' : `${bookmarkCount} bookmarks`, disabled: !userId },
      { id: 'glossary-flashcards', label: 'Flashcards', icon: Square },
    ],
  };

  // Bottom nav items (after Study group)
  const bottomNavItems: NavItem[] = [
    { id: 'glossary', label: 'Glossary', icon: BookText },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'find-test-site', label: 'Find Test Site', icon: MapPin, external: 'https://hamstudy.org/sessions' },
    { id: 'forum', label: 'Community', icon: Users, external: 'https://forum.openhamprep.com/auth/oidc' },
  ];

  const handleNavClick = (view: View, disabled?: boolean) => {
    if (!disabled) {
      navigate(`/dashboard?view=${view}`);
      onViewChange(view);
      setMobileOpen(false);
    }
  };

  // One bundle so the desktop rail and the mobile drawer cannot drift apart.
  const navContentProps = {
    isCollapsed,
    onToggleCollapse,
    currentView,
    isOnAdminPage,
    topNavItems,
    bottomNavItems,
    learnGroup,
    studyGroup,
    learnExpanded,
    setLearnExpanded,
    studyExpanded,
    setStudyExpanded,
    onNavClick: handleNavClick,
    selectedTest,
    onOpenLicenseModal: () => setLicenseModalOpen(true),
    onSearch,
    onCloseMobile: () => setMobileOpen(false),
    userInfo,
    isAdmin,
    onProfileClick: () => setProfileModalOpen(true),
    onAdminClick: () => navigate('/admin'),
  };

  return (
    <>
      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onSignOut();
                setMobileOpen(false);
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Modal */}
      {userId && userInfo && onProfileUpdate && (
        <ProfileModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          userInfo={{
            displayName: userInfo.displayName,
            email: userInfo.email,
            forumUsername: userInfo.forumUsername,
          }}
          userId={userId}
          onProfileUpdate={onProfileUpdate}
          onSignOut={() => setSignOutDialogOpen(true)}
        />
      )}

      {/* License Select Modal */}
      <LicenseSelectModal
        open={licenseModalOpen}
        onOpenChange={setLicenseModalOpen}
        selectedTest={selectedTest}
        onTestChange={onTestChange}
      />

      {/* Mobile Hamburger Button - uses safe-area-inset for iOS PWA notch/Dynamic Island */}
      <div className="md:hidden fixed left-4 top-safe-top z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-card border-border shadow-lg"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Open menu</p>
            </TooltipContent>
          </Tooltip>
          <SheetContent side="left" className="w-64 p-0 bg-card border-border">
            <div className="flex flex-col h-full">
              <SidebarNavContent {...navContentProps} isMobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarNavContent {...navContentProps} />
      </div>
    </>
  );
}

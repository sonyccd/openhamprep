import {
  Play,
  Zap,
  BookOpen,
  AlertTriangle,
  Bookmark,
  BarChart3,
  Menu,
  BookText,
  MapPin,
  GraduationCap,
  Library,
} from 'lucide-react';
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
import { LicenseSelectModal } from '@/components/LicenseSelectModal';
import {
  SidebarHeader,
  SidebarLicenseSelector,
  SidebarNavItem,
  SidebarStudyGroup,
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
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [studyExpanded, setStudyExpanded] = useState(true);

  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAdminPage = location.pathname === '/admin';

  // Top-level nav items (before Study group)
  const topNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'practice-test', label: 'Practice Test', icon: Play, disabled: !isTestAvailable },
    { id: 'topics', label: 'Topics', icon: Library },
  ];

  // Study group items
  const studyGroup: NavGroup = {
    id: 'study',
    label: 'Study',
    icon: GraduationCap,
    items: [
      { id: 'random-practice', label: 'Random Practice', icon: Zap, disabled: !isTestAvailable },
      {
        id: 'subelement-practice',
        label: 'By Subelement',
        icon: BookOpen,
        disabled: !isTestAvailable,
      },
      {
        id: 'weak-questions',
        label: 'Weak Areas',
        icon: AlertTriangle,
        badge: weakQuestionCount,
        disabled: !isTestAvailable || weakQuestionCount === 0,
      },
      { id: 'bookmarks', label: 'Bookmarked', icon: Bookmark, badge: bookmarkCount },
    ],
  };

  // Bottom nav items (after Study group)
  const bottomNavItems: NavItem[] = [
    { id: 'glossary', label: 'Glossary', icon: BookText },
    { id: 'find-test-site', label: 'Find Test Site', icon: MapPin },
  ];

  const handleNavClick = (view: View, disabled?: boolean) => {
    if (!disabled) {
      navigate(`/dashboard?view=${view}`);
      onViewChange(view);
      setMobileOpen(false);
    }
  };

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const showExpanded = isMobile || !isCollapsed;

    return (
      <>
        <SidebarHeader
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onToggleCollapse={onToggleCollapse}
        />

        <SidebarLicenseSelector
          selectedTest={selectedTest}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onOpenModal={() => setLicenseModalOpen(true)}
        />

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {/* Top nav items: Dashboard, Practice Test, Topics */}
          {topNavItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={!isOnAdminPage && currentView === item.id}
              showExpanded={showExpanded}
              onClick={() => handleNavClick(item.id, item.disabled)}
            />
          ))}

          {/* Study Group - Collapsible */}
          <SidebarStudyGroup
            group={studyGroup}
            currentView={currentView}
            isOnAdminPage={isOnAdminPage}
            isExpanded={studyExpanded}
            showExpanded={showExpanded}
            onToggle={() => setStudyExpanded(!studyExpanded)}
            onNavClick={handleNavClick}
          />

          {/* Bottom nav items: Glossary, Find Test Site */}
          {bottomNavItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={!isOnAdminPage && currentView === item.id}
              showExpanded={showExpanded}
              onClick={() => handleNavClick(item.id, item.disabled)}
            />
          ))}
        </nav>

        <SidebarFooter
          userInfo={userInfo}
          isAdmin={isAdmin}
          isOnAdminPage={isOnAdminPage}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onProfileClick={() => setProfileModalOpen(true)}
          onAdminClick={() => navigate('/admin')}
          onSignOutClick={() => setSignOutDialogOpen(true)}
        />
      </>
    );
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
        />
      )}

      {/* License Select Modal */}
      <LicenseSelectModal
        open={licenseModalOpen}
        onOpenChange={setLicenseModalOpen}
        selectedTest={selectedTest}
        onTestChange={onTestChange}
      />

      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
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
              <NavContent isMobile />
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
        <NavContent />
      </div>
    </>
  );
}

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
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { ProfileModal } from '@/components/ProfileModal';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate, useLocation } from 'react-router-dom';
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

export const DashboardSidebar = ({
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
}: DashboardSidebarProps) => {
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
      <Dialog
        open={signOutDialogOpen}
        onClose={() => setSignOutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-describedby="sign-out-description"
      >
        <DialogTitle>Sign out?</DialogTitle>
        <DialogContent>
          <DialogContentText id="sign-out-description">
            Are you sure you want to sign out of your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={() => setSignOutDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              onSignOut();
              setMobileOpen(false);
              setSignOutDialogOpen(false);
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>

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

      {/*
        Mobile hamburger. top-safe-top is a Tailwind utility built on
        env(safe-area-inset-top) for the iOS PWA notch — kept as a class
        because it resolves a CSS environment variable, which is not something
        the theme models. Documented as a deliberate mix until C7.
      */}
      <Box
        className="top-safe-top"
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          left: 16,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Tooltip title="Open menu" placement="right">
          <IconButton
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 3,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <Box component={Menu} aria-hidden="true" sx={{ width: 20, height: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/*
        temporary is the variant that matches what the shadcn Sheet did — an
        overlay with a backdrop and focus trapping. Deliberately not used for
        the desktop rail: a permanent Drawer's paper is position: fixed and its
        root is flex: 0 0 auto with no width, so in AppLayout's flex row it
        would reserve nothing and overlay the content. The desktop rail is a
        plain flex Box below, which also keeps the width transition native.
      */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{
          paper: {
            sx: { width: 256, bgcolor: 'background.paper', borderColor: 'divider' },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SidebarNavContent {...navContentProps} isMobile />
        </Box>
      </Drawer>

      {/* Desktop rail */}
      <Box
        component="nav"
        aria-label="Main navigation"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          height: '100vh',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 300ms',
          width: isCollapsed ? 64 : 256,
          flexShrink: 0,
        }}
      >
        <SidebarNavContent {...navContentProps} />
      </Box>
    </>
  );
};

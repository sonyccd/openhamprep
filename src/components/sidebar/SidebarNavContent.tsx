import { Search } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { getModifierKey } from '@/lib/searchUtils';
import type { View } from '@/types/navigation';
import type { TestType } from '@/types/navigation';
import { SidebarHeader } from './SidebarHeader';
import { SidebarLicenseSelector } from './SidebarLicenseSelector';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarLearnGroup } from './SidebarLearnGroup';
import { SidebarStudyGroup } from './SidebarStudyGroup';
import { SidebarFooter } from './SidebarFooter';
import type { NavGroup, NavItem, UserInfo } from './types';

/**
 * Everything inside the sidebar, for both the desktop rail and the mobile
 * drawer.
 *
 * This was declared inside DashboardSidebar's render body. A component created
 * during render is a new type on every render, so React unmounts and remounts
 * its whole subtree rather than updating it — and DashboardSidebar re-renders
 * on any of six pieces of its own state: the mobile drawer, the profile modal,
 * the licence modal, the sign-out dialog, and each of the two expandable nav
 * groups.
 *
 * So expanding "Study" rebuilt every node in the navigation, including the
 * unrelated Dashboard button. Measured before the change by capturing a node,
 * toggling a group, and comparing identity: sameNode=false.
 *
 * It is the third instance of this pattern in the codebase, after
 * ProfileModal's five (#288), and the highest-traffic one — the sidebar is on
 * every screen.
 *
 * The prop list is long because that is what the closure was reading
 * implicitly. Passing it explicitly is the cost of the subtree surviving a
 * re-render.
 */
interface SidebarNavContentProps {
  isMobile?: boolean;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  currentView: View;
  isOnAdminPage: boolean;
  topNavItems: NavItem[];
  bottomNavItems: NavItem[];
  learnGroup: NavGroup;
  studyGroup: NavGroup;
  learnExpanded: boolean;
  setLearnExpanded: (expanded: boolean) => void;
  studyExpanded: boolean;
  setStudyExpanded: (expanded: boolean) => void;
  onNavClick: (view: View, disabled?: boolean) => void;
  selectedTest: TestType;
  onOpenLicenseModal: () => void;
  onSearch?: () => void;
  onCloseMobile: () => void;
  userInfo?: UserInfo;
  isAdmin: boolean;
  onProfileClick: () => void;
  onAdminClick: () => void;
}

export const SidebarNavContent = ({
  isMobile = false,
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
  onNavClick,
  selectedTest,
  onOpenLicenseModal,
  onSearch,
  onCloseMobile,
  userInfo,
  isAdmin,
  onProfileClick,
  onAdminClick,
}: SidebarNavContentProps) => {
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
        onOpenModal={onOpenLicenseModal}
      />

      {/* Search Button */}
      {onSearch && (
        <Box sx={{ px: 1, pt: 1 }}>
          {showExpanded ? (
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                onSearch();
                onCloseMobile();
              }}
              sx={{
                justifyContent: 'flex-start',
                gap: 1,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
              startIcon={<Box component={Search} sx={{ width: 16, height: 16 }} />}
            >
              Search...
              <Box
                component="kbd"
                sx={{
                  ml: 'auto',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: 'muted',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                }}
              >
                {getModifierKey()}K
              </Box>
            </Button>
          ) : (
            <Tooltip title={`Search (${getModifierKey()}K)`} placement="right">
              <IconButton
                onClick={onSearch}
                aria-label="Search"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <Box component={Search} aria-hidden="true" sx={{ width: 16, height: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Navigation */}
      <Stack
        component="nav"
        spacing={0.5}
        sx={{ flex: 1, py: 2, px: 1, overflowY: 'auto' }}
      >
        {/* Top nav items: Dashboard, Practice Test */}
        {topNavItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={!isOnAdminPage && currentView === item.id}
            showExpanded={showExpanded}
            onClick={() => onNavClick(item.id, item.disabled)}
          />
        ))}

        {/* Learn Group - Collapsible (Topics & Lessons) */}
        <SidebarLearnGroup
          group={learnGroup}
          currentView={currentView}
          isOnAdminPage={isOnAdminPage}
          isExpanded={learnExpanded}
          showExpanded={showExpanded}
          onToggle={() => {
            // If sidebar is collapsed, expand it and show learn submenu
            if (isCollapsed && onToggleCollapse) {
              onToggleCollapse();
              setLearnExpanded(true);
            } else {
              // Otherwise just toggle the learn submenu
              setLearnExpanded(!learnExpanded);
            }
          }}
          onNavClick={onNavClick}
        />

        {/* Study Group - Collapsible */}
        <SidebarStudyGroup
          group={studyGroup}
          currentView={currentView}
          isOnAdminPage={isOnAdminPage}
          isExpanded={studyExpanded}
          showExpanded={showExpanded}
          onToggle={() => {
            // If sidebar is collapsed, expand it and show study submenu
            if (isCollapsed && onToggleCollapse) {
              onToggleCollapse();
              setStudyExpanded(true);
            } else {
              // Otherwise just toggle the study submenu
              setStudyExpanded(!studyExpanded);
            }
          }}
          onNavClick={onNavClick}
        />

        {/* Bottom nav items: Glossary, Find Test Site */}
        {bottomNavItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={!isOnAdminPage && currentView === item.id}
            showExpanded={showExpanded}
            onClick={() => onNavClick(item.id, item.disabled)}
          />
        ))}
      </Stack>

      <SidebarFooter
        userInfo={userInfo}
        isAdmin={isAdmin}
        isOnAdminPage={isOnAdminPage}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        onProfileClick={onProfileClick}
        onAdminClick={onAdminClick}
      />
    </>
  );
};

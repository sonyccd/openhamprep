import { Play, Zap, BookOpen, AlertTriangle, Bookmark, LogOut, Radio, PanelLeftClose, PanelLeft, BarChart3, Menu, Lock, ChevronDown, BookText, Shield, MapPin, Users, ExternalLink, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileModal } from "@/components/ProfileModal";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { View, TestType, testTypes } from "@/types/navigation";
import { LicenseSelectModal } from "@/components/LicenseSelectModal";
interface NavItem {
  id: View;
  label: string;
  icon: React.ElementType;
  badge?: number;
  disabled?: boolean;
}
interface UserInfo {
  displayName: string | null;
  email: string | null;
  forumUsername: string | null;
}
interface DashboardSidebarProps {
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
  mobileMenuOpen,
  onMobileMenuChange,
  isTourActive,
}: DashboardSidebarProps) {
  // Use controlled state if provided, otherwise use local state
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const mobileOpen = mobileMenuOpen !== undefined ? mobileMenuOpen : localMobileOpen;
  const setMobileOpen = (open: boolean) => {
    if (onMobileMenuChange) {
      onMobileMenuChange(open);
    } else {
      setLocalMobileOpen(open);
    }
  };
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const {
    isAdmin
  } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAdminPage = location.pathname === '/admin';
  const getInitials = () => {
    if (userInfo?.displayName) {
      return userInfo.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userInfo?.email) {
      return userInfo.email[0].toUpperCase();
    }
    return 'U';
  };
  const navItems: NavItem[] = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3
  }, {
    id: 'practice-test',
    label: 'Practice Test',
    icon: Play,
    disabled: !isTestAvailable
  }, {
    id: 'random-practice',
    label: 'Random Practice',
    icon: Zap,
    disabled: !isTestAvailable
  }, {
    id: 'subelement-practice',
    label: 'Study by Topic',
    icon: BookOpen,
    disabled: !isTestAvailable
  }, {
    id: 'weak-questions',
    label: 'Weak Areas',
    icon: AlertTriangle,
    badge: weakQuestionCount,
    disabled: !isTestAvailable || weakQuestionCount === 0
  }, {
    id: 'bookmarks',
    label: 'Bookmarked',
    icon: Bookmark,
    badge: bookmarkCount
  }, {
    id: 'glossary',
    label: 'Glossary',
    icon: BookText
  }, {
    id: 'find-test-site',
    label: 'Find Test Site',
    icon: MapPin
  }];
  const handleNavClick = (view: View, disabled?: boolean) => {
    if (!disabled) {
      // Navigate to dashboard with the selected view
      navigate(`/dashboard?view=${view}`);
      onViewChange(view);
      setMobileOpen(false);
    }
  };
  const currentTest = testTypes.find(t => t.id === selectedTest);

  const licenseIcons: Record<TestType, React.ElementType> = {
    technician: Radio,
    general: Zap,
    extra: Award,
  };
  const CurrentLicenseIcon = licenseIcons[selectedTest];
  const NavContent = ({
    isMobile = false
  }: {
    isMobile?: boolean;
  }) => <>
      {/* Header with Logo */}
      <div className={cn("flex items-center h-14 border-b border-border px-4", !isMobile && isCollapsed ? "justify-center" : "justify-between")}>
        {(isMobile || !isCollapsed) && <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <span className="font-mono font-bold text-foreground text-sm">
              <span className="text-primary">Open Ham Prep</span>
            </span>
          </div>}
        {!isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleCollapse} 
                className="h-7 w-7 shrink-0"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <PanelLeft className="w-4 h-4" aria-hidden="true" /> : <PanelLeftClose className="w-4 h-4" aria-hidden="true" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Test Type Selector */}
      <div className={cn("border-b border-border", !isMobile && isCollapsed ? "p-2" : "p-3")} data-tour="license-selector">
        {isMobile || !isCollapsed ? <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">License Class</label>
            <button
              onClick={() => setLicenseModalOpen(true)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-muted-foreground/50 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                <CurrentLicenseIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{currentTest?.name}</span>
              </div>
            </button>
          </div> : <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setLicenseModalOpen(true)}
                className="w-full flex items-center justify-center p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors"
              >
                <CurrentLicenseIcon className="w-4 h-4 text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border-border">
              <p className="font-medium">{currentTest?.name}</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </TooltipContent>
          </Tooltip>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
        // Don't highlight nav items when on admin page
        const isActive = !isOnAdminPage && currentView === item.id;
        const Icon = item.icon;
        const showExpanded = isMobile || !isCollapsed;
        const buttonContent = <button onClick={() => handleNavClick(item.id, item.disabled)} disabled={item.disabled} data-tour={item.id} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors", isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary", item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground", !showExpanded && "justify-center px-2")}>
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>}
              </div>
              {showExpanded && <span className="text-sm font-medium truncate">{item.label}</span>}
            </button>;
        if (!showExpanded) {
          return <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-border">
                  <p>{item.label}</p>
                  {item.badge !== undefined && item.badge > 0 && <span className="text-xs text-muted-foreground ml-1">({item.badge})</span>}
                </TooltipContent>
              </Tooltip>;
        }
        return <div key={item.id}>{buttonContent}</div>;
      })}

        {/* Community Link - External */}
        {(() => {
          const showExpanded = isMobile || !isCollapsed;
          const communityLink = (
            <a
              href="https://forum.openhamprep.com/"
              target="_blank"
              rel="noopener noreferrer"
              data-tour="forum"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-secondary",
                !showExpanded && "justify-center px-2"
              )}
            >
              <div className="relative shrink-0">
                <Users className="w-5 h-5" />
              </div>
              {showExpanded && (
                <span className="text-sm font-medium truncate flex items-center gap-1">
                  Forum
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </a>
          );

          if (!showExpanded) {
            return (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  {communityLink}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-border">
                  <p>Forum</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          return communityLink;
        })()}
      </nav>

      {/* Footer with User Profile */}
      <div className="border-t border-border">
        {/* User Profile Section */}
        <div className={cn("p-3 border-b border-border", !isMobile && isCollapsed && "flex justify-center")}>
          {isMobile || !isCollapsed ? <button onClick={() => setProfileModalOpen(true)} className="w-full flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-secondary transition-colors">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {userInfo?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userInfo?.email || ''}
                </p>
              </div>
            </button> : <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={() => setProfileModalOpen(true)} className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">
                <p className="font-medium">{userInfo?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{userInfo?.email}</p>
              </TooltipContent>
            </Tooltip>}
        </div>

        {/* Admin Link */}
        {isAdmin && <div className={cn("p-2 border-b border-border", !isMobile && isCollapsed && "flex justify-center")}>
            {!isMobile && isCollapsed ? <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className={cn("w-full h-10", isOnAdminPage ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}>
                    <Shield className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-border">
                  <p>Admin Dashboard</p>
                </TooltipContent>
              </Tooltip> : <Button variant="ghost" onClick={() => navigate('/admin')} className={cn("w-full justify-start gap-3", isOnAdminPage ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}>
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Admin</span>
              </Button>}
          </div>}

        {/* Sign Out */}
        <div className="p-2">
          {!isMobile && isCollapsed ? <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setSignOutDialogOpen(true)} className="w-full h-10 text-muted-foreground hover:text-destructive">
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">
                <p>Sign Out</p>
              </TooltipContent>
            </Tooltip> : <Button variant="ghost" onClick={() => setSignOutDialogOpen(true)} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </Button>}
        </div>
      </div>
    </>;
  return <>
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
            <AlertDialogAction onClick={() => {
            onSignOut();
            setMobileOpen(false);
          }}>
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Modal */}
      {userId && userInfo && onProfileUpdate && <ProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} userInfo={{
      displayName: userInfo.displayName,
      email: userInfo.email,
      forumUsername: userInfo.forumUsername
    }} userId={userId} onProfileUpdate={onProfileUpdate} />}

      {/* License Select Modal */}
      <LicenseSelectModal
        open={licenseModalOpen}
        onOpenChange={setLicenseModalOpen}
        selectedTest={selectedTest}
        onTestChange={onTestChange}
      />

      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={(open) => {
          // Prevent closing when tour is active
          if (!open && isTourActive) return;
          setMobileOpen(open);
        }}>
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
      <div className={cn("hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
        <NavContent />
      </div>
    </>;
}
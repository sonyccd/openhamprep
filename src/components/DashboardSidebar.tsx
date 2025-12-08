import { Play, Zap, BookOpen, AlertTriangle, Bookmark, LogOut, Radio, PanelLeftClose, PanelLeft, BarChart3, Menu, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileModal } from "@/components/ProfileModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export type TestType = 'technician' | 'general' | 'extra';

export const testTypes = [
  { id: 'technician' as TestType, name: 'Technician', available: true },
  { id: 'general' as TestType, name: 'General', available: false },
  { id: 'extra' as TestType, name: 'Amateur Extra', available: false },
];

type View = 'dashboard' | 'practice-test' | 'random-practice' | 'weak-questions' | 'bookmarks' | 'subelement-practice' | 'review-test';
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
  onTestChange
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
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
  }];
  const handleNavClick = (view: View, disabled?: boolean) => {
    if (!disabled) {
      onViewChange(view);
      setMobileOpen(false);
    }
  };
  const currentTest = testTypes.find(t => t.id === selectedTest);

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
              <span className="text-primary">RARS Test Prep</span>
            </span>
          </div>}
        {!isMobile && isCollapsed && <Radio className="w-5 h-5 text-primary" />}
        {!isMobile && <Button variant="ghost" size="icon" onClick={onToggleCollapse} className={cn("h-7 w-7 shrink-0", isCollapsed && "hidden md:flex")}>
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>}
      </div>

      {/* Test Type Selector */}
      <div className={cn("border-b border-border", !isMobile && isCollapsed ? "p-2" : "p-3")}>
        {(isMobile || !isCollapsed) ? (
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">License Class</label>
            <Select value={selectedTest} onValueChange={(v) => {
              const test = testTypes.find(t => t.id === v);
              if (test?.available) {
                onTestChange(v as TestType);
              }
            }}>
              <SelectTrigger className="w-full bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {testTypes.map((test) => (
                  <SelectItem 
                    key={test.id} 
                    value={test.id}
                    disabled={!test.available}
                    className={cn(!test.available && "opacity-50 cursor-not-allowed")}
                  >
                    <span className="flex items-center gap-2">
                      {test.name}
                      {!test.available && (
                        <span className="text-[10px] text-muted-foreground ml-1">(Coming Soon)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!currentTest?.available && (
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Coming Soon
              </span>
            )}
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button className="w-full flex items-center justify-center p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors">
                <span className="text-xs font-bold text-primary">{selectedTest[0].toUpperCase()}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border-border">
              <p className="font-medium">{currentTest?.name}</p>
              {!currentTest?.available && (
                <p className="text-xs text-muted-foreground">Coming Soon</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
        const isActive = currentView === item.id;
        const Icon = item.icon;
        const showExpanded = isMobile || !isCollapsed;
        const buttonContent = <button onClick={() => handleNavClick(item.id, item.disabled)} disabled={item.disabled} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors", isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary", item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground", !showExpanded && "justify-center px-2")}>
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
      email: userInfo.email
    }} userId={userId} onProfileUpdate={onProfileUpdate} />}

      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-card border-border shadow-lg">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
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
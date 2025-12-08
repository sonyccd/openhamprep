import { 
  Play, 
  Zap, 
  BookOpen, 
  AlertTriangle, 
  Bookmark, 
  LogOut,
  Radio,
  PanelLeftClose,
  PanelLeft,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type View = 'dashboard' | 'practice-test' | 'random-practice' | 'weak-questions' | 'bookmarks' | 'subelement-practice' | 'review-test';

interface NavItem {
  id: View;
  label: string;
  icon: React.ElementType;
  badge?: number;
  disabled?: boolean;
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
}: DashboardSidebarProps) {
  const navItems: NavItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3,
    },
    { 
      id: 'practice-test', 
      label: 'Practice Test', 
      icon: Play,
      disabled: !isTestAvailable,
    },
    { 
      id: 'random-practice', 
      label: 'Random Practice', 
      icon: Zap,
      disabled: !isTestAvailable,
    },
    { 
      id: 'subelement-practice', 
      label: 'Study by Topic', 
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
    { 
      id: 'bookmarks', 
      label: 'Bookmarked', 
      icon: Bookmark,
      badge: bookmarkCount,
    },
  ];

  return (
    <div 
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-border px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-primary" />
            <span className="font-mono font-bold text-foreground">
              <span className="text-primary">RARS</span>
            </span>
          </div>
        )}
        {isCollapsed && (
          <Radio className="w-6 h-6 text-primary" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className={cn("h-8 w-8 shrink-0", isCollapsed && "hidden md:flex")}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          const buttonContent = (
            <button
              onClick={() => !item.disabled && onViewChange(item.id)}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-border">
                  <p>{item.label}</p>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">({item.badge})</span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.id}>{buttonContent}</div>;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                className="w-full h-10 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border-border">
              <p>Sign Out</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </Button>
        )}
      </div>
    </div>
  );
}

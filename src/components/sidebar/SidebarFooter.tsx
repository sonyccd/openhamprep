import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { UserInfo } from './types';

interface SidebarFooterProps {
  userInfo?: UserInfo;
  isAdmin: boolean;
  isOnAdminPage: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  onProfileClick: () => void;
  onAdminClick: () => void;
}

export function SidebarFooter({
  userInfo,
  isAdmin,
  isOnAdminPage,
  isCollapsed,
  isMobile,
  onProfileClick,
  onAdminClick,
}: SidebarFooterProps) {
  const showExpanded = isMobile || !isCollapsed;

  const getInitials = () => {
    if (userInfo?.displayName) {
      return userInfo.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (userInfo?.email) {
      return userInfo.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="border-t border-border">
      {/* Admin Link */}
      {isAdmin && (
        <div
          className={cn(
            'p-2 border-b border-border',
            !isMobile && isCollapsed && 'flex justify-center'
          )}
        >
          {!showExpanded ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAdminClick}
                  className={cn(
                    'w-full h-10',
                    isOnAdminPage
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Shield className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">
                <p>Admin Dashboard</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={onAdminClick}
              className={cn(
                'w-full justify-start gap-3',
                isOnAdminPage
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Shield className="w-5 h-5" />
              <span className="text-base font-medium">Admin</span>
            </Button>
          )}
        </div>
      )}

      {/* User Profile Section */}
      <div
        className={cn(
          'p-3',
          !isMobile && isCollapsed && 'flex justify-center'
        )}
      >
        {showExpanded ? (
          <button
            onClick={onProfileClick}
            className="w-full flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {userInfo?.displayName || 'User'}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {userInfo?.email || ''}
              </p>
            </div>
          </button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={onProfileClick}
                className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
              >
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
          </Tooltip>
        )}
      </div>
    </div>
  );
}

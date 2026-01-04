import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavGroup, NavItem } from './types';
import type { View } from '@/types/navigation';

interface SidebarStudyGroupProps {
  group: NavGroup;
  currentView: View;
  isOnAdminPage: boolean;
  isExpanded: boolean;
  showExpanded: boolean;
  onToggle: () => void;
  onNavClick: (view: View, disabled?: boolean) => void;
}

export function SidebarStudyGroup({
  group,
  currentView,
  isOnAdminPage,
  isExpanded,
  showExpanded,
  onToggle,
  onNavClick,
}: SidebarStudyGroupProps) {
  const StudyIcon = group.icon;
  const totalBadge = group.items.reduce((sum, item) => sum + (item.badge || 0), 0);
  const isStudyItemActive = group.items.some(
    (item) => !isOnAdminPage && currentView === item.id
  );

  if (!showExpanded) {
    // Collapsed: show Study icon with tooltip listing items
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            aria-label={`Study menu${totalBadge > 0 ? `, ${totalBadge} items need attention` : ''}`}
            aria-expanded={isExpanded}
            className={cn(
              'w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-colors',
              isStudyItemActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <div className="relative shrink-0">
              <StudyIcon className="w-5 h-5" aria-hidden="true" />
              {totalBadge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center" aria-hidden="true">
                  {totalBadge > 9 ? '9+' : totalBadge}
                </span>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-popover border-border">
          <p className="font-medium">Study</p>
          <p className="text-xs text-muted-foreground">
            Random, Topics, Weak Areas, Bookmarks
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-1">
      {/* Study header - clickable to expand/collapse */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="study-group-items"
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          isStudyItemActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        <div className="relative shrink-0">
          <StudyIcon className="w-5 h-5" aria-hidden="true" />
          {totalBadge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center" aria-hidden="true">
              {totalBadge > 9 ? '9+' : totalBadge}
            </span>
          )}
        </div>
        <span className="text-sm font-medium truncate flex-1 text-left">{group.label}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        )}
        {totalBadge > 0 && (
          <span className="sr-only">, {totalBadge} items need attention</span>
        )}
      </button>

      {/* Study items - shown when expanded */}
      {isExpanded && (
        <div id="study-group-items" className="ml-4 pl-2 border-l border-border space-y-1">
          {group.items.map((item) => {
            const isActive = !isOnAdminPage && currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id, item.disabled)}
                disabled={item.disabled}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  item.disabled &&
                    'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground'
                )}
              >
                <div className="relative shrink-0">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center" aria-hidden="true">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="font-medium truncate">{item.label}</span>
                {item.badgeAriaLabel && (
                  <span className="sr-only">, {item.badgeAriaLabel}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

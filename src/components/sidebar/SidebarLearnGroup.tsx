import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavGroup, NavItem } from './types';
import type { View } from '@/types/navigation';

interface SidebarLearnGroupProps {
  group: NavGroup;
  currentView: View;
  isOnAdminPage: boolean;
  isExpanded: boolean;
  showExpanded: boolean;
  onToggle: () => void;
  onNavClick: (view: View, disabled?: boolean) => void;
}

export function SidebarLearnGroup({
  group,
  currentView,
  isOnAdminPage,
  isExpanded,
  showExpanded,
  onToggle,
  onNavClick,
}: SidebarLearnGroupProps) {
  const LearnIcon = group.icon;
  const isLearnItemActive = group.items.some(
    (item) => !isOnAdminPage && (currentView === item.id ||
      (item.id === 'topics' && currentView === 'topic-detail') ||
      (item.id === 'lessons' && currentView === 'lesson-detail'))
  );

  if (!showExpanded) {
    // Collapsed: show Learn icon with tooltip listing items
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            aria-label="Learn menu"
            aria-expanded={isExpanded}
            className={cn(
              'w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-colors',
              isLearnItemActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <div className="relative shrink-0">
              <LearnIcon className="w-5 h-5" aria-hidden="true" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-popover border-border">
          <p className="font-medium">Learn</p>
          <p className="text-xs text-muted-foreground">
            Topics, Lessons
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-1">
      {/* Learn header - clickable to expand/collapse */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="learn-group-items"
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          isLearnItemActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        <div className="relative shrink-0">
          <LearnIcon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium truncate flex-1 text-left">{group.label}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        )}
      </button>

      {/* Learn items - shown when expanded */}
      {isExpanded && (
        <div id="learn-group-items" className="ml-4 pl-2 border-l border-border space-y-1">
          {group.items.map((item) => {
            const isActive = !isOnAdminPage && (
              currentView === item.id ||
              (item.id === 'topics' && currentView === 'topic-detail') ||
              (item.id === 'lessons' && currentView === 'lesson-detail')
            );
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
                </div>
                <span className="font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

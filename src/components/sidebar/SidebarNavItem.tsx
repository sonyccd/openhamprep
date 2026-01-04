import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavItem } from './types';

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  showExpanded: boolean;
  onClick: () => void;
}

export function SidebarNavItem({
  item,
  isActive,
  showExpanded,
  onClick,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  const buttonContent = (
    <button
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
        item.disabled &&
          'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
        !showExpanded && 'justify-center px-2'
      )}
    >
      <div className="relative shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      {showExpanded && (
        <span className="text-base font-medium truncate">{item.label}</span>
      )}
    </button>
  );

  if (!showExpanded) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right" className="bg-popover border-border">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div>{buttonContent}</div>;
}

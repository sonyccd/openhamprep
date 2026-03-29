import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { OHPLogo } from '@/components/OHPLogo';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse: () => void;
}

export function SidebarHeader({
  isCollapsed,
  isMobile,
  onToggleCollapse,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center h-14 border-b border-border px-4',
        !isMobile && isCollapsed ? 'justify-center' : 'justify-between'
      )}
    >
      {(isMobile || !isCollapsed) && (
        <div className="flex items-center">
          <OHPLogo variant="horizontal" className="h-9 w-auto" />
        </div>
      )}
      {!isMobile && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-7 w-7 shrink-0"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

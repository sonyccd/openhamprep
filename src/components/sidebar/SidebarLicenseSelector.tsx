import { Radio, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { testTypes, type TestType } from '@/types/navigation';

interface SidebarLicenseSelectorProps {
  selectedTest: TestType;
  isCollapsed: boolean;
  isMobile: boolean;
  onOpenModal: () => void;
}

const licenseIcons: Record<TestType, React.ElementType> = {
  technician: Radio,
  general: Zap,
  extra: Award,
};

export function SidebarLicenseSelector({
  selectedTest,
  isCollapsed,
  isMobile,
  onOpenModal,
}: SidebarLicenseSelectorProps) {
  const currentTest = testTypes.find((t) => t.id === selectedTest);
  const CurrentLicenseIcon = licenseIcons[selectedTest];
  const showExpanded = isMobile || !isCollapsed;

  return (
    <div
      className={cn('border-b border-border', !isMobile && isCollapsed ? 'p-2' : 'p-3')}
      data-tour="license-selector"
    >
      {showExpanded ? (
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
            License Class
          </label>
          <button
            onClick={onOpenModal}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-muted-foreground/50 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <CurrentLicenseIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">
                {currentTest?.name}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenModal}
              className="w-full flex items-center justify-center p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors"
            >
              <CurrentLicenseIcon className="w-4 h-4 text-primary" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-popover border-border">
            <p className="font-medium">{currentTest?.name}</p>
            <p className="text-xs text-muted-foreground">Click to change</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

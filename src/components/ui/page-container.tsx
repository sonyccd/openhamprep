import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  /** Max-width tier: narrow (2xl), standard (3xl), wide (5xl), full (7xl) */
  width?: 'narrow' | 'standard' | 'wide' | 'full';
  /** Add extra bottom padding for mobile nav (for views with bottom action buttons) */
  mobileNavPadding?: boolean;
  /** Apply the radio-wave background effect */
  radioWaveBg?: boolean;
  /** Additional className for the outer container */
  className?: string;
  /** Additional className for the inner content container */
  contentClassName?: string;
}

const widthClasses = {
  narrow: 'max-w-2xl',
  standard: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-7xl',
};

export function PageContainer({
  children,
  width = 'standard',
  mobileNavPadding = false,
  radioWaveBg = false,
  className,
  contentClassName,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto',
        'py-8 md:py-12 px-4 md:px-8',
        mobileNavPadding && 'pb-24 md:pb-8',
        radioWaveBg && 'radio-wave-bg',
        className
      )}
    >
      <div className={cn(widthClasses[width], 'mx-auto', contentClassName)}>
        {children}
      </div>
    </div>
  );
}

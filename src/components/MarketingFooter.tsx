import { cn } from "@/lib/utils";

interface MarketingFooterProps {
  className?: string;
  showOpenSource?: boolean;
}

export function MarketingFooter({ className, showOpenSource = true }: MarketingFooterProps) {
  const tagline = showOpenSource
    ? "Official FCC question pools • Free to use • Open Source"
    : "Official FCC question pools • Free to use";

  return (
    <footer className={cn("py-8 px-4 border-t border-border", className)}>
      <div className="max-w-6xl mx-auto text-center text-muted-foreground space-y-3">
        <p className="text-sm">{tagline}</p>
        <p className="text-sm">Made with ❤️ in North Carolina</p>
        <p className="text-xs mt-4">© {new Date().getFullYear()} Brad Bazemore. All rights reserved.</p>
      </div>
    </footer>
  );
}

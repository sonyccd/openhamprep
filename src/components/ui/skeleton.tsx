import { cn } from "@/lib/utils";

// data-testid rather than a role: a skeleton is a visual placeholder with no
// semantic meaning of its own, and marking each one role="status" would make
// assistive tech announce every block of a loading screen.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-testid="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

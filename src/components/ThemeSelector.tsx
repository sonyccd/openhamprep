import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => value && setTheme(value)}
      className="justify-start"
    >
      <ToggleGroupItem value="light" aria-label="Light theme" className="gap-2">
        <Sun className="h-4 w-4" />
        <span className="text-xs">Light</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark theme" className="gap-2">
        <Moon className="h-4 w-4" />
        <span className="text-xs">Dark</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System theme" className="gap-2">
        <Monitor className="h-4 w-4" />
        <span className="text-xs">System</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

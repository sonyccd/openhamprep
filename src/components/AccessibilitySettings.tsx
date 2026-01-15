import { Type, Bold, ZoomIn } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAccessibility, FontFamily } from "@/hooks/useAccessibility";

export function AccessibilitySettings() {
  const {
    fontFamily,
    setFontFamily,
    boldText,
    setBoldText,
    largeFont,
    setLargeFont,
  } = useAccessibility();

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Type className="w-4 h-4" />
          Font
        </div>
        <ToggleGroup
          type="single"
          value={fontFamily}
          onValueChange={(value) => value && setFontFamily(value as FontFamily)}
          className="justify-start flex-wrap"
        >
          <ToggleGroupItem value="default" aria-label="Default font" className="text-xs">
            Default
          </ToggleGroupItem>
          <ToggleGroupItem value="dyslexic" aria-label="OpenDyslexic font" className="text-xs">
            OpenDyslexic
          </ToggleGroupItem>
          <ToggleGroupItem value="arimo" aria-label="Arimo font" className="text-xs">
            Arimo
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          OpenDyslexic is designed to help readers with dyslexia
        </p>
      </div>

      {/* Bold All Text */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bold className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="bold-text" className="text-sm font-medium cursor-pointer">
              Bold All Text
            </Label>
            <p className="text-xs text-muted-foreground">
              Make all text bold for better readability
            </p>
          </div>
        </div>
        <Switch
          id="bold-text"
          checked={boldText}
          onCheckedChange={setBoldText}
        />
      </div>

      {/* Extra Large Text */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ZoomIn className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="large-font" className="text-sm font-medium cursor-pointer">
              Extra Large Text
            </Label>
            <p className="text-xs text-muted-foreground">
              Increase text size throughout the app
            </p>
          </div>
        </div>
        <Switch
          id="large-font"
          checked={largeFont}
          onCheckedChange={setLargeFont}
        />
      </div>
    </div>
  );
}

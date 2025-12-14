import { useState } from "react";
import { Radio, Zap, Award, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TestType, testTypes, testConfig } from "@/types/navigation";

interface WelcomeModalProps {
  open: boolean;
  onComplete: (selectedLicense: TestType) => void;
  onSkip: () => void;
}

const licenseIcons: Record<TestType, React.ElementType> = {
  technician: Radio,
  general: Zap,
  extra: Award,
};

const licenseDescriptions: Record<TestType, string> = {
  technician: "Perfect for beginners. Start your ham radio journey here!",
  general: "Expanded HF privileges for experienced operators.",
  extra: "Full amateur privileges. The ultimate license.",
};

export function WelcomeModal({ open, onComplete, onSkip }: WelcomeModalProps) {
  const [selectedLicense, setSelectedLicense] = useState<TestType>("technician");

  const handleContinue = () => {
    onComplete(selectedLicense);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-[90vw] max-w-md p-4 sm:p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-1 sm:pb-2">
          <div className="mx-auto mb-2 sm:mb-4 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
          </div>
          <DialogTitle className="text-lg sm:text-xl">Welcome to Open Ham Prep!</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Which license are you studying for?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2 sm:py-4">
          {testTypes.map((test) => {
            const Icon = licenseIcons[test.id];
            const config = testConfig[test.id];
            const isSelected = selectedLicense === test.id;

            return (
              <button
                key={test.id}
                onClick={() => test.available && setSelectedLicense(test.id)}
                disabled={!test.available}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 hover:bg-secondary/50",
                  !test.available && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    {test.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{config.questionCount} questions</span>
                    <span>{config.passingScore} to pass</span>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground text-sm"
            size="sm"
          >
            Skip tour
          </Button>
          <Button onClick={handleContinue} className="gap-2" size="sm">
            Continue
            <Sparkles className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

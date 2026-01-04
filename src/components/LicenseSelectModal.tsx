import { useState } from "react";
import { Radio, Zap, Award, ChevronRight } from "lucide-react";
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

interface LicenseSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTest: TestType;
  onTestChange: (test: TestType) => void;
}

const licenseIcons: Record<TestType, React.ElementType> = {
  technician: Radio,
  general: Zap,
  extra: Award,
};

const licenseDescriptions: Record<TestType, string> = {
  technician: "Entry-level license for new operators. 35 questions, need 26 to pass.",
  general: "Expanded HF privileges. 35 questions, need 26 to pass.",
  extra: "Full amateur privileges. 50 questions, need 37 to pass.",
};

export function LicenseSelectModal({
  open,
  onOpenChange,
  selectedTest,
  onTestChange,
}: LicenseSelectModalProps) {
  const [pendingSelection, setPendingSelection] = useState<TestType>(selectedTest);

  // Reset pending selection when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPendingSelection(selectedTest);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (pendingSelection !== selectedTest) {
      onTestChange(pendingSelection);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPendingSelection(selectedTest);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select License Class</DialogTitle>
          <DialogDescription>
            Choose which amateur radio license exam you want to study for.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {testTypes.map((test) => {
            const Icon = licenseIcons[test.id];
            const config = testConfig[test.id];
            const isSelected = pendingSelection === test.id;
            const isCurrent = selectedTest === test.id;

            return (
              <button
                key={test.id}
                onClick={() => test.available && setPendingSelection(test.id)}
                disabled={!test.available}
                aria-label={`${test.name} license: ${licenseDescriptions[test.id]}${isCurrent ? ' (currently selected)' : ''}${!test.available ? ' (coming soon)' : ''}`}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 hover:bg-secondary/50",
                  !test.available && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-semibold",
                        isSelected ? "text-foreground" : "text-foreground"
                      )}
                    >
                      {test.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                    {!test.available && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {licenseDescriptions[test.id]}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{config.questionCount} questions</span>
                    <span>{config.passingScore} to pass</span>
                    <span>74% passing</span>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={pendingSelection === selectedTest}
          >
            {pendingSelection === selectedTest ? "No Change" : "Change License"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

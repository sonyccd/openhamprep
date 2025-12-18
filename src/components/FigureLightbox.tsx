import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FigureLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  figureUrl: string;
  questionId: string;
}

export function FigureLightbox({ isOpen, onClose, figureUrl, questionId }: FigureLightboxProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/90",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "flex flex-col items-center justify-center",
            "max-w-[90vw] max-h-[90vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "focus:outline-none"
          )}
        >
          <img
            src={figureUrl}
            alt={`Figure for question ${questionId}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />
          <p className="mt-3 text-sm text-white/80 font-mono">
            {questionId}
          </p>
          <DialogPrimitive.Close
            className={cn(
              "absolute -top-2 -right-2 md:top-2 md:right-2",
              "rounded-full bg-background/90 p-2",
              "opacity-90 hover:opacity-100 transition-opacity",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

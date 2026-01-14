import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && <ToastDescription className="mt-1">{description}</ToastDescription>}
                </div>
                <ToastClose />
              </div>
              {action && <div className="flex justify-end">{action}</div>}
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

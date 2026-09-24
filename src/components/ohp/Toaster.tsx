import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * sonner is the app's toast system, a deliberate exception to the MUI-only
 * rule (docs/MUI_MIGRATION_STRATEGY.md §5.3).
 *
 * It follows the theme through its own CSS custom properties, fed from MUI's
 * palette variables. Those are what sonner's stylesheet already reads, so
 * this needs no class names and no overriding of sonner's own rules.
 */
const Toaster = ({ style, toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // A caller's own style and toastOptions merge over these rather than
      // replacing them: dropping the palette variables would leave every
      // toast unstyled, which is the failure this replaced.
      style={
        {
          "--normal-bg": "var(--mui-palette-background-default)",
          "--normal-text": "var(--mui-palette-text-primary)",
          "--normal-border": "var(--mui-palette-divider)",
          "--success-bg": "var(--mui-palette-background-default)",
          "--success-text": "var(--mui-palette-success-main)",
          "--success-border": "var(--mui-palette-divider)",
          "--error-bg": "var(--mui-palette-background-default)",
          "--error-text": "var(--mui-palette-error-main)",
          "--error-border": "var(--mui-palette-divider)",
          "--warning-bg": "var(--mui-palette-background-default)",
          "--warning-text": "var(--mui-palette-warning-main)",
          "--warning-border": "var(--mui-palette-divider)",
          "--info-bg": "var(--mui-palette-background-default)",
          "--info-text": "var(--mui-palette-info-main)",
          "--info-border": "var(--mui-palette-divider)",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        style: { boxShadow: "var(--mui-shadows-8)", ...toastOptions?.style },
      }}
      {...props}
    />
  );
};

export { Toaster };

import { Icon } from '@/components/ohp/Icon';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Bell, X } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import type { DashboardNotification, NotificationVariant } from '@/hooks/useDashboardNotifications';
import { iconTileSx, tintColor, tintedPanelSx, type TintToken } from './tintSx';

/**
 * The palette key a notification variant speaks in.
 *
 * 'destructive' is the app's token name; MUI's is 'error'. The mapping lives
 * here so the rest of the component works in palette keys.
 */
const VARIANT_TOKEN: Record<NotificationVariant, TintToken> = {
  destructive: 'error',
  warning: 'warning',
  success: 'success',
  muted: null,
};

/**
 * Single notification item component.
 */
export function NotificationItem({
  notification,
  onDismiss,
  showPushPrompt,
  onRequestPush,
}: {
  notification: DashboardNotification;
  onDismiss: () => void;
  showPushPrompt: boolean;
  onRequestPush: () => void;
}) {
  const { icon: Glyph, title, description, action, dismissible, variant } = notification;
  const token = VARIANT_TOKEN[variant] ?? null;

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      sx={tintedPanelSx(token)}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={iconTileSx(token)}>
          <Icon icon={Glyph} size={20} sx={{ color: tintColor(token) }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="p" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography
            component="p"
            sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.25 }}
          >
            {description}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {showPushPrompt && (
            <>
              {/*
                Two renderings of one action, shown at different widths — the
                icon-only form needs its own accessible name because the label
                it replaces is not in the tree at that width.
              */}
              <IconButton
                onClick={onRequestPush}
                aria-label="Enable notifications"
                sx={{
                  display: { xs: 'inline-flex', sm: 'none' },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Icon icon={Bell} size={16} />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                onClick={onRequestPush}
                startIcon={<Icon icon={Bell} size={16} />}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Enable alerts
              </Button>
            </>
          )}

          {action && (
            <Button variant="contained" color="secondary" size="small" onClick={action.onClick}>
              {action.label}
            </Button>
          )}

          {dismissible && (
            <IconButton
              onClick={onDismiss}
              aria-label="Dismiss notification"
              sx={{ width: 32, height: 32, color: 'text.secondary' }}
            >
              <Icon icon={X} size={16} />
            </IconButton>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}

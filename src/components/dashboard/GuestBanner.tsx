import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { tokenAlpha } from '@/theme/muiTheme';

/**
 * Shown to unauthenticated users, dismissible, never gating content.
 *
 * The copy says what an account enables technically rather than why the user
 * should sign up — see docs/superpowers/specs/2026-05-20-guest-mode-design.md.
 */
export function GuestBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
          border: '1px solid',
          borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 20),
          borderRadius: '8px',
          px: 2,
          py: 1.5,
          mb: 3,
        }}
      >
        <Typography component="p" sx={{ fontSize: '0.875rem', color: 'text.primary' }}>
          You're studying as a guest — progress isn't being saved.{' '}
          <Box
            component={Link}
            to="/auth?returnTo=/dashboard"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Create a free account
          </Box>
        </Typography>
        <IconButton
          onClick={onDismiss}
          aria-label="Dismiss banner"
          sx={{ color: 'text.secondary', flexShrink: 0 }}
        >
          <Box component={X} aria-hidden="true" sx={{ width: 16, height: 16 }} />
        </IconButton>
      </Box>
  );
}

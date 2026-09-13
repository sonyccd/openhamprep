import { Shield, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { tokenAlpha } from '@/theme/muiTheme';
import type { UserInfo } from './types';

interface SidebarFooterProps {
  userInfo?: UserInfo;
  isAdmin: boolean;
  isOnAdminPage: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  onProfileClick: () => void;
  onAdminClick: () => void;
}

const truncate = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const SidebarFooter = ({
  userInfo,
  isAdmin,
  isOnAdminPage,
  isCollapsed,
  isMobile,
  onProfileClick,
  onAdminClick,
}: SidebarFooterProps) => {
  const showExpanded = isMobile || !isCollapsed;

  const getInitials = () => {
    if (userInfo?.displayName) {
      return userInfo.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (userInfo?.email) {
      return userInfo.email[0].toUpperCase();
    }
    return 'U';
  };

  const adminColours = isOnAdminPage
    ? {
        color: 'primary.main',
        bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 10),
      }
    : { color: 'text.secondary', '&:hover': { color: 'primary.main' } };

  const avatarSx = (size: number) => ({
    width: size,
    height: size,
    fontSize: size >= 36 ? '0.875rem' : '0.75rem',
    fontWeight: 500,
    color: 'primary.main',
    bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 10),
  });

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      {/* Admin Link */}
      {isAdmin && (
        <Box
          sx={{
            p: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            ...(!isMobile && isCollapsed && { display: 'flex', justifyContent: 'center' }),
          }}
        >
          {!showExpanded ? (
            <Tooltip title="Admin Dashboard" placement="right" enterDelay={0}>
              <IconButton
                onClick={onAdminClick}
                aria-label="Admin Dashboard"
                aria-current={isOnAdminPage ? 'page' : undefined}
                sx={{ width: '100%', height: 40, borderRadius: 2, ...adminColours }}
              >
                <Box component={Shield} aria-hidden="true" sx={{ width: 20, height: 20 }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              onClick={onAdminClick}
              aria-current={isOnAdminPage ? 'page' : undefined}
              fullWidth
              sx={{ justifyContent: 'flex-start', gap: 1.5, ...adminColours }}
              startIcon={<Box component={Shield} sx={{ width: 20, height: 20 }} />}
            >
              Admin
            </Button>
          )}
        </Box>
      )}

      {/* Guest: Sign in link */}
      {!userInfo &&
        (!showExpanded ? (
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="Sign in" placement="right" enterDelay={0}>
              <Box
                component={Link}
                to="/auth?returnTo=/dashboard"
                aria-label="Sign in"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', bgcolor: 'secondary.main' },
                }}
              >
                <Box component={LogIn} aria-hidden="true" sx={{ width: 20, height: 20 }} />
              </Box>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ p: 1.5 }}>
            <Typography
              component={Link}
              to="/auth?returnTo=/dashboard"
              variant="body2"
              sx={{
                fontWeight: 500,
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign in →
            </Typography>
          </Box>
        ))}

      {/* Authenticated: User Profile Section */}
      {userInfo && (
        <Box
          sx={{
            p: 1.5,
            ...(!isMobile && isCollapsed && { display: 'flex', justifyContent: 'center' }),
          }}
        >
          {showExpanded ? (
            <ButtonBase
              onClick={onProfileClick}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.5,
                p: 1,
                m: -1,
                borderRadius: 2,
                '&:hover': { bgcolor: 'secondary.main' },
              }}
            >
              <Avatar sx={{ ...avatarSx(36), flexShrink: 0 }}>{getInitials()}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, ...truncate }}>
                  {userInfo.displayName || 'User'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', ...truncate }}>
                  {userInfo.email || ''}
                </Typography>
              </Box>
            </ButtonBase>
          ) : (
            <Tooltip
              placement="right"
              enterDelay={0}
              title={
                <>
                  <Box sx={{ fontWeight: 500 }}>{userInfo.displayName || 'User'}</Box>
                  <Box sx={{ fontSize: '0.75rem' }}>{userInfo.email}</Box>
                </>
              }
            >
              <ButtonBase
                onClick={onProfileClick}
                // Collapsed there is no visible name, so the button spells one
                // out rather than announcing only its initials.
                aria-label={`Profile: ${userInfo.displayName || 'User'}`}
                sx={{
                  borderRadius: '50%',
                  transition: 'box-shadow 200ms',
                  '&:hover': {
                    boxShadow: (theme) =>
                      `0 0 0 2px ${tokenAlpha(theme.vars.palette.primary.main, 20)}`,
                  },
                }}
              >
                <Avatar sx={avatarSx(32)}>{getInitials()}</Avatar>
              </ButtonBase>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

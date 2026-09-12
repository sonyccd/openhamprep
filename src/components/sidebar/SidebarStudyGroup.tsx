import { ChevronDown, ChevronRight } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { tokenAlpha } from '@/theme/muiTheme';
import type { NavGroup } from './types';
import type { View } from '@/types/navigation';

interface SidebarStudyGroupProps {
  group: NavGroup;
  currentView: View;
  isOnAdminPage: boolean;
  isExpanded: boolean;
  showExpanded: boolean;
  onToggle: () => void;
  onNavClick: (view: View, disabled?: boolean) => void;
}

const activeSx = {
  color: 'primary.main',
  bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 10),
  border: '1px solid',
  borderColor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 20),
} as const;

const idleSx = {
  color: 'text.secondary',
  '&:hover': { color: 'text.primary', bgcolor: 'secondary.main' },
} as const;

/** The count bubble over an icon. Decorative — the text equivalent is separate. */
const badgeSx = (size: number) =>
  ({
    position: 'absolute',
    top: size >= 16 ? -6 : -4,
    right: size >= 16 ? -6 : -4,
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size >= 16 ? '10px' : '9px',
    fontWeight: 700,
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
  }) as const;

export const SidebarStudyGroup = ({
  group,
  currentView,
  isOnAdminPage,
  isExpanded,
  showExpanded,
  onToggle,
  onNavClick,
}: SidebarStudyGroupProps) => {
  const StudyIcon = group.icon;
  const totalBadge = group.items.reduce((sum, item) => sum + (item.badge || 0), 0);
  const isStudyItemActive = group.items.some(
    (item) => !isOnAdminPage && currentView === item.id
  );

  if (!showExpanded) {
    // Collapsed: show Study icon with tooltip listing items
    return (
      <Tooltip
        placement="right"
        enterDelay={0}
        title={
          <>
            <Box sx={{ fontWeight: 500 }}>Study</Box>
            <Box sx={{ fontSize: '0.75rem' }}>Random, Topics, Weak Areas, Bookmarks</Box>
          </>
        }
      >
        <ButtonBase
          onClick={onToggle}
          aria-label={`Study menu${totalBadge > 0 ? `, ${totalBadge} items need attention` : ''}`}
          aria-expanded={isExpanded}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1,
            py: 1.25,
            borderRadius: 2,
            transition: 'color 200ms, background-color 200ms',
            ...(isStudyItemActive ? activeSx : idleSx),
          }}
        >
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Box component={StudyIcon} aria-hidden="true" sx={{ width: 20, height: 20 }} />
            {totalBadge > 0 && (
              <Box component="span" aria-hidden="true" sx={badgeSx(16)}>
                {totalBadge > 9 ? '9+' : totalBadge}
              </Box>
            )}
          </Box>
        </ButtonBase>
      </Tooltip>
    );
  }

  return (
    <Stack spacing={0.5}>
      {/* Study header - clickable to expand/collapse */}
      <ButtonBase
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="study-group-items"
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          transition: 'color 200ms, background-color 200ms',
          ...(isStudyItemActive ? { color: 'primary.main' } : idleSx),
        }}
      >
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Box component={StudyIcon} aria-hidden="true" sx={{ width: 20, height: 20 }} />
          {totalBadge > 0 && (
            <Box component="span" aria-hidden="true" sx={badgeSx(16)}>
              {totalBadge > 9 ? '9+' : totalBadge}
            </Box>
          )}
        </Box>
        <Typography
          variant="body2"
          component="span"
          sx={{
            fontWeight: 500,
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {group.label}
        </Typography>
        <Box
          component={isExpanded ? ChevronDown : ChevronRight}
          aria-hidden="true"
          sx={{ width: 16, height: 16 }}
        />
        {totalBadge > 0 && (
          // The badge bubble is aria-hidden, so the count reaches assistive
          // tech as text here instead. visuallyHidden replaces the sr-only
          // class; A2c kept assertions on sr-only precisely because it is an
          // accessibility contract rather than styling.
          <Box component="span" sx={visuallyHidden}>
            , {totalBadge} items need attention
          </Box>
        )}
      </ButtonBase>

      {/* Study items - shown when expanded */}
      {isExpanded && (
        <Stack
          id="study-group-items"
          spacing={0.5}
          sx={{ ml: 2, pl: 1, borderLeft: '1px solid', borderColor: 'divider' }}
        >
          {group.items.map((item) => {
            const isActive = !isOnAdminPage && currentView === item.id;
            const Icon = item.icon;
            return (
              <ButtonBase
                key={item.id}
                onClick={() => onNavClick(item.id, item.disabled)}
                disabled={item.disabled}
                aria-current={isActive ? 'page' : undefined}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  // ButtonBase centres its content by default
                  // (ButtonBase.js:53); the plain <button> this replaced did
                  // not, so the row has to say so.
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  transition: 'color 200ms, background-color 200ms',
                  ...(isActive ? activeSx : idleSx),
                  '&.Mui-disabled': {
                    opacity: 0.5,
                    color: 'text.secondary',
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16 }} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <Box component="span" aria-hidden="true" sx={badgeSx(14)}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </Typography>
                {item.badge !== undefined && item.badge > 0 && (
                  <Box component="span" sx={visuallyHidden}>
                    , {item.badgeAriaLabel || `${item.badge} items`}
                  </Box>
                )}
              </ButtonBase>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

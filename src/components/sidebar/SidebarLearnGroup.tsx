import { ChevronDown, ChevronRight } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { tokenAlpha } from '@/theme/muiTheme';
import type { NavGroup } from './types';
import type { View } from '@/types/navigation';

interface SidebarLearnGroupProps {
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

export const SidebarLearnGroup = ({
  group,
  currentView,
  isOnAdminPage,
  isExpanded,
  showExpanded,
  onToggle,
  onNavClick,
}: SidebarLearnGroupProps) => {
  const LearnIcon = group.icon;
  const itemIsActive = (id: string) =>
    !isOnAdminPage &&
    (currentView === id ||
      (id === 'topics' && currentView === 'topic-detail') ||
      (id === 'lessons' && currentView === 'lesson-detail'));
  const isLearnItemActive = group.items.some((item) => itemIsActive(item.id));

  if (!showExpanded) {
    // Collapsed: show Learn icon with tooltip listing items
    return (
      <Tooltip
        placement="right"
        enterDelay={0}
        title={
          <>
            <Box sx={{ fontWeight: 500 }}>Learn</Box>
            <Box sx={{ fontSize: '0.75rem' }}>Lessons, Topics</Box>
          </>
        }
      >
        <ButtonBase
          onClick={onToggle}
          aria-label="Learn menu"
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
            ...(isLearnItemActive ? activeSx : idleSx),
          }}
        >
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Box component={LearnIcon} aria-hidden="true" sx={{ width: 20, height: 20 }} />
          </Box>
        </ButtonBase>
      </Tooltip>
    );
  }

  return (
    <Stack spacing={0.5}>
      {/* Learn header - clickable to expand/collapse */}
      <ButtonBase
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="learn-group-items"
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          transition: 'color 200ms, background-color 200ms',
          ...(isLearnItemActive ? { color: 'primary.main' } : idleSx),
        }}
      >
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Box component={LearnIcon} aria-hidden="true" sx={{ width: 20, height: 20 }} />
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
      </ButtonBase>

      {/* Learn items - shown when expanded */}
      {isExpanded && (
        <Stack
          id="learn-group-items"
          spacing={0.5}
          sx={{ ml: 2, pl: 1, borderLeft: '1px solid', borderColor: 'divider' }}
        >
          {group.items.map((item) => {
            const isActive = itemIsActive(item.id);
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
              </ButtonBase>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

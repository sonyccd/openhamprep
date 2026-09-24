import { Icon } from '@/components/ohp/Icon';
import { ExternalLink } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { tokenAlpha } from '@/theme/muiTheme';
import type { NavItem } from './types';

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  showExpanded: boolean;
  onClick: () => void;
}

/** Shared between the link and button forms so the two cannot drift. */
const rowSx = (showExpanded: boolean) =>
  ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: showExpanded ? 'flex-start' : 'center',
    gap: 1.5,
    px: showExpanded ? 1.5 : 1,
    py: 1.25,
    borderRadius: 2,
    transition: 'color 200ms, background-color 200ms',
    textAlign: 'left',
  }) as const;

export const SidebarNavItem = ({
  item,
  isActive,
  showExpanded,
  onClick,
}: SidebarNavItemProps) => {
  const Glyph = item.icon;

  // External link (opens in new tab)
  if (item.external) {
    const linkContent = (
      <Box
        component="a"
        href={item.external}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          ...rowSx(showExpanded),
          textDecoration: 'none',
          color: 'text.secondary',
          '&:hover': { color: 'text.primary', bgcolor: 'secondary.main' },
        }}
      >
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Icon icon={Glyph} size={20} />
        </Box>
        {showExpanded && (
          <Typography
            component="span"
            sx={{
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
            <Icon icon={ExternalLink} size={12} />
          </Typography>
        )}
      </Box>
    );

    if (!showExpanded) {
      return (
        <Tooltip title={item.label} placement="right" enterDelay={0}>
          {linkContent}
        </Tooltip>
      );
    }

    return <Box>{linkContent}</Box>;
  }

  // Internal nav button
  const buttonContent = (
    <ButtonBase
      onClick={onClick}
      disabled={item.disabled}
      aria-label={!showExpanded ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      sx={{
        ...rowSx(showExpanded),
        ...(isActive
          ? {
              color: 'primary.main',
              bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 10),
              border: '1px solid',
              borderColor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 20),
            }
          : {
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', bgcolor: 'secondary.main' },
            }),
        '&.Mui-disabled': {
          opacity: 0.5,
          color: 'text.secondary',
          bgcolor: 'transparent',
        },
      }}
    >
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Icon icon={Glyph} size={20} />
      </Box>
      {showExpanded && (
        <Typography
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
      )}
    </ButtonBase>
  );

  if (!showExpanded) {
    // MUI's Tooltip does not render on a disabled child, because a disabled
    // element fires no pointer events — so the collapsed rail would lose the
    // only label a disabled item has. A span wrapper gives the tooltip
    // something that does listen.
    return (
      <Tooltip title={item.label} placement="right" enterDelay={0}>
        <Box component="span" sx={{ display: 'block' }}>
          {buttonContent}
        </Box>
      </Tooltip>
    );
  }

  return <Box>{buttonContent}</Box>;
};

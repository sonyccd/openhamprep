import { PanelLeftClose, PanelLeft } from 'lucide-react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { OHPLogo } from '@/components/OHPLogo';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse: () => void;
}

export const SidebarHeader = ({
  isCollapsed,
  isMobile,
  onToggleCollapse,
}: SidebarHeaderProps) => {
  const label = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        justifyContent: !isMobile && isCollapsed ? 'center' : 'space-between',
      }}
    >
      {(isMobile || !isCollapsed) && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* OHPLogo is not in C3's scope, so it keeps its className API. */}
          <OHPLogo variant="horizontal" className="h-9 w-auto" />
        </Box>
      )}
      {!isMobile && (
        <Tooltip title={label} placement="right">
          <IconButton
            onClick={onToggleCollapse}
            aria-label={label}
            aria-expanded={!isCollapsed}
            sx={{ width: 28, height: 28, flexShrink: 0, color: 'text.secondary' }}
          >
            <Box
              component={isCollapsed ? PanelLeft : PanelLeftClose}
              aria-hidden="true"
              sx={{ width: 16, height: 16 }}
            />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

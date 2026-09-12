import { Radio, Zap, Award } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { tokenAlpha } from '@/theme/muiTheme';
import { testTypes, type TestType } from '@/types/navigation';

interface SidebarLicenseSelectorProps {
  selectedTest: TestType;
  isCollapsed: boolean;
  isMobile: boolean;
  onOpenModal: () => void;
}

const licenseIcons: Record<TestType, React.ElementType> = {
  technician: Radio,
  general: Zap,
  extra: Award,
};

export const SidebarLicenseSelector = ({
  selectedTest,
  isCollapsed,
  isMobile,
  onOpenModal,
}: SidebarLicenseSelectorProps) => {
  const currentTest = testTypes.find((t) => t.id === selectedTest);
  const CurrentLicenseIcon = licenseIcons[selectedTest];
  const showExpanded = isMobile || !isCollapsed;

  const surface = {
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: (theme) => tokenAlpha(theme.vars.palette.secondary.main, 50),
    transition: 'background-color 200ms, border-color 200ms',
    '&:hover': { bgcolor: 'secondary.main' },
  } as const;

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: !isMobile && isCollapsed ? 1 : 1.5,
      }}
    >
      {showExpanded ? (
        <Box>
          {/*
            Was a <label> with no htmlFor wrapping nothing, so it named no
            control — the button announced only "Technician", with no hint that
            it selects the licence class. aria-labelledby points at both the
            heading and the value, giving "License Class Technician", and both
            come from rendered text rather than a hand-written string.
          */}
          <Typography
            id="sidebar-license-label"
            variant="body2"
            sx={{ display: 'block', color: 'text.secondary', fontWeight: 500, mb: 0.75 }}
          >
            License Class
          </Typography>
          <ButtonBase
            onClick={onOpenModal}
            aria-labelledby="sidebar-license-label sidebar-license-value"
            sx={{
              ...surface,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1.5,
              p: 1.25,
              textAlign: 'left',
              '&:hover': { bgcolor: 'secondary.main', borderColor: 'text.secondary' },
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 10),
              }}
            >
              <Box
                component={CurrentLicenseIcon}
                aria-hidden="true"
                sx={{ width: 16, height: 16, color: 'primary.main' }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography id="sidebar-license-value" component="span" sx={{ fontWeight: 500 }}>
                {currentTest?.name}
              </Typography>
            </Box>
          </ButtonBase>
        </Box>
      ) : (
        <Tooltip
          placement="right"
          enterDelay={0}
          title={
            <>
              <Box sx={{ fontWeight: 500 }}>{currentTest?.name}</Box>
              <Box sx={{ fontSize: '0.75rem' }}>Click to change</Box>
            </>
          }
        >
          <ButtonBase
            onClick={onOpenModal}
            // Collapsed, there is no visible text to point at, so the name is
            // spelled out — it still contains the value rather than replacing it.
            aria-label={`License Class: ${currentTest?.name}`}
            sx={{
              ...surface,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
            }}
          >
            <Box
              component={CurrentLicenseIcon}
              aria-hidden="true"
              sx={{ width: 16, height: 16, color: 'primary.main' }}
            />
          </ButtonBase>
        </Tooltip>
      )}
    </Box>
  );
};

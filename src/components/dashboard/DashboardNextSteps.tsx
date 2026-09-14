import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LucideIcon } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import { tokenAlpha } from '@/theme/muiTheme';
import { iconTileSx, tintColor, tintedPanelSx, type TintToken } from './tintSx';

export interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: string;
  variant: 'primary' | 'secondary' | 'warning';
}

interface DashboardNextStepsProps {
  steps: NextStep[];
}

/** 'secondary' is the untinted card; the other two speak in their palette key. */
const STEP_TOKEN: Record<NextStep['variant'], TintToken> = {
  warning: 'warning',
  primary: 'primary',
  secondary: null,
};

export function DashboardNextSteps({ steps }: DashboardNextStepsProps) {
  if (steps.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        component="h2"
        sx={{
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          color: 'text.secondary',
          mb: 1.5,
          px: 0.5,
        }}
      >
        What to do next
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            ...(steps.length >= 2 && { sm: 'repeat(2, 1fr)' }),
            ...(steps.length >= 3 && { lg: 'repeat(3, 1fr)' }),
          },
        }}
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const token = STEP_TOKEN[step.variant];

          return (
            <MotionBox
              key={step.id}
              component="button"
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={step.onClick}
              sx={{
                // The card is untinted whatever the variant — the variant only
                // colours the icon tile, the badge and the hover border.
                ...tintedPanelSx(null),
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                cursor: 'pointer',
                width: '100%',
                '&:hover': {
                  bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
                  boxShadow: 1,
                  borderColor: token
                    ? (t) => tokenAlpha(t.vars.palette[token].main, 50)
                    : 'divider',
                },
              }}
            >
              <Box sx={iconTileSx(token, 'secondary.main')}>
                <Box
                  component={Icon}
                  aria-hidden="true"
                  sx={{ width: 20, height: 20, color: tintColor(token) }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {step.title}
                  </Box>
                  {step.badge && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: '4px',
                        ...(token
                          ? { bgcolor: `${token}.main`, color: `${token}.contrastText` }
                          : { bgcolor: 'muted', color: 'text.secondary' }),
                      }}
                    >
                      {step.badge}
                    </Box>
                  )}
                </Box>
                <Typography
                  component="p"
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    mt: 0.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {step.description}
                </Typography>
              </Box>
            </MotionBox>
          );
        })}
      </Box>
    </Box>
  );
}

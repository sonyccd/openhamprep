import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { LucideIcon } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import { ScoreRing } from '@/components/ohp/ScoreRing';
import { tokenAlpha } from '@/theme/muiTheme';
import type { ReadinessLevel } from '@/lib/readinessConfig';

interface NextAction {
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  priority: 'start' | 'weak' | 'practice' | 'ready' | 'default';
}

interface DashboardHeroProps {
  readinessLevel: ReadinessLevel;
  readinessTitle: string;
  readinessMessage: string;
  recentAvgScore: number;
  nextAction: NextAction;
  onAction: () => void;
}

/**
 * Which palette key the readiness level speaks in. `null` is "not started",
 * where nothing is scored yet and the whole block stays neutral.
 */
const LEVEL_TOKEN: Record<ReadinessLevel, 'success' | 'primary' | 'warning' | null> = {
  ready: 'success',
  'getting-close': 'primary',
  'needs-work': 'warning',
  'not-started': null,
};

export function DashboardHero({
  readinessLevel,
  readinessTitle,
  readinessMessage,
  recentAvgScore,
  nextAction,
  onAction,
}: DashboardHeroProps) {
  const token = LEVEL_TOKEN[readinessLevel] ?? null;
  const ActionIcon = nextAction.icon;
  const showDashedCircle = readinessLevel === 'not-started';

  // getting-close used the default button, so only the other two tint it.
  const buttonTint =
    token === 'success' || token === 'warning'
      ? {
          bgcolor: `${token}.main`,
          color: `${token}.contrastText`,
          '&:hover': { bgcolor: (t: Theme) => tokenAlpha(t.vars.palette[token].main, 90) },
        }
      : {};

  return (
    <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 3, md: 4 },
          p: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          {showDashedCircle ? (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: '4px dashed',
                borderColor: (t) => tokenAlpha(t.vars.palette.text.secondary, 30),
              }}
            >
              <Box
                component="span"
                sx={{
                  fontSize: '2.25rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'text.secondary',
                }}
              >
                ?
              </Box>
            </Box>
          ) : (
            <ScoreRing
              value={recentAvgScore}
              size={140}
              strokeWidth={10}
              // The number alone says nothing about what is being measured, and
              // the readiness level is conveyed visually by colour — which a
              // screen reader cannot see. Both go in the announcement.
              label="Exam readiness"
              valueText={`${recentAvgScore}% — ${readinessTitle}`}
              color={(t) =>
                token
                  ? t.vars.palette[token].main
                  : tokenAlpha(t.vars.palette.text.secondary, 30)
              }
              trackColor={(t) => t.vars.palette.secondary.main}
            />
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            textAlign: { xs: 'center', md: 'left' },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', md: '1.875rem' },
                fontWeight: 700,
                // 'not-started' titled in plain foreground, not muted.
                color: token ? `${token}.main` : 'text.primary',
              }}
            >
              {readinessTitle}
            </Typography>
            <Typography sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 448 }}>
              {readinessMessage}
            </Typography>
          </Box>

          <Box sx={{ alignSelf: { xs: 'center', md: 'flex-start' } }}>
            <Button
              variant="contained"
              size="large"
              onClick={onAction}
              startIcon={<Box component={ActionIcon} sx={{ width: 20, height: 20 }} />}
              sx={{ mt: 1, ...buttonTint }}
            >
              {nextAction.actionLabel}
            </Button>
          </Box>
        </Box>
      </Box>
    </MotionBox>
  );
}

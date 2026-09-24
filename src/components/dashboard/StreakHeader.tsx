import { Icon } from '@/components/ohp/Icon';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import { tokenAlpha } from '@/theme/muiTheme';

interface StreakHeaderProps {
  currentStreak: number;
  longestStreak: number;
}

/** The flame, the day count, and the best-streak trophy. */
export function StreakHeader({ currentStreak, longestStreak }: StreakHeaderProps) {
  const hasStreak = currentStreak > 0;
  const isNewRecord = hasStreak && currentStreak === longestStreak;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: '8px',
            display: 'flex',
            ...(hasStreak
              ? {
                  background: (t) =>
                    `linear-gradient(to bottom right, ${tokenAlpha(
                      t.vars.palette.warning.main,
                      20
                    )}, ${tokenAlpha(t.vars.palette.warning.main, 10)})`,
                }
              : { bgcolor: 'muted' }),
          }}
        >
          <Icon icon={Flame} size={20} sx={{ color: hasStreak ? 'warning.main' : 'text.secondary' }} />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnimatePresence mode="wait">
              <MotionBox
                key={currentStreak}
                component="span"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: hasStreak ? 'text.primary' : 'text.secondary',
                }}
              >
                {currentStreak}
              </MotionBox>
            </AnimatePresence>
            <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              {currentStreak === 1 ? 'day' : 'days'}
            </Box>
          </Box>
          <Typography component="p" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {hasStreak ? 'Current streak' : 'Start a streak!'}
          </Typography>
        </Box>
      </Box>

      {longestStreak > 0 && (
        <Box
          role="img"
          aria-label={
            isNewRecord
              ? `New record: ${longestStreak} day best streak`
              : `Best streak: ${longestStreak} days`
          }
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: '9999px',
            fontSize: '0.75rem',
            ...(isNewRecord
              ? {
                  bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
                  color: 'success.main',
                }
              : { bgcolor: 'muted', color: 'text.secondary' }),
          }}
        >
          <Icon icon={Trophy} size={12} />
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            {longestStreak}
          </Box>
        </Box>
      )}
    </Box>
  );
}

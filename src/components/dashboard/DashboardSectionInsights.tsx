import { Icon } from '@/components/ohp/Icon';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ChevronRight } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import { tokenAlpha } from '@/theme/muiTheme';
import { getSubelementName } from '@/lib/subelementNames';
import { SubelementMetric } from '@/hooks/useReadinessScore';
import { TestType } from '@/types/navigation';

/** Minimum risk score to display a section in Focus Areas */
const MIN_RISK_SCORE_THRESHOLD = 0.1;

/** Maximum number of focus areas to display */
const MAX_FOCUS_AREAS = 3;

interface FocusArea {
  subelement: string;
  name: string;
  riskScore: number;
}

interface DashboardSectionInsightsProps {
  subelementMetrics: Record<string, SubelementMetric> | undefined;
  testType: TestType;
  onPracticeSection: (subelement: string) => void;
}

export function DashboardSectionInsights({
  subelementMetrics,
  testType,
  onPracticeSection,
}: DashboardSectionInsightsProps) {
  // No metrics = nothing to show
  if (!subelementMetrics || Object.keys(subelementMetrics).length === 0) {
    return null;
  }

  // Sort by risk_score descending, take top 3
  const focusAreas: FocusArea[] = Object.entries(subelementMetrics)
    .sort((a, b) => b[1].risk_score - a[1].risk_score)
    .slice(0, MAX_FOCUS_AREAS)
    .map(([code, metric]) => ({
      subelement: code,
      name: getSubelementName(testType, code),
      riskScore: metric.risk_score,
    }));

  // If all risk scores are 0 or very low, don't show the section
  if (focusAreas.every(area => area.riskScore < MIN_RISK_SCORE_THRESHOLD)) {
    return null;
  }

  return (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 3 }}>
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
        Focus Areas
      </Typography>
      <Stack spacing={1}>
        {focusAreas.map((area, index) => (
          <MotionBox
            key={area.subelement}
            component="button"
            type="button"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onPracticeSection(area.subelement)}
            aria-label={`Practice ${area.name} section`}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              borderRadius: 1, // rounded-xl, and shape.borderRadius is 12
              border: '1px solid',
              borderColor: (t) => tokenAlpha(t.vars.palette.warning.main, 30),
              bgcolor: (t) => tokenAlpha(t.vars.palette.warning.main, 5),
              transition: 'all 200ms',
              font: 'inherit',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: (t) => tokenAlpha(t.vars.palette.warning.main, 10),
                borderColor: (t) => tokenAlpha(t.vars.palette.warning.main, 50),
                boxShadow: 1,
              },
              // The chevron nudge lived on a Tailwind `group-hover:` pair.
              '&:hover .FocusArea-chevron': { transform: 'translateX(2px)' },
            }}
          >
            <Box
              component="span"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: 'warning.main',
                fontSize: '0.875rem',
              }}
            >
              {area.subelement}
            </Box>

            <Box
              component="span"
              sx={{
                flex: 1,
                textAlign: 'left',
                fontWeight: 500,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {area.name}
            </Box>

            <Box
              component="span"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.875rem',
                color: 'warning.main',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Practice
              <Icon
                icon={ChevronRight}
                className="FocusArea-chevron"
                size={16}
                sx={{ transition: 'transform 200ms' }}
              />
            </Box>
          </MotionBox>
        ))}
      </Stack>
    </MotionBox>
  );
}

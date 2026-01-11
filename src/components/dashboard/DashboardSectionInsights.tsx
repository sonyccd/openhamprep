import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <h2 className="text-sm font-mono font-bold text-muted-foreground mb-3 px-1">
        Focus Areas
      </h2>
      <div className="space-y-2">
        {focusAreas.map((area, index) => (
          <motion.button
            key={area.subelement}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onPracticeSection(area.subelement)}
            aria-label={`Practice ${area.name} section`}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
              'border border-warning/30 bg-warning/5',
              'transition-all duration-200 group',
              'hover:bg-warning/10 hover:border-warning/50 hover:shadow-sm'
            )}
          >
            {/* Subelement code badge */}
            <span className="font-mono font-bold text-warning text-sm">
              {area.subelement}
            </span>

            {/* Section name */}
            <span className="flex-1 text-left font-medium text-foreground truncate">
              {area.name}
            </span>

            {/* Practice CTA */}
            <span className="flex items-center gap-1 text-sm text-warning font-medium shrink-0">
              Practice
              <ChevronRight className={cn(
                'w-4 h-4',
                'group-hover:translate-x-0.5 transition-transform duration-200'
              )} />
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

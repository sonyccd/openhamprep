import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubelementMetric } from '@/hooks/useReadinessScore';
import { TestType } from '@/types/navigation';

// Subelement names by test type
const SUBELEMENT_NAMES: Record<string, Record<string, string>> = {
  technician: {
    T0: "Safety",
    T1: "Commission's Rules",
    T2: "Operating Procedures",
    T3: "Radio Wave Characteristics",
    T4: "Amateur Radio Practices",
    T5: "Electrical Principles",
    T6: "Electronic Components",
    T7: "Station Equipment",
    T8: "Operating Activities",
    T9: "Antennas & Feed Lines"
  },
  general: {
    G0: "Safety",
    G1: "Commission's Rules",
    G2: "Operating Procedures",
    G3: "Radio Wave Propagation",
    G4: "Amateur Radio Practices",
    G5: "Electrical Principles",
    G6: "Circuit Components",
    G7: "Practical Circuits",
    G8: "Signals and Emissions",
    G9: "Antennas & Feed Lines"
  },
  extra: {
    E0: "Safety",
    E1: "Commission's Rules",
    E2: "Operating Procedures",
    E3: "Radio Wave Propagation",
    E4: "Amateur Practices",
    E5: "Electrical Principles",
    E6: "Circuit Components",
    E7: "Practical Circuits",
    E8: "Signals and Emissions",
    E9: "Antennas & Transmission Lines"
  }
};

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

  const subelementNames = SUBELEMENT_NAMES[testType] || {};

  // Sort by risk_score descending, take top 3
  const focusAreas: FocusArea[] = Object.entries(subelementMetrics)
    .sort((a, b) => b[1].risk_score - a[1].risk_score)
    .slice(0, 3)
    .map(([code, metric]) => ({
      subelement: code,
      name: subelementNames[code] || `Subelement ${code}`,
      riskScore: metric.risk_score,
    }));

  // If all risk scores are 0 or very low, don't show the section
  if (focusAreas.every(area => area.riskScore < 0.1)) {
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

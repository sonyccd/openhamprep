import { useState, useMemo } from "react";
import { Question } from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageContainer } from "@/components/ui/page-container";
import { cn } from "@/lib/utils";

interface QuestionListViewProps {
  title: string;
  subtitle: string;
  badge: string;
  questions: Question[];
  onBack: () => void;
  onStartPractice: (startIndex?: number) => void;
  description?: string;
}

export function QuestionListView({
  title,
  subtitle,
  badge,
  questions,
  onBack,
  onStartPractice,
  description,
}: QuestionListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter questions based on search
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.displayName.toLowerCase().includes(query) ||
        q.question.toLowerCase().includes(query)
    );
  }, [questions, searchQuery]);

  // Group questions by question group (e.g., T1A, T1B)
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = {};
    filteredQuestions.forEach((q) => {
      const group = q.questionGroup || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(q);
    });
    // Sort groups and questions within groups
    const sortedGroups = Object.keys(groups).sort();
    sortedGroups.forEach((group) => {
      groups[group].sort((a, b) => a.displayName.localeCompare(b.displayName));
    });
    return { groups, sortedKeys: sortedGroups };
  }, [filteredQuestions]);

  return (
    <PageContainer width="standard" mobileNavPadding>
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Decorative gradient bar */}
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent rounded-full" />

          <div className="pl-4">
            <div className="flex items-start gap-4 mb-3">
              <div className="shrink-0 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 font-mono font-bold text-primary text-sm tracking-wide">
                {badge}
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </motion.div>
      </div>

      {/* Description if provided */}
      {description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 p-4 rounded-xl bg-card border border-border"
        >
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </motion.div>
      )}

      {/* Start All + Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <Button
          onClick={() => onStartPractice()}
          size="lg"
          className="gap-2 h-12 px-6 font-medium"
        >
          <Play className="w-4 h-4" />
          Practice All Questions
        </Button>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Question List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="space-y-6"
      >
        {groupedQuestions.sortedKeys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No questions match your search." : "No questions available."}
            </p>
          </div>
        ) : (
          groupedQuestions.sortedKeys.map((groupKey, groupIndex) => (
            <motion.div
              key={groupKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + groupIndex * 0.03 }}
            >
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {groupKey}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Questions in group */}
              <div className="space-y-1">
                {groupedQuestions.groups[groupKey].map((q, qIndex) => {
                  const globalIndex = questions.findIndex((orig) => orig.id === q.id);

                  return (
                    <motion.button
                      key={q.id}
                      onClick={() => onStartPractice(globalIndex)}
                      onMouseEnter={() => setHoveredId(q.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all duration-150",
                        "border border-transparent",
                        "hover:bg-secondary hover:border-border",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30",
                        "group relative"
                      )}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * qIndex }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Question content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-medium text-primary">
                              {q.displayName}
                            </span>
                          </div>
                          <p className={cn(
                            "text-sm leading-snug transition-colors",
                            hoveredId === q.id
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}>
                            {q.question.length > 120
                              ? q.question.substring(0, 120) + "..."
                              : q.question}
                          </p>
                        </div>

                        {/* Play icon on hover */}
                        <AnimatePresence>
                          {hoveredId === q.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="shrink-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Bottom spacer for mobile nav */}
      <div className="h-8" />
    </PageContainer>
  );
}

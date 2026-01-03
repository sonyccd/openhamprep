import { Question } from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Book, Play, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/ui/page-container";
import type { ArrlChapter } from "@/types/chapters";

interface ChapterLandingProps {
  chapter: ArrlChapter;
  questions: Question[];
  onBack: () => void;
  onStartPractice: () => void;
}

export function ChapterLanding({
  chapter,
  questions,
  onBack,
  onStartPractice,
}: ChapterLandingProps) {
  return (
    <PageContainer width="standard" mobileNavPadding>
      {/* Back to All Chapters */}
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          All Chapters
        </Button>
      </div>

      {/* Chapter Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center font-mono font-bold text-2xl text-primary">
            {chapter.chapterNumber}
          </div>
          <div>
            <h1 className="text-2xl font-mono font-bold text-foreground">
              Chapter {chapter.chapterNumber}
            </h1>
            <p className="text-lg text-muted-foreground">{chapter.title}</p>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      {chapter.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            About This Chapter
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {chapter.description}
          </p>
        </motion.div>
      )}

      {/* Questions count */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-secondary/50 border border-border rounded-xl p-6 mb-6"
      >
        <div className="text-center">
          <p className="text-4xl font-mono font-bold text-foreground mb-2">
            {questions.length}
          </p>
          <p className="text-muted-foreground">
            {questions.length === 1 ? "question" : "questions"} from the ARRL textbook
          </p>
        </div>
      </motion.div>

      {/* Start Practice Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={onStartPractice}
          size="lg"
          className="w-full gap-2 h-14 text-lg"
          disabled={questions.length === 0}
        >
          <Play className="w-5 h-5" />
          {questions.length === 0 ? "No Questions Available" : "Start Practicing"}
        </Button>
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-3">
            No questions have been assigned to this chapter yet.
          </p>
        )}
      </motion.div>
    </PageContainer>
  );
}

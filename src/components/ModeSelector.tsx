import { Button } from "@/components/ui/button";
import { Radio, Zap, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface ModeSelectorProps {
  onSelectMode: (mode: 'practice-test' | 'random-practice') => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 radio-wave-bg">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Radio className="w-10 h-10 text-primary animate-pulse-slow" />
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-foreground">
            <span className="text-primary text-glow-primary">HAM</span> Radio
          </h1>
        </div>
        <h2 className="text-2xl md:text-3xl font-mono text-foreground/90 mb-2">
          Technician License Exam
        </h2>
        <p className="text-muted-foreground text-lg">
          2022-2026 Question Pool • FCC Element 2
        </p>
      </motion.div>

      {/* Mode Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full px-4">
        {/* Practice Test Mode */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button
            onClick={() => onSelectMode('practice-test')}
            className="w-full h-full bg-card border-2 border-border hover:border-primary/50 rounded-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                Practice Test
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Simulate the real exam experience with 35 randomly selected questions.
              See your results only after completing the test.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                35 Questions
              </span>
              <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                26 to Pass
              </span>
              <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                Results at End
              </span>
            </div>
          </button>
        </motion.div>

        {/* Random Practice Mode */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={() => onSelectMode('random-practice')}
            className="w-full h-full bg-card border-2 border-border hover:border-accent/50 rounded-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 group text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Zap className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-2xl font-mono font-bold text-foreground group-hover:text-accent transition-colors">
                Random Practice
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Study at your own pace with random questions.
              Get instant feedback on each answer.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                Unlimited Questions
              </span>
              <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                Instant Feedback
              </span>
              <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                Learn as You Go
              </span>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-12 text-center text-muted-foreground"
      >
        <p className="text-sm">
          Question pool contains 400+ official FCC exam questions
        </p>
      </motion.div>
    </div>
  );
}

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, Bookmark, MessageSquare, BarChart3, Target, Brain, Zap } from "lucide-react";

// Mock Question Card Preview
export function QuestionPreview() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-xl w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
          T1A01
        </span>
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 rounded flex items-center justify-center bg-muted">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="w-7 h-7 rounded flex items-center justify-center bg-primary/10">
            <Bookmark className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>
      </div>

      {/* Question */}
      <p className="text-sm md:text-base font-medium text-foreground mb-4 leading-relaxed">
        Which agency regulates and enforces the rules for the Amateur Radio Service in the United States?
      </p>

      {/* Options */}
      <div className="space-y-2">
        <div className="p-3 rounded-lg border-2 border-border flex items-center gap-3 opacity-60">
          <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-mono font-bold">A</span>
          <span className="text-sm">FEMA</span>
        </div>
        <div className="p-3 rounded-lg border-2 border-success bg-success/10 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-success text-success-foreground flex items-center justify-center text-xs font-mono font-bold">B</span>
          <span className="text-sm text-success font-medium">The FCC</span>
          <Check className="w-4 h-4 text-success ml-auto" />
        </div>
        <div className="p-3 rounded-lg border-2 border-destructive bg-destructive/10 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-mono font-bold">C</span>
          <span className="text-sm text-destructive">The ITU</span>
          <X className="w-4 h-4 text-destructive ml-auto" />
        </div>
        <div className="p-3 rounded-lg border-2 border-border flex items-center gap-3 opacity-60">
          <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-mono font-bold">D</span>
          <span className="text-sm">Homeland Security</span>
        </div>
      </div>
    </div>
  );
}

// Mock Dashboard Preview
export function DashboardPreview() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-xl w-full max-w-md">
      {/* Readiness Card */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">82%</span>
          </div>
          <div>
            <h3 className="font-bold text-primary text-sm">Almost Ready!</h3>
            <p className="text-xs text-muted-foreground">A few more passing scores</p>
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-primary rounded-full" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <Target className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">78%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <BarChart3 className="w-5 h-5 text-success mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">12</div>
          <div className="text-xs text-muted-foreground">Tests Taken</div>
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">Weekly Goals</span>
          <span className="text-xs text-muted-foreground">3/5 days</span>
        </div>
        <div className="flex gap-1">
          {[true, true, true, false, false, false, false].map((done, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full",
                done ? "bg-success" : "bg-secondary"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock Practice Modes Preview
export function PracticeModesPreview() {
  const modes = [
    { icon: Target, label: "Practice Test", color: "text-primary", bg: "bg-primary/10" },
    { icon: Zap, label: "Random Practice", color: "text-success", bg: "bg-success/10" },
    { icon: Brain, label: "Weak Questions", color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xl w-full max-w-xs">
      <h3 className="text-sm font-semibold text-foreground mb-3">Practice Modes</h3>
      <div className="space-y-2">
        {modes.map((mode) => (
          <div
            key={mode.label}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", mode.bg)}>
              <mode.icon className={cn("w-4 h-4", mode.color)} />
            </div>
            <span className="text-sm font-medium text-foreground">{mode.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Combined Preview Section
export function UIPreviewSection() {
  return (
    <section className="py-16 px-4 bg-muted/30 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">
            See It In Action
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A modern, distraction-free interface designed to help you focus on what matters: passing your exam.
          </p>
        </motion.div>

        <div className="relative">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-center gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-shrink-0"
            >
              <PracticeModesPreview />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0 z-10 transform scale-110"
            >
              <QuestionPreview />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-shrink-0"
            >
              <DashboardPreview />
            </motion.div>
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden flex flex-col items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <QuestionPreview />
            </motion.div>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <PracticeModesPreview />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <DashboardPreview />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { Check, X, ChevronRight, Flame, BookmarkPlus, RotateCcw, MapPin, Calendar, Target } from "lucide-react";

// Random Practice Mockup
export function RandomPracticeMockup() {
  return <div className="bg-background rounded-lg border border-border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-card px-4 py-3 border-b border-border flex items-center justify-between">
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="w-3 h-3 text-orange-500" />
          <span>Streak: 7</span>
        </div>
      </div>
      
      {/* Question */}
      <div className="p-4 space-y-3">
        <div className="text-xs font-mono text-muted-foreground">T1A01</div>
        <div className="text-sm text-foreground font-medium">
          Which of the following is part of the FCC Rules that apply to amateur radio?
        </div>
        
        {/* Options */}
        <div className="space-y-2 pt-2">
          {["Part 97", "Part 15", "Part 73", "Part 95"].map((option, i) => <motion.div key={option} initial={{
          opacity: 0,
          x: -10
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: i * 0.1
        }} className={`flex items-center gap-2 p-2 rounded-md border text-xs ${i === 0 ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" : "border-border text-muted-foreground"}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-green-500 text-white" : "bg-muted"}`}>
                {i === 0 ? <Check className="w-2.5 h-2.5" /> : String.fromCharCode(65 + i)}
              </div>
              {option}
            </motion.div>)}
        </div>
      </div>
    </div>;
}

// Practice Test Mockup
export function PracticeTestMockup() {
  return <div className="bg-background rounded-lg border border-border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-card px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Practice Test</span>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">⏱ 1:45:32</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{
          width: 0
        }} animate={{
          width: "60%"
        }} transition={{
          duration: 1,
          delay: 0.5
        }} className="h-full bg-primary rounded-full" />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Question 21 of 35</span>
          <span>60%</span>
        </div>
      </div>
      
      {/* Question preview */}
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-2">Current Question</div>
        <div className="h-12 bg-muted/50 rounded animate-pulse" />
        
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-muted/30 rounded border border-border" />)}
        </div>
      </div>
    </div>;
}

// Study by Topics Mockup
export function StudyByTopicsMockup() {
  const topics = [{
    name: "Commission's Rules",
    progress: 85,
    color: "bg-blue-500"
  }, {
    name: "Station Operation",
    progress: 60,
    color: "bg-green-500"
  }, {
    name: "Radio Wave",
    progress: 40,
    color: "bg-purple-500"
  }];
  return <div className="bg-background rounded-lg border border-border shadow-lg overflow-hidden">
      <div className="bg-card px-4 py-3 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">Subelement T1</span>
      </div>
      
      <div className="p-4 space-y-3">
        {topics.map((topic, i) => <motion.div key={topic.name} initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: i * 0.15
      }} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground">{topic.name}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{
            width: 0
          }} animate={{
            width: `${topic.progress}%`
          }} transition={{
            duration: 0.8,
            delay: 0.3 + i * 0.15
          }} className={`h-full ${topic.color} rounded-full`} />
            </div>
          </motion.div>)}
      </div>
    </div>;
}

// Weak Questions Mockup
export function WeakQuestionsMockup() {
  return <div className="bg-background rounded-lg border border-border shadow-lg overflow-hidden">
      <div className="bg-card px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">Weak Questions</span>
        <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">12 to review</span>
      </div>
      
      <div className="p-4 space-y-2">
        {[{
        id: "T5C06",
        attempts: 3,
        correct: 0
      }, {
        id: "T7A08",
        attempts: 4,
        correct: 1
      }, {
        id: "T6B11",
        attempts: 2,
        correct: 0
      }].map((q, i) => <motion.div key={q.id} initial={{
        opacity: 0,
        x: -10
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        delay: i * 0.1
      }} className="flex items-center justify-between p-2 rounded-md bg-red-500/5 border border-red-500/20">
            <span className="text-xs font-mono text-foreground">{q.id}</span>
            <div className="flex items-center gap-1">
              <X className="w-3 h-3 text-red-500" />
              <span className="text-[10px] text-muted-foreground">
                {q.correct}/{q.attempts}
              </span>
            </div>
          </motion.div>)}
        
        <motion.button initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.5
      }} className="w-full mt-2 py-2 text-xs bg-primary text-primary-foreground rounded-md font-medium">
          Start Review Session
        </motion.button>
      </div>
    </div>;
}

// Find Exam Sessions Mockup
export function FindExamSessionsMockup() {
  return (
    <div className="bg-background rounded-lg border border-border shadow-lg overflow-hidden">
      <div className="bg-card px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-primary" />
          <span className="text-xs font-mono text-muted-foreground">Find Exam Sessions</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Near 27601</span>
      </div>
      
      {/* Map Preview */}
      <div className="relative h-32 bg-gradient-to-br from-blue-100 to-green-50 dark:from-blue-950/30 dark:to-green-950/20 overflow-hidden">
        {/* Grid lines to simulate map */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-muted-foreground" style={{ top: `${i * 20}%` }} />
          ))}
          {[...Array(8)].map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-muted-foreground" style={{ left: `${i * 14}%` }} />
          ))}
        </div>
        
        {/* "Roads" */}
        <div className="absolute inset-0">
          <div className="absolute h-0.5 bg-muted-foreground/30 w-full top-1/3 transform -rotate-12" />
          <div className="absolute h-0.5 bg-muted-foreground/30 w-full top-2/3 transform rotate-6" />
          <div className="absolute w-0.5 bg-muted-foreground/30 h-full left-1/4 transform rotate-6" />
          <div className="absolute w-0.5 bg-muted-foreground/30 h-full left-2/3 transform -rotate-3" />
        </div>
        
        {/* Location markers */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="absolute top-6 left-1/4"
        >
          <div className="relative">
            <MapPin className="w-5 h-5 text-primary fill-primary/20" />
            <div className="absolute inset-0 animate-ping">
              <MapPin className="w-5 h-5 text-primary/30" />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          className="absolute top-16 left-1/2"
        >
          <MapPin className="w-5 h-5 text-green-500 fill-green-500/20" />
        </motion.div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
          className="absolute top-10 right-1/4"
        >
          <MapPin className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
        </motion.div>
        
        {/* Zoom controls */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-0.5">
          <div className="w-5 h-5 bg-background/90 border border-border rounded text-[10px] flex items-center justify-center text-muted-foreground">+</div>
          <div className="w-5 h-5 bg-background/90 border border-border rounded text-[10px] flex items-center justify-center text-muted-foreground">−</div>
        </div>
      </div>
      
      {/* Session list */}
      <div className="p-3 space-y-2">
        {[
          { location: "Raleigh Community Center", date: "Jan 15", walkIns: true },
          { location: "Durham Public Library", date: "Jan 22", walkIns: false },
        ].map((session, i) => (
          <motion.div
            key={session.location}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center justify-between p-2 rounded-md border border-border text-xs"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground truncate max-w-[120px]">{session.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {session.walkIns && (
                <span className="text-[9px] px-1 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded">
                  Walk-ins
                </span>
              )}
              <span className="text-muted-foreground">{session.date}</span>
            </div>
          </motion.div>
        ))}
        
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full py-1.5 text-[10px] bg-primary text-primary-foreground rounded-md font-medium flex items-center justify-center gap-1"
        >
          <Target className="w-3 h-3" />
          Set Target Date
        </motion.button>
      </div>
    </div>
  );
}

// Bookmarks Mockup
export function BookmarksMockup() {
  return <div className="bg-background rounded-lg border border-border shadow-lg overflow-hidden">
      <div className="bg-card px-4 py-3 border-b border-border flex items-center gap-2">
        <BookmarkPlus className="w-3 h-3 text-yellow-500" />
        <span className="text-xs font-mono text-muted-foreground">Saved Questions</span>
      </div>
      
      <div className="p-4 space-y-2">
        {[{
        id: "T1B03",
        note: "Review antenna regulations"
      }, {
        id: "T4A05",
        note: "Important for test"
      }, {
        id: "T8C02",
        note: null
      }].map((q, i) => <motion.div key={q.id} initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: i * 0.1
      }} className="p-2 rounded-md border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-foreground">{q.id}</span>
              <BookmarkPlus className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            </div>
            {q.note && <p className="text-[10px] text-muted-foreground mt-1 italic">"{q.note}"</p>}
          </motion.div>)}
      </div>
    </div>;
}

// Glossary Mockup
export function GlossaryMockup() {
  return <div className="bg-background rounded-lg border border-border shadow-lg overflow-hidden">
      <div className="bg-card px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Flashcard Mode</span>
          <div className="flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="relative h-28" style={{
        perspective: "1000px"
      }}>
          <motion.div initial={{
          rotateY: 0
        }} animate={{
          rotateY: [0, 0, 180, 180, 0]
        }} transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.2, 0.3, 0.8, 1]
        }} className="relative w-full h-full" style={{
          transformStyle: "preserve-3d"
        }}>
            {/* Front of card */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-lg border border-cyan-500/20" style={{
            backfaceVisibility: "hidden"
          }}>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">SWR</div>
                <div className="text-[10px] text-muted-foreground mt-1">Tap to reveal</div>
              </div>
            </div>
            
            {/* Back of card */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 rounded-lg border border-cyan-500/30" style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}>
              <div className="text-center px-3">
                <div className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400 mb-1">Definition</div>
                <div className="text-xs text-foreground leading-relaxed">
                  Standing Wave Ratio - A measure of impedance matching between transmission line and antenna
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="flex justify-center gap-4 mt-4">
          <button className="px-3 py-1.5 text-[10px] bg-red-500/10 text-red-500 rounded-md">
            Need Practice
          </button>
          <button className="px-3 py-1.5 text-[10px] bg-green-500/10 text-green-500 rounded-md">
            Got It!
          </button>
        </div>
      </div>
    </div>;
}
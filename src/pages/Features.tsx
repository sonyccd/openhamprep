import { LandingNav } from "@/components/LandingNav";
import { motion } from "framer-motion";
import {
  Shuffle,
  ClipboardCheck,
  BookOpen,
  Target,
  Bookmark,
  BookText,
  Timer,
  TrendingUp,
  Lightbulb,
  Link2,
  Sparkles,
  Keyboard,
  History,
  Palette,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  RandomPracticeMockup,
  PracticeTestMockup,
  StudyByTopicsMockup,
  WeakQuestionsMockup,
  BookmarksMockup,
  GlossaryMockup,
} from "@/components/FeatureMockups";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  bgColor: string;
  mockup: ReactNode;
}

const features: Feature[] = [
  {
    icon: Shuffle,
    title: "Random Practice",
    description: "Practice questions in random order to build well-rounded knowledge. Skip questions you're unsure about and come back to them later.",
    benefits: ["Prevents pattern memorization", "Simulates real exam randomness", "Track your streak for motivation"],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    mockup: <RandomPracticeMockup />,
  },
  {
    icon: ClipboardCheck,
    title: "Practice Tests",
    description: "Take full-length practice exams that mirror the real FCC test experience with 35 questions randomly selected from the question pool.",
    benefits: ["Realistic exam simulation", "Optional 2-hour timer", "Immediate scoring and review"],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    mockup: <PracticeTestMockup />,
  },
  {
    icon: BookOpen,
    title: "Study by Topics",
    description: "Focus your study on specific subelements and topics. Each topic includes a description and curated learning resources before you start practicing.",
    benefits: ["Targeted learning", "Topic overviews", "Curated video and article resources"],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    mockup: <StudyByTopicsMockup />,
  },
  {
    icon: Target,
    title: "Weak Questions Review",
    description: "The system tracks questions you frequently get wrong and creates personalized review sessions to strengthen your weak areas.",
    benefits: ["Adaptive learning", "Focus on problem areas", "Efficient study time"],
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    mockup: <WeakQuestionsMockup />,
  },
  {
    icon: Bookmark,
    title: "Bookmarked Questions",
    description: "Save questions you want to review later. Add personal notes to bookmarks to remember why you saved them.",
    benefits: ["Personal study list", "Add notes for context", "Quick access anytime"],
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    mockup: <BookmarksMockup />,
  },
  {
    icon: BookText,
    title: "Glossary & Flashcards",
    description: "Learn essential ham radio terminology with our comprehensive glossary. Use flashcard mode to test your knowledge of definitions.",
    benefits: ["Essential terms defined", "Interactive flashcard mode", "Track mastery progress"],
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    mockup: <GlossaryMockup />,
  },
];

const additionalFeatures = [
  {
    icon: Timer,
    title: "Optional Test Timer",
    description: "Enable a 2-hour countdown timer during practice tests to simulate real exam pressure.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor your accuracy, tests passed, and weak areas with a clear dashboard.",
  },
  {
    icon: Lightbulb,
    title: "Detailed Explanations",
    description: "Every question includes an explanation to help you understand why the answer is correct.",
  },
  {
    icon: Link2,
    title: "Learning Resources",
    description: "Questions link to relevant videos, articles, and websites for deeper learning.",
  },
  {
    icon: Sparkles,
    title: "Glossary Highlighting",
    description: "Terms from the glossary are highlighted in questions with hover definitions.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description: "Power users can navigate quickly with keyboard shortcuts for all actions.",
  },
  {
    icon: History,
    title: "Session History",
    description: "Go back to review previous questions within your practice session.",
  },
  {
    icon: Palette,
    title: "Theme Options",
    description: "Choose light, dark, or system theme to match your preference.",
  },
  {
    icon: Trophy,
    title: "Weekly Goals",
    description: "Set and track weekly study goals for questions answered and tests completed.",
  },
  {
    icon: BarChart3,
    title: "Test Readiness",
    description: "Know exactly when you're ready to pass the real FCC exam.",
  },
];

// Animated icon wrapper with floating effect
function AnimatedIcon({ icon: Icon, color, bgColor }: { icon: LucideIcon; color: string; bgColor: string }) {
  return (
    <motion.div 
      className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center mb-4 relative`}
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className={`w-7 h-7 ${color}`} />
      </motion.div>
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-xl ${bgColor} blur-xl opacity-50`} />
    </motion.div>
  );
}

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute bottom-20 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl"
          />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-6"
          >
            Everything You Need to{" "}
            <span className="text-primary">Pass Your Exam</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            RARS Test Prep is packed with features designed to help you study efficiently, 
            track your progress, and pass the FCC amateur radio license exam on your first try.
          </motion.p>
        </div>
      </section>

      {/* Main Features with Mockups */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-foreground mb-4"
          >
            Core Study Modes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto"
          >
            Multiple ways to study so you can find what works best for your learning style.
          </motion.p>

          <div className="space-y-24">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } gap-8 lg:gap-16 items-center`}
              >
                {/* Text content */}
                <div className="flex-1 space-y-4">
                  <AnimatedIcon icon={feature.icon} color={feature.color} bgColor={feature.bgColor} />
                  <h3 className="text-2xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {feature.description}
                  </p>
                  <ul className="space-y-3 pt-2">
                    {feature.benefits.map((benefit, i) => (
                      <motion.li 
                        key={benefit} 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 text-muted-foreground"
                      >
                        <div className={`w-2 h-2 rounded-full ${feature.color.replace('text-', 'bg-')}`} />
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                
                {/* Mockup */}
                <motion.div 
                  className="flex-1 w-full max-w-md"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative">
                    {/* Shadow/glow effect behind mockup */}
                    <div className={`absolute inset-0 ${feature.bgColor} blur-2xl opacity-30 translate-y-4`} />
                    <div className="relative">
                      {feature.mockup}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-foreground mb-4"
          >
            Plus So Much More
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Every detail is designed to make your study experience better.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <feature.icon className="w-5 h-5 text-primary mb-2 group-hover:text-primary transition-colors" />
                </motion.div>
                <h3 className="font-medium text-foreground text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-foreground mb-12"
          >
            Why Study With RARS Test Prep?
          </motion.h2>

          <div className="space-y-8">
            {[
              {
                title: "Built by Hams, for Hams",
                description: "Created by the Raleigh Amateur Radio Society, a community of active amateur radio operators who understand what it takes to pass the exam.",
              },
              {
                title: "Complete Question Pool",
                description: "Access the full FCC question pool for Technician, General, and Extra class licenses. Every question you might see on the real exam is here.",
              },
              {
                title: "Learn, Don't Just Memorize",
                description: "Explanations and learning resources help you understand the concepts, not just memorize answers. This knowledge will serve you well as a licensed operator.",
              },
              {
                title: "Track Your Progress",
                description: "Know exactly where you stand with clear metrics showing your accuracy, weak areas, and test readiness. No guessing whether you're ready for the real exam.",
              },
              {
                title: "Study Anywhere",
                description: "Works on any device with a web browser. Study on your computer at home or on your phone during a lunch break.",
              },
              {
                title: "Completely Free",
                description: "No hidden fees, no premium tiers, no ads. RARS provides this as a free service to help more people join the amateur radio community.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 group"
              >
                <motion.div 
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                  whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--primary))" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <span className="text-primary font-bold text-sm group-hover:text-primary-foreground transition-colors">{index + 1}</span>
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5 relative overflow-hidden">
        {/* Animated background */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10"
        >
          <div className="w-full h-full rounded-full border-2 border-dashed border-primary" />
        </motion.div>
        
        <div className="max-w-2xl mx-auto text-center relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-foreground mb-4"
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mb-8"
          >
            Join thousands of aspiring ham radio operators who have used RARS Test Prep 
            to pass their FCC exams. Your license is just a few study sessions away.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Start Studying For Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground space-y-3">
          <p className="text-sm">
            © {new Date().getFullYear()} Brad Bazemore &{" "}
            <a
              href="https://www.rars.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              RARS
            </a>
            . All rights reserved.
          </p>
          <p className="text-sm">Made with ❤️ in North Carolina</p>
        </div>
      </footer>
    </div>
  );
}

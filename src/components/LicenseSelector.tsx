import { Link } from "react-router-dom";
import { Radio, BookOpen, Target, BarChart3, Bookmark, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";
import { UIPreviewSection } from "@/components/UIPreview";

interface LicenseSelectorProps {
  onSelectLicense: () => void;
}

export function LicenseSelector({
  onSelectLicense
}: LicenseSelectorProps) {
  const features = [{
    icon: BookOpen,
    title: "Official Question Pools",
    description: "Study from the actual FCC question pools used on the real exam. No surprises on test day.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    icon: Target,
    title: "Practice Tests",
    description: "Take 35-question practice tests that mirror the real exam format and passing requirements.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  }, {
    icon: Zap,
    title: "Random Practice",
    description: "Drill through unlimited random questions to build confidence and reinforce learning.",
    color: "text-success",
    bgColor: "bg-success/10"
  }, {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your improvement over time. See which topics need more attention.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    icon: Bookmark,
    title: "Bookmark Questions",
    description: "Save tricky questions for later review. Add personal notes to help you remember.",
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  }, {
    icon: CheckCircle2,
    title: "Weak Area Review",
    description: "Focus your study time on questions you've missed. Master your problem areas.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  }];

  const benefits = ["Free to use - no hidden costs", "Study anywhere, anytime", "Track your progress across sessions", "Built by hams, for hams"];

  return <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <LandingNav />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-4 pt-12 pb-12 md:pt-20 md:pb-16 radio-wave-bg">
        <motion.div initial={{
        opacity: 0,
        y: -30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }} className="text-center max-w-3xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Radio className="w-12 h-12 text-primary animate-pulse-slow" />
            <h1 className="text-4xl md:text-6xl font-mono font-bold text-foreground">
              <a href="https://www.rars.org/" target="_blank" rel="noopener noreferrer" className="text-primary text-glow-primary hover:underline">
                RARS
              </a>{" "}
              Test Prep
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Your path to becoming a licensed Amateur Radio operator
          </p>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Prepare for your Technician, General, or Amateur Extra license exam with our comprehensive study tools.
            Built by the{" "}
            <a href="https://www.rars.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              Raleigh Amateur Radio Society
            </a>
            .
          </p>

          {/* CTA Button */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.3,
          delay: 0.3
        }}>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Start Studying For Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits Bar */}
      <motion.section initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.5,
      delay: 0.2
    }} className="bg-muted/50 border-y border-border py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {benefits.map((benefit, index) => <div key={index} className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <span>{benefit}</span>
              </div>)}
          </div>
        </div>
      </motion.section>

      {/* UI Preview Section */}
      <UIPreviewSection />

      {/* Features Section */}
      <section id="features" className="py-16 px-4 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.3
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">
              Everything You Need to Pass
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our study tools are designed to help you learn efficiently and pass your exam on the first try.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <motion.div key={feature.title} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.4,
            delay: 0.4 + index * 0.1
          }} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 bg-muted/30 scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.5
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">How It Works</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
            step: "1",
            title: "Create Account",
            description: "Sign up for free in seconds. No credit card required."
          }, {
            step: "2",
            title: "Study & Practice",
            description: "Take practice tests and drill through questions at your own pace."
          }, {
            step: "3",
            title: "Pass Your Exam",
            description: "Show up confident and earn your amateur radio license!"
          }].map((item, index) => <motion.div key={item.step} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.4,
            delay: 0.6 + index * 0.1
          }} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.7
      }} className="max-w-2xl mx-auto text-center">
          <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 md:p-12">
            <Radio className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-4">Ready to Get Licensed?</h2>
            <p className="text-muted-foreground mb-6">Join other aspiring hams who have used RARS Test Prep to pass their exams. Your amateur radio journey starts here.</p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
      </motion.div>
      </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground space-y-3">
          <p className="text-sm">Official FCC question pools • Free to use</p>
          <p className="text-sm">
            A test prep app for the{" "}
            <a href="https://www.rars.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              Raleigh Amateur Radio Society (RARS)
            </a>
          </p>
          <p className="text-sm">Made with ❤️ in North Carolina</p>
          <p className="text-xs mt-4">© {new Date().getFullYear()} Brad Bazemore. All rights reserved.</p>
        </div>
      </footer>
    </div>;
}
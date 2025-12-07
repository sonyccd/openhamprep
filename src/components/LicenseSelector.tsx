import { Link } from "react-router-dom";
import { Radio, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LicenseSelectorProps {
  onSelectLicense: () => void;
}

export function LicenseSelector({ onSelectLicense }: LicenseSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 radio-wave-bg relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
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
            <span className="text-primary text-glow-primary">RARS</span> Test Prep
          </h1>
        </div>
        <p className="text-muted-foreground text-lg mb-2">
          Amateur Radio License Exam Preparation
        </p>
        <p className="text-muted-foreground">
          Study for your Technician, General, or Amateur Extra license
        </p>
      </motion.div>

      {/* CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card border-2 border-border rounded-xl p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-mono font-bold text-foreground mb-2">
          Get Started
        </h2>
        <p className="text-muted-foreground mb-6">
          Sign in to track your progress, review weak areas, and prepare for your exam.
        </p>
        <Link to="/auth">
          <Button size="lg" className="w-full">
            Sign In or Create Account
          </Button>
        </Link>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl w-full px-4"
      >
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-primary font-bold">35</span>
          </div>
          <h3 className="font-medium text-foreground mb-1">Practice Tests</h3>
          <p className="text-sm text-muted-foreground">Just like the real exam</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-accent font-bold">∞</span>
          </div>
          <h3 className="font-medium text-foreground mb-1">Random Practice</h3>
          <p className="text-sm text-muted-foreground">Unlimited question drills</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-success font-bold">✓</span>
          </div>
          <h3 className="font-medium text-foreground mb-1">Track Progress</h3>
          <p className="text-sm text-muted-foreground">Review weak areas</p>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-12 text-center text-muted-foreground"
      >
        <p className="text-sm">
          Official FCC question pools • Free to use
        </p>
      </motion.div>
    </div>
  );
}

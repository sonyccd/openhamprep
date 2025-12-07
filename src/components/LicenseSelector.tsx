import { Link } from "react-router-dom";
import { Radio, Lock, User, LogOut, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface LicenseSelectorProps {
  onSelectLicense: (license: 'technician') => void;
}

const licenses = [
  {
    id: 'technician' as const,
    name: 'Technician',
    element: 'Element 2',
    description: 'Entry-level license with VHF/UHF privileges',
    available: true,
    questionCount: '400+',
  },
  {
    id: 'general' as const,
    name: 'General',
    element: 'Element 3',
    description: 'HF privileges for worldwide communication',
    available: false,
    questionCount: '400+',
  },
  {
    id: 'extra' as const,
    name: 'Amateur Extra',
    element: 'Element 4',
    description: 'Full privileges on all amateur bands',
    available: false,
    questionCount: '700+',
  },
];

export function LicenseSelector({ onSelectLicense }: LicenseSelectorProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 radio-wave-bg">
      {/* Auth Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4"
      >
        {user ? (
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              Sign In
            </Button>
          </Link>
        )}
      </motion.div>

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
        <p className="text-muted-foreground text-lg">
          Amateur Radio License Exam Preparation
        </p>
        {!user && (
          <p className="text-sm text-muted-foreground mt-2">
            <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to track your progress
          </p>
        )}
      </motion.div>

      {/* License Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
        {licenses.map((license, index) => (
          <motion.div
            key={license.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
          >
            <button
              onClick={() => license.available && onSelectLicense('technician')}
              disabled={!license.available}
              className={`w-full h-full rounded-xl p-6 transition-all duration-300 text-left relative overflow-hidden ${
                license.available
                  ? 'bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 group cursor-pointer'
                  : 'bg-card/50 border-2 border-border/50 cursor-not-allowed'
              }`}
            >
              {!license.available && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Coming Soon</span>
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <h3 className={`text-2xl font-mono font-bold transition-colors ${
                  license.available 
                    ? 'text-foreground group-hover:text-primary' 
                    : 'text-foreground/50'
                }`}>
                  {license.name}
                </h3>
                <span className={`text-sm font-medium ${
                  license.available ? 'text-primary' : 'text-muted-foreground/50'
                }`}>
                  {license.element}
                </span>
              </div>
              
              <p className={`text-sm mb-4 leading-relaxed ${
                license.available ? 'text-muted-foreground' : 'text-muted-foreground/50'
              }`}>
                {license.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  license.available 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-secondary/50 text-secondary-foreground/50'
                }`}>
                  {license.questionCount} Questions
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  license.available 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-secondary/50 text-secondary-foreground/50'
                }`}>
                  2022-2026 Pool
                </span>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

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

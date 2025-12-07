import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Radio,
  LogOut,
  AlertTriangle,
  Play,
  BookOpen,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PracticeTest } from '@/components/PracticeTest';
import { RandomPractice } from '@/components/RandomPractice';
import { WeakQuestionsReview } from '@/components/WeakQuestionsReview';

type TestType = 'technician' | 'general' | 'extra';
type View = 'dashboard' | 'practice-test' | 'random-practice' | 'weak-questions';

const testTypes = [
  { id: 'technician' as TestType, name: 'Technician', available: true },
  { id: 'general' as TestType, name: 'General', available: false },
  { id: 'extra' as TestType, name: 'Amateur Extra', available: false },
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState<TestType>('technician');
  const [view, setView] = useState<View>('dashboard');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const { data: testResults, isLoading: testsLoading } = useQuery({
    queryKey: ['test-results', user?.id, selectedTest],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_test_results')
        .select('*')
        .eq('user_id', user!.id)
        .eq('test_type', selectedTest === 'technician' ? 'practice' : selectedTest)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: questionAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['question-attempts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate weak questions (questions answered incorrectly more than once)
  const weakQuestionIds = questionAttempts
    ? Object.entries(
        questionAttempts.reduce((acc, attempt) => {
          if (!attempt.is_correct) {
            acc[attempt.question_id] = (acc[attempt.question_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      )
        .filter(([_, count]) => count >= 1)
        .map(([id]) => id)
    : [];

  const currentTest = testTypes.find(t => t.id === selectedTest);
  const isTestAvailable = currentTest?.available ?? false;

  // Handle view changes
  if (view === 'practice-test') {
    return <PracticeTest onBack={() => setView('dashboard')} />;
  }

  if (view === 'random-practice') {
    return <RandomPractice onBack={() => setView('dashboard')} />;
  }

  if (view === 'weak-questions') {
    return <WeakQuestionsReview weakQuestionIds={weakQuestionIds} onBack={() => setView('dashboard')} />;
  }

  if (authLoading || testsLoading || attemptsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Calculate stats
  const totalTests = testResults?.length || 0;
  const passedTests = testResults?.filter(t => t.passed).length || 0;
  const avgScore = totalTests > 0 
    ? Math.round(testResults!.reduce((sum, t) => sum + Number(t.percentage), 0) / totalTests) 
    : 0;
  
  const totalAttempts = questionAttempts?.length || 0;
  const correctAttempts = questionAttempts?.filter(a => a.is_correct).length || 0;
  const overallAccuracy = totalAttempts > 0 
    ? Math.round((correctAttempts / totalAttempts) * 100) 
    : 0;

  const recentTests = testResults?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background py-6 px-4 radio-wave-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-mono font-bold text-foreground">
              <span className="text-primary">RARS</span> Test Prep
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Test Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Studying for</p>
                <Select value={selectedTest} onValueChange={(v) => setSelectedTest(v as TestType)}>
                  <SelectTrigger className="w-[220px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {testTypes.map((test) => (
                      <SelectItem 
                        key={test.id} 
                        value={test.id}
                        className="flex items-center gap-2"
                      >
                        <span className="flex items-center gap-2">
                          {test.name}
                          {!test.available && (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isTestAvailable && (
                <div className="flex items-center gap-2 text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Coming Soon</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <button
            onClick={() => isTestAvailable && setView('practice-test')}
            disabled={!isTestAvailable}
            className={cn(
              "p-6 rounded-xl border-2 text-left transition-all",
              isTestAvailable
                ? "bg-card border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-pointer group"
                : "bg-card/50 border-border/50 cursor-not-allowed opacity-60"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                isTestAvailable ? "bg-primary/10" : "bg-muted"
              )}>
                <Play className={cn("w-6 h-6", isTestAvailable ? "text-primary" : "text-muted-foreground")} />
              </div>
            </div>
            <h3 className={cn(
              "text-lg font-mono font-bold mb-1",
              isTestAvailable ? "text-foreground group-hover:text-primary" : "text-muted-foreground"
            )}>
              Practice Test
            </h3>
            <p className="text-sm text-muted-foreground">
              35 questions, timed like the real exam
            </p>
          </button>

          <button
            onClick={() => isTestAvailable && setView('random-practice')}
            disabled={!isTestAvailable}
            className={cn(
              "p-6 rounded-xl border-2 text-left transition-all",
              isTestAvailable
                ? "bg-card border-accent/30 hover:border-accent hover:shadow-lg hover:shadow-accent/10 cursor-pointer group"
                : "bg-card/50 border-border/50 cursor-not-allowed opacity-60"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                isTestAvailable ? "bg-accent/10" : "bg-muted"
              )}>
                <Zap className={cn("w-6 h-6", isTestAvailable ? "text-accent" : "text-muted-foreground")} />
              </div>
            </div>
            <h3 className={cn(
              "text-lg font-mono font-bold mb-1",
              isTestAvailable ? "text-foreground group-hover:text-accent" : "text-muted-foreground"
            )}>
              Random Practice
            </h3>
            <p className="text-sm text-muted-foreground">
              Quick practice, one question at a time
            </p>
          </button>

          <button
            onClick={() => isTestAvailable && weakQuestionIds.length > 0 && setView('weak-questions')}
            disabled={!isTestAvailable || weakQuestionIds.length === 0}
            className={cn(
              "p-6 rounded-xl border-2 text-left transition-all",
              isTestAvailable && weakQuestionIds.length > 0
                ? "bg-card border-destructive/30 hover:border-destructive hover:shadow-lg hover:shadow-destructive/10 cursor-pointer group"
                : "bg-card/50 border-border/50 cursor-not-allowed opacity-60"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                isTestAvailable && weakQuestionIds.length > 0 ? "bg-destructive/10" : "bg-muted"
              )}>
                <AlertTriangle className={cn(
                  "w-6 h-6", 
                  isTestAvailable && weakQuestionIds.length > 0 ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
              {weakQuestionIds.length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {weakQuestionIds.length}
                </span>
              )}
            </div>
            <h3 className={cn(
              "text-lg font-mono font-bold mb-1",
              isTestAvailable && weakQuestionIds.length > 0 ? "text-foreground group-hover:text-destructive" : "text-muted-foreground"
            )}>
              Review Weak Areas
            </h3>
            <p className="text-sm text-muted-foreground">
              {weakQuestionIds.length > 0 
                ? `Practice ${weakQuestionIds.length} questions you've missed`
                : "No weak questions yet"}
            </p>
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tests</span>
            </div>
            <p className="text-2xl font-mono font-bold text-foreground">{totalTests}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Passed</span>
            </div>
            <p className="text-2xl font-mono font-bold text-success">{passedTests}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Avg Score</span>
            </div>
            <p className="text-2xl font-mono font-bold text-foreground">{avgScore}%</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Questions</span>
            </div>
            <p className="text-2xl font-mono font-bold text-foreground">{totalAttempts}</p>
          </div>
        </motion.div>

        {/* Accuracy Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Accuracy</span>
            <span className="text-lg font-mono font-bold text-primary">{overallAccuracy}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
              style={{ width: `${overallAccuracy}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1 text-success">
              <CheckCircle className="w-3 h-3" /> {correctAttempts}
            </span>
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="w-3 h-3" /> {totalAttempts - correctAttempts}
            </span>
          </div>
        </motion.div>

        {/* Recent Tests */}
        {recentTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <h2 className="text-sm font-mono font-bold text-foreground mb-3">Recent Tests</h2>
            <div className="space-y-2">
              {recentTests.map((test) => (
                <div 
                  key={test.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    test.passed 
                      ? "border-success/30 bg-success/5" 
                      : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      test.passed 
                        ? "bg-success text-success-foreground" 
                        : "bg-destructive text-destructive-foreground"
                    )}>
                      {test.passed ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {test.score}/{test.total_questions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(test.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-lg font-mono font-bold",
                    test.passed ? "text-success" : "text-destructive"
                  )}>
                    {test.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

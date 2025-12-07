import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
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
  Bookmark,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PracticeTest } from '@/components/PracticeTest';
import { RandomPractice } from '@/components/RandomPractice';
import { WeakQuestionsReview } from '@/components/WeakQuestionsReview';
import { BookmarkedQuestions } from '@/components/BookmarkedQuestions';

type TestType = 'technician' | 'general' | 'extra';
type View = 'dashboard' | 'practice-test' | 'random-practice' | 'weak-questions' | 'bookmarks';

const testTypes = [
  { id: 'technician' as TestType, name: 'Technician', available: true },
  { id: 'general' as TestType, name: 'General', available: false },
  { id: 'extra' as TestType, name: 'Amateur Extra', available: false },
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { bookmarks } = useBookmarks();
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

  if (view === 'bookmarks') {
    return <BookmarkedQuestions onBack={() => setView('dashboard')} />;
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

  // Calculate test readiness
  const lastFiveTests = testResults?.slice(0, 5) || [];
  const recentPassCount = lastFiveTests.filter(t => t.passed).length;
  const recentAvgScore = lastFiveTests.length > 0
    ? Math.round(lastFiveTests.reduce((sum, t) => sum + Number(t.percentage), 0) / lastFiveTests.length)
    : 0;
  
  // Readiness levels: not-started, needs-work, getting-close, ready
  type ReadinessLevel = 'not-started' | 'needs-work' | 'getting-close' | 'ready';
  let readinessLevel: ReadinessLevel = 'not-started';
  let readinessMessage = "Take some practice tests to see your readiness";
  
  if (totalTests >= 1) {
    if (recentAvgScore >= 85 && recentPassCount >= Math.min(3, lastFiveTests.length)) {
      readinessLevel = 'ready';
      readinessMessage = "You're ready to take the real exam!";
    } else if (recentAvgScore >= 74 && recentPassCount >= 1) {
      readinessLevel = 'getting-close';
      readinessMessage = "Almost there! A few more passing scores and you'll be ready";
    } else {
      readinessLevel = 'needs-work';
      readinessMessage = "Keep practicing to improve your scores";
    }
  }

  const readinessConfig = {
    'not-started': { 
      color: 'text-muted-foreground', 
      bg: 'bg-secondary', 
      border: 'border-border',
      icon: Target,
      progress: 0
    },
    'needs-work': { 
      color: 'text-foreground', 
      bg: 'bg-secondary', 
      border: 'border-border',
      icon: TrendingUp,
      progress: 33
    },
    'getting-close': { 
      color: 'text-primary', 
      bg: 'bg-primary/10', 
      border: 'border-primary/30',
      icon: TrendingUp,
      progress: 66
    },
    'ready': { 
      color: 'text-success', 
      bg: 'bg-success/10', 
      border: 'border-success/30',
      icon: CheckCircle,
      progress: 100
    },
  };

  const config = readinessConfig[readinessLevel];
  const ReadinessIcon = config.icon;

  return (
    <div className="min-h-screen bg-background py-6 px-4 radio-wave-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header with Test Selector */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Radio className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-mono font-bold text-foreground">
                <span className="text-primary">RARS</span> Test Prep
              </h1>
            </div>
            <div className="hidden md:block h-6 w-px bg-border" />
            <Select value={selectedTest} onValueChange={(v) => setSelectedTest(v as TestType)}>
              <SelectTrigger className="w-[180px] bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {testTypes.map((test) => (
                  <SelectItem 
                    key={test.id} 
                    value={test.id}
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
            {!isTestAvailable && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                Coming Soon
              </span>
            )}
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

        {/* Test Readiness Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl p-4 mb-6 border",
            config.bg,
            config.border
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              readinessLevel === 'ready' ? 'bg-success/20' : 
              readinessLevel === 'getting-close' ? 'bg-primary/20' : 'bg-secondary'
            )}>
              <ReadinessIcon className={cn("w-6 h-6", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className={cn("font-mono font-bold", config.color)}>
                  {readinessLevel === 'not-started' ? 'Test Readiness' :
                   readinessLevel === 'needs-work' ? 'Keep Studying' :
                   readinessLevel === 'getting-close' ? 'Almost Ready' :
                   'Ready to Test!'}
                </h2>
                {totalTests > 0 && (
                  <span className="text-sm font-mono text-muted-foreground">
                    {recentAvgScore}% avg
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{readinessMessage}</p>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${config.progress}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={cn(
                    "h-full rounded-full",
                    readinessLevel === 'ready' ? 'bg-success' :
                    readinessLevel === 'getting-close' ? 'bg-primary' :
                    'bg-muted-foreground/30'
                  )}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.15 }}
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
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-4 mb-8"
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

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-4"
        >
          <h2 className="text-lg font-mono font-bold text-foreground">Start Practicing</h2>
          <p className="text-sm text-muted-foreground">Choose how you want to study</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Button
            onClick={() => isTestAvailable && setView('practice-test')}
            disabled={!isTestAvailable}
            variant="outline"
            className={cn(
              "h-auto p-6 flex items-center gap-4 justify-start",
              isTestAvailable 
                ? "hover:bg-secondary hover:border-foreground/20 hover:shadow-lg" 
                : "opacity-60"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
              isTestAvailable ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Play className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground">Practice Test</h3>
              <p className="text-sm text-muted-foreground">35 questions, like the real exam</p>
            </div>
          </Button>

          <Button
            onClick={() => isTestAvailable && setView('random-practice')}
            disabled={!isTestAvailable}
            variant="outline"
            className={cn(
              "h-auto p-6 flex items-center gap-4 justify-start",
              isTestAvailable 
                ? "hover:bg-secondary hover:border-foreground/20 hover:shadow-lg" 
                : "opacity-60"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
              isTestAvailable ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Zap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground">Random Practice</h3>
              <p className="text-sm text-muted-foreground">Quick drills, one at a time</p>
            </div>
          </Button>

          <Button
            onClick={() => isTestAvailable && weakQuestionIds.length > 0 && setView('weak-questions')}
            disabled={!isTestAvailable || weakQuestionIds.length === 0}
            variant="outline"
            className={cn(
              "h-auto p-6 flex items-center gap-4 justify-start",
              isTestAvailable && weakQuestionIds.length > 0
                ? "hover:bg-secondary hover:border-foreground/20 hover:shadow-lg" 
                : "opacity-60"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 relative",
              isTestAvailable && weakQuestionIds.length > 0 ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"
            )}>
              <AlertTriangle className="w-6 h-6" />
              {weakQuestionIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                  {weakQuestionIds.length}
                </span>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground">Review Weak Areas</h3>
              <p className="text-sm text-muted-foreground">
                {weakQuestionIds.length > 0 
                  ? `${weakQuestionIds.length} questions to review`
                  : "No weak questions yet"}
              </p>
            </div>
          </Button>

          <Button
            onClick={() => setView('bookmarks')}
            variant="outline"
            className="h-auto p-6 flex items-center gap-4 justify-start hover:bg-secondary hover:border-foreground/20 hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-secondary text-foreground relative">
              <Bookmark className="w-6 h-6" />
              {bookmarks && bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                  {bookmarks.length}
                </span>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground">Bookmarked</h3>
              <p className="text-sm text-muted-foreground">
                {bookmarks && bookmarks.length > 0
                  ? `${bookmarks.length} saved question${bookmarks.length !== 1 ? 's' : ''}`
                  : "Save questions to review"}
              </p>
            </div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

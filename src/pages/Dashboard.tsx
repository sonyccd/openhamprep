import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Radio
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: testResults, isLoading: testsLoading } = useQuery({
    queryKey: ['test-results', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_test_results')
        .select('*')
        .eq('user_id', user!.id)
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

  const practiceTestAttempts = questionAttempts?.filter(a => a.attempt_type === 'practice_test').length || 0;
  const randomPracticeAttempts = questionAttempts?.filter(a => a.attempt_type === 'random_practice').length || 0;

  const recentTests = testResults?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <Radio className="w-5 h-5" />
            <span className="font-mono font-semibold">Your Progress</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Tests Taken</span>
            </div>
            <p className="text-3xl font-mono font-bold text-foreground">{totalTests}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Tests Passed</span>
            </div>
            <p className="text-3xl font-mono font-bold text-success">{passedTests}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-sm text-muted-foreground">Avg Score</span>
            </div>
            <p className="text-3xl font-mono font-bold text-foreground">{avgScore}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Questions</span>
            </div>
            <p className="text-3xl font-mono font-bold text-foreground">{totalAttempts}</p>
          </motion.div>
        </div>

        {/* Accuracy Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 mb-8"
        >
          <h2 className="text-lg font-mono font-bold text-foreground mb-4">Overall Accuracy</h2>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                  style={{ width: `${overallAccuracy}%` }}
                />
              </div>
            </div>
            <p className="text-2xl font-mono font-bold text-primary">{overallAccuracy}%</p>
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">{correctAttempts} correct</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground">{totalAttempts - correctAttempts} incorrect</span>
            </div>
          </div>
        </motion.div>

        {/* Practice Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-5 h-5 text-primary" />
              <h3 className="font-mono font-semibold text-foreground">Practice Tests</h3>
            </div>
            <p className="text-4xl font-mono font-bold text-primary">{practiceTestAttempts}</p>
            <p className="text-sm text-muted-foreground">questions answered</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="font-mono font-semibold text-foreground">Random Practice</h3>
            </div>
            <p className="text-4xl font-mono font-bold text-accent">{randomPracticeAttempts}</p>
            <p className="text-sm text-muted-foreground">questions answered</p>
          </div>
        </motion.div>

        {/* Recent Tests */}
        {recentTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="text-lg font-mono font-bold text-foreground mb-4">Recent Tests</h2>
            <div className="space-y-3">
              {recentTests.map((test, idx) => (
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
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold",
                      test.passed 
                        ? "bg-success text-success-foreground" 
                        : "bg-destructive text-destructive-foreground"
                    )}>
                      {test.passed ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {test.score}/{test.total_questions} correct
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(test.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xl font-mono font-bold",
                    test.passed ? "text-success" : "text-destructive"
                  )}>
                    {test.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {totalTests === 0 && totalAttempts === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground mb-4">No practice data yet. Start practicing to track your progress!</p>
            <Link to="/">
              <Button>Start Practicing</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

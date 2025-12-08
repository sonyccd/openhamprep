import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, BarChart3, TrendingDown, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminStatsProps {
  testType: 'technician' | 'general' | 'extra';
  onAddLinkToQuestion?: (questionId: string) => void;
}

const TEST_TYPE_PREFIXES = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

interface QuestionStats {
  id: string;
  question: string;
  subelement: string;
  question_group: string;
  hasLinks: boolean;
  totalAttempts: number;
  correctAttempts: number;
  firstTryCorrect: number;
  firstTryTotal: number;
}

export function AdminStats({ testType, onAddLinkToQuestion }: AdminStatsProps) {
  const prefix = TEST_TYPE_PREFIXES[testType];

  // Fetch questions with their link status
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['admin-stats-questions', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question, subelement, question_group, links')
        .like('id', `${prefix}%`)
        .order('id');
      
      if (error) throw error;
      return data.map(q => ({
        ...q,
        hasLinks: Array.isArray(q.links) && q.links.length > 0
      }));
    },
  });

  // Fetch all question attempts for statistics
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['admin-stats-attempts', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('question_id, is_correct, user_id, attempted_at')
        .like('question_id', `${prefix}%`)
        .order('attempted_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = questionsLoading || attemptsLoading;

  // Calculate statistics
  const subelementStats = questions.reduce((acc, q) => {
    if (!acc[q.subelement]) {
      acc[q.subelement] = { count: 0, withLinks: 0, groups: new Set() };
    }
    acc[q.subelement].count++;
    if (q.hasLinks) acc[q.subelement].withLinks++;
    acc[q.subelement].groups.add(q.question_group);
    return acc;
  }, {} as Record<string, { count: number; withLinks: number; groups: Set<string> }>);

  // Calculate per-question attempt statistics
  const questionAttemptStats: Record<string, { total: number; correct: number; firstTryCorrect: number; firstTryTotal: number; userFirstAttempts: Set<string> }> = {};
  
  // Track first attempts per user per question
  const userQuestionFirstAttempt: Record<string, boolean> = {};
  
  attempts.forEach(attempt => {
    const key = `${attempt.user_id}-${attempt.question_id}`;
    const isFirstAttempt = !userQuestionFirstAttempt[key];
    
    if (!questionAttemptStats[attempt.question_id]) {
      questionAttemptStats[attempt.question_id] = { 
        total: 0, 
        correct: 0, 
        firstTryCorrect: 0, 
        firstTryTotal: 0,
        userFirstAttempts: new Set()
      };
    }
    
    questionAttemptStats[attempt.question_id].total++;
    if (attempt.is_correct) questionAttemptStats[attempt.question_id].correct++;
    
    if (isFirstAttempt) {
      questionAttemptStats[attempt.question_id].firstTryTotal++;
      if (attempt.is_correct) questionAttemptStats[attempt.question_id].firstTryCorrect++;
      userQuestionFirstAttempt[key] = true;
    }
  });

  // Build full question stats
  const fullQuestionStats: QuestionStats[] = questions.map(q => ({
    id: q.id,
    question: q.question,
    subelement: q.subelement,
    question_group: q.question_group,
    hasLinks: q.hasLinks,
    totalAttempts: questionAttemptStats[q.id]?.total || 0,
    correctAttempts: questionAttemptStats[q.id]?.correct || 0,
    firstTryCorrect: questionAttemptStats[q.id]?.firstTryCorrect || 0,
    firstTryTotal: questionAttemptStats[q.id]?.firstTryTotal || 0,
  }));

  // Find hardest questions (lowest first-try correct rate with at least 3 attempts)
  const hardestQuestions = fullQuestionStats
    .filter(q => q.firstTryTotal >= 3)
    .map(q => ({
      ...q,
      firstTryRate: q.firstTryTotal > 0 ? (q.firstTryCorrect / q.firstTryTotal) * 100 : 0,
      overallRate: q.totalAttempts > 0 ? (q.correctAttempts / q.totalAttempts) * 100 : 0,
    }))
    .sort((a, b) => a.firstTryRate - b.firstTryRate)
    .slice(0, 10);

  // Questions without links that have low success rates
  const needsResources = fullQuestionStats
    .filter(q => !q.hasLinks && q.firstTryTotal >= 3)
    .map(q => ({
      ...q,
      firstTryRate: q.firstTryTotal > 0 ? (q.firstTryCorrect / q.firstTryTotal) * 100 : 0,
    }))
    .filter(q => q.firstTryRate < 60)
    .sort((a, b) => a.firstTryRate - b.firstTryRate)
    .slice(0, 10);

  // Overall stats
  const totalQuestions = questions.length;
  const questionsWithLinks = questions.filter(q => q.hasLinks).length;
  const questionsWithAttempts = fullQuestionStats.filter(q => q.totalAttempts > 0).length;
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(a => a.is_correct).length;
  const overallCorrectRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {questionsWithAttempts} have been attempted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questions with Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionsWithLinks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalQuestions > 0 ? ((questionsWithLinks / totalQuestions) * 100).toFixed(1) : 0}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCorrectRate.toFixed(1)}%</div>
            <Progress value={overallCorrectRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Subelement Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Questions by Subelement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(subelementStats)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([subelement, stats]) => (
                <div key={subelement} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {subelement}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {stats.groups.size} groups
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{stats.count} questions</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <LinkIcon className="w-3 h-3" />
                        {stats.withLinks}/{stats.count}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(stats.withLinks / stats.count) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Hardest Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            Hardest Questions (Lowest First-Try Success)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hardestQuestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Not enough attempt data yet (need at least 3 attempts per question)
            </p>
          ) : (
            <div className="space-y-3">
              {hardestQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className={`p-3 rounded-lg border border-border bg-card ${!q.hasLinks && onAddLinkToQuestion ? 'cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors' : ''}`}
                  onClick={() => !q.hasLinks && onAddLinkToQuestion?.(q.id)}
                  title={!q.hasLinks ? "Click to add a learning link" : undefined}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {q.id}
                        </span>
                        {q.hasLinks ? (
                          <Badge variant="secondary" className="text-xs">
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Has Links
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Add Link
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-destructive">
                        {q.firstTryRate.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        first try ({q.firstTryCorrect}/{q.firstTryTotal})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        overall: {q.overallRate.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Needing Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Questions Needing Learning Resources
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Low success rate (&lt;60%) and no learning links attached
          </p>
        </CardHeader>
        <CardContent>
          {needsResources.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {questionsWithLinks === totalQuestions 
                ? "All questions have learning resources!" 
                : "No struggling questions without resources found yet"}
            </p>
          ) : (
            <div className="space-y-3">
              {needsResources.map((q) => (
                <div 
                  key={q.id} 
                  className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/10 transition-colors"
                  onClick={() => onAddLinkToQuestion?.(q.id)}
                  title="Click to add a learning link"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {q.id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {q.subelement} / {q.question_group}
                        </span>
                        <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Add Link
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-amber-500">
                        {q.firstTryRate.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {q.firstTryCorrect}/{q.firstTryTotal} first tries
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
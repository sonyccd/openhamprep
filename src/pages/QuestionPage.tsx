import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuestion } from '@/hooks/useQuestions';
import { QuestionCard } from '@/components/QuestionCard';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Loader2, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const isValidQuestionId = (id: string) => /^[TGE]\d[A-Z]\d{2}$/i.test(id);

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: question, isLoading, error } = useQuestion(id);

  // Update document title
  useEffect(() => {
    const prevTitle = document.title;
    document.title = id ? `Question ${id.toUpperCase()} | Open Ham Prep` : 'Question | Open Ham Prep';
    return () => {
      document.title = prevTitle;
    };
  }, [id]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?returnTo=/questions/${id}`, { replace: true });
    }
  }, [user, authLoading, navigate, id]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if not logged in (will redirect)
  if (!user) {
    return null;
  }

  // Validate question ID format
  if (id && !isValidQuestionId(id)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Question ID</h1>
            <p className="text-muted-foreground mb-6">
              The question ID "{id}" is not a valid format. Question IDs should look like T1A01, G2B03, or E3C12.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show loading while fetching question
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  // Question not found
  if (error || !question) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Question Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find question "{id?.toUpperCase()}". It may have been removed or the ID is incorrect.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="py-8 px-4 pb-24 md:pb-8">
        {/* Back button */}
        <div className="max-w-3xl mx-auto mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Question Card - showing result immediately */}
        <QuestionCard
          question={question}
          selectedAnswer={question.correctAnswer}
          onSelectAnswer={() => {}}
          showResult={true}
          enableGlossaryHighlight
        />

        {/* Navigation actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto mt-8 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/dashboard?view=random-practice')}>
            <Zap className="w-4 h-4 mr-2" />
            Practice More Questions
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

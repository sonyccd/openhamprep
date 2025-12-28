import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuestion } from '@/hooks/useQuestions';
import { QuestionCard } from '@/components/QuestionCard';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Loader2, AlertCircle, Zap, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

// Accept either display name format (T1A01) or UUID format
const isValidDisplayName = (id: string) => /^[TGE]\d[A-Z]\d{2}$/i.test(id);
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const isValidQuestionId = (id: string) => isValidDisplayName(id) || isUUID(id);

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: question, isLoading, error } = useQuestion(id);

  // Update document title - use displayName if available (for UUID-based URLs)
  useEffect(() => {
    const prevTitle = document.title;
    const displayId = question?.displayName || (id && isValidDisplayName(id) ? id.toUpperCase() : id);
    document.title = displayId ? `Question ${displayId} | Open Ham Prep` : 'Question | Open Ham Prep';
    return () => {
      document.title = prevTitle;
    };
  }, [id, question?.displayName]);

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
              The question ID "{id}" is not a valid format. Question IDs should look like T1A01, G2B03, E3C12, or be a valid UUID.
            </p>
            <Button onClick={() => navigate(user ? '/dashboard' : '/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {user ? 'Back to Dashboard' : 'Back to Home'}
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
            <Button onClick={() => navigate(user ? '/dashboard' : '/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {user ? 'Back to Dashboard' : 'Back to Home'}
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

        {/* Sign-up CTA for anonymous users */}
        {!user && !authLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mt-6"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-muted-foreground mb-3">
                Create a free account to track your progress, bookmark questions, and access more study tools.
              </p>
              <Button onClick={() => navigate(`/auth?returnTo=/questions/${id}`)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Free Account
              </Button>
            </div>
          </motion.div>
        )}

        {/* Navigation actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-8 flex flex-col sm:flex-row justify-center gap-4"
        >
          {user ? (
            <>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate('/dashboard?view=random-practice')}>
                <Zap className="w-4 h-4 mr-2" />
                Practice More Questions
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button onClick={() => navigate('/auth?returnTo=/dashboard?view=random-practice')}>
                <Zap className="w-4 h-4 mr-2" />
                Start Practicing
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

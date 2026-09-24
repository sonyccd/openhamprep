import { Icon } from '@/components/ohp/Icon';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuestion } from '@/hooks/useQuestions';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { QuestionCard } from '@/components/QuestionCard';
import { MotionBox } from '@/components/ohp/MotionBox';
import { ThemeToggle } from '@/components/ThemeToggle';
import { QuestionPageMessage } from './question/QuestionPageMessage';
import { SignUpPrompt } from './question/SignUpPrompt';

// Accept either display name format (T1A01) or UUID format
const isValidDisplayName = (id: string) => /^[TGE]\d[A-Z]\d{2}$/i.test(id);
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const isValidQuestionId = (id: string) => isValidDisplayName(id) || isUUID(id);

/** The theme toggle floats in the corner on every state of this page. */
function CornerThemeToggle() {
  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
      <ThemeToggle />
    </Box>
  );
}

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { navigateToTopic } = useAppNavigation();
  const { data: question, isLoading, error } = useQuestion(id);

  const handleTopicClick = (slug: string) => {
    navigateToTopic(slug);
    navigate('/dashboard');
  };

  const goHome = () => navigate(user ? '/dashboard' : '/');
  const homeLabel = user ? 'Back to Dashboard' : 'Back to Home';

  // Title follows the question, using displayName for UUID-based URLs.
  useEffect(() => {
    const prevTitle = document.title;
    const displayId = question?.displayName || (id && isValidDisplayName(id) ? id.toUpperCase() : id);
    document.title = displayId ? `Question ${displayId} | Open Ham Prep` : 'Question | Open Ham Prep';
    return () => {
      document.title = prevTitle;
    };
  }, [id, question?.displayName]);

  if (id && !isValidQuestionId(id)) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <CornerThemeToggle />
        <QuestionPageMessage title="Invalid Question ID" actionLabel={homeLabel} onAction={goHome}>
          The question ID "{id}" is not a valid format. Question IDs should look like T1A01, G2B03,
          E3C12, or be a valid UUID.
        </QuestionPageMessage>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ textAlign: 'center' }} role="status" aria-label="Loading question">
          <CircularProgress size={32} sx={{ mb: 2 }} />
          <Typography sx={{ color: 'text.secondary' }}>Loading question...</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !question) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <CornerThemeToggle />
        <QuestionPageMessage title="Question Not Found" actionLabel={homeLabel} onAction={goHome}>
          We couldn't find question "{id?.toUpperCase()}". It may have been removed or the ID is
          incorrect.
        </QuestionPageMessage>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <CornerThemeToggle />

      <Box sx={{ py: 4, px: 2, pb: { xs: 12, md: 4 } }}>
        {user && (
          <Box sx={{ maxWidth: 768, mx: 'auto', mb: 3 }}>
            <Button
              variant="text"
              color="inherit"
              onClick={() => navigate('/dashboard')}
              startIcon={<Icon icon={ArrowLeft} size={16} />}
            >
              Dashboard
            </Button>
          </Box>
        )}

        {!user && !authLoading && <SignUpPrompt onSignUp={() => navigate(`/auth?returnTo=/questions/${id}`)} />}

        <QuestionCard
          question={question}
          selectedAnswer={question.correctAnswer}
          onSelectAnswer={() => {}}
          showResult={true}
          enableGlossaryHighlight
          onTopicClick={handleTopicClick}
        />

        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          sx={{ maxWidth: 768, mx: 'auto', mt: 4, display: 'flex', justifyContent: 'center' }}
        >
          <Button
            variant="contained"
            onClick={() => navigate(user ? '/dashboard?view=random-practice' : '/auth?returnTo=/dashboard?view=random-practice')}
            startIcon={<Icon icon={Zap} size={16} />}
          >
            {user ? 'Practice More Questions' : 'Start Practicing'}
          </Button>
        </MotionBox>
      </Box>
    </Box>
  );
}

import { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QuestionListView } from "@/components/QuestionListView";
import { RotateCcw, ArrowLeft, CheckCircle } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { ChoiceRow } from "@/components/ChoiceRow";
import { QuizProgress } from "@/components/QuizProgress";
import { QuizScoreline } from "@/components/QuizScoreline";
import { getSubelementName } from "@/lib/subelementNames";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ohp/PageContainer";
import { QuizShell, QuizShellPending, QuizShellError, QuizNavControls } from "@/components/QuizShell";

interface SubelementPracticeProps {
  onBack: () => void;
  testType: TestType;
}

type TopicView = 'list' | 'questions' | 'practice';

// Topic descriptions for each subelement
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  T0: "Understanding FCC rules and regulations is fundamental to becoming a licensed amateur radio operator. This section covers the Commission's rules regarding station identification, authorized frequencies, power limits, and proper operating procedures.",
  T1: "Operating procedures form the backbone of effective amateur radio communication. This topic covers standard practices for making contacts, handling emergency communications, and participating in nets.",
  T2: "Radio waves are the foundation of all wireless communication. This section explores how radio signals behave, including concepts like frequency, wavelength, and the electromagnetic spectrum.",
  T3: "Propagation determines how far and how reliably your signal travels. This topic covers the various ways radio waves travel from transmitter to receiver.",
  T4: "Good amateur radio practices ensure safe, effective, and courteous operation. This section covers topics like RF safety, grounding, interference prevention, and station setup.",
  T5: "Electrical principles are essential for understanding how radio equipment works. This topic covers fundamental concepts like Ohm's Law, power calculations, and basic circuit theory.",
  T6: "Electronic components are the building blocks of all radio equipment. This section introduces resistors, capacitors, inductors, diodes, transistors, and integrated circuits.",
  T7: "Station equipment knowledge helps you select, operate, and maintain your radio gear. This topic covers transceivers, antennas, feed lines, and accessories.",
  T8: "Operating activities showcase the diverse world of amateur radio. This section covers various modes and activities including voice, digital modes, satellite communication, and emergency operations.",
  T9: "Antennas and feed lines are critical to your station's performance. This topic covers antenna types, feed line characteristics, and matching systems.",
};

export function SubelementPractice({
  onBack,
  testType
}: SubelementPracticeProps) {
  const {
    navigateToTopic,
    selectedSubelement: navSelectedSubelement,
    setSelectedSubelement: setNavSelectedSubelement,
  } = useAppNavigation();
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions(testType);
  const {
    saveRandomAttempt
  } = useProgress();

  // Get subelement name helper bound to current test type
  const getSubelementNameForTest = (sub: string) => getSubelementName(testType, sub);

  const [selectedSubelement, setSelectedSubelement] = useState<string | null>(null);
  const [topicView, setTopicView] = useState<TopicView>('list');



  // Reset state when test type changes
  useEffect(() => {
    setSelectedSubelement(null);
    setTopicView('list');
  }, [testType]);

  // Consume pre-selected subelement from navigation context
  useEffect(() => {
    if (navSelectedSubelement) {
      setSelectedSubelement(navSelectedSubelement);
      setTopicView('questions');
      setNavSelectedSubelement(null); // Clear after consuming
    }
  }, [navSelectedSubelement, setNavSelectedSubelement]);

  // Group questions by subelement
  const questionsBySubelement = useMemo(() => {
    if (!allQuestions) return {};
    return allQuestions.reduce((acc, q) => {
      if (!acc[q.subelement]) acc[q.subelement] = [];
      acc[q.subelement].push(q);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [allQuestions]);

  const subelements = useMemo(() => {
    return Object.keys(questionsBySubelement).sort();
  }, [questionsBySubelement]);

  const currentQuestions = useMemo(() => {
    return selectedSubelement ? questionsBySubelement[selectedSubelement] || [] : [];
  }, [selectedSubelement, questionsBySubelement]);

  const session = useQuizSession({
    questions: currentQuestions,
    // Picking a different subelement — including via the test-type reset above,
    // which clears the selection — abandons the session and its score.
    resetKey: selectedSubelement,
    onAttempt: (question, answer, _isCorrect, timeElapsedMs) =>
      saveRandomAttempt(question, answer, 'subelement_practice', timeElapsedMs),
  });

  const { question, selectedAnswer, showResult, stats, canGoBack } = session;

  const handleSelectSubelement = (sub: string) => {
    setSelectedSubelement(sub);
    setTopicView('questions');
  };

  const handleStartPractice = (startIndex?: number) => {
    setTopicView('practice');
    session.start(startIndex);
  };

  const handleBackToQuestions = () => {
    setTopicView('questions');
    // Leaves the question, not the run: resetKey does not fire here because the
    // subelement is unchanged, and the score carries over to when practice resumes.
    session.clearHistory();
  };

  const handleBackToList = () => {
    setSelectedSubelement(null);
    setTopicView('list');
  };

  // Keyboard shortcuts - must be called unconditionally before any returns
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => session.selectAnswer('A'), disabled: showResult || !question },
    { key: 'b', description: 'Select B', action: () => session.selectAnswer('B'), disabled: showResult || !question },
    { key: 'c', description: 'Select C', action: () => session.selectAnswer('C'), disabled: showResult || !question },
    { key: 'd', description: 'Select D', action: () => session.selectAnswer('D'), disabled: showResult || !question },
    { key: 'ArrowRight', description: 'Next', action: session.next, disabled: !showResult },
    { key: 'ArrowLeft', description: 'Previous', action: session.previous, disabled: !canGoBack },
    { key: 's', description: 'Skip', action: session.skip, disabled: showResult || !question },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: topicView === 'practice' });

  if (isLoading) return <QuizShellPending message="Loading questions..." />;

  if (error || !allQuestions || allQuestions.length === 0) {
    return <QuizShellError onBack={onBack} />;
  }

  // Show subelement selection list
  if (topicView === 'list' || !selectedSubelement) {
    return (
      <PageContainer width="standard" mobileNavPadding>
        <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontFamily: "monospace", fontWeight: 700, mb: 1 }}
          >
            Choose a Topic
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Focus on specific areas to strengthen your knowledge
          </Typography>
        </MotionBox>

        <Box sx={{ display: "grid", gap: 1.5 }}>
          {subelements.map((sub, index) => (
            <ChoiceRow
              key={sub}
              index={index}
              badge={sub}
              title={getSubelementNameForTest(sub)}
              onClick={() => handleSelectSubelement(sub)}
            />
          ))}
        </Box>
      </PageContainer>
    );
  }

  // Show question list view
  if (topicView === 'questions') {
    return (
      <QuestionListView
        title={getSubelementNameForTest(selectedSubelement)}
        subtitle={`Subelement ${selectedSubelement}`}
        badge={selectedSubelement}
        questions={currentQuestions}
        onBack={handleBackToList}
        onStartPractice={handleStartPractice}
        description={TOPIC_DESCRIPTIONS[selectedSubelement] || undefined}
      />
    );
  }

  // Show practice view
  if (!question) return <QuizShellPending />;

  const percentage = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;

  return (
    <QuizShell
      header={
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
            <Button
              variant="text"
              onClick={handleBackToQuestions}
              startIcon={<Box component={ArrowLeft} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
              sx={{ ml: -1, color: "text.primary" }}
            >
              Question List
            </Button>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <KeyboardShortcutsHelp />
              <Box
                component="span"
                sx={{ fontFamily: "monospace", fontSize: "0.875rem", color: "text.secondary" }}
              >
                {selectedSubelement}
              </Box>
            </Box>
          </Box>

          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <QuizProgress asked={session.askedIds.length} total={currentQuestions.length} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.875rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  fontFamily: "monospace",
                  color: "text.secondary",
                }}
              >
                <QuizScoreline correct={stats.correct} incorrect={stats.total - stats.correct} />
                <Box component="span" aria-hidden="true" sx={{ opacity: 0.3, mx: 0.5 }}>
                  |
                </Box>
                <Box component="span" sx={{ color: "primary.main", fontWeight: 500 }}>
                  {percentage}%
                </Box>
                <Box component="span" aria-hidden="true" sx={{ opacity: 0.3, mx: 0.5 }}>
                  |
                </Box>
                <Box component="span">
                  {session.askedIds.length}/{currentQuestions.length}
                </Box>
                {session.askedIds.length === currentQuestions.length && (
                  <Box
                    component={CheckCircle}
                    aria-hidden="true"
                    sx={{ width: 14, height: 14, color: "success.main" }}
                  />
                )}
              </Box>
              <IconButton
                aria-label="Reset"
                size="small"
                onClick={session.reset}
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                <Box component={RotateCcw} aria-hidden="true" sx={{ width: 16, height: 16 }} />
              </IconButton>
            </Box>
          </MotionBox>
        </Box>
      }
      actions={<QuizNavControls session={session} sx={{ mt: 5 }} />}
      footer={
        session.history.length > 1 &&
        `Question ${session.historyIndex + 1} of ${session.history.length}`
      }
    >
      <QuestionCard question={question} selectedAnswer={selectedAnswer} onSelectAnswer={session.selectAnswer} showResult={showResult} enableGlossaryHighlight onTopicClick={navigateToTopic} />
    </QuizShell>
  );
}

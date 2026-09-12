import { useState, useCallback, useEffect, useRef } from "react";
import type { Question } from "@/services/questions/questionService";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";

export type AnswerLetter = "A" | "B" | "C" | "D";

export interface QuizHistoryEntry {
  question: Question;
  selectedAnswer: AnswerLetter | null;
  showResult: boolean;
}

/**
 * Drill modes have no natural end, so the back-navigation stack would otherwise
 * grow for as long as the session lasts, holding every Question object served.
 * ChapterPractice capped it at 50; RandomPractice and SubelementPractice never
 * got the same fix. Extracting the engine applies it to all three.
 */
const MAX_HISTORY_SIZE = 50;

/**
 * history, index and askedIds move together on every transition — a draw can
 * append, trim and advance at once, and wrapping around resets all three. They
 * are one state object so no transition can land half-applied.
 */
interface SessionState {
  history: QuizHistoryEntry[];
  index: number;
  askedIds: string[];
}

const EMPTY_SESSION: SessionState = { history: [], index: -1, askedIds: [] };

const newEntry = (question: Question): QuizHistoryEntry => ({
  question,
  selectedAnswer: null,
  showResult: false,
});

/**
 * Picks the next question, avoiding ones already served. Exported for its own
 * tests: it owns the wrap-around rule, which is the part with an edge case.
 *
 * `wrapped` reports that every question in the pool had been served, so the
 * caller starts a fresh pass. The pick then comes from the whole pool rather
 * than from nothing.
 */
export const pickQuestion = (
  pool: Question[],
  excludeIds: string[] = [],
): { question: Question; wrapped: boolean } | null => {
  if (pool.length === 0) return null;

  const available = pool.filter((q) => !excludeIds.includes(q.id));
  if (available.length === 0) {
    return { question: pool[Math.floor(Math.random() * pool.length)], wrapped: true };
  }
  return { question: available[Math.floor(Math.random() * available.length)], wrapped: false };
};

export interface UseQuizSessionOptions {
  /** The pool to draw from: every question for random practice, one chapter's or one subelement's otherwise. */
  questions: Question[];
  /** Called once per answered question, after the answer is recorded. */
  onAttempt?: (
    question: Question,
    answer: AnswerLetter,
    isCorrect: boolean,
    timeElapsedMs: number,
  ) => void | Promise<void>;
  /**
   * Draw the first question as soon as the pool is non-empty. Random practice
   * opens straight into a question; the chapter and subelement modes show a
   * picker first and call start() themselves.
   */
  autoStart?: boolean;
  /**
   * Abandon the session whenever this changes — the license filter, the chosen
   * chapter, the chosen subelement.
   *
   * Deliberately not the questions array itself. React Query hands back a new
   * reference whenever the content changes, so keying on the pool would drop a
   * drill in progress if a question were edited mid-session. The three modes
   * each keyed their own reset effect on the selection, not the data.
   */
  resetKey?: unknown;
}

export interface UseQuizSession {
  question: Question | null;
  selectedAnswer: AnswerLetter | null;
  showResult: boolean;
  stats: { correct: number; total: number };
  history: QuizHistoryEntry[];
  historyIndex: number;
  /**
   * Each question served this pass, once, including the current one. Drives the
   * "seen 7 of 40" coverage readout in the chapter and subelement modes, and
   * those modes compare its length against the pool size to show an "all seen"
   * tick — so it must reach that size exactly, never overshoot it. Resets on
   * wrap-around, counting progress through the current pass.
   */
  askedIds: string[];
  canGoBack: boolean;
  /** True when the user has stepped back and is re-reading an earlier question. */
  isViewingHistory: boolean;
  selectAnswer: (answer: AnswerLetter) => Promise<void>;
  next: () => void;
  skip: () => void;
  previous: () => void;
  /** Begin a session, optionally at a chosen question in the pool. */
  start: (startIndex?: number) => void;
  /** Restart from an empty asked-set with the score zeroed. */
  reset: () => void;
  /**
   * Leave the current question without ending the run: drops the history stack
   * and leaves the score and the asked-set alone.
   *
   * This is the chapter and subelement modes stepping out to their question
   * list and back. Zeroing the score there would mean a glance at the list
   * silently threw away the session's progress.
   *
   * The score is what actually survives the round trip. The asked-set survives
   * *this* transition but not the resume that follows it: both modes resume
   * through start(), which rebuilds the asked-set as a single entry, so
   * coverage restarts either way. That was true before the engine was extracted
   * too — don't read this as coverage persisting across the list.
   */
  clearHistory: () => void;
}

/**
 * The shared engine behind the three drill modes (random, chapter, subelement).
 *
 * Those three kept their own copies of this: an askedIds set feeding a
 * wrap-around picker, a history stack the user can step back through, and a
 * running score. The copies had already drifted — see MAX_HISTORY_SIZE above.
 *
 * Deliberately not used by TopicQuiz, PracticeTest or WeakQuestionsReview:
 * those answer a fixed list or clear a backlog, with no draw and no history, so
 * they would inherit a stack they never read. See the analysis on issue #259.
 */
export function useQuizSession({
  questions,
  onAttempt,
  autoStart = false,
  resetKey,
}: UseQuizSessionOptions): UseQuizSession {
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const current = session.index >= 0 ? (session.history[session.index] ?? null) : null;
  const question = current?.question ?? null;
  const selectedAnswer = current?.selectedAnswer ?? null;
  const showResult = current?.showResult ?? false;

  // Keyed on the question, so it restarts whenever a new one is shown.
  const { getElapsedMs } = useQuestionTimer(question?.id);

  const start = useCallback(
    (startIndex?: number) => {
      const chosen =
        startIndex !== undefined && questions[startIndex]
          ? questions[startIndex]
          : pickQuestion(questions)?.question;

      if (!chosen) return;
      setSession({ history: [newEntry(chosen)], index: 0, askedIds: [chosen.id] });
    },
    [questions],
  );

  // Changing the selection makes the current questions and score meaningless.
  // Skipped on mount so a session that autoStarts is not immediately dropped.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setSession(EMPTY_SESSION);
    setStats({ correct: 0, total: 0 });
  }, [resetKey]);

  useEffect(() => {
    if (autoStart && questions.length > 0 && session.history.length === 0) start();
  }, [autoStart, questions, session.history.length, start]);

  const selectAnswer = useCallback(
    async (answer: AnswerLetter) => {
      if (!question || showResult) return;

      // Read before the state updates, so it measures time on the question
      // rather than time until the re-render settled.
      const timeElapsedMs = getElapsedMs();
      const isCorrect = answer === question.correctAnswer;

      setSession((prev) => {
        const history = [...prev.history];
        if (prev.index < 0 || prev.index >= history.length) return prev;
        history[prev.index] = { ...history[prev.index], selectedAnswer: answer, showResult: true };
        return { ...prev, history };
      });

      setStats((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

      await onAttempt?.(question, answer, isCorrect, timeElapsedMs);
    },
    [question, showResult, getElapsedMs, onAttempt],
  );

  /**
   * Serve a question the session has not shown yet. Computed from the current
   * state before setSession rather than inside the updater: the pick is random,
   * and an updater that returns a different value each time it runs is not safe
   * for React to call twice.
   */
  const draw = useCallback(() => {
    if (!session.history[session.index]) return;

    // Exclude what has already been served — which includes the current
    // question, put there by start() or by the draw that produced it — then
    // record the question this draw actually serves. Appending the *current*
    // id instead would re-add an id already present, so askedIds grew past the
    // pool size and the "seen N of M" readout could exceed 100%.
    const result = pickQuestion(questions, session.askedIds);
    if (!result) return;

    const askedIds = [...session.askedIds, result.question.id];
    const entry = newEntry(result.question);

    // A completed pass starts over from a clean stack, matching what the three
    // modes did before: the old questions are all about to repeat, so stepping
    // back into them would be misleading.
    if (result.wrapped) {
      setSession({ history: [entry], index: 0, askedIds: [result.question.id] });
      return;
    }

    const history = [...session.history, entry];
    const trimmed =
      history.length > MAX_HISTORY_SIZE ? history.slice(history.length - MAX_HISTORY_SIZE) : history;

    setSession({ history: trimmed, index: trimmed.length - 1, askedIds });
  }, [session, questions]);

  const next = useCallback(() => {
    // Stepping forward through questions already visited, rather than drawing.
    if (session.index < session.history.length - 1) {
      setSession((prev) => ({ ...prev, index: prev.index + 1 }));
      return;
    }
    draw();
  }, [session.index, session.history.length, draw]);

  const previous = useCallback(() => {
    setSession((prev) => (prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev));
  }, []);

  const reset = useCallback(() => {
    const result = pickQuestion(questions);
    setSession(
      result
        ? { history: [newEntry(result.question)], index: 0, askedIds: [result.question.id] }
        : EMPTY_SESSION,
    );
    setStats({ correct: 0, total: 0 });
  }, [questions]);

  const clearHistory = useCallback(() => {
    setSession((prev) => ({ ...prev, history: [], index: -1 }));
  }, []);

  return {
    question,
    selectedAnswer,
    showResult,
    stats,
    history: session.history,
    historyIndex: session.index,
    askedIds: session.askedIds,
    canGoBack: session.index > 0,
    isViewingHistory: session.index < session.history.length - 1,
    selectAnswer,
    next,
    skip: draw,
    previous,
    start,
    reset,
    clearHistory,
  };
}

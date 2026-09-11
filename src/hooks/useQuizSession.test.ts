import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuizSession, pickQuestion, type AnswerLetter } from "./useQuizSession";
import type { Question } from "@/services/questions/questionService";

const makeQuestion = (n: number, correctAnswer: AnswerLetter = "A"): Question => ({
  id: `id-${n}`,
  displayName: `T1A0${n}`,
  question: `Question ${n}?`,
  options: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
  correctAnswer,
  subelement: "T1",
  group: "T1A",
  links: [],
});

const pool = (size: number) => Array.from({ length: size }, (_, i) => makeQuestion(i + 1));

describe("pickQuestion", () => {
  it("returns null for an empty pool", () => {
    expect(pickQuestion([], [])).toBeNull();
  });

  it("never returns a question already served", () => {
    const questions = pool(3);
    const result = pickQuestion(questions, ["id-1", "id-2"]);

    expect(result).toEqual({ question: questions[2], wrapped: false });
  });

  it("wraps around once every question has been served", () => {
    const questions = pool(3);
    const result = pickQuestion(
      questions,
      questions.map((q) => q.id),
    );

    // The alternative would be returning null and stalling the drill. These
    // modes are meant to keep going, so a completed pass starts another.
    expect(result?.wrapped).toBe(true);
    expect(questions).toContain(result?.question);
  });
});

describe("useQuizSession", () => {
  beforeEach(() => {
    // Deterministic draws: Math.random() === 0 always takes the first available
    // question, so "the next unseen question" is the one at the front.
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stays empty until started", () => {
    const { result } = renderHook(() => useQuizSession({ questions: pool(3) }));

    expect(result.current.question).toBeNull();
    expect(result.current.history).toEqual([]);
    expect(result.current.historyIndex).toBe(-1);
  });

  it("draws the first question when autoStart is set", async () => {
    const questions = pool(3);
    const { result } = renderHook(() => useQuizSession({ questions, autoStart: true }));

    await waitFor(() => expect(result.current.question).toEqual(questions[0]));
    expect(result.current.canGoBack).toBe(false);
  });

  it("starts at a chosen question", () => {
    const questions = pool(3);
    const { result } = renderHook(() => useQuizSession({ questions }));

    act(() => result.current.start(2));

    expect(result.current.question).toEqual(questions[2]);
  });

  describe("answering", () => {
    it("records the answer on the current question and scores it", async () => {
      const questions = [makeQuestion(1, "B")];
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start());

      await act(async () => {
        await result.current.selectAnswer("B");
      });

      expect(result.current.selectedAnswer).toBe("B");
      expect(result.current.showResult).toBe(true);
      expect(result.current.stats).toEqual({ correct: 1, total: 1 });
    });

    it("counts a wrong answer toward the total but not the score", async () => {
      const questions = [makeQuestion(1, "B")];
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start());

      await act(async () => {
        await result.current.selectAnswer("D");
      });

      expect(result.current.stats).toEqual({ correct: 0, total: 1 });
    });

    it("reports the attempt with correctness and elapsed time", async () => {
      const onAttempt = vi.fn();
      const questions = [makeQuestion(1, "C")];
      const { result } = renderHook(() => useQuizSession({ questions, onAttempt }));
      act(() => result.current.start());

      await act(async () => {
        await result.current.selectAnswer("C");
      });

      expect(onAttempt).toHaveBeenCalledWith(questions[0], "C", true, expect.any(Number));
    });

    it("ignores a second answer to the same question", async () => {
      const onAttempt = vi.fn();
      const questions = [makeQuestion(1, "A")];
      const { result } = renderHook(() => useQuizSession({ questions, onAttempt }));
      act(() => result.current.start());

      await act(async () => {
        await result.current.selectAnswer("A");
      });
      await act(async () => {
        await result.current.selectAnswer("B");
      });

      // Double-scoring one question would quietly corrupt the session stats.
      expect(result.current.selectedAnswer).toBe("A");
      expect(result.current.stats).toEqual({ correct: 1, total: 1 });
      expect(onAttempt).toHaveBeenCalledTimes(1);
    });
  });

  describe("navigation", () => {
    it("serves an unseen question on next", () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));

      act(() => result.current.next());

      expect(result.current.question).toEqual(questions[1]);
      expect(result.current.history).toHaveLength(2);
    });

    it("steps back to the previous question with its answer intact", async () => {
      const questions = pool(2);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      await act(async () => {
        await result.current.selectAnswer("A");
      });
      act(() => result.current.next());

      act(() => result.current.previous());

      expect(result.current.question).toEqual(questions[0]);
      expect(result.current.selectedAnswer).toBe("A");
      expect(result.current.showResult).toBe(true);
      expect(result.current.isViewingHistory).toBe(true);
    });

    it("walks forward through visited questions instead of drawing new ones", () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      act(() => result.current.next());
      act(() => result.current.previous());

      act(() => result.current.next());

      // Returning to where you were should not consume a third question.
      expect(result.current.question).toEqual(questions[1]);
      expect(result.current.history).toHaveLength(2);
    });

    it("does not step back past the first question", () => {
      const questions = pool(2);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));

      act(() => result.current.previous());

      expect(result.current.question).toEqual(questions[0]);
      expect(result.current.canGoBack).toBe(false);
    });

    it("skips to a new question without scoring the skipped one", () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));

      act(() => result.current.skip());

      expect(result.current.question).toEqual(questions[1]);
      expect(result.current.stats).toEqual({ correct: 0, total: 0 });
    });
  });

  describe("exhausting the pool", () => {
    it("starts a fresh pass once every question has been served", () => {
      const questions = pool(2);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      act(() => result.current.next());

      act(() => result.current.next());

      // Both seen, so the next draw wraps: the stack resets rather than
      // offering back-navigation into questions that are all about to repeat.
      expect(result.current.history).toHaveLength(1);
      expect(result.current.historyIndex).toBe(0);
      expect(result.current.canGoBack).toBe(false);
    });

    it("keeps the running score across a wrap-around", async () => {
      const questions = pool(2);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      await act(async () => {
        await result.current.selectAnswer("A");
      });
      act(() => result.current.next());
      act(() => result.current.next());

      expect(result.current.stats).toEqual({ correct: 1, total: 1 });
    });
  });

  describe("coverage tracking", () => {
    it("counts each question served exactly once", () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      act(() => result.current.next());

      // Drives the "seen N of M" readout, so a duplicated id reports more
      // coverage than the session actually has.
      expect(result.current.askedIds).toEqual(["id-1", "id-2"]);
    });

    it("never reports more questions seen than the pool holds", () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));

      // Walk forward, step back, then draw again — the path that used to
      // re-serve a question and push the count past the pool size.
      act(() => result.current.skip());
      act(() => result.current.skip());
      act(() => result.current.previous());
      act(() => result.current.previous());
      act(() => result.current.skip());

      expect(result.current.askedIds.length).toBeLessThanOrEqual(questions.length);
      expect(new Set(result.current.askedIds).size).toBe(result.current.askedIds.length);
    });

    it("reaches exactly the pool size once every question has been served", () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      act(() => result.current.next());
      act(() => result.current.next());

      // The chapter and subelement modes test askedIds.length against the pool
      // size to show an "all seen" tick, so it has to land on equality rather
      // than step over it.
      expect(result.current.askedIds.length).toBe(questions.length);
    });
  });

  it("caps history so a long session cannot grow without bound", () => {
    // The regression this guards: ChapterPractice trimmed the stack at 50,
    // RandomPractice and SubelementPractice never did, so a long drill held
    // every Question it had served. 60 draws from a 100-question pool.
    const questions = pool(100);
    const { result } = renderHook(() => useQuizSession({ questions }));
    act(() => result.current.start(0));

    for (let i = 0; i < 60; i++) {
      act(() => result.current.next());
    }

    expect(result.current.history).toHaveLength(50);
    // Trimming drops the oldest entries, so the newest stays current.
    expect(result.current.question).toEqual(questions[60]);
  });

  describe("restarting", () => {
    it("clears the score and serves a question again on reset", async () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      await act(async () => {
        await result.current.selectAnswer("A");
      });

      act(() => result.current.reset());

      expect(result.current.stats).toEqual({ correct: 0, total: 0 });
      expect(result.current.question).not.toBeNull();
      expect(result.current.showResult).toBe(false);
      expect(result.current.canGoBack).toBe(false);
    });

    it("keeps the score and coverage when leaving the question view", async () => {
      const questions = pool(3);
      const { result } = renderHook(() => useQuizSession({ questions }));
      act(() => result.current.start(0));
      await act(async () => {
        await result.current.selectAnswer("A");
      });

      // Chapter and subelement practice step out to their question list and
      // back. That is leaving the current question, not abandoning the run —
      // the score has to survive the trip.
      act(() => result.current.clearHistory());

      expect(result.current.question).toBeNull();
      expect(result.current.history).toEqual([]);
      expect(result.current.stats).toEqual({ correct: 1, total: 1 });
      expect(result.current.askedIds).toEqual(["id-1"]);
    });

    it("abandons the session when the selection changes", async () => {
      const questions = pool(3);
      const { result, rerender } = renderHook(
        ({ key }) => useQuizSession({ questions, resetKey: key }),
        { initialProps: { key: "technician" } },
      );
      act(() => result.current.start(0));
      await act(async () => {
        await result.current.selectAnswer("A");
      });

      // Switching license filter or chapter makes the current questions and
      // score meaningless; carrying them into the new pool would misreport it.
      rerender({ key: "general" });

      expect(result.current.question).toBeNull();
      expect(result.current.stats).toEqual({ correct: 0, total: 0 });
    });

    it("keeps the session when the questions array changes identity", async () => {
      const questions = pool(3);
      const { result, rerender } = renderHook(
        ({ qs }) => useQuizSession({ questions: qs, resetKey: "technician" }),
        { initialProps: { qs: questions } },
      );
      act(() => result.current.start(0));
      await act(async () => {
        await result.current.selectAnswer("A");
      });

      // React Query returns a fresh array whenever content changes. Keying the
      // reset on the pool would drop a drill in progress because someone edited
      // an unrelated question.
      rerender({ qs: [...questions] });

      expect(result.current.question).toEqual(questions[0]);
      expect(result.current.stats).toEqual({ correct: 1, total: 1 });
    });
  });

  it("does nothing when the pool is empty", () => {
    const { result } = renderHook(() => useQuizSession({ questions: [], autoStart: true }));

    act(() => result.current.start());
    act(() => result.current.next());

    expect(result.current.question).toBeNull();
    expect(result.current.history).toEqual([]);
  });
});

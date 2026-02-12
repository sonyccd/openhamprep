/**
 * Selects questions matching the real FCC exam distribution.
 *
 * Real NCVEC exams draw one question per question group within each subelement.
 * For example, Technician subelement T1 has 6 groups (T1A–T1F), so 6 questions
 * are drawn — one from each group.
 *
 * Strategy:
 *  1. For each subelement in the distribution, pick one question per group
 *  2. If a subelement has fewer groups than its quota, fill from remaining pool
 *  3. If total is still short (sparse pool), fill from unused questions
 *  4. Shuffle the final set so questions aren't in subelement order
 */

interface Selectable {
  subelement: string;
  group: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectExamQuestions<T extends Selectable>(
  allQuestions: T[],
  questionCount: number,
  distribution: Record<string, number>
): T[] {
  const selected: T[] = [];
  const usedIndices = new Set<number>();

  // Build an index map for O(1) lookups by array position
  const indexByQuestion = new Map<T, number>();
  allQuestions.forEach((q, i) => indexByQuestion.set(q, i));

  for (const [subelement, count] of Object.entries(distribution)) {
    const pool = allQuestions.filter(q => q.subelement === subelement);
    if (pool.length === 0) continue;

    // Group questions by their question group (e.g. "T1A", "T1B")
    const groups = new Map<string, T[]>();
    for (const q of pool) {
      const existing = groups.get(q.group);
      if (existing) {
        existing.push(q);
      } else {
        groups.set(q.group, [q]);
      }
    }

    // Pick one random question from each group
    const fromGroups: T[] = [];
    for (const groupQuestions of groups.values()) {
      fromGroups.push(shuffleArray(groupQuestions)[0]);
    }

    // Shuffle so we don't always pick from groups in alphabetical order
    const shuffledFromGroups = shuffleArray(fromGroups);

    // Take up to `count` from the per-group picks
    const picked = shuffledFromGroups.slice(0, count);
    let subelementCount = picked.length;
    for (const q of picked) {
      selected.push(q);
      usedIndices.add(indexByQuestion.get(q)!);
    }

    // If we need more from this subelement than we got groups, fill randomly
    if (subelementCount < count) {
      const remaining = shuffleArray(pool.filter(q => !usedIndices.has(indexByQuestion.get(q)!)));
      for (const q of remaining) {
        if (subelementCount >= count) break;
        selected.push(q);
        usedIndices.add(indexByQuestion.get(q)!);
        subelementCount++;
      }
    }
  }

  // If we still don't have enough (sparse pool), fill from unused questions
  if (selected.length < questionCount) {
    const unused = shuffleArray(allQuestions.filter((_, i) => !usedIndices.has(i)));
    for (const q of unused) {
      if (selected.length >= questionCount) break;
      selected.push(q);
    }
  }

  // Shuffle final set so questions aren't grouped by subelement
  return shuffleArray(selected).slice(0, questionCount);
}

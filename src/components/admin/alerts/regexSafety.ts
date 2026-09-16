/** Pattern length cap, to keep compilation cost bounded. */
export const MAX_PATTERN_LENGTH = 200;

/** Short enough to stay fast, long enough that backtracking blows up on it. */
const REDOS_TEST_STRING = 'a'.repeat(25);

/** Above this, treat the pattern as one that will not finish in time. */
const REGEX_TEST_TIMEOUT_MS = 50;

/**
 * Constructs that commonly cause catastrophic backtracking.
 *
 * Each entry is deliberately narrow — a broad heuristic here rejects patterns
 * an admin legitimately wants, and the timed run below is the backstop for
 * anything these miss.
 */
const DANGEROUS_CONSTRUCTS = [
  // Nested quantifiers: (a+)+, (a*)+, (a+)*
  /\([^)]*[+*][^)]*\)[+*]/,
  // Overlapping alternations in a quantified group: (a|a)+, (a|ab)+
  /\([^)]*\|[^)]*\)[+*]/,
  // Repeated wildcards: (.*)+, (.+)+, (.*)*
  /\(\.[+*]\)[+*]/,
  // Nested groups with quantifiers: ((a+))+
  /\(\([^)]*[+*]\)[^)]*\)[+*]/,
  // Directly stacked quantifiers: a++, a**
  /[+*]{2,}/,
  // Backreferences under a quantifier, which can be very slow
  /\\[1-9][+*]/,
];

export interface PatternCheck {
  valid: boolean;
  error?: string;
}

/**
 * Screens an admin-supplied regex for ReDoS risk before it is stored.
 *
 * These patterns are run server-side against error text by the alert monitor,
 * so a catastrophic-backtracking pattern saved here stalls that job rather
 * than the admin's own browser. Three layers, cheapest first: a length cap, a
 * static scan for the usual dangerous constructs, then an actual timed run —
 * which is what catches anything the static scan does not recognise.
 */
export function isValidRegexPattern(pattern: string): PatternCheck {
  if (!pattern) return { valid: false, error: 'Pattern is required' };

  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: `Pattern too long (max ${MAX_PATTERN_LENGTH} characters)` };
  }

  if (DANGEROUS_CONSTRUCTS.some((construct) => construct.test(pattern))) {
    return {
      valid: false,
      error:
        'Pattern contains constructs that could cause performance issues. ' +
        'Simplify nested quantifiers or alternations.',
    };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    return { valid: false, error: 'Invalid regex syntax' };
  }

  try {
    const startTime = performance.now();
    regex.test(REDOS_TEST_STRING);
    if (performance.now() - startTime > REGEX_TEST_TIMEOUT_MS) {
      return { valid: false, error: 'Pattern is too slow to execute. Simplify the pattern.' };
    }
  } catch {
    return { valid: false, error: 'Pattern caused an error during testing' };
  }

  return { valid: true };
}

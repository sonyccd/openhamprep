// ============================================================
// TEST UTILITIES FOR SUPABASE EDGE FUNCTIONS
// ============================================================

/**
 * Creates a mock Supabase client for testing.
 * Returns chainable query builder that can be configured with expected responses.
 */
export interface MockQueryBuilder {
  select: (columns?: string, options?: { count?: string; head?: boolean }) => MockQueryBuilder;
  eq: (column: string, value: unknown) => MockQueryBuilder;
  like: (column: string, pattern: string) => MockQueryBuilder;
  in: (column: string, values: unknown[]) => MockQueryBuilder;
  gte: (column: string, value: unknown) => MockQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  // Result accessors
  then: (resolve: (result: { data: unknown; error: unknown; count?: number }) => void) => void;
}

export interface MockTableConfig {
  data?: unknown;
  error?: { message: string } | null;
  count?: number;
}

export interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder;
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  _setTableResponse: (table: string, config: MockTableConfig) => void;
  _setAuthUser: (user: { id: string } | null, error?: unknown) => void;
}

export function createMockSupabaseClient(): MockSupabaseClient {
  const tableResponses = new Map<string, MockTableConfig>();
  let authUser: { id: string } | null = { id: "test-user-id" };
  let authError: unknown = null;

  const createQueryBuilder = (table: string): MockQueryBuilder => {
    const getResponse = () => {
      const config = tableResponses.get(table) || { data: [], error: null };
      return { data: config.data, error: config.error, count: config.count };
    };

    const builder: MockQueryBuilder = {
      select: () => builder,
      eq: () => builder,
      like: () => builder,
      in: () => builder,
      gte: () => builder,
      order: () => builder,
      maybeSingle: async () => {
        const response = getResponse();
        return { data: response.data, error: response.error };
      },
      then: (resolve) => {
        resolve(getResponse());
      },
    };

    return builder;
  };

  return {
    from: (table: string) => createQueryBuilder(table),
    auth: {
      getUser: async () => ({
        data: { user: authUser },
        error: authError,
      }),
    },
    _setTableResponse: (table: string, config: MockTableConfig) => {
      tableResponses.set(table, config);
    },
    _setAuthUser: (user: { id: string } | null, error?: unknown) => {
      authUser = user;
      authError = error;
    },
  };
}

/**
 * Creates a mock HTTP Request object for testing Edge Functions.
 */
export function createMockRequest(
  body: unknown,
  options: {
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = "POST", headers = {} } = options;

  return new Request("http://localhost:8000/calculate-readiness", {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Sample test data generators
 */
export function createTestAttempts(
  count: number,
  correctRatio: number = 0.7
): Array<{ question_id: string; is_correct: boolean; attempted_at: string }> {
  const attempts = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    attempts.push({
      question_id: `question-${i}`,
      is_correct: Math.random() < correctRatio,
      attempted_at: new Date(now - i * 60000).toISOString(), // 1 minute apart
    });
  }

  return attempts;
}

export function createTestSyllabusData(
  prefix: string
): Array<{ code: string; exam_questions: number }> {
  const subelements =
    prefix === "T"
      ? ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T0"]
      : prefix === "G"
        ? ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G0"]
        : ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E0"];

  // Approximate weights for each exam type
  const weights =
    prefix === "E"
      ? [5, 5, 5, 5, 5, 5, 5, 5, 5, 5] // Extra has 50 questions
      : [6, 3, 3, 2, 4, 4, 4, 4, 3, 2]; // Tech/General have 35 questions

  return subelements.map((code, i) => ({
    code,
    exam_questions: weights[i],
  }));
}

export function createTestQuestions(
  subelementCodes: string[],
  questionsPerSubelement: number = 10
): Array<{ id: string; subelement: string; display_name: string }> {
  const questions = [];

  for (const code of subelementCodes) {
    for (let i = 0; i < questionsPerSubelement; i++) {
      questions.push({
        id: `${code}-q${i}`,
        subelement: code,
        display_name: `${code}A0${i}`,
      });
    }
  }

  return questions;
}

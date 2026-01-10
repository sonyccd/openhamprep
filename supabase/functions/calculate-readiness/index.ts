import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/constants.ts";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ReadinessRequest {
  exam_type: "technician" | "general" | "extra";
}

interface FormulaWeights {
  recent_accuracy: number;
  overall_accuracy: number;
  coverage: number;
  mastery: number;
  test_rate: number;
}

interface PassProbabilityConfig {
  k: number;
  r0: number;
}

interface RecencyPenaltyConfig {
  max_penalty: number;
  decay_rate: number;
}

interface CoverageBetaConfig {
  low: number;
  mid: number;
  high: number;
  low_threshold: number;
  high_threshold: number;
}

interface BlendConfig {
  min_recent_for_blend: number;
  recent_window: number;
}

interface ThresholdsConfig {
  min_attempts: number;
  min_per_subelement: number;
  recent_window: number;
  subelement_recent_window: number;
}

interface Config {
  formula_weights: FormulaWeights;
  pass_probability: PassProbabilityConfig;
  recency_penalty: RecencyPenaltyConfig;
  coverage_beta: CoverageBetaConfig;
  blend: BlendConfig;
  thresholds: ThresholdsConfig;
  version: string;
}

interface Metrics {
  recentAccuracy: number | null;
  overallAccuracy: number | null;
  coverage: number;
  mastery: number;
  testsPassed: number;
  testsTaken: number;
  testPassRate: number;
  daysSinceStudy: number;
  lastStudyAt: string | null;
  totalAttempts: number;
  uniqueQuestionsSeen: number;
  totalPoolSize: number;
}

interface SubelementMetric {
  accuracy: number | null;
  recent_accuracy: number | null;
  coverage: number;
  mastery: number;
  risk_score: number;
  expected_score: number;
  weight: number;
  pool_size: number;
  attempts_count: number;
  recent_attempts_count: number;
}

interface ReadinessResult {
  readinessScore: number;
  passProbability: number;
  recencyPenalty: number;
  expectedExamScore: number;
}

// ============================================================
// INPUT VALIDATION
// ============================================================

function validateExamType(examType: unknown): examType is "technician" | "general" | "extra" {
  return typeof examType === "string" &&
    ["technician", "general", "extra"].includes(examType);
}

function validateRequest(body: unknown): ReadinessRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object");
  }

  const { exam_type } = body as Record<string, unknown>;

  if (!validateExamType(exam_type)) {
    throw new Error("Invalid exam_type: must be 'technician', 'general', or 'extra'");
  }

  return { exam_type };
}

// ============================================================
// MAIN HANDLER
// ============================================================

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn(`[${requestId}] Missing authorization header`);
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        {
          status: 401,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn(`[${requestId}] Auth failed:`, authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    let validatedRequest: ReadinessRequest;
    try {
      validatedRequest = validateRequest(requestBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({
          error: validationError instanceof Error ? validationError.message : "Validation failed"
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const { exam_type } = validatedRequest;
    const prefix =
      exam_type === "technician" ? "T" : exam_type === "general" ? "G" : "E";

    console.log(
      `[${requestId}] Calculating readiness for user ${user.id}, exam_type=${exam_type}`
    );

    // Rate limiting: Skip recalculation if cache was updated recently (30 seconds)
    const CACHE_FRESHNESS_SECONDS = 30;
    const existingCache = await checkCacheFreshness(supabase, user.id, exam_type, CACHE_FRESHNESS_SECONDS);
    if (existingCache) {
      console.log(`[${requestId}] Cache still fresh (updated ${existingCache.age_seconds}s ago), skipping recalculation`);
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          readiness_score: existingCache.readiness_score,
          pass_probability: existingCache.pass_probability,
          expected_exam_score: existingCache.expected_exam_score,
          config_version: existingCache.config_version,
        }),
        {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    // Load config from database
    const config = await loadConfig(supabase);
    console.log(`[${requestId}] Loaded config version: ${config.version}`);

    // Gather raw metrics with graceful degradation
    const metrics = await gatherMetrics(
      supabase,
      user.id,
      prefix,
      config.thresholds,
      requestId
    );
    console.log(
      `[${requestId}] Metrics: attempts=${metrics.totalAttempts}, coverage=${(metrics.coverage * 100).toFixed(1)}%, mastery=${(metrics.mastery * 100).toFixed(1)}%`
    );

    // Calculate readiness score (ALL FORMULAS CENTRALIZED HERE)
    const result = calculateReadiness(metrics, config);
    console.log(
      `[${requestId}] Result: score=${result.readinessScore.toFixed(1)}, passProbability=${(result.passProbability * 100).toFixed(1)}%`
    );

    // Calculate subelement metrics (optimized - single batch of queries)
    const subelementMetrics = await calculateSubelementMetrics(
      supabase,
      user.id,
      prefix,
      config,
      requestId
    );

    // Calculate expected exam score from subelement metrics
    const expectedExamScore = Object.values(subelementMetrics).reduce(
      (sum, m) => sum + m.expected_score,
      0
    );

    // Upsert to cache (don't fail the whole request if this fails)
    try {
      await upsertCache(
        supabase,
        user.id,
        exam_type,
        { ...result, expectedExamScore },
        subelementMetrics,
        metrics,
        config.version
      );
    } catch (cacheError) {
      console.error(`[${requestId}] Cache upsert failed:`, cacheError);
      // Continue - we can still return the calculated values
    }

    // Upsert daily snapshot (non-blocking, don't fail request)
    upsertSnapshot(supabase, user.id, exam_type, result, metrics).catch(
      (err) => console.error(`[${requestId}] Snapshot upsert failed:`, err)
    );

    console.log(`[${requestId}] Successfully calculated readiness`);

    return new Response(
      JSON.stringify({
        success: true,
        readiness_score: result.readinessScore,
        pass_probability: result.passProbability,
        expected_exam_score: expectedExamScore,
        metrics: {
          recent_accuracy: metrics.recentAccuracy,
          overall_accuracy: metrics.overallAccuracy,
          coverage: metrics.coverage,
          mastery: metrics.mastery,
          tests_passed: metrics.testsPassed,
          tests_taken: metrics.testsTaken,
        },
        config_version: config.version,
      }),
      {
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================================
// DEFAULT CONFIGURATION (fallback if DB config unavailable)
// ============================================================

const DEFAULT_CONFIG: Config = {
  formula_weights: {
    recent_accuracy: 35,
    overall_accuracy: 20,
    coverage: 15,
    mastery: 15,
    test_rate: 15,
  },
  pass_probability: {
    k: 0.15,
    r0: 65,
  },
  recency_penalty: {
    max_penalty: 10,
    decay_rate: 0.5,
  },
  coverage_beta: {
    low: 1.2,
    mid: 1.0,
    high: 0.9,
    low_threshold: 0.3,
    high_threshold: 0.7,
  },
  blend: {
    min_recent_for_blend: 5,
    recent_window: 20,
  },
  thresholds: {
    min_attempts: 50,
    min_per_subelement: 2,
    recent_window: 50,
    subelement_recent_window: 20,
  },
  version: "v1.0.0-default",
};

// ============================================================
// RATE LIMITING (cache freshness check)
// ============================================================

interface CacheFreshnessResult {
  readiness_score: number;
  pass_probability: number;
  expected_exam_score: number;
  config_version: string | null;
  age_seconds: number;
}

/**
 * Check if the cache was updated recently (within freshnessSeconds).
 * Returns the cached data if fresh, null if stale or missing.
 */
async function checkCacheFreshness(
  supabase: SupabaseClient,
  userId: string,
  examType: string,
  freshnessSeconds: number
): Promise<CacheFreshnessResult | null> {
  try {
    const { data, error } = await supabase
      .from("user_readiness_cache")
      .select("readiness_score, pass_probability, expected_exam_score, config_version, calculated_at")
      .eq("user_id", userId)
      .eq("exam_type", examType)
      .maybeSingle();

    if (error || !data || !data.calculated_at) {
      return null;
    }

    const calculatedAt = new Date(data.calculated_at);
    const ageSeconds = (Date.now() - calculatedAt.getTime()) / 1000;

    if (ageSeconds <= freshnessSeconds) {
      return {
        readiness_score: data.readiness_score,
        pass_probability: data.pass_probability,
        expected_exam_score: data.expected_exam_score,
        config_version: data.config_version,
        age_seconds: Math.round(ageSeconds),
      };
    }

    return null;
  } catch {
    // If check fails, allow recalculation
    return null;
  }
}

// ============================================================
// CONFIGURATION LOADING (with graceful fallback)
// ============================================================

async function loadConfig(supabase: SupabaseClient): Promise<Config> {
  try {
    const { data, error } = await supabase
      .from("readiness_config")
      .select("key, value");

    if (error) {
      console.warn("Failed to load config from DB, using defaults:", error.message);
      return DEFAULT_CONFIG;
    }

    if (!data || data.length === 0) {
      console.warn("No config found in DB, using defaults");
      return DEFAULT_CONFIG;
    }

    const configMap = new Map(data.map((r: { key: string; value: unknown }) => [r.key, r.value]));

    return {
      formula_weights: (configMap.get("formula_weights") as FormulaWeights) || DEFAULT_CONFIG.formula_weights,
      pass_probability: (configMap.get("pass_probability") as PassProbabilityConfig) || DEFAULT_CONFIG.pass_probability,
      recency_penalty: (configMap.get("recency_penalty") as RecencyPenaltyConfig) || DEFAULT_CONFIG.recency_penalty,
      coverage_beta: (configMap.get("coverage_beta") as CoverageBetaConfig) || DEFAULT_CONFIG.coverage_beta,
      blend: (configMap.get("blend") as BlendConfig) || DEFAULT_CONFIG.blend,
      thresholds: (configMap.get("thresholds") as ThresholdsConfig) || DEFAULT_CONFIG.thresholds,
      version: (configMap.get("version") as string) || DEFAULT_CONFIG.version,
    };
  } catch (err) {
    console.error("Exception loading config, using defaults:", err);
    return DEFAULT_CONFIG;
  }
}

// ============================================================
// METRICS GATHERING (with graceful degradation)
// ============================================================

async function gatherMetrics(
  supabase: SupabaseClient,
  userId: string,
  prefix: string,
  thresholds: ThresholdsConfig,
  requestId: string
): Promise<Metrics> {
  // Default fallback metrics
  const fallbackMetrics: Metrics = {
    recentAccuracy: null,
    overallAccuracy: null,
    coverage: 0,
    mastery: 0,
    testsPassed: 0,
    testsTaken: 0,
    testPassRate: 0,
    daysSinceStudy: 30,
    lastStudyAt: null,
    totalAttempts: 0,
    uniqueQuestionsSeen: 0,
    totalPoolSize: 0,
  };

  // Get total pool size for this exam type
  let totalPoolSize = 0;
  try {
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .like("display_name", `${prefix}%`);
    totalPoolSize = count || 0;
  } catch (err) {
    console.warn(`[${requestId}] Failed to get pool size:`, err);
  }

  if (totalPoolSize === 0) {
    console.warn(`[${requestId}] No questions found for prefix ${prefix}`);
    return fallbackMetrics;
  }

  // Get all attempts for this exam type (we'll process in JS for flexibility)
  let attempts: Array<{
    is_correct: boolean;
    attempted_at: string;
    question_id: string;
  }> = [];

  try {
    const { data: allAttempts, error } = await supabase
      .from("question_attempts")
      .select("is_correct, attempted_at, question_id, questions!inner(display_name)")
      .eq("user_id", userId)
      .like("questions.display_name", `${prefix}%`)
      .order("attempted_at", { ascending: false });

    if (error) {
      console.warn(`[${requestId}] Failed to get attempts:`, error);
    } else {
      attempts = allAttempts || [];
    }
  } catch (err) {
    console.warn(`[${requestId}] Exception getting attempts:`, err);
  }

  const totalAttempts = attempts.length;

  // Recent accuracy (last N questions)
  const recentAttempts = attempts.slice(0, thresholds.recent_window);
  const recentCorrect = recentAttempts.filter((a) => a.is_correct).length;
  const recentAccuracy =
    recentAttempts.length > 0 ? recentCorrect / recentAttempts.length : null;

  // Overall accuracy
  const overallCorrect = attempts.filter((a) => a.is_correct).length;
  const overallAccuracy =
    totalAttempts > 0 ? overallCorrect / totalAttempts : null;

  // Unique questions seen (coverage)
  const uniqueQuestionIds = new Set(attempts.map((a) => a.question_id));
  const uniqueQuestionsSeen = uniqueQuestionIds.size;
  const coverage = totalPoolSize ? uniqueQuestionsSeen / totalPoolSize : 0;

  // Mastery (questions correct 2+ times)
  let masteredCount = 0;
  try {
    const questionIds = await getQuestionIdsForPrefix(supabase, prefix);
    if (questionIds.length > 0) {
      const { count } = await supabase
        .from("question_mastery")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_mastered", true)
        .in("question_id", questionIds);
      masteredCount = count || 0;
    }
  } catch (err) {
    console.warn(`[${requestId}] Failed to get mastery:`, err);
  }

  const mastery = totalPoolSize ? masteredCount / totalPoolSize : 0;

  // Practice test stats
  let testsTaken = 0;
  let testsPassed = 0;
  try {
    const { data: testResults, error } = await supabase
      .from("practice_test_results")
      .select("passed")
      .eq("user_id", userId)
      .eq("test_type", prefixToExamType(prefix));

    if (!error && testResults) {
      testsTaken = testResults.length;
      testsPassed = testResults.filter((t) => t.passed).length;
    }
  } catch (err) {
    console.warn(`[${requestId}] Failed to get test results:`, err);
  }

  const testPassRate = testsTaken > 0 ? testsPassed / testsTaken : 0;

  // Days since last study
  const lastStudyAt = attempts.length > 0 ? attempts[0].attempted_at : null;
  const daysSinceStudy = lastStudyAt
    ? (Date.now() - new Date(lastStudyAt).getTime()) / (1000 * 60 * 60 * 24)
    : 30; // Default to 30 days if never studied

  return {
    recentAccuracy,
    overallAccuracy,
    coverage,
    mastery,
    testsPassed,
    testsTaken,
    testPassRate,
    daysSinceStudy,
    lastStudyAt,
    totalAttempts,
    uniqueQuestionsSeen,
    totalPoolSize,
  };
}

async function getQuestionIdsForPrefix(
  supabase: SupabaseClient,
  prefix: string
): Promise<string[]> {
  const { data } = await supabase
    .from("questions")
    .select("id")
    .like("display_name", `${prefix}%`);
  return data?.map((q) => q.id) || [];
}

function prefixToExamType(prefix: string): string {
  return prefix === "T" ? "technician" : prefix === "G" ? "general" : "extra";
}

// ============================================================
// READINESS CALCULATION - ALL FORMULAS CENTRALIZED HERE
// ============================================================

function calculateReadiness(metrics: Metrics, config: Config): ReadinessResult {
  const w = config.formula_weights;

  // Readiness Score: R = w1*A_r + w2*A_o + w3*C + w4*M + w5*T_rate - penalty
  // Note: weights are already scaled (35, 20, 15, 15, 15) and metrics are 0-1
  const rawScore =
    w.recent_accuracy * (metrics.recentAccuracy ?? 0) +
    w.overall_accuracy * (metrics.overallAccuracy ?? 0) +
    w.coverage * metrics.coverage +
    w.mastery * metrics.mastery +
    w.test_rate * metrics.testPassRate;

  // Recency penalty: penalty = min(max_penalty, decay_rate * days)
  const recencyPenalty = Math.min(
    config.recency_penalty.max_penalty,
    config.recency_penalty.decay_rate * metrics.daysSinceStudy
  );

  // Clamp final score to 0-100
  const readinessScore = Math.max(0, Math.min(100, rawScore - recencyPenalty));

  // Pass probability using logistic function: P = 1 / (1 + e^(-k(R - R_0)))
  const { k, r0 } = config.pass_probability;
  const passProbability = 1 / (1 + Math.exp(-k * (readinessScore - r0)));

  return {
    readinessScore,
    passProbability,
    recencyPenalty,
    expectedExamScore: 0, // Calculated from subelements later
  };
}

// ============================================================
// SUBELEMENT METRICS CALCULATION (OPTIMIZED - SINGLE BATCH)
// ============================================================

interface SubelementData {
  code: string;
  weight: number;
}

interface QuestionData {
  id: string;
  subelement: string;
}

interface AttemptData {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
}

interface MasteryData {
  question_id: string;
}

async function calculateSubelementMetrics(
  supabase: SupabaseClient,
  userId: string,
  prefix: string,
  config: Config,
  requestId: string
): Promise<Record<string, SubelementMetric>> {
  // ===== BATCH 1: Get all subelements for this exam type =====
  const { data: syllabusData, error: syllabusError } = await supabase
    .from("syllabus")
    .select("code, exam_questions")
    .eq("license_type", prefix)
    .eq("type", "subelement");

  if (syllabusError) {
    console.warn(`[${requestId}] Failed to get syllabus:`, syllabusError);
    return {};
  }

  const subelements: SubelementData[] = (syllabusData || []).map((s) => ({
    code: s.code,
    weight: s.exam_questions || 0,
  }));

  if (subelements.length === 0) {
    return {};
  }

  const subelementCodes = subelements.map((s) => s.code);

  // ===== BATCH 2: Get all questions for these subelements =====
  const { data: questionsData, error: questionsError } = await supabase
    .from("questions")
    .select("id, subelement")
    .in("subelement", subelementCodes);

  if (questionsError) {
    console.warn(`[${requestId}] Failed to get questions:`, questionsError);
    return {};
  }

  const questions: QuestionData[] = questionsData || [];
  const questionIds = questions.map((q) => q.id);

  // Group questions by subelement for pool size
  const poolSizeBySubelement = new Map<string, number>();
  const questionIdsBySubelement = new Map<string, Set<string>>();

  for (const q of questions) {
    poolSizeBySubelement.set(
      q.subelement,
      (poolSizeBySubelement.get(q.subelement) || 0) + 1
    );

    if (!questionIdsBySubelement.has(q.subelement)) {
      questionIdsBySubelement.set(q.subelement, new Set());
    }
    questionIdsBySubelement.get(q.subelement)!.add(q.id);
  }

  // ===== BATCH 3: Get all attempts for these questions =====
  let attempts: AttemptData[] = [];
  if (questionIds.length > 0) {
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("question_attempts")
      .select("question_id, is_correct, attempted_at")
      .eq("user_id", userId)
      .in("question_id", questionIds)
      .order("attempted_at", { ascending: false });

    if (attemptsError) {
      console.warn(`[${requestId}] Failed to get attempts:`, attemptsError);
    } else {
      attempts = attemptsData || [];
    }
  }

  // Group attempts by subelement (using question -> subelement mapping)
  const questionToSubelement = new Map(questions.map((q) => [q.id, q.subelement]));
  const attemptsBySubelement = new Map<string, AttemptData[]>();

  for (const attempt of attempts) {
    const subelement = questionToSubelement.get(attempt.question_id);
    if (subelement) {
      if (!attemptsBySubelement.has(subelement)) {
        attemptsBySubelement.set(subelement, []);
      }
      attemptsBySubelement.get(subelement)!.push(attempt);
    }
  }

  // ===== BATCH 4: Get all mastery data for these questions =====
  let masteryData: MasteryData[] = [];
  if (questionIds.length > 0) {
    const { data: masteryResult, error: masteryError } = await supabase
      .from("question_mastery")
      .select("question_id")
      .eq("user_id", userId)
      .eq("is_mastered", true)
      .in("question_id", questionIds);

    if (masteryError) {
      console.warn(`[${requestId}] Failed to get mastery:`, masteryError);
    } else {
      masteryData = masteryResult || [];
    }
  }

  // Group mastery by subelement
  const masteredBySubelement = new Map<string, Set<string>>();
  for (const m of masteryData) {
    const subelement = questionToSubelement.get(m.question_id);
    if (subelement) {
      if (!masteredBySubelement.has(subelement)) {
        masteredBySubelement.set(subelement, new Set());
      }
      masteredBySubelement.get(subelement)!.add(m.question_id);
    }
  }

  // ===== CALCULATE METRICS FOR EACH SUBELEMENT IN-MEMORY =====
  const result: Record<string, SubelementMetric> = {};
  const { blend, coverage_beta: beta, thresholds } = config;

  for (const sub of subelements) {
    const code = sub.code;
    const weight = sub.weight;
    const poolSize = poolSizeBySubelement.get(code) || 0;

    const subAttempts = attemptsBySubelement.get(code) || [];
    const attemptsCount = subAttempts.length;
    const correctCount = subAttempts.filter((a) => a.is_correct).length;
    const accuracy = attemptsCount > 0 ? correctCount / attemptsCount : null;

    // Recent accuracy (last N per subelement) - attempts already sorted by date desc
    const recentWindow = thresholds.subelement_recent_window;
    const recentAttempts = subAttempts.slice(0, recentWindow);
    const recentCorrect = recentAttempts.filter((a) => a.is_correct).length;
    const recentAccuracy =
      recentAttempts.length > 0 ? recentCorrect / recentAttempts.length : null;
    const recentAttemptsCount = recentAttempts.length;

    // Coverage - unique questions seen
    const uniqueQuestionsSeen = new Set(subAttempts.map((a) => a.question_id)).size;
    const coverage = poolSize > 0 ? uniqueQuestionsSeen / poolSize : 0;

    // Mastery
    const masteredQuestions = masteredBySubelement.get(code) || new Set();
    const mastery = poolSize > 0 ? masteredQuestions.size / poolSize : 0;

    // Calculate estimated accuracy (A_hat) using configurable blend formula
    let estimatedAccuracy: number;
    if (recentAttemptsCount >= blend.recent_window) {
      // Sufficient recent data: use recent accuracy
      estimatedAccuracy = recentAccuracy ?? 0;
    } else if (recentAttemptsCount >= blend.min_recent_for_blend) {
      // Some recent data: blend recent and overall
      const alpha = recentAttemptsCount / blend.recent_window;
      estimatedAccuracy =
        alpha * (recentAccuracy ?? 0) + (1 - alpha) * (accuracy ?? 0);
    } else {
      // Insufficient recent data: use overall
      estimatedAccuracy = accuracy ?? 0;
    }

    // Calculate beta (coverage modifier)
    const coverageModifier =
      coverage < beta.low_threshold
        ? beta.low
        : coverage >= beta.high_threshold
          ? beta.high
          : beta.mid;

    // Risk score: Risk_s = w_s * (1 - A_hat) * beta
    const riskScore = weight * (1 - estimatedAccuracy) * coverageModifier;

    // Expected score: E_s = w_s * A_hat
    const expectedScore = weight * estimatedAccuracy;

    result[code] = {
      accuracy,
      recent_accuracy: recentAccuracy,
      coverage,
      mastery,
      risk_score: riskScore,
      expected_score: expectedScore,
      weight,
      pool_size: poolSize,
      attempts_count: attemptsCount,
      recent_attempts_count: recentAttemptsCount,
    };
  }

  return result;
}

// ============================================================
// DATABASE UPDATES
// ============================================================

async function upsertCache(
  supabase: SupabaseClient,
  userId: string,
  examType: string,
  result: ReadinessResult,
  subelementMetrics: Record<string, SubelementMetric>,
  metrics: Metrics,
  configVersion: string
): Promise<void> {
  const { error } = await supabase.from("user_readiness_cache").upsert(
    {
      user_id: userId,
      exam_type: examType,
      recent_accuracy: metrics.recentAccuracy,
      overall_accuracy: metrics.overallAccuracy,
      coverage: metrics.coverage,
      mastery: metrics.mastery,
      tests_passed: metrics.testsPassed,
      tests_taken: metrics.testsTaken,
      last_study_at: metrics.lastStudyAt,
      readiness_score: result.readinessScore,
      pass_probability: result.passProbability,
      expected_exam_score: result.expectedExamScore,
      subelement_metrics: subelementMetrics,
      total_attempts: metrics.totalAttempts,
      unique_questions_seen: metrics.uniqueQuestionsSeen,
      config_version: configVersion,
      calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,exam_type" }
  );

  if (error) {
    console.error("Failed to upsert cache:", error);
    throw new Error("Failed to save readiness cache");
  }
}

async function upsertSnapshot(
  supabase: SupabaseClient,
  userId: string,
  examType: string,
  result: ReadinessResult,
  metrics: Metrics
): Promise<void> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Get today's activity count
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayAttempts } = await supabase
    .from("question_attempts")
    .select("is_correct")
    .eq("user_id", userId)
    .gte("attempted_at", startOfDay.toISOString());

  const questionsAttempted = todayAttempts?.length || 0;
  const questionsCorrect = todayAttempts?.filter((a) => a.is_correct).length || 0;

  const { error } = await supabase.from("user_readiness_snapshots").upsert(
    {
      user_id: userId,
      exam_type: examType,
      snapshot_date: today,
      readiness_score: result.readinessScore,
      pass_probability: result.passProbability,
      recent_accuracy: metrics.recentAccuracy,
      overall_accuracy: metrics.overallAccuracy,
      coverage: metrics.coverage,
      mastery: metrics.mastery,
      tests_passed: metrics.testsPassed,
      tests_taken: metrics.testsTaken,
      questions_attempted: questionsAttempted,
      questions_correct: questionsCorrect,
    },
    { onConflict: "user_id,exam_type,snapshot_date" }
  );

  if (error) {
    console.error("Failed to upsert snapshot:", error);
    // Don't throw - snapshot failure shouldn't block the main operation
  }
}

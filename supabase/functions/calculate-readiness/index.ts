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

    // Parse request
    const { exam_type } = (await req.json()) as ReadinessRequest;
    if (!["technician", "general", "extra"].includes(exam_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid exam_type" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const prefix =
      exam_type === "technician" ? "T" : exam_type === "general" ? "G" : "E";

    console.log(
      `[${requestId}] Calculating readiness for user ${user.id}, exam_type=${exam_type}`
    );

    // Load config from database
    const config = await loadConfig(supabase);
    console.log(`[${requestId}] Loaded config version: ${config.version}`);

    // Gather raw metrics
    const metrics = await gatherMetrics(
      supabase,
      user.id,
      prefix,
      config.thresholds
    );
    console.log(
      `[${requestId}] Metrics: attempts=${metrics.totalAttempts}, coverage=${(metrics.coverage * 100).toFixed(1)}%, mastery=${(metrics.mastery * 100).toFixed(1)}%`
    );

    // Calculate readiness score (ALL FORMULAS CENTRALIZED HERE)
    const result = calculateReadiness(metrics, config);
    console.log(
      `[${requestId}] Result: score=${result.readinessScore.toFixed(1)}, passProbability=${(result.passProbability * 100).toFixed(1)}%`
    );

    // Calculate subelement metrics
    const subelementMetrics = await calculateSubelementMetrics(
      supabase,
      user.id,
      prefix,
      config
    );

    // Calculate expected exam score from subelement metrics
    const expectedExamScore = Object.values(subelementMetrics).reduce(
      (sum, m) => sum + m.expected_score,
      0
    );

    // Upsert to cache
    await upsertCache(
      supabase,
      user.id,
      exam_type,
      { ...result, expectedExamScore },
      subelementMetrics,
      metrics,
      config.version
    );

    // Upsert daily snapshot
    await upsertSnapshot(supabase, user.id, exam_type, result, metrics);

    console.log(`[${requestId}] Successfully updated readiness cache`);

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
// CONFIGURATION LOADING
// ============================================================

async function loadConfig(supabase: SupabaseClient): Promise<Config> {
  const { data, error } = await supabase
    .from("readiness_config")
    .select("key, value");

  if (error) {
    console.error("Failed to load config:", error);
    throw new Error("Failed to load readiness configuration");
  }

  const configMap = new Map(data?.map((r) => [r.key, r.value]) || []);

  return {
    formula_weights: (configMap.get("formula_weights") as FormulaWeights) || {
      recent_accuracy: 35,
      overall_accuracy: 20,
      coverage: 15,
      mastery: 15,
      test_rate: 15,
    },
    pass_probability: (configMap.get("pass_probability") as PassProbabilityConfig) || {
      k: 0.15,
      r0: 65,
    },
    recency_penalty: (configMap.get("recency_penalty") as RecencyPenaltyConfig) || {
      max_penalty: 10,
      decay_rate: 0.5,
    },
    coverage_beta: (configMap.get("coverage_beta") as CoverageBetaConfig) || {
      low: 1.2,
      mid: 1.0,
      high: 0.9,
      low_threshold: 0.3,
      high_threshold: 0.7,
    },
    thresholds: (configMap.get("thresholds") as ThresholdsConfig) || {
      min_attempts: 50,
      min_per_subelement: 2,
      recent_window: 50,
      subelement_recent_window: 20,
    },
    version: (configMap.get("version") as string) || "v1.0.0",
  };
}

// ============================================================
// METRICS GATHERING
// ============================================================

async function gatherMetrics(
  supabase: SupabaseClient,
  userId: string,
  prefix: string,
  thresholds: ThresholdsConfig
): Promise<Metrics> {
  // Get total pool size for this exam type
  const { count: totalPoolSize } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .like("display_name", `${prefix}%`);

  // Get all attempts for this exam type (we'll process in JS for flexibility)
  const { data: allAttempts } = await supabase
    .from("question_attempts")
    .select("is_correct, attempted_at, question_id, questions!inner(display_name)")
    .eq("user_id", userId)
    .like("questions.display_name", `${prefix}%`)
    .order("attempted_at", { ascending: false });

  const attempts = allAttempts || [];
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
  const { count: masteredCount } = await supabase
    .from("question_mastery")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_mastered", true)
    .in(
      "question_id",
      await getQuestionIdsForPrefix(supabase, prefix)
    );

  const mastery = totalPoolSize ? (masteredCount || 0) / totalPoolSize : 0;

  // Practice test stats
  const { data: testResults } = await supabase
    .from("practice_test_results")
    .select("passed")
    .eq("user_id", userId)
    .eq("test_type", prefixToExamType(prefix));

  const testsTaken = testResults?.length || 0;
  const testsPassed = testResults?.filter((t) => t.passed).length || 0;
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
    totalPoolSize: totalPoolSize || 0,
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
// SUBELEMENT METRICS CALCULATION
// ============================================================

async function calculateSubelementMetrics(
  supabase: SupabaseClient,
  userId: string,
  prefix: string,
  config: Config
): Promise<Record<string, SubelementMetric>> {
  // Get all subelements for this exam type with their weights
  const { data: syllabusData } = await supabase
    .from("syllabus")
    .select("code, exam_questions")
    .eq("license_type", prefix)
    .eq("type", "subelement");

  const subelements = syllabusData || [];
  const result: Record<string, SubelementMetric> = {};

  for (const sub of subelements) {
    const code = sub.code;
    const weight = sub.exam_questions || 0;

    // Get pool size for this subelement
    const { count: poolSize } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("subelement", code);

    // Get all attempts for this subelement
    const { data: attempts } = await supabase
      .from("question_attempts")
      .select("is_correct, attempted_at, question_id, questions!inner(subelement)")
      .eq("user_id", userId)
      .eq("questions.subelement", code)
      .order("attempted_at", { ascending: false });

    const attemptsCount = attempts?.length || 0;
    const correctCount = attempts?.filter((a) => a.is_correct).length || 0;
    const accuracy = attemptsCount > 0 ? correctCount / attemptsCount : null;

    // Recent accuracy (last N per subelement)
    const recentWindow = config.thresholds.subelement_recent_window;
    const recentAttempts = attempts?.slice(0, recentWindow) || [];
    const recentCorrect = recentAttempts.filter((a) => a.is_correct).length;
    const recentAccuracy =
      recentAttempts.length > 0 ? recentCorrect / recentAttempts.length : null;
    const recentAttemptsCount = recentAttempts.length;

    // Coverage
    const uniqueQuestionIds = new Set(attempts?.map((a) => a.question_id) || []);
    const coverage = poolSize ? uniqueQuestionIds.size / poolSize : 0;

    // Mastery
    const questionIds = await supabase
      .from("questions")
      .select("id")
      .eq("subelement", code);

    const { count: masteredCount } = await supabase
      .from("question_mastery")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_mastered", true)
      .in("question_id", questionIds.data?.map((q) => q.id) || []);

    const mastery = poolSize ? (masteredCount || 0) / poolSize : 0;

    // Calculate estimated accuracy (A_hat) using blend formula from spec
    let estimatedAccuracy: number;
    if (recentAttemptsCount >= recentWindow) {
      // Sufficient recent data: use recent accuracy
      estimatedAccuracy = recentAccuracy ?? 0;
    } else if (recentAttemptsCount >= 5) {
      // Some recent data: blend recent and overall
      const alpha = recentAttemptsCount / recentWindow;
      estimatedAccuracy =
        alpha * (recentAccuracy ?? 0) + (1 - alpha) * (accuracy ?? 0);
    } else {
      // Insufficient recent data: use overall
      estimatedAccuracy = accuracy ?? 0;
    }

    // Calculate beta (coverage modifier)
    const beta = config.coverage_beta;
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
      pool_size: poolSize || 0,
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

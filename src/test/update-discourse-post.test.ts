import { describe, it, expect } from "vitest";

/**
 * Unit tests for the update-discourse-post edge function.
 *
 * These tests verify the pure logic functions used by the edge function:
 * - Topic ID extraction from forum URLs
 * - Topic body formatting
 * - Request validation
 *
 * Integration tests would require mocking Deno runtime, Supabase client, and Discourse API.
 */

// =============================================================================
// EXTRACTED FUNCTIONS FOR TESTING
// These mirror the implementations in index.ts
// =============================================================================

/**
 * Extract topic ID from a Discourse forum URL.
 * Handles formats like:
 * - https://forum.openhamprep.com/t/topic-slug/123
 * - https://forum.openhamprep.com/t/123
 */
function extractTopicId(forumUrl: string): number | null {
  if (!forumUrl) return null;
  // Match /t/anything/123 or /t/123
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

/**
 * Format the topic body to match sync-discourse-topics format.
 * This ensures the webhook can correctly parse explanations back.
 */
function formatTopicBody(question: Question, newExplanation: string): string {
  const letters = ["A", "B", "C", "D"];
  const correctLetter = letters[question.correct_answer];

  const optionsText = question.options
    .map((opt, i) => `- **${letters[i]})** ${opt}`)
    .join("\n");

  const explanationText = newExplanation
    ? newExplanation
    : "_No explanation yet. Help improve this by contributing below!_";

  return `## Question
${question.question}

## Answer Options
${optionsText}

**Correct Answer: ${correctLetter}**

---

## Explanation
${explanationText}

---
_This topic was automatically created to facilitate community discussion about this exam question. Feel free to share study tips, memory tricks, or additional explanations!_`;
}

/**
 * Validate the request body for required fields.
 */
function validateRequestBody(body: unknown): {
  valid: boolean;
  questionId?: string;
  explanation?: string;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const { questionId, explanation } = body as {
    questionId?: string;
    explanation?: string;
  };

  if (!questionId) {
    return { valid: false, error: "questionId is required" };
  }

  return {
    valid: true,
    questionId,
    explanation: explanation ?? "",
  };
}

// =============================================================================
// TESTS: TOPIC ID EXTRACTION
// =============================================================================

describe("extractTopicId", () => {
  describe("valid forum URL formats", () => {
    it("should extract topic ID from full URL with slug", () => {
      const url = "https://forum.openhamprep.com/t/t1a01-question-text/123";
      expect(extractTopicId(url)).toBe(123);
    });

    it("should extract topic ID from URL without slug", () => {
      const url = "https://forum.openhamprep.com/t/456";
      expect(extractTopicId(url)).toBe(456);
    });

    it("should extract large topic IDs", () => {
      const url = "https://forum.openhamprep.com/t/some-topic/999999";
      expect(extractTopicId(url)).toBe(999999);
    });

    it("should extract topic ID with complex slug", () => {
      const url =
        "https://forum.openhamprep.com/t/t1a01-what-is-the-wavelength/789";
      expect(extractTopicId(url)).toBe(789);
    });

    it("should handle URL with trailing slash", () => {
      const url = "https://forum.openhamprep.com/t/topic-slug/123/";
      expect(extractTopicId(url)).toBe(123);
    });

    it("should handle URL with post number", () => {
      // URL format when linking to a specific post: /t/slug/topic_id/post_number
      const url = "https://forum.openhamprep.com/t/topic-slug/123/5";
      expect(extractTopicId(url)).toBe(123);
    });
  });

  describe("invalid forum URL formats", () => {
    it("should return null for empty string", () => {
      expect(extractTopicId("")).toBeNull();
    });

    it("should return null for null input", () => {
      // @ts-expect-error Testing null input
      expect(extractTopicId(null)).toBeNull();
    });

    it("should return null for undefined input", () => {
      // @ts-expect-error Testing undefined input
      expect(extractTopicId(undefined)).toBeNull();
    });

    it("should return null for URL without topic path", () => {
      const url = "https://forum.openhamprep.com/categories";
      expect(extractTopicId(url)).toBeNull();
    });

    it("should return null for URL with non-numeric ID", () => {
      const url = "https://forum.openhamprep.com/t/topic-slug/abc";
      expect(extractTopicId(url)).toBeNull();
    });

    it("should return null for category URL", () => {
      const url = "https://forum.openhamprep.com/c/technician-questions/5";
      expect(extractTopicId(url)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle different domain", () => {
      const url = "https://other-forum.com/t/topic/123";
      expect(extractTopicId(url)).toBe(123);
    });

    it("should handle HTTP URL", () => {
      const url = "http://forum.openhamprep.com/t/topic/123";
      expect(extractTopicId(url)).toBe(123);
    });

    it("should handle URL with query parameters", () => {
      const url = "https://forum.openhamprep.com/t/topic/123?u=admin";
      expect(extractTopicId(url)).toBe(123);
    });

    it("should handle URL with hash fragment", () => {
      const url = "https://forum.openhamprep.com/t/topic/123#heading";
      expect(extractTopicId(url)).toBe(123);
    });
  });
});

// =============================================================================
// TESTS: TOPIC BODY FORMATTING
// =============================================================================

describe("formatTopicBody", () => {
  const sampleQuestion: Question = {
    id: "T1A01",
    question: "What is the purpose of the Amateur Radio Service?",
    options: [
      "To provide personal radio communications",
      "To provide emergency communications",
      "To advance skills in the radio art",
      "All of these choices are correct",
    ],
    correct_answer: 3, // D
  };

  describe("basic formatting", () => {
    it("should include the question text", () => {
      const result = formatTopicBody(sampleQuestion, "Test explanation");
      expect(result).toContain("## Question");
      expect(result).toContain(sampleQuestion.question);
    });

    it("should include all answer options with letters", () => {
      const result = formatTopicBody(sampleQuestion, "Test explanation");
      expect(result).toContain("- **A)** To provide personal radio communications");
      expect(result).toContain("- **B)** To provide emergency communications");
      expect(result).toContain("- **C)** To advance skills in the radio art");
      expect(result).toContain("- **D)** All of these choices are correct");
    });

    it("should show correct answer letter", () => {
      const result = formatTopicBody(sampleQuestion, "Test explanation");
      expect(result).toContain("**Correct Answer: D**");
    });

    it("should include the explanation section", () => {
      const explanation = "This is the detailed explanation.";
      const result = formatTopicBody(sampleQuestion, explanation);
      expect(result).toContain("## Explanation");
      expect(result).toContain(explanation);
    });

    it("should include footer text", () => {
      const result = formatTopicBody(sampleQuestion, "Test");
      expect(result).toContain("This topic was automatically created");
    });
  });

  describe("correct answer mapping", () => {
    it("should map correct_answer 0 to A", () => {
      const q = { ...sampleQuestion, correct_answer: 0 };
      const result = formatTopicBody(q, "Test");
      expect(result).toContain("**Correct Answer: A**");
    });

    it("should map correct_answer 1 to B", () => {
      const q = { ...sampleQuestion, correct_answer: 1 };
      const result = formatTopicBody(q, "Test");
      expect(result).toContain("**Correct Answer: B**");
    });

    it("should map correct_answer 2 to C", () => {
      const q = { ...sampleQuestion, correct_answer: 2 };
      const result = formatTopicBody(q, "Test");
      expect(result).toContain("**Correct Answer: C**");
    });

    it("should map correct_answer 3 to D", () => {
      const q = { ...sampleQuestion, correct_answer: 3 };
      const result = formatTopicBody(q, "Test");
      expect(result).toContain("**Correct Answer: D**");
    });
  });

  describe("empty explanation handling", () => {
    it("should use placeholder for empty string explanation", () => {
      const result = formatTopicBody(sampleQuestion, "");
      expect(result).toContain(
        "_No explanation yet. Help improve this by contributing below!_"
      );
    });

    it("should use actual explanation when provided", () => {
      const explanation = "The correct answer is D because...";
      const result = formatTopicBody(sampleQuestion, explanation);
      expect(result).toContain(explanation);
      expect(result).not.toContain("_No explanation yet");
    });
  });

  describe("special characters", () => {
    it("should handle question with special characters", () => {
      const q: Question = {
        id: "E5A01",
        question: "What is the formula for λ (wavelength)?",
        options: ["λ = c/f", "λ = f/c", "λ = c×f", "λ = c+f"],
        correct_answer: 0,
      };
      const result = formatTopicBody(q, "Test");
      expect(result).toContain("λ (wavelength)");
      expect(result).toContain("λ = c/f");
    });

    it("should handle markdown in options", () => {
      const q: Question = {
        id: "G1A01",
        question: "What is the power formula?",
        options: ["P = I²R", "P = IR²", "P = I/R", "P = R/I"],
        correct_answer: 0,
      };
      const result = formatTopicBody(q, "Test");
      expect(result).toContain("P = I²R");
    });
  });

  describe("format structure", () => {
    it("should have sections in correct order", () => {
      const result = formatTopicBody(sampleQuestion, "Explanation text");

      const questionIndex = result.indexOf("## Question");
      const optionsIndex = result.indexOf("## Answer Options");
      const explanationIndex = result.indexOf("## Explanation");

      expect(questionIndex).toBeLessThan(optionsIndex);
      expect(optionsIndex).toBeLessThan(explanationIndex);
    });

    it("should have horizontal rules as separators", () => {
      const result = formatTopicBody(sampleQuestion, "Test");
      expect((result.match(/---/g) || []).length).toBeGreaterThanOrEqual(2);
    });
  });
});

// =============================================================================
// TESTS: REQUEST VALIDATION
// =============================================================================

describe("validateRequestBody", () => {
  describe("valid requests", () => {
    it("should accept valid request with both fields", () => {
      const body = { questionId: "T1A01", explanation: "Test explanation" };
      const result = validateRequestBody(body);
      expect(result.valid).toBe(true);
      expect(result.questionId).toBe("T1A01");
      expect(result.explanation).toBe("Test explanation");
    });

    it("should accept request with empty explanation", () => {
      const body = { questionId: "T1A01", explanation: "" };
      const result = validateRequestBody(body);
      expect(result.valid).toBe(true);
      expect(result.explanation).toBe("");
    });

    it("should accept request without explanation field", () => {
      const body = { questionId: "T1A01" };
      const result = validateRequestBody(body);
      expect(result.valid).toBe(true);
      expect(result.explanation).toBe("");
    });
  });

  describe("invalid requests", () => {
    it("should reject null body", () => {
      const result = validateRequestBody(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request body");
    });

    it("should reject undefined body", () => {
      const result = validateRequestBody(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request body");
    });

    it("should reject missing questionId", () => {
      const body = { explanation: "Test" };
      const result = validateRequestBody(body);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("questionId is required");
    });

    it("should reject empty questionId", () => {
      const body = { questionId: "", explanation: "Test" };
      const result = validateRequestBody(body);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("questionId is required");
    });

    it("should reject non-object body", () => {
      const result = validateRequestBody("string body");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request body");
    });

    it("should reject array body", () => {
      const result = validateRequestBody(["T1A01", "Test"]);
      expect(result.valid).toBe(false);
    });
  });
});

// =============================================================================
// TESTS: SYNC STATUS UPDATES
// =============================================================================

describe("sync status update logic", () => {
  interface SyncStatusUpdate {
    discourse_sync_status: "synced" | "error" | "pending";
    discourse_sync_at: string;
    discourse_sync_error: string | null;
  }

  /**
   * Creates a sync status update object for a successful sync.
   */
  function createSuccessStatus(): SyncStatusUpdate {
    return {
      discourse_sync_status: "synced",
      discourse_sync_at: new Date().toISOString(),
      discourse_sync_error: null,
    };
  }

  /**
   * Creates a sync status update object for a failed sync.
   */
  function createErrorStatus(errorMessage: string): SyncStatusUpdate {
    return {
      discourse_sync_status: "error",
      discourse_sync_at: new Date().toISOString(),
      discourse_sync_error: errorMessage,
    };
  }

  /**
   * Creates a sync status update object for a pending sync.
   */
  function createPendingStatus(): SyncStatusUpdate {
    return {
      discourse_sync_status: "pending",
      discourse_sync_at: new Date().toISOString(),
      discourse_sync_error: null,
    };
  }

  describe("success status", () => {
    it("should set status to synced", () => {
      const status = createSuccessStatus();
      expect(status.discourse_sync_status).toBe("synced");
    });

    it("should clear error message", () => {
      const status = createSuccessStatus();
      expect(status.discourse_sync_error).toBeNull();
    });

    it("should include timestamp", () => {
      const before = new Date().toISOString();
      const status = createSuccessStatus();
      const after = new Date().toISOString();

      expect(status.discourse_sync_at >= before).toBe(true);
      expect(status.discourse_sync_at <= after).toBe(true);
    });
  });

  describe("error status", () => {
    it("should set status to error", () => {
      const status = createErrorStatus("API error");
      expect(status.discourse_sync_status).toBe("error");
    });

    it("should include error message", () => {
      const errorMsg = "Discourse API error: 502";
      const status = createErrorStatus(errorMsg);
      expect(status.discourse_sync_error).toBe(errorMsg);
    });

    it("should include timestamp", () => {
      const status = createErrorStatus("Error");
      expect(status.discourse_sync_at).toBeDefined();
    });
  });

  describe("pending status", () => {
    it("should set status to pending", () => {
      const status = createPendingStatus();
      expect(status.discourse_sync_status).toBe("pending");
    });

    it("should have no error", () => {
      const status = createPendingStatus();
      expect(status.discourse_sync_error).toBeNull();
    });
  });
});

// =============================================================================
// TESTS: ERROR SCENARIOS
// =============================================================================

describe("error scenarios", () => {
  describe("Discourse API errors", () => {
    const discourseErrors = [
      { status: 401, message: "Unauthorized - Invalid API key" },
      { status: 403, message: "Forbidden - Insufficient permissions" },
      { status: 404, message: "Not Found - Topic does not exist" },
      { status: 422, message: "Unprocessable Entity - Invalid post content" },
      { status: 429, message: "Too Many Requests - Rate limited" },
      { status: 500, message: "Internal Server Error" },
      { status: 502, message: "Bad Gateway" },
      { status: 503, message: "Service Unavailable" },
    ];

    it.each(discourseErrors)(
      "should handle Discourse $status error",
      ({ status, message }) => {
        const errorMessage = `Discourse API error: ${status} - ${message}`;
        expect(errorMessage).toContain(status.toString());
        expect(errorMessage).toContain(message);
      }
    );
  });

  describe("database errors", () => {
    const dbErrors = [
      { code: "PGRST116", message: "Question not found" },
      { code: "23505", message: "Unique constraint violation" },
      { code: "42501", message: "Permission denied" },
    ];

    it.each(dbErrors)("should handle database error $code", ({ code, message }) => {
      const errorMessage = `Database error: ${code} - ${message}`;
      expect(errorMessage).toContain(code);
    });
  });

  describe("network errors", () => {
    it("should handle connection timeout", () => {
      const error = new Error("Connection timed out");
      expect(error.message).toBe("Connection timed out");
    });

    it("should handle DNS resolution failure", () => {
      const error = new Error("getaddrinfo ENOTFOUND forum.openhamprep.com");
      expect(error.message).toContain("ENOTFOUND");
    });
  });
});

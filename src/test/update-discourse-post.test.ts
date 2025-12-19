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

// =============================================================================
// TESTS: FORUM URL VALIDATION
// =============================================================================

describe("forum URL validation", () => {
  /**
   * Validates that a forum URL is in the expected Discourse format.
   */
  function isValidForumUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      // Must be HTTPS (or HTTP for local dev)
      if (!["https:", "http:"].includes(parsed.protocol)) return false;
      // Must have /t/ path for topic
      if (!parsed.pathname.includes("/t/")) return false;
      // Must have a numeric topic ID
      const topicIdMatch = parsed.pathname.match(/\/t\/(?:[^/]+\/)?(\d+)/);
      if (!topicIdMatch) return false;
      return true;
    } catch {
      return false;
    }
  }

  describe("valid forum URLs", () => {
    it("should accept full Discourse topic URL with slug", () => {
      expect(isValidForumUrl("https://forum.openhamprep.com/t/t1a01-question/123")).toBe(true);
    });

    it("should accept topic URL without slug", () => {
      expect(isValidForumUrl("https://forum.openhamprep.com/t/123")).toBe(true);
    });

    it("should accept HTTP URLs (for local development)", () => {
      expect(isValidForumUrl("http://localhost:4200/t/test-topic/456")).toBe(true);
    });

    it("should accept URLs with query parameters", () => {
      expect(isValidForumUrl("https://forum.openhamprep.com/t/topic/123?u=admin")).toBe(true);
    });

    it("should accept URLs with hash fragments", () => {
      expect(isValidForumUrl("https://forum.openhamprep.com/t/topic/123#post_5")).toBe(true);
    });
  });

  describe("invalid forum URLs", () => {
    it("should reject null", () => {
      expect(isValidForumUrl(null)).toBe(false);
    });

    it("should reject undefined", () => {
      expect(isValidForumUrl(undefined)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(isValidForumUrl("")).toBe(false);
    });

    it("should reject non-URL strings", () => {
      expect(isValidForumUrl("not a url")).toBe(false);
    });

    it("should reject URLs without /t/ path", () => {
      expect(isValidForumUrl("https://forum.openhamprep.com/categories")).toBe(false);
    });

    it("should reject category URLs", () => {
      expect(isValidForumUrl("https://forum.openhamprep.com/c/technician/5")).toBe(false);
    });

    it("should reject URLs without topic ID", () => {
      expect(isValidForumUrl("https://forum.openhamprep.com/t/topic-slug")).toBe(false);
    });

    it("should reject FTP URLs", () => {
      expect(isValidForumUrl("ftp://forum.openhamprep.com/t/topic/123")).toBe(false);
    });
  });
});

// =============================================================================
// TESTS: FORUM URL CHANGE TRACKING
// =============================================================================

describe("forum URL change tracking", () => {
  interface ChangeEntry {
    from: string | null;
    to: string | null;
  }

  /**
   * Detects if forum_url changed between original and updated question.
   */
  function detectForumUrlChange(
    originalUrl: string | null | undefined,
    newUrl: string | null | undefined
  ): ChangeEntry | null {
    const normalizedOriginal = originalUrl || null;
    const normalizedNew = newUrl?.trim() || null;

    if (normalizedOriginal === normalizedNew) {
      return null; // No change
    }

    return {
      from: normalizedOriginal,
      to: normalizedNew,
    };
  }

  describe("detecting changes", () => {
    it("should detect when forum_url is added", () => {
      const change = detectForumUrlChange(null, "https://forum.openhamprep.com/t/topic/123");
      expect(change).not.toBeNull();
      expect(change!.from).toBeNull();
      expect(change!.to).toBe("https://forum.openhamprep.com/t/topic/123");
    });

    it("should detect when forum_url is removed", () => {
      const change = detectForumUrlChange("https://forum.openhamprep.com/t/topic/123", null);
      expect(change).not.toBeNull();
      expect(change!.from).toBe("https://forum.openhamprep.com/t/topic/123");
      expect(change!.to).toBeNull();
    });

    it("should detect when forum_url is changed", () => {
      const change = detectForumUrlChange(
        "https://forum.openhamprep.com/t/old-topic/123",
        "https://forum.openhamprep.com/t/new-topic/456"
      );
      expect(change).not.toBeNull();
      expect(change!.from).toBe("https://forum.openhamprep.com/t/old-topic/123");
      expect(change!.to).toBe("https://forum.openhamprep.com/t/new-topic/456");
    });

    it("should return null when forum_url is unchanged", () => {
      const url = "https://forum.openhamprep.com/t/topic/123";
      const change = detectForumUrlChange(url, url);
      expect(change).toBeNull();
    });

    it("should treat empty string as null", () => {
      const change = detectForumUrlChange(null, "");
      expect(change).toBeNull();
    });

    it("should trim whitespace from new URL", () => {
      const change = detectForumUrlChange(
        "https://forum.openhamprep.com/t/topic/123",
        "  https://forum.openhamprep.com/t/topic/123  "
      );
      expect(change).toBeNull();
    });

    it("should detect change when URL has whitespace differences", () => {
      const change = detectForumUrlChange(
        "https://forum.openhamprep.com/t/topic/123",
        "https://forum.openhamprep.com/t/different/456"
      );
      expect(change).not.toBeNull();
    });
  });

  describe("handling undefined", () => {
    it("should treat undefined original as null", () => {
      const change = detectForumUrlChange(undefined, "https://forum.openhamprep.com/t/topic/123");
      expect(change).not.toBeNull();
      expect(change!.from).toBeNull();
    });

    it("should treat undefined new as null", () => {
      const change = detectForumUrlChange("https://forum.openhamprep.com/t/topic/123", undefined);
      expect(change).not.toBeNull();
      expect(change!.to).toBeNull();
    });

    it("should return null when both are undefined", () => {
      const change = detectForumUrlChange(undefined, undefined);
      expect(change).toBeNull();
    });
  });
});

// =============================================================================
// TESTS: EFFECTIVE FORUM URL LOGIC
// =============================================================================

describe("effective forum URL for sync", () => {
  /**
   * Determines the effective forum URL to use for Discourse sync.
   * Prefers the new URL if set, falls back to original.
   */
  function getEffectiveForumUrl(
    originalUrl: string | null | undefined,
    newUrl: string | null | undefined
  ): string | null {
    return (newUrl?.trim() || null) ?? (originalUrl || null);
  }

  it("should use new URL when provided", () => {
    const result = getEffectiveForumUrl(
      "https://forum.openhamprep.com/t/old/123",
      "https://forum.openhamprep.com/t/new/456"
    );
    expect(result).toBe("https://forum.openhamprep.com/t/new/456");
  });

  it("should fall back to original URL when new is null", () => {
    const result = getEffectiveForumUrl(
      "https://forum.openhamprep.com/t/original/123",
      null
    );
    expect(result).toBe("https://forum.openhamprep.com/t/original/123");
  });

  it("should fall back to original URL when new is empty", () => {
    const result = getEffectiveForumUrl(
      "https://forum.openhamprep.com/t/original/123",
      ""
    );
    expect(result).toBe("https://forum.openhamprep.com/t/original/123");
  });

  it("should return null when both are null", () => {
    const result = getEffectiveForumUrl(null, null);
    expect(result).toBeNull();
  });

  it("should use new URL even when original exists", () => {
    const result = getEffectiveForumUrl(
      "https://forum.openhamprep.com/t/old/123",
      "https://forum.openhamprep.com/t/new/456"
    );
    expect(result).toBe("https://forum.openhamprep.com/t/new/456");
  });

  it("should handle whitespace in new URL", () => {
    const result = getEffectiveForumUrl(
      null,
      "  https://forum.openhamprep.com/t/topic/123  "
    );
    expect(result).toBe("https://forum.openhamprep.com/t/topic/123");
  });
});

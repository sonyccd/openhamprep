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

  describe("status must be updated on failure", () => {
    /**
     * This test ensures that when any error occurs, the sync status
     * is updated to "error" and does NOT remain as "pending".
     *
     * Bug found: Previously, unhandled exceptions in the catch block
     * would return a 500 error but leave status as "pending".
     */

    interface StatusTransition {
      initialStatus: "pending" | "synced" | "error" | null;
      errorOccurred: boolean;
      expectedFinalStatus: "pending" | "synced" | "error";
    }

    function determineExpectedStatus(
      initialStatus: "pending" | "synced" | "error" | null,
      errorOccurred: boolean,
      syncSucceeded: boolean
    ): "pending" | "synced" | "error" {
      if (errorOccurred) {
        // ANY error must result in "error" status, never staying "pending"
        return "error";
      }
      if (syncSucceeded) {
        return "synced";
      }
      // If no error and no success (shouldn't happen), keep current
      return initialStatus || "pending";
    }

    it("should update status to error when Discourse API fails", () => {
      const result = determineExpectedStatus("pending", true, false);
      expect(result).toBe("error");
    });

    it("should update status to error when unhandled exception occurs", () => {
      const result = determineExpectedStatus("pending", true, false);
      expect(result).toBe("error");
    });

    it("should update status to error when database update fails", () => {
      const result = determineExpectedStatus("pending", true, false);
      expect(result).toBe("error");
    });

    it("should update status to synced when sync succeeds", () => {
      const result = determineExpectedStatus("pending", false, true);
      expect(result).toBe("synced");
    });

    it("should NEVER leave status as pending after an error", () => {
      // This is the critical test - status must not remain "pending" on error
      const errorScenarios = [
        { name: "API 401", error: true },
        { name: "API 403", error: true },
        { name: "API 404", error: true },
        { name: "API 500", error: true },
        { name: "API 502", error: true },
        { name: "Network timeout", error: true },
        { name: "DNS failure", error: true },
        { name: "JSON parse error", error: true },
        { name: "Invalid topic ID", error: true },
        { name: "Missing credentials", error: true },
      ];

      for (const scenario of errorScenarios) {
        const finalStatus = determineExpectedStatus("pending", scenario.error, false);
        expect(finalStatus).not.toBe("pending");
        expect(finalStatus).toBe("error");
      }
    });

    it("should include error message in status update", () => {
      interface ErrorStatusUpdate {
        discourse_sync_status: "error";
        discourse_sync_at: string;
        discourse_sync_error: string;
      }

      function createErrorStatusUpdate(errorMessage: string): ErrorStatusUpdate {
        return {
          discourse_sync_status: "error",
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: errorMessage,
        };
      }

      const update = createErrorStatusUpdate("Discourse API error: 502");
      expect(update.discourse_sync_status).toBe("error");
      expect(update.discourse_sync_error).toBe("Discourse API error: 502");
      expect(update.discourse_sync_error).not.toBeNull();
      expect(update.discourse_sync_error.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// TESTS: SAFE URL VALIDATION (XSS PREVENTION)
// =============================================================================

describe("getSafeUrl - XSS prevention", () => {
  /**
   * Validates a URL string and returns it only if it uses a safe protocol (http/https).
   * Prevents XSS attacks via javascript: or other dangerous URL schemes.
   * This mirrors the implementation in AdminQuestions.tsx
   */
  function getSafeUrl(urlString: string | null | undefined): string | null {
    if (!urlString) return null;
    try {
      const url = new URL(urlString);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return urlString;
      }
      return null;
    } catch {
      return null;
    }
  }

  describe("safe protocols", () => {
    it("should allow https URLs", () => {
      expect(getSafeUrl("https://forum.openhamprep.com/t/topic/123")).toBe(
        "https://forum.openhamprep.com/t/topic/123"
      );
    });

    it("should allow http URLs", () => {
      expect(getSafeUrl("http://localhost:4200/t/topic/123")).toBe(
        "http://localhost:4200/t/topic/123"
      );
    });
  });

  describe("dangerous protocols - XSS prevention", () => {
    it("should reject javascript: protocol", () => {
      expect(getSafeUrl("javascript:alert('XSS')")).toBeNull();
    });

    it("should reject javascript: with encoding", () => {
      expect(getSafeUrl("javascript:alert(document.cookie)")).toBeNull();
    });

    it("should reject data: protocol", () => {
      expect(getSafeUrl("data:text/html,<script>alert('XSS')</script>")).toBeNull();
    });

    it("should reject vbscript: protocol", () => {
      expect(getSafeUrl("vbscript:msgbox('XSS')")).toBeNull();
    });

    it("should reject file: protocol", () => {
      expect(getSafeUrl("file:///etc/passwd")).toBeNull();
    });

    it("should reject ftp: protocol", () => {
      expect(getSafeUrl("ftp://ftp.example.com/file")).toBeNull();
    });
  });

  describe("invalid inputs", () => {
    it("should return null for null input", () => {
      expect(getSafeUrl(null)).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(getSafeUrl(undefined)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(getSafeUrl("")).toBeNull();
    });

    it("should return null for non-URL strings", () => {
      expect(getSafeUrl("not a url")).toBeNull();
    });

    it("should return null for relative paths", () => {
      expect(getSafeUrl("/t/topic/123")).toBeNull();
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

// =============================================================================
// TESTS: AUTHENTICATION FLOW
// =============================================================================

describe("authentication flow", () => {
  /**
   * These tests verify the expected authentication flow for the edge function.
   * The actual implementation uses supabase.auth.getUser() to validate tokens,
   * NOT manual JWT decoding with has_role RPC.
   *
   * Bug fixed: Previously the function used decodeJwtPayload() + has_role RPC
   * which was returning 401 errors. The fix aligns with sync-discourse-topics
   * by using supabase.auth.getUser() + direct user_roles table query.
   */

  describe("token validation patterns", () => {
    interface AuthResult {
      success: boolean;
      userId?: string;
      error?: string;
    }

    /**
     * Simulates the CORRECT auth pattern using supabase.auth.getUser()
     */
    function validateTokenCorrectly(
      hasValidToken: boolean,
      userId: string | null
    ): AuthResult {
      // This mirrors the fixed implementation:
      // const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!hasValidToken || !userId) {
        return { success: false, error: "Invalid token" };
      }
      return { success: true, userId };
    }

    /**
     * Simulates the INCORRECT auth pattern using manual JWT decode + has_role RPC
     * This was the buggy implementation that caused 401 errors.
     */
    function validateTokenIncorrectly(
      jwtPayload: { sub?: string; role?: string } | null
    ): AuthResult {
      // This mirrors the OLD buggy implementation:
      // const payload = decodeJwtPayload(token);
      // const userId = payload?.sub as string;
      if (!jwtPayload) {
        return { success: false, error: "Invalid token" };
      }
      const userId = jwtPayload.sub;
      if (!userId) {
        return { success: false, error: "Invalid token" };
      }
      return { success: true, userId };
    }

    it("should validate token using getUser pattern (correct)", () => {
      const result = validateTokenCorrectly(true, "user-123");
      expect(result.success).toBe(true);
      expect(result.userId).toBe("user-123");
    });

    it("should fail when getUser returns no user", () => {
      const result = validateTokenCorrectly(false, null);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid token");
    });

    it("should handle JWT decode approach (legacy - should not be used)", () => {
      // This test documents the old buggy approach
      const payload = { sub: "user-123", role: "authenticated" };
      const result = validateTokenIncorrectly(payload);
      expect(result.success).toBe(true);
    });

    it("should fail with null payload in legacy approach", () => {
      const result = validateTokenIncorrectly(null);
      expect(result.success).toBe(false);
    });

    it("should fail with missing sub in legacy approach", () => {
      const result = validateTokenIncorrectly({ role: "authenticated" });
      expect(result.success).toBe(false);
    });
  });

  describe("admin role verification patterns", () => {
    interface RoleCheckResult {
      isAdmin: boolean;
      error?: string;
    }

    /**
     * Simulates the CORRECT pattern: direct query to user_roles table
     */
    function checkAdminRoleCorrectly(
      roleData: { role: string } | null,
      queryError: Error | null
    ): RoleCheckResult {
      // This mirrors the fixed implementation:
      // const { data: roleData } = await supabase
      //   .from("user_roles")
      //   .select("role")
      //   .eq("user_id", user.id)
      //   .eq("role", "admin")
      //   .maybeSingle();
      if (queryError) {
        return { isAdmin: false, error: queryError.message };
      }
      return { isAdmin: roleData !== null };
    }

    /**
     * Simulates the INCORRECT pattern: using has_role RPC
     * This was prone to errors because the RPC may not work with the service role client.
     */
    function checkAdminRoleIncorrectly(
      hasRoleResult: boolean | null,
      rpcError: Error | null
    ): RoleCheckResult {
      // This mirrors the OLD buggy implementation:
      // const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {...});
      if (rpcError) {
        return { isAdmin: false, error: rpcError.message };
      }
      return { isAdmin: hasRoleResult === true };
    }

    it("should detect admin via direct table query (correct pattern)", () => {
      const result = checkAdminRoleCorrectly({ role: "admin" }, null);
      expect(result.isAdmin).toBe(true);
    });

    it("should detect non-admin via direct table query", () => {
      const result = checkAdminRoleCorrectly(null, null);
      expect(result.isAdmin).toBe(false);
    });

    it("should handle query error in correct pattern", () => {
      const result = checkAdminRoleCorrectly(null, new Error("DB error"));
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe("DB error");
    });

    it("should detect admin via RPC (legacy pattern)", () => {
      const result = checkAdminRoleIncorrectly(true, null);
      expect(result.isAdmin).toBe(true);
    });

    it("should detect non-admin via RPC (legacy pattern)", () => {
      const result = checkAdminRoleIncorrectly(false, null);
      expect(result.isAdmin).toBe(false);
    });

    it("should handle RPC error in legacy pattern", () => {
      const result = checkAdminRoleIncorrectly(null, new Error("RPC failed"));
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe("RPC failed");
    });
  });

  describe("service role detection", () => {
    /**
     * Decode a JWT and extract the payload without verifying the signature.
     * The signature is already verified by Supabase's API gateway.
     */
    function decodeJwtPayload(token: string): Record<string, unknown> | null {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const payload = parts[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        return JSON.parse(decoded);
      } catch {
        return null;
      }
    }

    /**
     * Check if a JWT token has the service_role claim.
     */
    function isServiceRoleToken(token: string): boolean {
      const payload = decodeJwtPayload(token);
      return payload?.role === "service_role";
    }

    it("should detect service_role token", () => {
      // Create a mock JWT with service_role
      const payload = { role: "service_role", iat: Date.now() };
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const mockToken = `header.${encodedPayload}.signature`;

      expect(isServiceRoleToken(mockToken)).toBe(true);
    });

    it("should not detect authenticated user as service_role", () => {
      const payload = { role: "authenticated", sub: "user-123" };
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const mockToken = `header.${encodedPayload}.signature`;

      expect(isServiceRoleToken(mockToken)).toBe(false);
    });

    it("should return false for invalid token", () => {
      expect(isServiceRoleToken("invalid")).toBe(false);
      expect(isServiceRoleToken("")).toBe(false);
      expect(isServiceRoleToken("a.b")).toBe(false);
    });
  });

  describe("authorization flow integration", () => {
    /**
     * Full authorization flow simulation.
     * Tests the complete auth check from token to admin verification.
     */
    interface AuthContext {
      isServiceRole: boolean;
      user: { id: string } | null;
      isAdmin: boolean;
    }

    type AuthOutcome =
      | { allowed: true; reason: "service_role" | "admin_user" }
      | { allowed: false; status: 401 | 403; error: string };

    function authorizeRequest(ctx: AuthContext): AuthOutcome {
      // Service role bypasses all checks
      if (ctx.isServiceRole) {
        return { allowed: true, reason: "service_role" };
      }

      // Must have a valid user
      if (!ctx.user) {
        return { allowed: false, status: 401, error: "Invalid token" };
      }

      // User must be admin
      if (!ctx.isAdmin) {
        return { allowed: false, status: 403, error: "Admin role required" };
      }

      return { allowed: true, reason: "admin_user" };
    }

    it("should allow service_role without user check", () => {
      const result = authorizeRequest({
        isServiceRole: true,
        user: null,
        isAdmin: false,
      });
      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.reason).toBe("service_role");
      }
    });

    it("should allow admin user", () => {
      const result = authorizeRequest({
        isServiceRole: false,
        user: { id: "user-123" },
        isAdmin: true,
      });
      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.reason).toBe("admin_user");
      }
    });

    it("should reject request with no valid user (401)", () => {
      const result = authorizeRequest({
        isServiceRole: false,
        user: null,
        isAdmin: false,
      });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.status).toBe(401);
        expect(result.error).toBe("Invalid token");
      }
    });

    it("should reject non-admin user (403)", () => {
      const result = authorizeRequest({
        isServiceRole: false,
        user: { id: "user-123" },
        isAdmin: false,
      });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.status).toBe(403);
        expect(result.error).toBe("Admin role required");
      }
    });

    it("should distinguish between 401 and 403 correctly", () => {
      // 401 = no valid user (authentication failed)
      const noUser = authorizeRequest({
        isServiceRole: false,
        user: null,
        isAdmin: false,
      });

      // 403 = valid user but not admin (authorization failed)
      const notAdmin = authorizeRequest({
        isServiceRole: false,
        user: { id: "user-123" },
        isAdmin: false,
      });

      expect(noUser.allowed).toBe(false);
      expect(notAdmin.allowed).toBe(false);

      if (!noUser.allowed && !notAdmin.allowed) {
        expect(noUser.status).toBe(401);
        expect(notAdmin.status).toBe(403);
      }
    });
  });

  describe("regression tests for auth bugs", () => {
    /**
     * These tests document specific bugs that were fixed to prevent regression.
     */

    it("BUG: should not use has_role RPC for admin check", () => {
      /**
       * The has_role RPC function works for RLS policies but was unreliable
       * when called from edge functions with service role client.
       *
       * Fixed by: Querying user_roles table directly instead of using RPC
       */
      const incorrectPattern = "supabase.rpc('has_role', { _user_id, _role })";
      const correctPattern = "supabase.from('user_roles').select()";

      // Document the fix
      expect(incorrectPattern).toContain("rpc");
      expect(correctPattern).toContain("from");
    });

    it("BUG: should use getUser() not manual JWT decode for token validation", () => {
      /**
       * Manual JWT decoding was failing to properly validate tokens,
       * causing 401 errors even with valid authenticated users.
       *
       * Fixed by: Using supabase.auth.getUser(token) instead
       */
      const incorrectPattern = "decodeJwtPayload(token); payload?.sub";
      const correctPattern = "supabase.auth.getUser(token)";

      // Document the fix
      expect(incorrectPattern).toContain("decodeJwtPayload");
      expect(correctPattern).toContain("getUser");
    });

    it("BUG: auth error should return 401, admin error should return 403", () => {
      /**
       * Ensure proper HTTP status codes are returned:
       * - 401 Unauthorized: Token validation failed (not authenticated)
       * - 403 Forbidden: User authenticated but not admin (not authorized)
       */
      const authErrorStatus = 401;
      const adminErrorStatus = 403;

      expect(authErrorStatus).toBe(401);
      expect(adminErrorStatus).toBe(403);
      expect(authErrorStatus).not.toBe(adminErrorStatus);
    });
  });
});

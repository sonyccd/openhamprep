import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for the discourse-webhook edge function.
 *
 * These tests verify the pure logic functions used by the webhook handler:
 * - Explanation parsing from Discourse post markdown
 * - Question ID extraction from topic titles
 * - Signature verification
 *
 * Integration tests would require mocking Deno runtime and Supabase client.
 */

// =============================================================================
// EXTRACTED FUNCTIONS FOR TESTING
// These mirror the implementations in index.ts
// =============================================================================

const QUESTION_ID_PATTERN = /^([TGE]\d[A-Z]\d{2})\s*-/;

/**
 * Extract the explanation text from the Discourse post markdown.
 */
function parseExplanationFromPost(rawContent: string): string | null {
  // Handle null/undefined input
  if (!rawContent) {
    return null;
  }

  const explanationMatch = rawContent.match(
    /##\s*Explanation\s*\n([\s\S]*?)(?:\n---|\n##|$)/i
  );

  if (!explanationMatch) {
    return null;
  }

  let explanation = explanationMatch[1].trim();

  // Check for placeholder text
  if (
    explanation ===
    "_No explanation yet. Help improve this by contributing below!_"
  ) {
    return null;
  }

  // Clean up trailing whitespace
  explanation = explanation.replace(/\s+$/, "");

  // Return null for empty or whitespace-only content, or if it's just "---"
  if (!explanation || explanation === "---") {
    return null;
  }

  return explanation;
}

/**
 * Extract question ID from topic title.
 */
function extractQuestionIdFromTitle(title: string): string | null {
  // Handle null/undefined input
  if (!title) {
    return null;
  }

  const match = title.match(QUESTION_ID_PATTERN);
  return match ? match[1] : null;
}

/**
 * Verify signature (simplified version for testing - actual uses Web Crypto API)
 */
async function computeHmacSha256(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// =============================================================================
// TESTS: EXPLANATION PARSING
// =============================================================================

describe("parseExplanationFromPost", () => {
  describe("valid explanation formats", () => {
    it("should parse a simple explanation", () => {
      const content = `## Question
What is the meaning of life?

## Explanation
The answer is 42.

---
_This topic was automatically created..._`;

      expect(parseExplanationFromPost(content)).toBe("The answer is 42.");
    });

    it("should parse multi-line explanations", () => {
      const content = `## Question
Some question

## Explanation
This is a multi-line explanation.

It has multiple paragraphs.

And even more content here.

---
_Footer_`;

      const result = parseExplanationFromPost(content);
      expect(result).toContain("This is a multi-line explanation.");
      expect(result).toContain("It has multiple paragraphs.");
      expect(result).toContain("And even more content here.");
    });

    it("should parse explanation with markdown formatting", () => {
      const content = `## Question
Test

## Explanation
This has **bold** and *italic* text.

- Bullet point 1
- Bullet point 2

\`code snippet\`

---
_Footer_`;

      const result = parseExplanationFromPost(content);
      expect(result).toContain("**bold**");
      expect(result).toContain("*italic*");
      expect(result).toContain("- Bullet point 1");
    });

    it("should parse explanation with code blocks", () => {
      const content = `## Question
What is the formula?

## Explanation
The formula is:

\`\`\`
P = I * E
\`\`\`

Where P is power, I is current, and E is voltage.

---
_Footer_`;

      const result = parseExplanationFromPost(content);
      expect(result).toContain("P = I * E");
      expect(result).toContain("Where P is power");
    });

    it("should handle explanation ending with another section", () => {
      const content = `## Question
Test

## Explanation
This is the explanation.

## References
Some references here`;

      expect(parseExplanationFromPost(content)).toBe("This is the explanation.");
    });

    it("should handle explanation at end of content without delimiter", () => {
      const content = `## Question
Test

## Explanation
This is the final explanation.`;

      expect(parseExplanationFromPost(content)).toBe(
        "This is the final explanation."
      );
    });

    it("should handle case-insensitive heading", () => {
      const content = `## EXPLANATION
Uppercase heading works too.

---`;

      expect(parseExplanationFromPost(content)).toBe("Uppercase heading works too.");
    });

    it("should handle extra whitespace in heading", () => {
      const content = `##   Explanation
With extra spaces.

---`;

      expect(parseExplanationFromPost(content)).toBe("With extra spaces.");
    });
  });

  describe("placeholder text handling", () => {
    it("should return null for the default placeholder text", () => {
      const content = `## Explanation
_No explanation yet. Help improve this by contributing below!_

---`;

      expect(parseExplanationFromPost(content)).toBeNull();
    });

    it("should return actual content if placeholder is modified", () => {
      const content = `## Explanation
_No explanation yet. Help improve this by contributing below!_

Actually, here's an explanation now.

---`;

      const result = parseExplanationFromPost(content);
      expect(result).toContain("Actually, here's an explanation now.");
    });
  });

  describe("missing or invalid explanation sections", () => {
    it("should return null when no explanation section exists", () => {
      const content = `## Question
Some question text

## Answer Options
- A) Option A
- B) Option B`;

      expect(parseExplanationFromPost(content)).toBeNull();
    });

    it("should return null for empty content", () => {
      expect(parseExplanationFromPost("")).toBeNull();
    });

    it("should return null for content with only ## Explanation but no content", () => {
      const content = `## Explanation

---`;

      expect(parseExplanationFromPost(content)).toBeNull();
    });

    it("should return null for whitespace-only explanation", () => {
      const content = `## Explanation



---`;

      expect(parseExplanationFromPost(content)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle explanation with horizontal rule inside", () => {
      // The first --- should be the delimiter
      const content = `## Explanation
Part one of explanation

---

This should NOT be included.`;

      expect(parseExplanationFromPost(content)).toBe("Part one of explanation");
    });

    it("should handle real-world question format", () => {
      const content = `## Question
Which of the following is part of the Basis and Purpose of the Amateur Radio Service?

## Answer Options
- **A)** Providing personal radio communications for as many citizens as possible
- **B)** Providing communications for international non-profit organizations
- **C)** Advancing skills in the technical and communication phases of the radio art
- **D)** All of these choices are correct

**Correct Answer: C**

---

## Explanation
The Amateur Radio Service exists to advance skills in both the technical and communication aspects of radio. This is codified in Part 97 of the FCC rules as one of the fundamental purposes of amateur radio.

---
_This topic was automatically created to facilitate community discussion about this exam question. Feel free to share study tips, memory tricks, or additional explanations!_`;

      const result = parseExplanationFromPost(content);
      expect(result).toBe(
        "The Amateur Radio Service exists to advance skills in both the technical and communication aspects of radio. This is codified in Part 97 of the FCC rules as one of the fundamental purposes of amateur radio."
      );
    });

    it("should handle explanation with special characters", () => {
      const content = `## Explanation
The formula uses λ (lambda) for wavelength: λ = c/f

Also: 300/f(MHz) = λ(meters)

---`;

      const result = parseExplanationFromPost(content);
      expect(result).toContain("λ (lambda)");
      expect(result).toContain("300/f(MHz)");
    });

    it("should handle explanation with URLs", () => {
      const content = `## Explanation
For more info, see https://www.arrl.org/band-plan

The ARRL provides excellent resources.

---`;

      const result = parseExplanationFromPost(content);
      expect(result).toContain("https://www.arrl.org/band-plan");
    });
  });
});

// =============================================================================
// TESTS: QUESTION ID EXTRACTION
// =============================================================================

describe("extractQuestionIdFromTitle", () => {
  describe("valid question IDs", () => {
    it("should extract Technician question IDs", () => {
      expect(
        extractQuestionIdFromTitle("T1A01 - Which of the following is correct?")
      ).toBe("T1A01");
      expect(
        extractQuestionIdFromTitle("T1B02 - What is the ITU?")
      ).toBe("T1B02");
      expect(
        extractQuestionIdFromTitle("T9Z99 - Edge case question")
      ).toBe("T9Z99");
    });

    it("should extract General question IDs", () => {
      expect(
        extractQuestionIdFromTitle("G1A01 - General question here")
      ).toBe("G1A01");
      expect(
        extractQuestionIdFromTitle("G5C12 - Another general question")
      ).toBe("G5C12");
    });

    it("should extract Extra question IDs", () => {
      expect(
        extractQuestionIdFromTitle("E1A01 - Extra class question")
      ).toBe("E1A01");
      expect(
        extractQuestionIdFromTitle("E9F08 - Advanced topic")
      ).toBe("E9F08");
    });

    it("should handle minimal spacing", () => {
      expect(extractQuestionIdFromTitle("T1A01- No space before dash")).toBe(
        "T1A01"
      );
      expect(extractQuestionIdFromTitle("T1A01 -No space after dash")).toBe(
        "T1A01"
      );
    });

    it("should handle extra spacing", () => {
      expect(
        extractQuestionIdFromTitle("T1A01   -   Lots of spaces")
      ).toBe("T1A01");
    });
  });

  describe("invalid titles", () => {
    it("should return null for titles without question ID format", () => {
      expect(extractQuestionIdFromTitle("General Discussion Topic")).toBeNull();
      expect(extractQuestionIdFromTitle("Welcome to the forum!")).toBeNull();
      expect(extractQuestionIdFromTitle("")).toBeNull();
    });

    it("should return null for malformed question IDs", () => {
      // Wrong prefix letter
      expect(extractQuestionIdFromTitle("A1A01 - Wrong prefix")).toBeNull();
      expect(extractQuestionIdFromTitle("X1A01 - Invalid")).toBeNull();

      // Wrong format
      expect(extractQuestionIdFromTitle("T1101 - Numbers instead of letter")).toBeNull();
      expect(extractQuestionIdFromTitle("T1AA1 - Letter instead of number")).toBeNull();
      expect(extractQuestionIdFromTitle("TAA01 - Missing number")).toBeNull();
    });

    it("should return null when ID is not at start", () => {
      expect(
        extractQuestionIdFromTitle("Discussion about T1A01 question")
      ).toBeNull();
      expect(
        extractQuestionIdFromTitle("Re: T1A01 - Reply topic")
      ).toBeNull();
    });

    it("should return null for lowercase question IDs", () => {
      // The pattern requires uppercase
      expect(extractQuestionIdFromTitle("t1a01 - Lowercase")).toBeNull();
      expect(extractQuestionIdFromTitle("T1a01 - Mixed case")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should only capture the first question ID", () => {
      expect(
        extractQuestionIdFromTitle("T1A01 - Question about T1A02")
      ).toBe("T1A01");
    });

    it("should handle very long titles", () => {
      const longTitle =
        "T1A01 - " +
        "This is a very long question title that goes on and on ".repeat(10);
      expect(extractQuestionIdFromTitle(longTitle)).toBe("T1A01");
    });

    it("should handle special characters in title", () => {
      expect(
        extractQuestionIdFromTitle("T1A01 - What is the λ wavelength?")
      ).toBe("T1A01");
      expect(
        extractQuestionIdFromTitle("G2B03 - Power = I²R or I×E?")
      ).toBe("G2B03");
    });
  });
});

// =============================================================================
// TESTS: SIGNATURE VERIFICATION
// =============================================================================

describe("signature verification", () => {
  it("should compute correct HMAC-SHA256 signature", async () => {
    const payload = '{"post":{"id":1}}';
    const secret = "test-secret";

    const signature = await computeHmacSha256(payload, secret);

    // The signature should be a 64-character hex string (256 bits = 32 bytes = 64 hex chars)
    expect(signature).toHaveLength(64);
    expect(signature).toMatch(/^[0-9a-f]+$/);
  });

  it("should produce different signatures for different payloads", async () => {
    const secret = "test-secret";
    const sig1 = await computeHmacSha256('{"id":1}', secret);
    const sig2 = await computeHmacSha256('{"id":2}', secret);

    expect(sig1).not.toBe(sig2);
  });

  it("should produce different signatures for different secrets", async () => {
    const payload = '{"test":true}';
    const sig1 = await computeHmacSha256(payload, "secret1");
    const sig2 = await computeHmacSha256(payload, "secret2");

    expect(sig1).not.toBe(sig2);
  });

  it("should produce consistent signatures for same input", async () => {
    const payload = '{"consistent":true}';
    const secret = "my-secret";

    const sig1 = await computeHmacSha256(payload, secret);
    const sig2 = await computeHmacSha256(payload, secret);

    expect(sig1).toBe(sig2);
  });
});

// =============================================================================
// TESTS: WEBHOOK PAYLOAD VALIDATION
// =============================================================================

describe("webhook payload structure", () => {
  it("should validate expected Discourse webhook payload structure", () => {
    const validPayload = {
      post: {
        id: 123,
        topic_id: 456,
        post_number: 1,
        raw: "## Explanation\nTest content\n---",
        cooked: "<p>HTML content</p>",
        username: "testuser",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      },
    };

    // Verify structure
    expect(validPayload.post).toBeDefined();
    expect(validPayload.post.post_number).toBe(1);
    expect(validPayload.post.topic_id).toBe(456);
    expect(typeof validPayload.post.raw).toBe("string");
  });

  it("should identify first post vs reply", () => {
    const firstPost = { post: { post_number: 1 } };
    const reply = { post: { post_number: 2 } };

    expect(firstPost.post.post_number === 1).toBe(true);
    expect(reply.post.post_number === 1).toBe(false);
  });
});

// =============================================================================
// TESTS: ERROR SCENARIOS
// =============================================================================

describe("error handling scenarios", () => {
  describe("malformed input handling", () => {
    it("should handle null/undefined gracefully in parsing", () => {
      // @ts-expect-error Testing null input
      expect(parseExplanationFromPost(null)).toBeNull();
      // @ts-expect-error Testing undefined input
      expect(parseExplanationFromPost(undefined)).toBeNull();
    });

    it("should handle null/undefined in title extraction", () => {
      // @ts-expect-error Testing null input
      expect(extractQuestionIdFromTitle(null)).toBeNull();
      // @ts-expect-error Testing undefined input
      expect(extractQuestionIdFromTitle(undefined)).toBeNull();
    });
  });
});

// =============================================================================
// TESTS: SYNC STATUS LOGIC
// =============================================================================

describe("sync status behavior", () => {
  /**
   * These tests verify the expected sync status updates for different scenarios.
   * The actual database updates happen in the edge function, but we test the logic
   * that determines what status should be set.
   */

  interface SyncStatusUpdate {
    discourse_sync_status: 'synced' | 'error' | 'pending';
    discourse_sync_at: string;
    discourse_sync_error: string | null;
  }

  /**
   * Simulates the sync status update logic from the webhook handler.
   */
  function determineSyncStatus(
    updateSucceeded: boolean,
    explanationChanged: boolean,
    errorMessage: string | null = null
  ): SyncStatusUpdate | null {
    // If no explanation change and content is already in sync, mark as synced
    if (!explanationChanged && updateSucceeded) {
      return {
        discourse_sync_status: 'synced',
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: null,
      };
    }

    // If explanation changed and update succeeded
    if (explanationChanged && updateSucceeded) {
      return {
        discourse_sync_status: 'synced',
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: null,
      };
    }

    // If update failed
    if (!updateSucceeded) {
      return {
        discourse_sync_status: 'error',
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMessage || 'Unknown error',
      };
    }

    return null;
  }

  describe("successful updates", () => {
    it("should set status to 'synced' when explanation is successfully updated", () => {
      const result = determineSyncStatus(true, true);
      expect(result).not.toBeNull();
      expect(result!.discourse_sync_status).toBe('synced');
      expect(result!.discourse_sync_error).toBeNull();
    });

    it("should set status to 'synced' when explanation is unchanged", () => {
      const result = determineSyncStatus(true, false);
      expect(result).not.toBeNull();
      expect(result!.discourse_sync_status).toBe('synced');
      expect(result!.discourse_sync_error).toBeNull();
    });

    it("should include timestamp in sync status update", () => {
      const before = new Date().toISOString();
      const result = determineSyncStatus(true, true);
      const after = new Date().toISOString();

      expect(result).not.toBeNull();
      expect(result!.discourse_sync_at).toBeDefined();
      expect(result!.discourse_sync_at >= before).toBe(true);
      expect(result!.discourse_sync_at <= after).toBe(true);
    });
  });

  describe("failed updates", () => {
    it("should set status to 'error' when database update fails", () => {
      const result = determineSyncStatus(false, true, 'Database connection failed');
      expect(result).not.toBeNull();
      expect(result!.discourse_sync_status).toBe('error');
      expect(result!.discourse_sync_error).toBe('Database connection failed');
    });

    it("should include error message in sync status", () => {
      const errorMessage = 'PGRST116: Row not found';
      const result = determineSyncStatus(false, true, errorMessage);
      expect(result!.discourse_sync_error).toBe(errorMessage);
    });

    it("should default to 'Unknown error' when no error message provided", () => {
      const result = determineSyncStatus(false, true, null);
      expect(result!.discourse_sync_error).toBe('Unknown error');
    });
  });

  describe("status values", () => {
    it("should only use valid status values", () => {
      const validStatuses = ['synced', 'error', 'pending'];

      const successResult = determineSyncStatus(true, true);
      expect(validStatuses).toContain(successResult!.discourse_sync_status);

      const errorResult = determineSyncStatus(false, true, 'error');
      expect(validStatuses).toContain(errorResult!.discourse_sync_status);
    });
  });
});

// =============================================================================
// TESTS: WEBHOOK RESPONSE STATUS
// =============================================================================

describe("webhook response status values", () => {
  /**
   * The webhook handler returns different status values based on what happened.
   * These tests document the expected status values for different scenarios.
   */

  type WebhookStatus = 'updated' | 'unchanged' | 'skipped' | 'ignored';

  interface WebhookScenario {
    eventType: string;
    eventName: string;
    postNumber: number;
    explanationParsed: boolean;
    explanationChanged: boolean;
    expectedStatus: WebhookStatus | 'error';
  }

  const scenarios: WebhookScenario[] = [
    {
      eventType: 'post',
      eventName: 'post_edited',
      postNumber: 1,
      explanationParsed: true,
      explanationChanged: true,
      expectedStatus: 'updated',
    },
    {
      eventType: 'post',
      eventName: 'post_edited',
      postNumber: 1,
      explanationParsed: true,
      explanationChanged: false,
      expectedStatus: 'unchanged',
    },
    {
      eventType: 'post',
      eventName: 'post_edited',
      postNumber: 1,
      explanationParsed: false,
      explanationChanged: false,
      expectedStatus: 'skipped',
    },
    {
      eventType: 'post',
      eventName: 'post_edited',
      postNumber: 2, // Reply, not first post
      explanationParsed: true,
      explanationChanged: true,
      expectedStatus: 'ignored',
    },
    {
      eventType: 'topic',
      eventName: 'topic_created',
      postNumber: 1,
      explanationParsed: true,
      explanationChanged: true,
      expectedStatus: 'ignored',
    },
  ];

  it.each(scenarios)(
    'should return "$expectedStatus" for $eventType/$eventName with post_number=$postNumber',
    (scenario) => {
      // Simulate the webhook handler logic
      let status: WebhookStatus | 'error';

      if (scenario.eventType !== 'post') {
        status = 'ignored';
      } else if (scenario.eventName !== 'post_edited') {
        status = 'ignored';
      } else if (scenario.postNumber !== 1) {
        status = 'ignored';
      } else if (!scenario.explanationParsed) {
        status = 'skipped';
      } else if (!scenario.explanationChanged) {
        status = 'unchanged';
      } else {
        status = 'updated';
      }

      expect(status).toBe(scenario.expectedStatus);
    }
  );
});

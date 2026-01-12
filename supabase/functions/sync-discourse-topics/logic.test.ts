// ============================================================
// UNIT TESTS FOR SYNC-DISCOURSE-TOPICS LOGIC
// ============================================================

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import {
  formatTopicBody,
  formatTopicTitle,
  extractQuestionIdFromTitle,
  licenseToPrefix,
  prefixToLicense,
  getCategoryForPrefix,
  clampBatchSize,
  estimateSyncTime,
  calculateRemainingBatches,
  type Question,
} from "./logic.ts";

// ============================================================
// formatTopicBody Tests
// ============================================================

Deno.test("formatTopicBody - formats question with explanation", () => {
  const question: Question = {
    id: "123",
    display_name: "T1A01",
    question: "What is the meaning of life?",
    options: ["42", "43", "44", "45"],
    correct_answer: 0,
    explanation: "The answer is 42 according to Douglas Adams.",
  };

  const body = formatTopicBody(question);

  assertStringIncludes(body, "## Question");
  assertStringIncludes(body, "What is the meaning of life?");
  assertStringIncludes(body, "## Answer Options");
  assertStringIncludes(body, "**A)** 42");
  assertStringIncludes(body, "**B)** 43");
  assertStringIncludes(body, "**Correct Answer: A**");
  assertStringIncludes(body, "## Explanation");
  assertStringIncludes(body, "The answer is 42 according to Douglas Adams.");
});

Deno.test("formatTopicBody - formats question without explanation", () => {
  const question: Question = {
    id: "123",
    display_name: "T1A01",
    question: "What is the meaning of life?",
    options: ["42", "43", "44", "45"],
    correct_answer: 0,
    explanation: null,
  };

  const body = formatTopicBody(question);

  assertStringIncludes(
    body,
    "_No explanation yet. Help improve this by contributing below!_"
  );
});

Deno.test("formatTopicBody - correct answer letter mapping", () => {
  const questionA: Question = {
    id: "1",
    display_name: "T1A01",
    question: "Q",
    options: ["A", "B", "C", "D"],
    correct_answer: 0,
    explanation: null,
  };
  const questionB: Question = { ...questionA, correct_answer: 1 };
  const questionC: Question = { ...questionA, correct_answer: 2 };
  const questionD: Question = { ...questionA, correct_answer: 3 };

  assertStringIncludes(formatTopicBody(questionA), "**Correct Answer: A**");
  assertStringIncludes(formatTopicBody(questionB), "**Correct Answer: B**");
  assertStringIncludes(formatTopicBody(questionC), "**Correct Answer: C**");
  assertStringIncludes(formatTopicBody(questionD), "**Correct Answer: D**");
});

Deno.test("formatTopicBody - includes footer text", () => {
  const question: Question = {
    id: "123",
    display_name: "T1A01",
    question: "Q",
    options: ["A", "B", "C", "D"],
    correct_answer: 0,
    explanation: null,
  };

  const body = formatTopicBody(question);
  assertStringIncludes(body, "This topic was automatically created");
});

// ============================================================
// formatTopicTitle Tests
// ============================================================

Deno.test("formatTopicTitle - formats title correctly", () => {
  assertEquals(
    formatTopicTitle("T1A01", "What is the meaning of life?"),
    "T1A01 - What is the meaning of life?"
  );
});

Deno.test("formatTopicTitle - truncates long titles", () => {
  const longQuestion = "A".repeat(300);
  const title = formatTopicTitle("T1A01", longQuestion);
  assertEquals(title.length, 250);
  assertEquals(title.endsWith("..."), true);
});

Deno.test("formatTopicTitle - preserves short titles", () => {
  const title = formatTopicTitle("T1A01", "Short question");
  assertEquals(title, "T1A01 - Short question");
  assertEquals(title.length < 250, true);
});

// ============================================================
// extractQuestionIdFromTitle Tests
// ============================================================

Deno.test("extractQuestionIdFromTitle - extracts Technician ID", () => {
  assertEquals(
    extractQuestionIdFromTitle("T1A01 - What is the primary purpose of the..."),
    "T1A01"
  );
});

Deno.test("extractQuestionIdFromTitle - extracts General ID", () => {
  assertEquals(
    extractQuestionIdFromTitle("G2B03 - What is the maximum bandwidth..."),
    "G2B03"
  );
});

Deno.test("extractQuestionIdFromTitle - extracts Extra ID", () => {
  assertEquals(
    extractQuestionIdFromTitle("E3C12 - Why is the ionosphere important..."),
    "E3C12"
  );
});

Deno.test("extractQuestionIdFromTitle - returns null for invalid format", () => {
  assertEquals(extractQuestionIdFromTitle("Invalid title format"), null);
  assertEquals(extractQuestionIdFromTitle("A1A01 - Wrong prefix"), null);
});

Deno.test("extractQuestionIdFromTitle - handles extra spaces", () => {
  assertEquals(
    extractQuestionIdFromTitle("T1A01  -  Question with extra spaces"),
    "T1A01"
  );
});

// ============================================================
// licenseToPrefix Tests
// ============================================================

Deno.test("licenseToPrefix - converts technician", () => {
  assertEquals(licenseToPrefix("technician"), "T");
  assertEquals(licenseToPrefix("TECHNICIAN"), "T");
  assertEquals(licenseToPrefix("Technician"), "T");
});

Deno.test("licenseToPrefix - converts general", () => {
  assertEquals(licenseToPrefix("general"), "G");
  assertEquals(licenseToPrefix("GENERAL"), "G");
});

Deno.test("licenseToPrefix - converts extra", () => {
  assertEquals(licenseToPrefix("extra"), "E");
  assertEquals(licenseToPrefix("EXTRA"), "E");
});

Deno.test("licenseToPrefix - returns null for invalid", () => {
  assertEquals(licenseToPrefix("invalid"), null);
  assertEquals(licenseToPrefix("amateur"), null);
});

// ============================================================
// prefixToLicense Tests
// ============================================================

Deno.test("prefixToLicense - converts T to technician", () => {
  assertEquals(prefixToLicense("T"), "technician");
  assertEquals(prefixToLicense("t"), "technician");
});

Deno.test("prefixToLicense - converts G to general", () => {
  assertEquals(prefixToLicense("G"), "general");
});

Deno.test("prefixToLicense - converts E to extra", () => {
  assertEquals(prefixToLicense("E"), "extra");
});

Deno.test("prefixToLicense - returns unknown for invalid", () => {
  assertEquals(prefixToLicense("X"), "unknown");
  assertEquals(prefixToLicense("A"), "unknown");
});

// ============================================================
// getCategoryForPrefix Tests
// ============================================================

Deno.test("getCategoryForPrefix - returns Technician Questions", () => {
  assertEquals(getCategoryForPrefix("T"), "Technician Questions");
  assertEquals(getCategoryForPrefix("t"), "Technician Questions");
});

Deno.test("getCategoryForPrefix - returns General Questions", () => {
  assertEquals(getCategoryForPrefix("G"), "General Questions");
});

Deno.test("getCategoryForPrefix - returns Extra Questions", () => {
  assertEquals(getCategoryForPrefix("E"), "Extra Questions");
});

Deno.test("getCategoryForPrefix - returns null for invalid", () => {
  assertEquals(getCategoryForPrefix("X"), null);
});

// ============================================================
// clampBatchSize Tests
// ============================================================

Deno.test("clampBatchSize - clamps to minimum", () => {
  assertEquals(clampBatchSize(0), 1);
  assertEquals(clampBatchSize(-5), 1);
});

Deno.test("clampBatchSize - clamps to maximum", () => {
  assertEquals(clampBatchSize(150), 100);
  assertEquals(clampBatchSize(1000), 100);
});

Deno.test("clampBatchSize - preserves valid values", () => {
  assertEquals(clampBatchSize(50), 50);
  assertEquals(clampBatchSize(1), 1);
  assertEquals(clampBatchSize(100), 100);
});

Deno.test("clampBatchSize - respects custom min/max", () => {
  assertEquals(clampBatchSize(5, 10, 50), 10);
  assertEquals(clampBatchSize(100, 10, 50), 50);
  assertEquals(clampBatchSize(25, 10, 50), 25);
});

// ============================================================
// estimateSyncTime Tests
// ============================================================

Deno.test("estimateSyncTime - singular minute", () => {
  assertEquals(estimateSyncTime(30), "~1 minute");
  assertEquals(estimateSyncTime(60), "~1 minute");
});

Deno.test("estimateSyncTime - plural minutes", () => {
  assertEquals(estimateSyncTime(61), "~2 minutes");
  assertEquals(estimateSyncTime(120), "~2 minutes");
  assertEquals(estimateSyncTime(180), "~3 minutes");
});

Deno.test("estimateSyncTime - handles zero", () => {
  assertEquals(estimateSyncTime(0), "~0 minutes");
});

// ============================================================
// calculateRemainingBatches Tests
// ============================================================

Deno.test("calculateRemainingBatches - exact division", () => {
  assertEquals(calculateRemainingBatches(100, 50), 2);
  assertEquals(calculateRemainingBatches(50, 50), 1);
});

Deno.test("calculateRemainingBatches - rounds up", () => {
  assertEquals(calculateRemainingBatches(51, 50), 2);
  assertEquals(calculateRemainingBatches(101, 50), 3);
});

Deno.test("calculateRemainingBatches - handles zero", () => {
  assertEquals(calculateRemainingBatches(0, 50), 0);
});

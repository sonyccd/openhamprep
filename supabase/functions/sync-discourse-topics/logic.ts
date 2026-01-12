/// <reference lib="deno.ns" />

// ============================================================
// PURE LOGIC FOR SYNC-DISCOURSE-TOPICS
// Extracted for testability
// ============================================================

import { MAX_TITLE_LENGTH, CATEGORY_MAP } from "../_shared/constants.ts";

export interface Question {
  id: string;
  display_name: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

/**
 * Format the topic body for a question in Discourse.
 * Returns a markdown-formatted string.
 */
export function formatTopicBody(question: Question): string {
  const letters = ["A", "B", "C", "D"];
  const correctLetter = letters[question.correct_answer];

  const optionsText = question.options
    .map((opt, i) => `- **${letters[i]})** ${opt}`)
    .join("\n");

  const explanationText = question.explanation
    ? question.explanation
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
 * Format and truncate topic title.
 * Discourse has a 255 char limit, we use MAX_TITLE_LENGTH (250) for safety.
 */
export function formatTopicTitle(displayName: string, questionText: string): string {
  let title = `${displayName} - ${questionText}`;
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + "...";
  }
  return title;
}

/**
 * Extract question ID from topic title.
 * Format: "T1A01 - Question text..."
 */
export function extractQuestionIdFromTitle(title: string): string | null {
  const match = title.match(/^([TGE]\d[A-Z]\d{2})\s*-/);
  return match ? match[1] : null;
}

/**
 * Map license name to prefix.
 */
export function licenseToPrefix(
  license: string
): "T" | "G" | "E" | null {
  const licenseMap: Record<string, "T" | "G" | "E"> = {
    technician: "T",
    general: "G",
    extra: "E",
  };
  return licenseMap[license.toLowerCase()] || null;
}

/**
 * Map prefix to license name.
 */
export function prefixToLicense(prefix: string): string {
  const prefixMap: Record<string, string> = {
    T: "technician",
    G: "general",
    E: "extra",
  };
  return prefixMap[prefix.toUpperCase()] || "unknown";
}

/**
 * Get category name from question prefix.
 */
export function getCategoryForPrefix(prefix: string): string | null {
  return CATEGORY_MAP[prefix.toUpperCase()] || null;
}

/**
 * Clamp batch size to valid range.
 */
export function clampBatchSize(
  batchSize: number,
  min: number = 1,
  max: number = 100
): number {
  return Math.min(Math.max(min, batchSize), max);
}

/**
 * Calculate estimated time for syncing topics.
 * Assumes approximately 1 second per topic.
 */
export function estimateSyncTime(topicCount: number): string {
  const seconds = topicCount;
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

/**
 * Calculate how many batches remain after processing a batch.
 */
export function calculateRemainingBatches(
  remainingTopics: number,
  batchSize: number
): number {
  return Math.ceil(remainingTopics / batchSize);
}

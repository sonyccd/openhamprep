import type { VerifyResult } from "@/hooks/useDiscourseSyncStatus";

/** Synced share of a total, as 0–100 for a progress bar; 0 when there is nothing to count. */
export function syncedPercent(synced: number, total: number): number {
  return total > 0 ? (synced / total) * 100 : 0;
}

/** How many problems a verification turned up, across all three kinds. */
export function countDiscrepancies(result: VerifyResult): number {
  const { orphanedInDiscourse, brokenForumUrl, missingStatus } = result.discrepancies;
  return orphanedInDiscourse.length + brokenForumUrl.length + missingStatus.length;
}

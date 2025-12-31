import type { TestType } from "@/types/navigation";

/**
 * Map test type to question ID prefix.
 * Technician questions start with 'T', General with 'G', Extra with 'E'.
 */
export const TEST_TYPE_PREFIX_MAP: Record<TestType, string> = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

/**
 * Get the question ID prefix for a given test type.
 * @param testType - The test type (technician, general, or extra)
 * @returns The single-letter prefix (T, G, or E)
 */
export function getTestTypePrefix(testType: TestType): string {
  return TEST_TYPE_PREFIX_MAP[testType];
}

/**
 * Filter items by test type prefix.
 * Useful for filtering questions or attempts by the current license selection.
 * @param items - Array of items with a property containing the question display name
 * @param testType - The test type to filter by
 * @param getDisplayName - Function to extract the display name from each item
 */
export function filterByTestType<T>(
  items: T[],
  testType: TestType,
  getDisplayName: (item: T) => string | undefined
): T[] {
  const prefix = getTestTypePrefix(testType);
  return items.filter((item) => getDisplayName(item)?.startsWith(prefix));
}

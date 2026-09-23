/** Wraps a CSV field in quotes when it carries a comma, newline or quote of its own. */
export function escapeCSVField(field: string | null | undefined): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

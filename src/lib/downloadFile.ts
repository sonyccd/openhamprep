/**
 * Hands the browser a generated file.
 *
 * The four example downloads across the bulk importers each repeated this
 * blob/anchor/revoke dance verbatim; only the filename, MIME type and body
 * differed.
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

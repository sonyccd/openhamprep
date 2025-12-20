import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates a URL string and returns it only if it uses a safe protocol (http/https).
 * Prevents XSS attacks via javascript: or other dangerous URL schemes.
 */
export function getSafeUrl(urlString: string | null | undefined): string | null {
  if (!urlString) return null;
  try {
    const url = new URL(urlString);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return urlString;
    }
    return null;
  } catch {
    return null;
  }
}

import type { Page } from "@playwright/test";

// Sentry, Amplitude, Pendo and Vercel Analytics all initialise on every page
// load (see App.tsx / main.tsx). In a sandboxed or offline browser their
// network calls fail and land in console.error, which would fail every
// "no console errors" assertion for reasons that have nothing to do with the
// app. Filter that third-party noise, and nothing else — anything from our own
// code still fails the test.
// Deliberately host-specific. An earlier draft also filtered bare
// /net::ERR_/ and /Failed to load resource/, which would have swallowed any
// genuine asset or API failure from our own code and quietly gutted the guard.
// A blocked third-party request names its host in the message, so matching the
// host is enough.
const THIRD_PARTY_NOISE = [
  /sentry/i,
  /amplitude/i,
  /pendo/i,
  /vercel-(insights|analytics)/i,
  /vitals\.vercel/i,
];

const isNoise = (text: string) => THIRD_PARTY_NOISE.some((p) => p.test(text));

/**
 * Starts collecting console and page errors, skipping known third-party noise.
 * Returns the live array — read it after the interactions you care about.
 */
export const collectAppErrors = (page: Page): string[] => {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!isNoise(text)) errors.push(text);
  });

  page.on("pageerror", (err) => {
    if (!isNoise(err.message)) errors.push(err.message);
  });

  return errors;
};

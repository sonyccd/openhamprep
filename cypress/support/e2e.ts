// Cypress E2E Support File
// This file is loaded before every test file

import './commands';

// Prevent Cypress from failing on uncaught exceptions from the app
Cypress.on('uncaught:exception', (err) => {
  // Ignore ResizeObserver errors (common in React apps)
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  // Ignore PostHog errors in tests
  if (err.message.includes('posthog')) {
    return false;
  }
  return true;
});

// Clear localStorage and cookies before each test to ensure clean state
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});

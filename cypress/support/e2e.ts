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

// Create test user before running tests (runs once per spec file)
// This ensures the test user exists without manual setup
before(() => {
  const email = Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');

  cy.log(`Ensuring test user exists: ${email}`);

  // Try to sign up the test user - if they already exist, that's fine
  cy.visit('/auth');
  cy.contains('Sign up').click();

  cy.get('input#displayName').type('Cypress Test User');
  cy.get('input#email').type(email);
  cy.get('input#password').type(password);
  cy.get('input#confirmPassword').type(password);
  cy.get('button[type="submit"]').click();

  // Wait for signup response - either success (email confirmation) or error (user exists)
  // Both outcomes are acceptable for test setup
  cy.wait(2000);

  // Check if we got the "user exists" error or confirmation screen
  cy.get('body').then(($body) => {
    if ($body.text().includes('already exists') || $body.text().includes('already registered')) {
      cy.log('Test user already exists - proceeding with tests');
    } else if ($body.text().includes('Check Your Email')) {
      cy.log('New test user created - email confirmation required');
      cy.log('Note: For local Supabase, email confirmation may be auto-confirmed');
    }
  });

  // Clear state for the actual tests
  cy.clearLocalStorage();
  cy.clearCookies();
});

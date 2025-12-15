/// <reference types="cypress" />

// Custom command declarations
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Login via Supabase Auth UI
       * @param email - User email
       * @param password - User password
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Logout the current user
       */
      logout(): Chainable<void>;

      /**
       * Select a license type (Technician, General, or Extra)
       * @param license - The license type to select
       */
      selectLicense(license: 'Technician' | 'General' | 'Extra'): Chainable<void>;

      /**
       * Wait for the dashboard to fully load
       */
      waitForDashboard(): Chainable<void>;

      /**
       * Get element by data-testid attribute
       * @param testId - The data-testid value
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Login command - uses the auth form
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth');

  // Wait for auth form to load
  cy.get('input[type="email"]').should('be.visible');

  // Fill in credentials
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);

  // Submit form
  cy.get('button[type="submit"]').contains(/sign in/i).click();

  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard');
});

// Logout command
Cypress.Commands.add('logout', () => {
  // Click the Sign Out button in the sidebar
  cy.contains('button', 'Sign Out').click();

  // Confirm sign out in the dialog
  cy.get('[role="alertdialog"]').within(() => {
    cy.contains('button', 'Sign Out').click();
  });

  // Verify redirect to auth page
  cy.url().should('include', '/auth');
});

// Select license command
Cypress.Commands.add('selectLicense', (license: 'Technician' | 'General' | 'Extra') => {
  // Click the license selector (uses data-tour attribute)
  cy.get('[data-tour="license-selector"]').click();

  // Wait for modal and select the license option
  cy.contains('Select License Class').should('be.visible');

  // Map display names to internal names if needed
  const displayName = license === 'Extra' ? 'Amateur Extra' : license;
  cy.contains(displayName).click();

  // Confirm selection
  cy.contains('button', /Change License|No Change/).click();
});

// Wait for dashboard to load
Cypress.Commands.add('waitForDashboard', () => {
  cy.url().should('include', '/dashboard');
  // Wait for the readiness card to load (indicates dashboard content is ready)
  cy.get('[data-tour="dashboard-readiness"]', { timeout: 10000 }).should('be.visible');
});

// Get by data-testid helper
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

export {};

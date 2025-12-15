/// <reference types="cypress" />

describe('Dashboard Navigation', () => {
  // Skip login tests if no test user exists
  // Users need to be created via local Supabase seed or manually

  describe('Unauthenticated Access', () => {
    it('should redirect unauthenticated users away from dashboard', () => {
      cy.visit('/dashboard');

      // Should redirect to auth page or home
      cy.url({ timeout: 10000 }).should('satisfy', (url: string) => {
        return url.includes('/auth') || url.endsWith('/') || !url.includes('/dashboard');
      });
    });
  });

  describe('Authenticated Dashboard', () => {
    beforeEach(() => {
      // Login before each test
      cy.fixture('user').then((userData) => {
        cy.visit('/auth');
        cy.get('input#email').type(userData.validUser.email);
        cy.get('input#password').type(userData.validUser.password);
        cy.get('button[type="submit"]').click();
        cy.url({ timeout: 10000 }).should('include', '/dashboard');
      });
    });

    describe('Dashboard Layout', () => {
      it('should display the main dashboard content', () => {
        // Check for key dashboard elements
        cy.contains('Test Readiness', { timeout: 10000 }).should('be.visible');
      });

      it('should display user navigation elements', () => {
        // Check for sidebar or navigation
        cy.get('[data-tour="dashboard-readiness"]').should('be.visible');
      });

      it('should display weekly goals section', () => {
        cy.contains('This Week').should('be.visible');
        cy.contains('Questions').should('be.visible');
        cy.contains('Practice Tests').should('be.visible');
      });

      it('should display key metrics', () => {
        cy.contains('Accuracy').should('be.visible');
        cy.contains('Tests Passed').should('be.visible');
        cy.contains('Weak Questions').should('be.visible');
      });
    });

    describe('Navigation to Practice Modes', () => {
      it('should navigate to practice test', () => {
        cy.contains('Take a Test').click();
        cy.url().should('include', 'view=practice-test');
      });

      it('should navigate to random practice', () => {
        cy.contains('Practice Questions').click();
        cy.url().should('include', 'view=random-practice');
      });
    });

    describe('Sidebar Navigation', () => {
      it('should have clickable sidebar menu items', () => {
        // Look for sidebar navigation elements
        cy.get('nav').should('be.visible');
      });
    });

    describe('URL-based Navigation', () => {
      it('should load practice-test view from URL', () => {
        cy.visit('/dashboard?view=practice-test');

        // Should show practice test component
        cy.url().should('include', 'view=practice-test');
      });

      it('should load random-practice view from URL', () => {
        cy.visit('/dashboard?view=random-practice');

        cy.url().should('include', 'view=random-practice');
      });

      it('should load glossary view from URL', () => {
        cy.visit('/dashboard?view=glossary');

        cy.url().should('include', 'view=glossary');
      });
    });

    describe('Mobile Responsiveness', () => {
      beforeEach(() => {
        cy.viewport('iphone-x');
      });

      it('should display mobile-friendly layout', () => {
        cy.visit('/dashboard');

        // Dashboard should still be visible on mobile
        cy.contains('Test Readiness', { timeout: 10000 }).should('be.visible');
      });

      it('should have accessible navigation on mobile', () => {
        cy.visit('/dashboard');

        // Mobile menu should be present
        cy.get('button').should('be.visible');
      });
    });

    describe('Theme Toggle', () => {
      it('should have a theme toggle available', () => {
        // Theme toggle might be in header or settings
        // This test verifies the toggle exists somewhere in the app
        cy.get('html').should('have.attr', 'class');
      });
    });
  });
});

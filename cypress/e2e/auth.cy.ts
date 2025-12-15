/// <reference types="cypress" />

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/auth');
  });

  describe('Auth Page Display', () => {
    it('should display the login form by default', () => {
      cy.contains('Sign in to track your progress').should('be.visible');
      cy.get('input#email').should('be.visible');
      cy.get('input#password').should('be.visible');
      cy.get('button[type="submit"]').contains('Sign In').should('be.visible');
    });

    it('should display the app name and logo', () => {
      cy.contains('Open Ham Prep').should('be.visible');
    });

    it('should have a link to switch to sign up', () => {
      cy.contains("Don't have an account?").should('be.visible');
      cy.contains('Sign up').should('be.visible');
    });
  });

  describe('Sign Up Flow', () => {
    beforeEach(() => {
      // Switch to sign up form
      cy.contains('Sign up').click();
    });

    it('should display the sign up form', () => {
      cy.contains('Create an account to get started').should('be.visible');
      cy.get('input#displayName').should('be.visible');
      cy.get('input#email').should('be.visible');
      cy.get('input#password').should('be.visible');
      cy.get('input#confirmPassword').should('be.visible');
      cy.get('button[type="submit"]').contains('Create Account').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('input#email').type('invalid-email');
      cy.get('input#password').type('password123');
      cy.get('input#confirmPassword').type('password123');
      cy.get('button[type="submit"]').click();

      cy.contains('Please enter a valid email address').should('be.visible');
    });

    it('should validate password length', () => {
      cy.get('input#email').type('test@example.com');
      cy.get('input#password').type('short');
      cy.get('input#confirmPassword').type('short');
      cy.get('button[type="submit"]').click();

      cy.contains('Password must be at least 6 characters').should('be.visible');
    });

    it('should validate password confirmation', () => {
      cy.get('input#email').type('test@example.com');
      cy.get('input#password').type('password123');
      cy.get('input#confirmPassword').type('different123');
      cy.get('button[type="submit"]').click();

      cy.contains('Passwords do not match').should('be.visible');
    });

    it('should show email confirmation screen after successful signup', () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      cy.get('input#displayName').type('Test User');
      cy.get('input#email').type(uniqueEmail);
      cy.get('input#password').type('password123');
      cy.get('input#confirmPassword').type('password123');
      cy.get('button[type="submit"]').click();

      // Should show email confirmation screen
      cy.contains('Check Your Email', { timeout: 10000 }).should('be.visible');
      cy.contains(uniqueEmail).should('be.visible');
    });
  });

  describe('Sign In Flow', () => {
    it('should validate email format', () => {
      cy.get('input#email').type('invalid-email');
      cy.get('input#password').type('password123');
      cy.get('button[type="submit"]').click();

      cy.contains('Please enter a valid email address').should('be.visible');
    });

    it('should validate password length', () => {
      cy.get('input#email').type('test@example.com');
      cy.get('input#password').type('short');
      cy.get('button[type="submit"]').click();

      cy.contains('Password must be at least 6 characters').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input#email').type('nonexistent@example.com');
      cy.get('input#password').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible');
    });

    it('should successfully sign in with valid credentials', () => {
      // This test requires a valid user in the local Supabase
      // Credentials are configured via CYPRESS_TEST_USER_EMAIL and CYPRESS_TEST_USER_PASSWORD env vars
      // or use defaults for local development (test@example.com / testpassword123)
      const email = Cypress.env('TEST_USER_EMAIL');
      const password = Cypress.env('TEST_USER_PASSWORD');

      cy.get('input#email').type(email);
      cy.get('input#password').type(password);
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard on success
      cy.url({ timeout: 10000 }).should('include', '/dashboard');
    });
  });

  describe('Forgot Password Flow', () => {
    it('should navigate to forgot password form', () => {
      cy.contains('Forgot password?').click();
      cy.contains('Reset Password').should('be.visible');
      cy.contains("Enter your email address and we'll send you a link").should('be.visible');
    });

    it('should validate email on forgot password form', () => {
      cy.contains('Forgot password?').click();
      cy.get('input#resetEmail').type('invalid-email');
      cy.get('button[type="submit"]').contains('Send Reset Link').click();

      cy.contains('Please enter a valid email address').should('be.visible');
    });

    it('should show confirmation after sending reset link', () => {
      cy.contains('Forgot password?').click();
      cy.get('input#resetEmail').type('test@example.com');
      cy.get('button[type="submit"]').contains('Send Reset Link').click();

      // Should show confirmation screen
      cy.contains('Check Your Email', { timeout: 10000 }).should('be.visible');
      cy.contains("We've sent a password reset link").should('be.visible');
    });

    it('should navigate back to sign in from forgot password', () => {
      cy.contains('Forgot password?').click();
      cy.contains('Back to Sign In').click();
      cy.contains('Sign in to track your progress').should('be.visible');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility on sign in form', () => {
      cy.get('input#password').should('have.attr', 'type', 'password');

      // Click the eye icon to show password
      cy.get('input#password').parent().find('button').click();
      cy.get('input#password').should('have.attr', 'type', 'text');

      // Click again to hide password
      cy.get('input#password').parent().find('button').click();
      cy.get('input#password').should('have.attr', 'type', 'password');
    });

    it('should toggle password visibility on sign up form', () => {
      cy.contains('Sign up').click();

      cy.get('input#password').should('have.attr', 'type', 'password');
      cy.get('input#confirmPassword').should('have.attr', 'type', 'password');

      // Toggle main password
      cy.get('input#password').parent().find('button').click();
      cy.get('input#password').should('have.attr', 'type', 'text');

      // Toggle confirm password
      cy.get('input#confirmPassword').parent().find('button').click();
      cy.get('input#confirmPassword').should('have.attr', 'type', 'text');
    });
  });

  describe('Google Sign In', () => {
    it('should display Google sign in button', () => {
      cy.contains('Continue with Google').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to auth when accessing dashboard unauthenticated', () => {
      cy.visit('/dashboard');

      // Should redirect to auth page (or stay on index which redirects)
      cy.url({ timeout: 10000 }).should('satisfy', (url: string) => {
        return url.includes('/auth') || url.endsWith('/');
      });
    });
  });
});

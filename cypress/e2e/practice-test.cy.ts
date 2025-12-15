/// <reference types="cypress" />

describe('Practice Test Flow', () => {
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

  describe('Practice Test Start Screen', () => {
    beforeEach(() => {
      cy.visit('/dashboard?view=practice-test');
    });

    it('should display the start screen', () => {
      cy.contains('Ready to Begin?', { timeout: 10000 }).should('be.visible');
    });

    it('should show test information', () => {
      cy.contains('Questions').should('be.visible');
      cy.contains('To Pass').should('be.visible');
      cy.contains('Correct Needed').should('be.visible');
    });

    it('should display warning about progress not being saved', () => {
      cy.contains('Progress will not be saved').should('be.visible');
    });

    it('should have a start test button', () => {
      cy.contains('button', 'Start Test').should('be.visible');
    });
  });

  describe('Taking a Practice Test', () => {
    beforeEach(() => {
      cy.visit('/dashboard?view=practice-test');
      cy.contains('Ready to Begin?', { timeout: 10000 }).should('be.visible');
      cy.contains('button', 'Start Test').click();
    });

    it('should show the first question after starting', () => {
      // Wait for questions to load
      cy.contains('answered', { timeout: 10000 }).should('be.visible');
    });

    it('should display question progress', () => {
      cy.contains('Progress').should('be.visible');
      cy.contains('answered').should('be.visible');
    });

    it('should display navigation buttons', () => {
      cy.contains('button', 'Previous').should('be.visible');
      cy.contains('button', 'Next').should('be.visible');
    });

    it('should allow selecting an answer', () => {
      // Wait for question card to load
      cy.get('button').contains(/^[A-D]\./).should('be.visible');

      // Click on an answer option
      cy.get('button').contains(/^A\./).click();

      // Progress should update to 1 answered
      cy.contains('1 /').should('be.visible');
    });

    it('should navigate to next question', () => {
      // Select an answer first
      cy.get('button').contains(/^[A-D]\./).first().click();

      // Click next
      cy.contains('button', 'Next').click();

      // Should now show question 2
      cy.get('button').contains('2').should('have.class', 'bg-primary');
    });

    it('should navigate to previous question', () => {
      // Go to next question
      cy.contains('button', 'Next').click();

      // Go back
      cy.contains('button', 'Previous').click();

      // Should be back at question 1
      cy.get('button').contains('1').should('have.class', 'bg-primary');
    });

    it('should allow direct question navigation via number buttons', () => {
      // Click on question 3 in the navigator (if viewport is large enough)
      cy.viewport(1280, 720);
      cy.get('button').contains('3').click();

      // Should now be on question 3
      cy.get('button').contains('3').should('have.class', 'bg-primary');
    });

    it('should have timer toggle', () => {
      cy.contains('Exam Timer').should('be.visible');
      cy.get('#timer-toggle').should('be.visible');
    });

    it('should show timer when enabled', () => {
      // Toggle timer on
      cy.get('#timer-toggle').click();

      // Timer should be visible
      cy.contains(':').should('be.visible'); // Time format contains :
    });
  });

  describe('Completing a Practice Test', () => {
    beforeEach(() => {
      cy.visit('/dashboard?view=practice-test');
      cy.contains('Ready to Begin?', { timeout: 10000 }).should('be.visible');
      cy.contains('button', 'Start Test').click();
      cy.contains('answered', { timeout: 10000 }).should('be.visible');
    });

    it('should show finish button on last question', () => {
      // Navigate to the last question by clicking numbers (simplified - go to a few)
      // For a full test, you'd iterate through all questions
      cy.viewport(1280, 720);

      // Get the total number of questions from the progress indicator
      cy.contains('answered').invoke('text').then((text) => {
        const match = text.match(/(\d+) \/ (\d+)/);
        if (match) {
          const total = parseInt(match[2]);
          // Click on the last question number
          cy.get('button').contains(`${total}`).click();

          // Should show Finish Test button
          cy.contains('button', 'Finish Test').should('be.visible');
        }
      });
    });

    it('should show warning for unanswered questions', () => {
      cy.viewport(1280, 720);

      // Navigate to last question without answering any
      cy.contains('answered').invoke('text').then((text) => {
        const match = text.match(/(\d+) \/ (\d+)/);
        if (match) {
          const total = parseInt(match[2]);
          cy.get('button').contains(`${total}`).click();

          // Should show unanswered warning
          cy.contains('unanswered question').should('be.visible');
        }
      });
    });

    it('should submit test and show results', () => {
      // Answer a few questions quickly
      cy.get('button').contains(/^A\./).click();
      cy.contains('button', 'Next').click();

      cy.get('button').contains(/^B\./).click();
      cy.contains('button', 'Next').click();

      cy.get('button').contains(/^C\./).click();

      // Go to last question
      cy.viewport(1280, 720);
      cy.contains('answered').invoke('text').then((text) => {
        const match = text.match(/(\d+) \/ (\d+)/);
        if (match) {
          const total = parseInt(match[2]);
          cy.get('button').contains(`${total}`).click();

          // Click finish
          cy.contains('button', 'Finish Test').click();

          // Should show results
          cy.contains('Test Complete', { timeout: 10000 }).should('be.visible');
        }
      });
    });
  });

  describe('Test Results', () => {
    // This test requires completing a full test first
    // We'll use a simplified version that just checks the results page structure

    it('should display results after completing test', () => {
      cy.visit('/dashboard?view=practice-test');
      cy.contains('Ready to Begin?', { timeout: 10000 }).should('be.visible');
      cy.contains('button', 'Start Test').click();
      cy.contains('answered', { timeout: 10000 }).should('be.visible');

      // Answer first question and go to last to finish quickly
      cy.get('button').contains(/^A\./).click();

      cy.viewport(1280, 720);
      cy.contains('answered').invoke('text').then((text) => {
        const match = text.match(/(\d+) \/ (\d+)/);
        if (match) {
          const total = parseInt(match[2]);
          cy.get('button').contains(`${total}`).click();
          cy.contains('button', 'Finish Test').click();

          // Check results elements
          cy.contains('Test Complete', { timeout: 10000 }).should('be.visible');
          cy.contains('%').should('be.visible'); // Score percentage
        }
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      cy.visit('/dashboard?view=practice-test');
      cy.contains('Ready to Begin?', { timeout: 10000 }).should('be.visible');
      cy.contains('button', 'Start Test').click();
      cy.contains('answered', { timeout: 10000 }).should('be.visible');
    });

    it('should select answer A with keyboard', () => {
      cy.get('body').type('a');

      // Answer should be selected (progress should update)
      cy.contains('1 /').should('be.visible');
    });

    it('should navigate with arrow keys', () => {
      cy.get('body').type('{rightarrow}');

      // Should be on question 2
      cy.get('button').contains('2').should('have.class', 'bg-primary');
    });
  });
});

import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'qg52b7',
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      // Test user credentials - set via CYPRESS_TEST_USER_EMAIL and CYPRESS_TEST_USER_PASSWORD env vars
      // or use defaults for local development
      TEST_USER_EMAIL: process.env.CYPRESS_TEST_USER_EMAIL || 'test@example.com',
      TEST_USER_PASSWORD: process.env.CYPRESS_TEST_USER_PASSWORD || 'testpassword123',
    },
  },
});

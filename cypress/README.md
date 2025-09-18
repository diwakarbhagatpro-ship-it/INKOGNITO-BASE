# Cypress E2E Testing

This directory contains end-to-end tests using Cypress for the Inkognito application.

## Test Files

- `home.cy.js`: Tests for the home page functionality
- `tts.cy.js`: Tests for the Text-to-Speech component

## Running Tests

You can run the Cypress tests using the following npm scripts:

```bash
# Open Cypress Test Runner UI
npm run cypress:open

# Run tests headlessly in the terminal
npm run cypress:run

# Run E2E tests as part of the test suite
npm run test:e2e
```

## Configuration

The Cypress configuration is in `cypress.config.js` at the root of the project. The base URL is set to `http://localhost:5000`, which is the development server URL.

## Writing New Tests

To create a new test file:

1. Create a new file in the `cypress/e2e` directory with the `.cy.js` extension
2. Use the Cypress API to write your tests
3. Follow the pattern in the existing test files

## Best Practices

- Use `beforeEach` to set up the test environment
- Keep tests independent of each other
- Use meaningful assertions
- Test user flows, not implementation details
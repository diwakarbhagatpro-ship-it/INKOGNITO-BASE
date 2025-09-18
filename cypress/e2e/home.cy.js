describe('Home Page', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('http://localhost:5000');
  });

  it('should load the home page successfully', () => {
    // Check if the page has loaded
    cy.contains('h1', 'Inkognito').should('be.visible');
  });

  it('should have navigation elements', () => {
    // Check for navigation elements
    cy.get('nav').should('exist');
  });

  it('should have a footer', () => {
    // Check for footer
    cy.get('footer').should('exist');
  });
});
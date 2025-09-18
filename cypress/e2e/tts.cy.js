describe('TTS Component', () => {
  beforeEach(() => {
    // Visit the page with TTS component
    cy.visit('http://localhost:5000');
  });

  it('should have a TTS input field', () => {
    // Look for text input field
    cy.get('input[type="text"]').should('exist');
  });

  it('should have a speak button', () => {
    // Look for speak button
    cy.contains('button', 'Speak').should('exist');
  });

  it('should allow text input', () => {
    // Type text in the input field
    const testText = 'Hello, this is a test';
    cy.get('input[type="text"]').type(testText).should('have.value', testText);
  });
});
describe('signup test', () => {
  before(() => {
    cy.visit('/signup').wait(3000);
  });

  beforeEach(() => {
    cy.intercept('/webapi/countries', {
      body: {
        result: [{ code: 'CT', name: 'Country' }],
      },
    });
  });

  it('show introduction page', () => {
    cy.contains('Important Note').should('be.visible');
    cy.get('[data-cy=next-button]').should('be.visible');
    cy.get('[data-cy=next-button]').should('be.enabled');
    cy.get('[data-cy=next-button]').click();
  });

  it('show account form', () => {
    cy.get('input#username').first().as('usernameInput');
    cy.get('input#email').first().as('emailInput');
    cy.get('input#password').first().as('passwordInput');
    cy.get('input#password-confirmation').first().as('confirmPasswordInput');
    cy.get('button[data-cy=next-button]').first().as('nextButton');

    cy.get('@usernameInput').should('exist');
    cy.get('@emailInput').should('exist');
    cy.get('@passwordInput').should('exist');
    cy.get('@confirmPasswordInput').should('exist');
    cy.get('@nextButton').should('be.disabled');

    cy.get('@usernameInput').type('username');
    cy.get('@emailInput').type('email@gmail.com');
    cy.get('@passwordInput').type('p455w0rD');
    cy.get('@confirmPasswordInput').type('p455w0rD');
    cy.get('@nextButton').should('be.enabled');
    cy.get('@nextButton').click();
  });

  it('show customer information form', () => {
    cy.get('input#first-name').first().as('firstNameInput');
    cy.get('input#last-name').first().as('lastNameInput');
    cy.get('input#company-name').first().as('companyNameInput');
    cy.get('input#vat-id').first().as('vatIdInput');
    cy.get('button[data-cy=next-button]').first().as('nextButton');

    cy.get('@firstNameInput').should('exist');
    cy.get('@lastNameInput').should('exist');
    cy.get('@companyNameInput').should('exist');
    cy.get('@vatIdInput').should('exist');
    cy.get('@nextButton').should('be.disabled');

    cy.get('@firstNameInput').type('First');
    cy.get('@lastNameInput').type('Last');
    cy.get('@nextButton').click();
  });

  it('show address form', () => {
    cy.get('input#address-1').first().as('address1Input');
    cy.get('input#address-2').first().as('address2Input');
    cy.get('input#city').first().as('cityInput');
    cy.get('input#postal').first().as('postalInput');
    cy.get('#country input').first().as('countryInput');
    cy.get('div#signup-captcha').first().as('captcha');
    cy.get('input#tos').first().as('tosInput');
    cy.get('button')
      .contains('button', 'Create Account')
      .first()
      .as('submitButton');
    cy.get('button[data-cy=submit-button]').first().as('submitButton');

    cy.get('@address1Input').should('exist');
    cy.get('@address2Input').should('exist');
    cy.get('@cityInput').should('exist');
    cy.get('@postalInput').should('exist');
    cy.get('@countryInput').should('exist');
    cy.get('@captcha').should('exist');
    cy.get('@tosInput').should('exist');
    cy.get('@submitButton').should('be.disabled');

    cy.get('@address1Input').type('Address first line');
    cy.get('@address2Input').type('Address second line');
    cy.get('@cityInput').type('City');
    cy.get('@postalInput').type('11703');
    cy.get('@tosInput').click();
  });

  it('checks signup postal input field for valid inputs!', () => {
    cy.get('input#postal').first().as('postalInput');
    cy.get('@postalInput').type('12345');
    cy.get('[data-cy=postal] .details .text-rui-error').should('not.exist');
    cy.get('@postalInput').clear().type('ABC-40');
    cy.get('[data-cy=postal] .details .text-rui-error').should('not.exist');
    cy.get('@postalInput').clear().type('ABC-40 224');
    cy.get('[data-cy=postal] .details .text-rui-error').should('not.exist');
    cy.get('@postalInput').clear().type('12@345');
    cy.get('[data-cy=postal] .details .text-rui-error')
      .first()
      .as('postalError');
    cy.get('@postalInput').clear().type('12#345');
    cy.get('@postalError').should('exist');
    cy.get('@postalInput').clear().type('.');
    cy.get('@postalError').should('exist');
    cy.get('@postalInput').clear().type('105102');
    cy.get('#postal .details .text-rui-error').should('not.exist');
  });
});

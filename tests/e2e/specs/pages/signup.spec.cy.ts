describe('Signup test', () => {
  it('successfully loads', () => {
    cy.visit('/signup').wait(3000);
  });

  it('show introduction page', () => {
    cy.contains('Important Note');
    cy.get('[data-cy=next-button]').click();
  });

  it('show account form', () => {
    cy.get('input#username').first().as('usernameInput');
    cy.get('input#email').first().as('emailInput');
    cy.get('input#github').first().as('githubInput');
    cy.get('input#password').first().as('passwordInput');
    cy.get('input#password-confirmation').first().as('confirmPasswordInput');
    cy.get('button[data-cy=next-button]').first().as('nextButton');

    expect(cy.get('@usernameInput')).to.exist;
    expect(cy.get('@emailInput')).to.exist;
    expect(cy.get('@passwordInput')).to.exist;
    expect(cy.get('@confirmPasswordInput')).to.exist;
    expect(cy.get('@nextButton').should('be.disabled'));

    cy.get('@usernameInput').type('username');
    cy.get('@emailInput').type('email@gmail.com');
    cy.get('@passwordInput').type('p455w0rD');
    cy.get('@confirmPasswordInput').type('p455w0rD');
    expect(cy.get('@nextButton').should('be.enabled'));
    cy.get('@nextButton').click();
  });

  it('show customer information form', () => {
    cy.get('input#first-name').first().as('firstNameInput');
    cy.get('input#last-name').first().as('lastNameInput');
    cy.get('input#company-name').first().as('companyNameInput');
    cy.get('input#vat-id').first().as('vatIdInput');
    cy.get('button[data-cy=next-button]').first().as('nextButton');

    expect(cy.get('@firstNameInput')).to.exist;
    expect(cy.get('@lastNameInput')).to.exist;
    expect(cy.get('@companyNameInput')).to.exist;
    expect(cy.get('@vatIdInput')).to.exist;
    expect(cy.get('@nextButton').should('be.disabled'));

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

    expect(cy.get('@address1Input')).to.exist;
    expect(cy.get('@address2Input')).to.exist;
    expect(cy.get('@cityInput')).to.exist;
    expect(cy.get('@postalInput')).to.exist;
    expect(cy.get('@countryInput')).to.exist;
    expect(cy.get('@captcha')).to.exist;
    expect(cy.get('@tosInput')).to.exist;
    expect(cy.get('@submitButton').should('be.disabled'));

    cy.get('@address1Input').type('Address first line');
    cy.get('@address2Input').type('Address second line');
    cy.get('@cityInput').type('City');
    cy.get('@postalInput').type('11703');
    cy.get('@tosInput').click();
  });

  it('checks signup postal input field for valid inputs!', () => {
    cy.get('input#postal').first().as('postalInput');
    cy.get('@postalInput').type('12345');
    cy.get('#postal .details .text-rui-error').should('not.exist');
    cy.get('@postalInput').clear().type('ABC-40');
    cy.get('#postal .details .text-rui-error').should('not.exist');
    cy.get('@postalInput').clear().type('ABC-40 224');
    cy.get('#postal .details .text-rui-error').should('not.exist');
    cy.get('@postalInput').clear().type('12@345');
    cy.get('#postal .details .text-rui-error').first().as('postalError');
    expect(cy.get('@postalError')).to.exist;
    cy.get('@postalInput').clear().type('12#345');
    expect(cy.get('@postalError')).to.exist;
    cy.get('@postalInput').clear().type('.');
    expect(cy.get('@postalError')).to.exist;
    cy.get('@postalInput').clear().type('105102');
    cy.get('#postal .details .text-rui-error').should('not.exist');
  });
});

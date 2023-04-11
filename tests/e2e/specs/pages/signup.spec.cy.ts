describe('Signup test', () => {
  it('successfully loads', () => {
    cy.visit('/signup').wait(3000);
  });

  it('checks input fields and submit button!', () => {
    cy.get('input#username').first().as('usernameInput');
    cy.get('input#email').first().as('emailInput');
    cy.get('input#github').first().as('githubInput');
    cy.get('input#password').first().as('passwordInput');
    cy.get('input#password-confirmation').first().as('confirmPasswordInput');
    cy.get('input#first-name').first().as('firstNameInput');
    cy.get('input#last-name').first().as('lastNameInput');
    cy.get('input#company-name').first().as('companyNameInput');
    cy.get('input#vat-id').first().as('vatIdInput');
    cy.get('input#address-1').first().as('address1Input');
    cy.get('input#address-2').first().as('address2Input');
    cy.get('input#city').first().as('cityInput');
    cy.get('input#postal').first().as('postalInput');
    cy.get('input#country').first().as('countryInput');
    cy.get('div#signup-captcha').first().as('captcha');
    cy.get('input#tos').first().as('tosInput');
    cy.get('button')
      .contains('button', 'Create Account')
      .first()
      .as('submitButton');

    expect(cy.get('@usernameInput')).to.exist;
    expect(cy.get('@emailInput')).to.exist;
    expect(cy.get('@passwordInput')).to.exist;
    expect(cy.get('@confirmPasswordInput')).to.exist;
    expect(cy.get('@firstNameInput')).to.exist;
    expect(cy.get('@lastNameInput')).to.exist;
    expect(cy.get('@companyNameInput')).to.exist;
    expect(cy.get('@vatIdInput')).to.exist;
    expect(cy.get('@address1Input')).to.exist;
    expect(cy.get('@address2Input')).to.exist;
    expect(cy.get('@cityInput')).to.exist;
    expect(cy.get('@postalInput')).to.exist;
    expect(cy.get('@countryInput')).to.exist;
    expect(cy.get('@captcha')).to.exist;
    expect(cy.get('@tosInput')).to.exist;
    expect(cy.get('@submitButton')).to.exist;
  });

  it('checks signup postal input field for valid inputs!', () => {
    cy.get('input#postal').first().as('postalInput');
    cy.get('@postalInput').type('12345');
    cy.get('span#postal-error').should('not.exist');
    cy.get('@postalInput').clear().type('ABC-40');
    cy.get('span#postal-error').should('not.exist');
    cy.get('@postalInput').clear().type('ABC-40 224');
    cy.get('span#postal-error').should('not.exist');

    cy.get('@postalInput').clear().type('12@345');
    cy.get('span#postal-error').first().as('postalError');
    expect(cy.get('@postalError')).to.exist;
    cy.get('@postalInput').clear().type('12#345');
    expect(cy.get('@postalError')).to.exist;
    cy.get('@postalInput').clear().type('.');
    expect(cy.get('@postalError')).to.exist;
    cy.get('@postalInput').clear().type('105102');
    cy.get('span#postal-error').should('not.exist');
  });
});

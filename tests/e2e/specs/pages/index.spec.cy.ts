describe('Homepage test', () => {
  it('successfully loads', () => {
    cy.visit('/').wait(3000);
  });

  it('checks our dashboard hero buttons!', () => {
    cy.get('button')
      .contains('button', 'Start now for free')
      .first()
      .should('be.visible');

    cy.get('button')
      .contains('button', 'Get Premium')
      .first()
      .should('be.visible');
  });

  it('checks our dashboard app download links!', () => {
    cy.get('button').contains('Start now for free').first().click();

    cy.url().should('include', '/download');

    cy.get('div').contains('h6', 'Download rotki').first().should('be.visible');

    cy.get('div')
      .contains(
        'h3',
        'Download now and start using across all major Operating Systems',
      )
      .first()
      .should('be.visible');

    cy.get('h6').contains('LINUX').first().as('linuxLink');
    cy.get('h6').contains('MAC apple silicon').first().as('appleSiliconLink');
    cy.get('h6').contains('MAC intel').first().as('appleIntelLink');
    cy.get('h6').contains('WINDOWS').first().as('windowsLink');

    cy.get('@linuxLink').should('exist');
    cy.get('@appleSiliconLink').should('exist');
    cy.get('@appleIntelLink').should('exist');
    cy.get('@windowsLink').should('exist');
    cy.get('p').contains('Latest Release: v').first().should('exist');

    cy.get('@linuxLink')
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button')
      .as('linuxButton');

    cy.get('@linuxButton').should('exist');

    cy.get('@linuxButton')
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-linux')
      .and('include', '.AppImage');

    cy.get('@appleSiliconLink')
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button')
      .as('appleSiliconButton');

    cy.get('@appleSiliconButton').should('exist');
    cy.get('@appleSiliconButton')
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-darwin_arm')
      .and('include', '.dmg');

    cy.get('@appleIntelLink')
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button')
      .as('appleIntelButton');

    cy.get('@appleIntelButton');
    cy.get('@appleIntelButton')
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-darwin_x')
      .and('include', '.dmg');

    cy.get('@windowsLink')
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button')
      .as('windowsButton');

    cy.get('@windowsButton').should('exist');
    cy.get('@windowsButton')
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-win32')
      .and('include', '.exe');
  });
});

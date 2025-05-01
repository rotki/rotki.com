describe('homepage', () => {
  it('successfully loads', () => {
    cy.visit('/').wait(3000);
  });

  it('checks our homepage hero buttons!', () => {
    cy.get('button')
      .contains('button', 'Download rotki for free')
      .first()
      .should('be.visible');

    cy.get('button')
      .contains('button', 'Start now for free')
      .first()
      .should('be.visible');

    cy.get('button')
      .contains('button', 'Get Premium')
      .first()
      .should('be.visible');
  });
});

describe('download page', () => {
  it('download page loads properly', () => {
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
  });

  it('show links for mac', () => {
    cy.visit('/download', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        });
      },
    });

    cy.get('[data-cy="main-download-button"]').contains('Download for MAC').should('exist');
  });

  it('show links for linux', () => {
    cy.visit('/download', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        });
      },
    });

    cy.get('[data-cy="main-download-button"]').contains('Download for LINUX').should('exist');
  });

  it('show links for windows', () => {
    cy.visit('/download', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        });
      },
    });

    cy.get('[data-cy="main-download-button"]').contains('Download for WINDOWS').should('exist');
  });

  it('checks all download links!', () => {
    cy.get('[data-cy="show-all-download"]').click();

    cy.get('h6').contains('LINUX').first().as('linuxLink');
    cy.get('h6').contains('MAC').first().as('apple');
    cy.get('h6').contains('WINDOWS').first().as('windowsLink');

    cy.get('@linuxLink').should('exist');
    cy.get('@apple').should('exist');
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

    cy.get('@apple')
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button')
      .as('appleButton');

    cy.get('@appleButton').should('exist');

    cy.get('@appleButton').click();

    cy.get('[role=menu-content]').as('appleMenu');
    cy.get('@appleMenu').should('exist');

    cy.get('a').contains('MAC Apple Silicon').as('appleSiliconLink');
    cy.get('a').contains('MAC Intel').as('appleIntelLink');

    cy.get('@appleSiliconLink')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-darwin_arm')
      .and('include', '.dmg');

    cy.get('@appleIntelLink')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-darwin_x')
      .and('include', '.dmg');

    cy.get('h6').contains('DOCKER').first().as('dockerLink');

    cy.get('@dockerLink').should('exist');

    cy.get('@dockerLink')
      .next()
      .find('input')
      .as('dockerInput');

    cy.get('@dockerInput').should('exist');

    cy.get('@dockerInput')
      .should('have.value', 'docker pull rotki/rotki');
  });
});

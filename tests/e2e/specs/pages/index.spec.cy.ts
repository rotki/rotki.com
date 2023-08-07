describe('Homepage test', () => {
  it('successfully loads', () => {
    cy.visit('/').wait(3000);
  });

  it('checks our dashboard hero buttons!', () => {
    const freeButton = cy
      .get('button')
      .contains('button', 'Start now for free')
      .first();

    const premiumButton = cy
      .get('button')
      .contains('button', 'Get Premium')
      .first();

    expect(freeButton).to.exist;
    expect(premiumButton).to.exist;
  });

  it('checks our dashboard app download links!', () => {
    const freeButton = cy.get('button').contains('Start now for free').first();

    freeButton.click();

    cy.url().should('include', '/download');

    const downloadTitle = cy
      .get('div')
      .contains('h6', 'Download rotki')
      .first();

    const downloadDesc = cy
      .get('div')
      .contains(
        'h3',
        'Download now and start using across all major Operating Systems',
      )
      .first();

    const linuxLink = cy.get('h6').contains('LINUX').first();
    const macSiliconLink = cy.get('h6').contains('MAC apple silicon').first();
    const macIntelLink = cy.get('h6').contains('MAC intel').first();
    const windowsLink = cy.get('h6').contains('WINDOWS').first();
    const version = cy.get('p').contains('Latest Release: v').first();

    expect(downloadTitle).to.exist;
    expect(downloadDesc).to.exist;
    expect(linuxLink).to.exist;
    expect(macSiliconLink).to.exist;
    expect(macIntelLink).to.exist;
    expect(windowsLink).to.exist;
    expect(version).to.exist;

    const linuxButton = linuxLink
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button');

    expect(linuxButton).to.exist;
    linuxButton
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-linux')
      .and('include', '.AppImage');

    const macSiliconButton = macSiliconLink
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button');

    expect(macSiliconButton).to.exist;
    macSiliconButton
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-darwin_arm')
      .and('include', '.dmg');

    const macIntelButton = macIntelLink
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button');

    expect(macIntelButton).to.exist;
    macIntelButton
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-darwin_x')
      .and('include', '.dmg');

    const windowsButton = windowsLink
      .parent()
      .parent()
      .find('div button')
      .contains('Download')
      .parent('button');

    expect(windowsButton).to.exist;
    windowsButton
      .should('be.enabled')
      .parent('a')
      .should('have.attr', 'href')
      .and('include', 'rotki-win32')
      .and('include', '.exe');
  });
});

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
    const freeButton = cy
      .get('button')
      .contains('button', 'Start now for free')
      .first();

    freeButton.click();

    const modalTitle = cy.get('div').contains('div', 'Download Rotki').first();
    const modalDesc = cy
      .get('div')
      .contains(
        'div',
        'You can download Rotki in your computer and start using it for free right now. Binaries available for all major Operating Systems.'
      )
      .first();
    const linuxLink = cy.get('img[src="/img/dl/linux.svg"]').first();
    const macSiliconLink = cy.get('img[src="/img/dl/mac_apple.svg"]').first();
    const macIntelLink = cy.get('img[src="/img/dl/mac.svg"]').first();
    const windowsLink = cy.get('img[src="/img/dl/windows.svg"]').first();

    expect(modalTitle).to.exist;
    expect(modalDesc).to.exist;
    expect(linuxLink).to.exist;
    expect(macSiliconLink).to.exist;
    expect(macIntelLink).to.exist;
    expect(windowsLink).to.exist;
  });
});

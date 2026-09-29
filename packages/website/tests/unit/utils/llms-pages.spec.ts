import { describe, expect, it } from 'vitest';
import { addPagesToLlmsFullTxt, addPagesToLlmsTxt, extractLlmsPage, type LlmsPage, routeForFile } from '~/utils/llms-pages';

function page(head: string): string {
  return `<!DOCTYPE html><html lang="en-US"><head>${head}</head><body></body></html>`;
}

const DOWNLOAD: LlmsPage = { path: '/download', title: 'Download', description: 'Get rotki.' };

describe('llms-pages', () => {
  it('maps generated files to routes', () => {
    expect(routeForFile('index.html')).toBe('/');
    expect(routeForFile('checkout/pay/index.html')).toBe('/checkout/pay');
  });

  it('reads the og:title and description, decoding entities', () => {
    const html = page('<title>Download | rotki</title><meta name="description" content="Tom&#39;s &amp; Jerry&quot;s app"><meta property="og:title" content="Download">');
    expect(extractLlmsPage(html, '/download')).toEqual({
      path: '/download',
      title: 'Download',
      description: 'Tom\'s & Jerry"s app',
    });
  });

  it('falls back to <title> without og:title', () => {
    const html = page('<title>Values | rotki</title><meta content="Our values." name="description">');
    expect(extractLlmsPage(html, '/values')?.title).toBe('Values | rotki');
  });

  it('skips noindex pages, redirect stubs, and pages without a description', () => {
    const description = '<meta name="description" content="x"><meta property="og:title" content="x">';
    expect(extractLlmsPage(page(`${description}<meta name="robots" content="noindex, nofollow">`), '/login')).toBeUndefined();
    expect(extractLlmsPage(page(`<meta http-equiv="refresh" content="0; url=/checkout/pay">`), '/pricing')).toBeUndefined();
    expect(extractLlmsPage(page('<meta property="og:title" content="x">'), '/health')).toBeUndefined();
  });

  it('skips collection detail pages but keeps their hubs', () => {
    const html = page('<meta name="description" content="x"><meta property="og:title" content="x">');
    expect(extractLlmsPage(html, '/integrations/aave')).toBeUndefined();
    expect(extractLlmsPage(html, '/compare/koinly')).toBeUndefined();
    expect(extractLlmsPage(html, '/features/csv-import')).toBeUndefined();
    expect(extractLlmsPage(html, '/integrations')).toBeDefined();
  });

  it('inserts the pages section before the first configured section', () => {
    const llmsTxt = '# rotki\n\n> About.\n\n## Documentation Sets\n\n- [full](x)\n\n## Integrations\n\n- [Aave](y)';
    const home: LlmsPage = { path: '/', title: 'rotki', description: 'Home.' };
    const result = addPagesToLlmsTxt(llmsTxt, [home, DOWNLOAD], 'https://rotki.com/', 'Integrations');
    expect(result).toContain('- [full](x)\n\n## Pages\n\n');
    expect(result).toContain('- [rotki](https://rotki.com): Home.\n- [Download](https://rotki.com/download): Get rotki.\n\n## Integrations\n');
  });

  it('appends the pages section when the anchor section is missing', () => {
    const result = addPagesToLlmsTxt('# rotki\n', [DOWNLOAD], 'https://rotki.com', 'Integrations');
    expect(result.endsWith('- [Download](https://rotki.com/download): Get rotki.\n')).toBe(true);
  });

  it('prepends one document per page to llms-full.txt', () => {
    expect(addPagesToLlmsFullTxt('# Aave\n\nbody', [DOWNLOAD], 'https://rotki.com'))
      .toBe('# Download\n\nURL: https://rotki.com/download\n\nGet rotki.\n\n# Aave\n\nbody');
  });
});

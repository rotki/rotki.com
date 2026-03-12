/**
 * Generates the OG share image for the sponsor/mint page.
 *
 * Usage:
 *   pnpm og:mint                          # uses https://rotki.com
 *   pnpm og:mint -- --base-url http://localhost:3000
 *
 * Requirements:
 *   - Playwright browsers installed (`pnpm exec playwright install chromium`)
 */

import { Buffer } from 'node:buffer';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const { values } = parseArgs({
  options: {
    'base-url': { type: 'string', default: 'https://rotki.com' },
  },
  strict: false,
});

const baseUrl = values['base-url'];
const outputPath = path.resolve(import.meta.dirname, '../public/img/og/mint.png');

async function fetchAsDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? 'image/png';
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

function buildOgHtml(nftSrc: string, logoSrc: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;">
  <div style="
    width: 1200px;
    height: 630px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 48px;
    padding: 48px 64px;
    background: linear-gradient(135deg, #f8f9ff 0%, #eef0ff 50%, #f0f4ff 100%);
    font-family: Roboto, sans-serif;
    box-sizing: border-box;
    overflow: hidden;
  ">
    <div style="flex-shrink: 0;">
      <img src="${nftSrc}" alt="Sponsor NFT" style="
        width: 380px;
        height: 380px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1);
        object-fit: cover;
      " />
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <img src="${logoSrc}" alt="rotki" style="width: 48px; height: 48px;" />
        <span style="font-size: 28px; font-weight: 700; color: #4e46b4;">rotki</span>
      </div>
      <h1 style="
        font-size: 48px;
        font-weight: 800;
        color: #1a1a2e;
        line-height: 1.1;
        margin: 0;
        letter-spacing: -0.5px;
      ">Sponsor the next<br/>rotki release</h1>
      <p style="
        font-size: 22px;
        color: #555;
        line-height: 1.45;
        margin: 0;
        max-width: 460px;
      ">Support open-source, privacy-preserving software by minting exclusive sponsor NFTs. Each tier comes with special perks.</p>
      <div style="display: flex; gap: 14px; margin-top: 12px;">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #cd7f32; color: white; border-radius: 10px; font-size: 17px; font-weight: 700;">\u{1F949} Bronze</div>
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #a8a8a8; color: white; border-radius: 10px; font-size: 17px; font-weight: 700;">\u{1F948} Silver</div>
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #d4a017, #f5c842); color: white; border-radius: 10px; font-size: 17px; font-weight: 700;">\u{1F947} Gold</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function generateOgMint(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });

  // First navigate to the live page to discover image URLs
  await page.goto(`${baseUrl}/sponsor/mint`, { waitUntil: 'networkidle' });

  // Wait for the NFT image to appear (loaded via API call after client hydration)
  await page.waitForSelector('[data-id="nft-image"], img[src*="/api/nft/image"]', { state: 'attached', timeout: 30_000 });

  // Select the Gold tier to ensure we capture the gold artwork
  const goldCard = page.locator('.tier-option', { hasText: 'GOLD' });
  await goldCard.click();
  // Wait for the image to update after tier change
  await page.waitForTimeout(2000);

  const { nftUrl, logoUrl }: { nftUrl: string; logoUrl: string } = await page.evaluate(`(() => {
    const nftImg = document.querySelector('[data-id="nft-image"]') || document.querySelector('img[src*="/api/nft/image"]');
    const logoImg = document.querySelector('img[src*="app_logo"]');
    return {
      nftUrl: nftImg ? nftImg.src : '',
      logoUrl: logoImg ? logoImg.src : '',
    };
  })()`);

  console.log('Fetching images...');
  console.log(`  NFT:  ${nftUrl.slice(0, 80)}...`);
  console.log(`  Logo: ${logoUrl.slice(0, 80)}...`);

  // Fetch images server-side to avoid cross-origin / tainted canvas issues
  const [nftDataUri, logoDataUri] = await Promise.all([
    fetchAsDataUri(nftUrl),
    fetchAsDataUri(logoUrl),
  ]);

  // Render the OG layout with embedded data URI images
  const html = buildOgHtml(nftDataUri, logoDataUri);
  await page.setContent(html, { waitUntil: 'networkidle' });

  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`OG image saved to ${outputPath}`);

  await browser.close();
}

await generateOgMint();

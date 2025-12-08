import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, normalize, relative } from 'node:path';
import process from 'node:process';
import { applyCardPaymentAssetSecurityHeaders, applyCardPaymentHtmlSecurityHeaders } from '#shared/utils/card-payment-security';

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || '';

  const normalizedPath = normalize(path).replace(/^(\\.\\.[/\\])+/, '');
  const baseDir = join(process.cwd(), 'public', 'checkout', 'pay', 'card');
  let filePath: string;

  if (normalizedPath === '') {
    filePath = join(baseDir, 'index.html');
  }
  else {
    filePath = join(baseDir, normalizedPath);
  }

  const relativePath = relative(baseDir, filePath);
  if (relativePath.startsWith('..') || relativePath.includes('..')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied',
    });
  }

  if (!existsSync(filePath)) {
    const indexPath = join(baseDir, 'index.html');
    if (existsSync(indexPath)) {
      try {
        const html = await readFile(indexPath, 'utf-8');
        setHeader(event, 'content-type', 'text/html; charset=utf-8');

        // Apply full security headers for HTML documents (SPA fallback)
        applyCardPaymentHtmlSecurityHeaders(event);

        return html;
      }
      catch (error) {
        console.error('Card payment SPA index.html not found:', error);
      }
    }

    throw createError({
      statusCode: 404,
      statusMessage: 'Card payment page not found',
    });
  }

  if (path.endsWith('.css')) {
    setHeader(event, 'content-type', 'text/css');
  }
  else if (path.endsWith('.js')) {
    setHeader(event, 'content-type', 'application/javascript');
  }
  else if (path.endsWith('.png')) {
    setHeader(event, 'content-type', 'image/png');
  }
  else if (path.endsWith('.ico')) {
    setHeader(event, 'content-type', 'image/x-icon');
  }
  else if (path.endsWith('.svg')) {
    setHeader(event, 'content-type', 'image/svg+xml');
  }
  else if (path.endsWith('.woff') || path.endsWith('.woff2')) {
    setHeader(event, 'content-type', 'font/woff');
  }
  else if (path.endsWith('.html')) {
    setHeader(event, 'content-type', 'text/html; charset=utf-8');
  }

  // Apply appropriate security headers based on content type
  if (path.endsWith('.html') || normalizedPath === '') {
    // Full security headers for HTML documents
    applyCardPaymentHtmlSecurityHeaders(event);
  }
  else {
    // Basic security headers for static assets
    applyCardPaymentAssetSecurityHeaders(event);
  }

  // Set cache headers for assets
  if (path.includes('assets/') || /\\.(css|js|png|ico|svg|woff|woff2)$/.test(path)) {
    setHeader(event, 'cache-control', 'public, max-age=604800'); // 1 week
  }

  return sendStream(event, createReadStream(filePath));
});

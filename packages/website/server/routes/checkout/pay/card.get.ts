import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { applyCardPaymentHtmlSecurityHeaders } from '~/utils/card-payment-security';

export default defineEventHandler(async (event) => {
  // Apply security headers and set content type
  applyCardPaymentHtmlSecurityHeaders(event);
  setHeader(event, 'content-type', 'text/html; charset=utf-8');

  const indexPath = join(process.cwd(), 'public', 'checkout', 'pay', 'card', 'index.html');

  try {
    return await readFile(indexPath, 'utf-8');
  }
  catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'Card payment page not found',
    });
  }
});

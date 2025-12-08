import { useLogger } from '#shared/utils/use-logger';
import { z } from 'zod';

// Known false positive patterns to filter out
const KNOWN_FALSE_POSITIVES = [
  // Browser prefetch/preconnect
  /^https?:\/\/[\d.a-z-]+\/(favicon\.ico|apple-touch-icon|robots\.txt)$/i,
  // Common CDN eval/inline issues that are often false positives
  /eval|unsafe-eval|unsafe-inline/i,
  // Data URIs that are commonly blocked but safe
  /^data:image\/(svg\+xml|png|jpeg|gif|webp);base64/i,
];

// Suspicious patterns that might indicate malicious reports
const SUSPICIOUS_PATTERNS = [
  // Multiple encoded layers that might hide payloads
  /%25%25|%2525/,
  // SQL injection attempts in URIs
  /(union|select|insert|update|delete|drop)\s+(from|into|table)/i,
  // Script injection attempts
  /<script[^>]*>|javascript:|on\w+\s*=/i,
];

// Define schema for CSP violation report validation
// Based on CSP Level 3 specification: https://w3c.github.io/webappsec-csp/
const cspViolationReportSchema = z.object({
  'csp-report': z.object({
    'blocked-uri': z.string().optional(),
    'column-number': z.number().int().positive().optional(),
    // document-uri can be special values like 'about', 'data:', 'blob:', or actual URLs
    'document-uri': z.string().refine((uri) => {
      // Allow special URI schemes and actual URLs
      if (!uri)
        return false;

      // Special cases that are valid in CSP reports
      const specialSchemes = ['about', 'data:', 'blob:', 'javascript:', 'inline'];
      if (specialSchemes.some(scheme => uri.startsWith(scheme))) {
        return true;
      }

      // Try to validate as URL for regular cases
      try {
        // eslint-disable-next-line no-new
        new URL(uri);
        return true;
      }
      catch {
        // If not a valid URL, still accept if it's a reasonable string
        return uri.length > 0 && uri.length < 2048;
      }
    }, 'Invalid document URI format'),
    'effective-directive': z.string().optional(),
    'line-number': z.number().int().positive().optional(),
    'original-policy': z.string().min(1, 'Original policy is required'),
    'referrer': z.string().optional(),
    'script-sample': z.string().optional(),
    'source-file': z.string().optional(),
    'status-code': z.number().int().optional(),
    'violated-directive': z.string().min(1, 'Violated directive is required'),
  }),
});

function serialize<T>(object: T, isDev: boolean): string {
  return isDev ? JSON.stringify(object, null, 2) : JSON.stringify(object);
}

export default defineEventHandler(async (event) => {
  const logger = useLogger('csp.violation');
  const { public: { isDev } } = useRuntimeConfig();

  // Only accept POST requests
  assertMethod(event, 'POST');

  // Get client IP for logging
  const clientIP = getRequestIP(event, { xForwardedFor: true });

  // Check request size limit (8KB max)
  const contentLength = getHeader(event, 'content-length');
  const maxSize = 8 * 1024; // 8KB

  if (contentLength && Number.parseInt(contentLength) > maxSize) {
    logger.warn(`CSP violation report rejected: size ${contentLength} exceeds limit of ${maxSize} bytes`);
    throw createError({
      statusCode: 413,
      statusMessage: 'Request body too large',
    });
  }

  // Parse request body
  const body = await readBody(event);
  const parseResult = cspViolationReportSchema.safeParse(body);

  if (!parseResult.success) {
    logger.error(`Invalid CSP violation report format: ${serialize({
      errors: parseResult.error.errors,
      receivedBody: body,
    }, isDev)}`);

    // Return 400 for malformed reports
    throw createError({
      data: parseResult.error.errors,
      statusCode: 400,
      statusMessage: 'Invalid CSP violation report format',
    });
  }

  const report = parseResult.data['csp-report'];

  // Check for suspicious patterns that might indicate malicious reports
  const allReportValues = JSON.stringify(report);
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(allReportValues)) {
      logger.warn(`Suspicious CSP report pattern detected from ${clientIP}`);
      return {
        message: 'Report filtered due to suspicious content',
        status: 'filtered',
        reason: 'suspicious-pattern',
      };
    }
  }

  // Filter out browser extension violations
  const sourceFile = report['source-file'];
  const blockedUri = report['blocked-uri'];

  // Check browser extensions
  if (sourceFile?.match(/^(moz|chrome|safari|edge|webkit)-extension(:|$)/) ||
    blockedUri?.match(/^(moz|chrome|safari|edge|webkit)-extension(:|$)/)) {
    logger.debug('CSP violation from browser extension filtered out');
    return {
      message: 'Browser extension violation filtered out',
      status: 'ignored',
      reason: 'browser-extension',
    };
  }

  // Filter known false positives
  if (blockedUri) {
    for (const pattern of KNOWN_FALSE_POSITIVES) {
      if (pattern.test(blockedUri)) {
        logger.debug(`Known false positive filtered: ${blockedUri}`);
        return {
          message: 'Known false positive filtered',
          status: 'ignored',
          reason: 'false-positive',
        };
      }
    }
  }

  // Filter out inline/eval violations from localhost (common in development)
  if (report['document-uri']?.includes('localhost') &&
    (blockedUri === 'inline' || blockedUri === 'eval')) {
    logger.debug('Localhost inline/eval violation filtered');
    return {
      message: 'Localhost development violation filtered',
      status: 'ignored',
      reason: 'localhost-development',
    };
  }

  // Filter out violations from automated tools/bots
  const userAgent = getHeader(event, 'user-agent') || '';
  const botPatterns = /bot|crawler|spider|scraper|headless|puppeteer|playwright/i;
  if (botPatterns.test(userAgent)) {
    logger.debug('CSP violation from bot/crawler filtered');
    return {
      message: 'Bot/crawler violation filtered',
      status: 'ignored',
      reason: 'bot-traffic',
    };
  }

  // Sanitize and truncate fields to prevent log injection
  const sanitizeField = (field: string | undefined, maxLength = 500): string | undefined => {
    if (!field)
      return field;
    // Remove control characters and limit length
    // eslint-disable-next-line no-control-regex
    return field.replace(/[\u0000-\u001F\u007F]/g, '').substring(0, maxLength);
  };

  const logEntry = {
    blockedUri: sanitizeField(report['blocked-uri']),
    clientIP,
    columnNumber: report['column-number'],
    documentUri: sanitizeField(report['document-uri']),
    effectiveDirective: sanitizeField(report['effective-directive'], 100),
    lineNumber: report['line-number'],
    originalPolicy: sanitizeField(report['original-policy'], 1200),
    referrer: sanitizeField(report.referrer),
    scriptSample: sanitizeField(report['script-sample'], 100),
    sourceFile: sanitizeField(report['source-file']),
    statusCode: report['status-code'],
    timestamp: new Date().toISOString(),
    userAgent: sanitizeField(userAgent, 200),
    violatedDirective: sanitizeField(report['violated-directive'], 100),
  };

  logger.error(`CSP Violation detected ${serialize(logEntry, isDev)}`);

  const violationType = report['violated-directive']?.split(' ')[0] || 'unknown';
  const blockedResource = sanitizeField(report['blocked-uri'], 100) || 'inline';
  const documentUri = sanitizeField(report['document-uri'], 100) || 'unknown';

  logger.warn(`CSP ${violationType} violation: ${blockedResource} blocked on ${documentUri}`);

  return {
    message: 'CSP violation report received and logged',
    success: true,
  };
});

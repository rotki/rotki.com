import { z } from 'zod';
import { useLogger } from '~/utils/use-logger';

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

export default defineEventHandler(async (event) => {
  const logger = useLogger('csp.violation');

  // Only accept POST requests
  assertMethod(event, 'POST');

  // Parse request body
  const body = await readBody(event);

  // Validate the CSP violation report using safeParse
  const parseResult = cspViolationReportSchema.safeParse(body);

  if (!parseResult.success) {
    logger.error('Invalid CSP violation report format:', {
      errors: parseResult.error.errors,
      receivedBody: body,
    });

    // Return 400 for malformed reports
    throw createError({
      data: parseResult.error.errors,
      statusCode: 400,
      statusMessage: 'Invalid CSP violation report format',
    });
  }

  const report = parseResult.data['csp-report'];

  // Filter out browser extension violations
  const sourceFile = report['source-file'];
  if (sourceFile?.startsWith('moz-extension') ||
    sourceFile?.startsWith('chrome-extension') ||
    sourceFile?.startsWith('safari-extension') ||
    sourceFile?.startsWith('edge-extension')) {
    logger.debug('CSP violation from browser extension filtered out', {
      sourceFile,
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
    });

    return {
      message: 'Browser extension violation filtered out',
      status: 'ignored',
      reason: 'browser-extension',
    };
  }

  // Log the violation with structured data
  logger.error('CSP Violation detected', {
    blockedUri: report['blocked-uri'],
    clientIP: getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown',
    columnNumber: report['column-number'],
    documentUri: report['document-uri'],
    effectiveDirective: report['effective-directive'],
    lineNumber: report['line-number'],
    originalPolicy: report['original-policy'],
    referrer: report.referrer,
    scriptSample: report['script-sample'],
    sourceFile: report['source-file'],
    statusCode: report['status-code'],
    timestamp: new Date().toISOString(),
    userAgent: getHeader(event, 'user-agent'),
    violatedDirective: report['violated-directive'],
  });

  // Log a simplified version for quick scanning
  const violationType = report['violated-directive']?.split(' ')[0] || 'unknown';
  const blockedResource = report['blocked-uri'] || 'inline';

  logger.warn(`CSP ${violationType} violation: ${blockedResource} blocked on ${report['document-uri']}`);

  // Return success response (CSP violations should not cause user-facing errors)
  return {
    message: 'CSP violation report received and logged',
    success: true,
  };
});

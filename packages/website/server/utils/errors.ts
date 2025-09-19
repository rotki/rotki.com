import type { H3Event } from 'h3';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('api-errors');

/**
 * Custom API error class with user-friendly messages
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public details?: any,
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors with proper logging and user-friendly messages
 */
export function handleApiError(event: H3Event, error: any): never {
  const method = event.node.req.method;
  const url = event.node.req.url;
  const message = error.message || 'Unknown error';

  // Log with clear, readable format
  logger.error(`API Error: ${method} ${url} - ${message}`, {
    details: error.details,
    stack: error.stack,
    statusCode: error.statusCode,
  });

  if (error instanceof ApiError) {
    throw createError({
      data: error.details,
      statusCode: error.statusCode,
      statusMessage: error.userMessage,
    });
  }

  // Handle specific error types
  if (error.code === 'INVALID_CID') {
    throw new ApiError(400, 'Invalid NFT identifier provided');
  }

  if (error.code === 'TIMEOUT' || error.name === 'AbortError') {
    throw new ApiError(504, 'Request timed out, please try again');
  }

  if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
    throw new ApiError(503, 'Service temporarily unavailable, please try again later');
  }

  if (error.message?.includes('rate limit')) {
    throw new ApiError(429, 'Too many requests, please slow down');
  }

  // Generic error handling
  throw createError({
    statusCode: 500,
    statusMessage: 'An unexpected error occurred',
  });
}

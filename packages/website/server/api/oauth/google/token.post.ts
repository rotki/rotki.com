import { z } from 'zod';
import { useLogger } from '~/utils/use-logger';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

// Define schema for request validation
const tokenRequestSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  code: z.string().min(1, 'Authorization code is required'),
  redirect_uri: z.string().url('Valid redirect URI is required'),
});

export default defineEventHandler(async (event) => {
  // Get client secret from server runtime config
  const config = useRuntimeConfig();
  const logger = useLogger('oauth.google.token');
  const clientSecret = config.googleClientSecret;

  if (!clientSecret) {
    logger.error('Google client secret is not configured on the server');
    throw createError({
      statusCode: 500,
      statusMessage: 'OAuth configuration error',
    });
  }

  // Parse and validate request body
  const body = await readBody(event);

  try {
    // Validate request body against schema
    const { client_id, code, redirect_uri } = tokenRequestSchema.parse(body);

    // Exchange authorization code for access token
    return await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
      body: new URLSearchParams({
        client_id,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });
  }
  catch (error) {
    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      logger.error('Validation error:', error.errors);
      throw createError({
        data: error.errors,
        statusCode: 400,
        statusMessage: 'Invalid request parameters',
      });
    }

    // Handle other errors
    logger.error('Google OAuth token exchange error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to exchange authorization code for access token',
    });
  }
});

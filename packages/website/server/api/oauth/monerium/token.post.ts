import { removeTrailingSlash } from '#shared/utils/text';
import { useLogger } from '#shared/utils/use-logger';
import { z } from 'zod';

interface MoneriumTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

const tokenRequestSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  code: z.string().min(1, 'Authorization code is required'),
  redirect_uri: z.string().url('Valid redirect URI is required'),
  code_verifier: z.string().min(43, 'Code verifier is required'),
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const logger = useLogger('oauth.monerium.token');
  const moneriumClientSecret = config.moneriumClientSecret;
  const moneriumAuthBaseUrl = config.public.moneriumAuthBaseUrl;

  if (!moneriumClientSecret) {
    logger.error('Monerium client secret is not configured on the server');
    throw createError({
      statusCode: 500,
      statusMessage: 'OAuth configuration error please contact the server administrator',
    });
  }

  const body = await readBody(event);

  const parseResult = tokenRequestSchema.safeParse(body);

  if (!parseResult.success) {
    logger.error('Validation error:', parseResult.error.errors);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request parameters',
      data: parseResult.error.errors,
    });
  }

  try {
    const { client_id, code, redirect_uri, code_verifier } = parseResult.data;
    const payload = new URLSearchParams({
      client_id,
      code,
      redirect_uri,
      code_verifier,
      grant_type: 'authorization_code',
    });

    if (moneriumClientSecret)
      payload.append('client_secret', moneriumClientSecret);

    return await $fetch<MoneriumTokenResponse>(`${removeTrailingSlash(moneriumAuthBaseUrl)}/auth/token`, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }
  catch (error) {
    logger.error('Monerium OAuth token exchange error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to exchange authorization code for access token',
    });
  }
});

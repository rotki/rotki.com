import { z } from 'zod';
import { removeTrailingSlash } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';

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
  const moneriumClientSecret = config.moneriumClientSecret as string | undefined;
  const moneriumAuthBaseUrl = (config.public.moneriumAuthBaseUrl as string | undefined) ?? 'https://api.monerium.dev';

  const body = await readBody(event);

  try {
    const { client_id, code, redirect_uri, code_verifier } = tokenRequestSchema.parse(body);

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
    if (error instanceof z.ZodError) {
      logger.error('Validation error:', error.errors);
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request parameters',
        data: error.errors,
      });
    }

    logger.error('Monerium OAuth token exchange error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to exchange authorization code for access token',
    });
  }
});

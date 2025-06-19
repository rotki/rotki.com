export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { client_id, client_secret, code, redirect_uri } = body;

  if (!code || !redirect_uri || !client_id || !client_secret) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters',
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await $fetch('https://oauth2.googleapis.com/token', {
      body: new URLSearchParams({
        client_id,
        client_secret,
        code,
        grant_type: 'authorization_code',
        redirect_uri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    return tokenResponse;
  }
  catch (error) {
    console.error('Google OAuth token exchange error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to exchange authorization code for access token',
    });
  }
});

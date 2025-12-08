<script setup lang="ts">
import type { OAuthTokenResponse } from '~/types/oauth';
import { get, set } from '@vueuse/shared';
import OAuthPage from '~/components/oauth/OAuthPage.vue';
import { useOAuth } from '~/composables/account/use-oauth';
import { useLogger } from '~/utils/use-logger';

const { t } = useI18n({ useScope: 'global' });

const {
  loading,
  error,
  completed,
  accessToken,
  refreshToken,
  currentMode,
  mode,
  extractAndValidateParams,
  handleAppModeCompletion,
  handleAppModeFailure,
  handleDockerModeCompletion,
  isValidMode,
} = useOAuth('google');

// Set page metadata
useHead({
  title: t('oauth.title'),
});

const {
  public: {
    googleClientId,
  },
} = useRuntimeConfig();

const logger = useLogger();

if (!googleClientId) {
  set(error, t('oauth.errors.client_id_not_configured'));
}

// Google OAuth configuration
const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

function handleGoogleAuth() {
  if (!googleClientId) {
    set(error, t('oauth.errors.client_id_not_configured'));
    return;
  }

  const currentMode = get(mode);
  if (!isValidMode(currentMode)) {
    set(error, t('oauth.errors.invalid_mode'));
    return;
  }

  try {
    set(loading, true);
    set(error, undefined);

    // Generate state parameter for security
    const state = btoa(JSON.stringify({
      mode: get(mode),
      timestamp: Date.now(),
    }));

    // Get current URL origin
    const redirectUri = `${window.location.origin}/oauth/google`;

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.app.created',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    // Redirect to Google OAuth
    window.location.href = `${googleAuthUrl}?${params.toString()}`;
  }
  catch (error_) {
    logger.error('OAuth error:', error_);
    const errorMessage = t('oauth.errors.initiate_flow_failed');
    set(error, errorMessage);
    set(loading, false);

    // If in app mode, notify the application about the failure
    if (currentMode === 'app') {
      handleAppModeFailure(errorMessage);
    }
  }
}

// Exchange code for access token
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  return await $fetch<OAuthTokenResponse>('/api/oauth/google/token', {
    method: 'POST',
    body: {
      code,
      redirect_uri: redirectUri,
      client_id: googleClientId,
    },
  });
}

// Main function to handle OAuth callback
async function handleOAuthCallback() {
  const params = extractAndValidateParams();
  if (!params)
    return;

  const { code, state } = params;

  try {
    // Parse state parameter and set mode
    const stateData = JSON.parse(atob(state));
    const originalMode = stateData.mode;
    set(currentMode, originalMode);

    set(loading, true);

    // Get redirect URI
    const redirectUri = `${window.location.origin}/oauth/google`;

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, redirectUri);

    if (tokenResponse.access_token) {
      if (originalMode === 'app') {
        handleAppModeCompletion(tokenResponse, googleClientId);
      }
      else if (originalMode === 'docker') {
        handleDockerModeCompletion(tokenResponse);
      }
    }
    else {
      set(error, t('oauth.errors.no_access_token'));
    }
  }
  catch (error_) {
    logger.error('Token exchange error:', error_);
    const errorMessage = t('oauth.errors.token_exchange_failed');
    set(error, errorMessage);

    // If in app mode, notify the application about the failure
    if (get(currentMode) === 'app')
      handleAppModeFailure(errorMessage);
  }
  finally {
    set(loading, false);
  }
}

// Handle OAuth callback
onMounted(handleOAuthCallback);
</script>

<template>
  <OAuthPage
    :title="t('oauth.title')"
    :description="t('oauth.description')"
    :button-text="t('oauth.button')"
    :loading="loading"
    :error="error"
    :completed="completed"
    :access-token="accessToken"
    :refresh-token="refreshToken"
    :mode="mode"
    :current-mode="currentMode"
    @auth-click="handleGoogleAuth()"
  >
    <template #button-prepend>
      <svg
        class="size-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 210 210"
      >
        <path
          class="fill-current"
          d="M0,105C0,47.103,47.103,0,105,0c23.383,0,45.515,7.523,64.004,21.756l-24.4,31.696C133.172,44.652,119.477,40,105,40  c-35.841,0-65,29.159-65,65s29.159,65,65,65c28.867,0,53.398-18.913,61.852-45H105V85h105v20c0,57.897-47.103,105-105,105  S0,162.897,0,105z"
        />
      </svg>
    </template>
  </OAuthPage>
</template>

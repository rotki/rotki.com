<script setup lang="ts">
import { get, set } from '@vueuse/core';

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
}

const { t } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();

// Get callback URL from query parameters
const callbackUrl = computed(() => route.query.callbackUrl as string);

// State management
const loading = ref(false);
const error = ref<string | null>(null);
const completed = ref(false);

// Check if required environment variables are available
const googleClientId = config.public.googleClientId;
const googleClientSecret = config.public.googleClientSecret;

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

  if (!get(callbackUrl)) {
    set(error, t('oauth.errors.no_callback_url'));
    return;
  }

  try {
    set(loading, true);
    set(error, null);

    // Generate state parameter for security
    const state = btoa(JSON.stringify({
      callbackUrl: get(callbackUrl),
      timestamp: Date.now(),
    }));

    // Get current URL origin
    const redirectUri = `${window.location.origin}/oauth/google`;

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/calendar',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    // Redirect to Google OAuth
    window.location.href = `${googleAuthUrl}?${params.toString()}`;
  }
  catch (error_) {
    console.error('OAuth error:', error_);
    set(error, t('oauth.errors.initiate_flow_failed'));
    set(loading, false);
  }
}

// Handle OAuth callback
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const errorParam = urlParams.get('error');

  if (errorParam) {
    set(error, t('oauth.errors.oauth_error', { error: errorParam }));
    return;
  }

  if (code && state) {
    try {
      set(loading, true);

      // Parse state parameter
      const stateData = JSON.parse(atob(state));
      const originalCallbackUrl = stateData.callbackUrl;

      // Get redirect URI
      const redirectUri = `${window.location.origin}/oauth/google`;

      // Exchange code for access token
      const tokenResponse = await $fetch<GoogleTokenResponse>('/api/oauth/google/token', {
        method: 'POST',
        body: {
          code,
          redirect_uri: redirectUri,
          client_id: googleClientId,
          client_secret: googleClientSecret,
        },
      });

      if (tokenResponse.access_token) {
        // Redirect to callback URL with access token
        const callbackUrlWithToken = new URL(originalCallbackUrl);
        callbackUrlWithToken.searchParams.set('access_token', tokenResponse.access_token);
        callbackUrlWithToken.searchParams.set('token_type', 'Bearer');

        if (tokenResponse.refresh_token) {
          callbackUrlWithToken.searchParams.set('refresh_token', tokenResponse.refresh_token);
        }

        // Set completed state and show message before redirecting
        set(completed, true);
        set(loading, false);

        // Delay redirect to allow user to see completion message
        setTimeout(() => {
          window.location.href = callbackUrlWithToken.toString();
        }, 2000);
      }
      else {
        throw new Error(t('oauth.errors.no_access_token'));
      }
    }
    catch (error_) {
      console.error('Token exchange error:', error_);
      set(error, t('oauth.errors.token_exchange_failed'));
    }
    finally {
      set(loading, false);
    }
  }
});

// Set page metadata
useHead({
  title: t('oauth.title'),
});

const otherHeight = inject('otherHeight', 0);
</script>

<template>
  <div
    class="container"
    :class="[$style.wrapper]"
  >
    <div class="max-w-md w-full">
      <div class="text-center">
        <h4 class="text-h4 mt-6">
          {{ completed ? t('oauth.completion.title') : t('oauth.title') }}
        </h4>
        <p class="mt-2 text-sm text-rui-text-secondary">
          {{ completed ? t('oauth.completion.description') : t('oauth.description') }}
        </p>
      </div>

      <div class="mt-6">
        <RuiAlert
          v-if="error"
          type="error"
        >
          {{ error }}
        </RuiAlert>

        <RuiAlert
          v-if="completed"
          type="success"
        >
          {{ t('oauth.completion.description') }}
        </RuiAlert>

        <RuiButton
          v-if="!completed"
          color="primary"
          class="w-full"
          size="lg"
          :loading="loading"
          @click="handleGoogleAuth()"
        >
          <template #prepend>
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
          {{ t('oauth.button') }}
        </RuiButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply w-full flex flex-col lg:flex-row gap-10 lg:gap-20 items-center justify-center;
  @apply text-center lg:text-left py-4;
  min-height: calc(100vh - v-bind(otherHeight) * 1px);
}
</style>

<script setup lang="ts">
import type {
  OAuthStateWithStorage,
  OAuthTokenResponse,
} from '~/types/oauth';
import { get, set } from '@vueuse/shared';
import OAuthPage from '~/components/oauth/OAuthPage.vue';
import { useOAuth } from '~/composables/account/use-oauth';
import { usePkce } from '~/composables/account/use-pkce';
import { removeTrailingSlash } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';

const { t } = useI18n({ useScope: 'global' });

const {
  loading,
  error,
  completed,
  accessToken,
  refreshToken,
  expiresIn,
  currentMode,
  mode,
  extractAndValidateParams,
  handleAppModeCompletion,
  handleAppModeFailure,
  handleDockerModeCompletion,
  isValidMode,
} = useOAuth('monerium');

useHead({
  title: t('oauth_monerium.title'),
});

const {
  public: {
    moneriumAuthorizationCodeFlowClientId,
    moneriumAuthBaseUrl,
  },
} = useRuntimeConfig();

const logger = useLogger();

const {
  generateRandomString,
  generateCodeChallenge,
  storeVerifier,
  pullVerifier,
  generateStorageKey,
} = usePkce('rotki-monerium-pkce-');

if (!moneriumAuthorizationCodeFlowClientId)
  set(error, t('oauth_monerium.errors.client_id_not_configured'));

async function handleMoneriumAuth() {
  if (!moneriumAuthorizationCodeFlowClientId) {
    set(error, t('oauth_monerium.errors.client_id_not_configured'));
    return;
  }

  const currentModeValue = get(mode);
  if (!isValidMode(currentModeValue)) {
    set(error, t('oauth_monerium.errors.invalid_mode'));
    return;
  }

  try {
    set(loading, true);
    set(error, undefined);

    const codeVerifier = generateRandomString();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const storageKey = generateStorageKey();
    const statePayload: OAuthStateWithStorage = {
      mode: currentModeValue,
      storageKey,
      timestamp: Date.now(),
    };
    const state = btoa(JSON.stringify(statePayload));

    storeVerifier(storageKey, codeVerifier);

    // Get current URL origin
    const redirectUri = `${window.location.origin}/oauth/monerium`;

    // Build Monerium OAuth URL
    const params = new URLSearchParams({
      client_id: moneriumAuthorizationCodeFlowClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    window.location.href = `${removeTrailingSlash(moneriumAuthBaseUrl)}/auth?${params.toString()}`;
  }
  catch (error_) {
    logger.error('Monerium OAuth error:', error_);
    set(error, t('oauth_monerium.errors.initiate_flow_failed'));
    set(loading, false);

    const currentModeValue = get(mode);
    if (currentModeValue === 'app')
      handleAppModeFailure(t('oauth_monerium.errors.initiate_flow_failed'));
  }
}

function parseState(stateString: string): OAuthStateWithStorage {
  return JSON.parse(atob(stateString)) as OAuthStateWithStorage;
}

async function exchangeCodeForToken(code: string, redirectUri: string, codeVerifier: string): Promise<OAuthTokenResponse> {
  return await $fetch<OAuthTokenResponse>(
    '/api/oauth/monerium/token',
    {
      method: 'POST',
      body: {
        client_id: moneriumAuthorizationCodeFlowClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      },
    },
  );
}

async function handleOAuthCallback() {
  const params = extractAndValidateParams();
  if (!params)
    return;

  const { code, state } = params;

  try {
    const { mode: originalMode, storageKey } = parseState(state);
    set(currentMode, originalMode);

    const codeVerifier = pullVerifier(storageKey);
    if (!codeVerifier)
      throw new Error('missing_code_verifier');

    set(loading, true);
    const redirectUri = `${window.location.origin}/oauth/monerium`;
    const tokenResponse = await exchangeCodeForToken(code, redirectUri, codeVerifier);

    if (tokenResponse.access_token) {
      if (originalMode === 'app') {
        handleAppModeCompletion(tokenResponse, moneriumAuthorizationCodeFlowClientId);
      }
      else {
        handleDockerModeCompletion(tokenResponse);
      }
    }
    else {
      set(error, t('oauth_monerium.errors.no_access_token'));
    }
  }
  catch (error_) {
    logger.error('Monerium token exchange error:', error_);
    const errorMessage = t('oauth_monerium.errors.token_exchange_failed');
    set(error, errorMessage);

    if (get(currentMode) === 'app')
      handleAppModeFailure(errorMessage);
  }
  finally {
    set(loading, false);
  }
}

onMounted(handleOAuthCallback);
</script>

<template>
  <OAuthPage
    :title="t('oauth_monerium.title')"
    :description="t('oauth_monerium.description')"
    :button-text="t('oauth_monerium.button')"
    :loading="loading"
    :error="error"
    :completed="completed"
    :access-token="accessToken"
    :refresh-token="refreshToken"
    :expires-in="expiresIn"
    :mode="mode"
    :current-mode="currentMode"
    show-expires-in
    @auth-click="handleMoneriumAuth()"
  >
    <template #expires-in="{ expiresIn: expiresInSeconds }">
      {{ t('oauth_monerium.expires_in_label', { seconds: expiresInSeconds }) }}
    </template>
  </OAuthPage>
</template>

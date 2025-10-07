<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { removeTrailingSlash } from '~/utils/text';

type OAuthMode = 'app' | 'docker';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();
const {
  public: {
    moneriumClientId,
    moneriumAuthBaseUrl,
  },
} = useRuntimeConfig();
const logger = useLogger();

const mode = computed(() => route.query.mode as OAuthMode);

const loading = ref(false);
const error = ref<string>();
const completed = ref(false);
const accessToken = ref('');
const refreshToken = ref('');
const expiresIn = ref<number>();
const currentMode = ref<OAuthMode>();

const CODE_VERIFIER_KEY_PREFIX = 'rotki-monerium-pkce-';

if (!moneriumClientId)
  set(error, t('oauth_monerium.errors.client_id_not_configured'));

function generateRandomString(length: number = 96): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const charsetLength = charset.length;
  const maxValid = 256 - (256 % charsetLength);
  let output = '';
  const randomValues = new Uint8Array(length * 2); // Get extra bytes for rejection sampling
  crypto.getRandomValues(randomValues);

  let i = 0;
  while (output.length < length && i < randomValues.length) {
    const value = randomValues[i++];
    // Rejection sampling: only use values that don't introduce bias
    if (value < maxValid)
      output += charset[value % charsetLength];
  }

  // If we need more bytes, get them (unlikely but possible)
  while (output.length < length) {
    const extraBytes = new Uint8Array(1);
    crypto.getRandomValues(extraBytes);
    const value = extraBytes[0];
    if (value < maxValid)
      output += charset[value % charsetLength];
  }

  return output;
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function storeVerifier(storageKey: string, verifier: string): void {
  sessionStorage.setItem(storageKey, verifier);
}

function pullVerifier(storageKey: string): string | null {
  const verifier = sessionStorage.getItem(storageKey);
  if (verifier)
    sessionStorage.removeItem(storageKey);
  return verifier;
}

async function handleMoneriumAuth() {
  if (!moneriumClientId) {
    set(error, t('oauth_monerium.errors.client_id_not_configured'));
    return;
  }

  const currentModeValue = get(mode);
  if (!currentModeValue || !['app', 'docker'].includes(currentModeValue)) {
    set(error, t('oauth_monerium.errors.invalid_mode'));
    return;
  }

  try {
    set(loading, true);
    set(error, undefined);

    const codeVerifier = generateRandomString();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const storageKey = `${CODE_VERIFIER_KEY_PREFIX}${crypto.randomUUID?.() ?? Date.now()}`;
    const statePayload = {
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
      client_id: moneriumClientId,
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

function extractAndValidateParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const errorParam = urlParams.get('error');

  if (errorParam) {
    const errorMessage = t('oauth_monerium.errors.oauth_error', { error: errorParam });
    set(error, errorMessage);

    if (state) {
      try {
        const stateData = JSON.parse(atob(state));
        if (stateData.mode === 'app')
          handleAppModeFailure(errorMessage);
      }
      catch (error_) {
        logger.error('Failed to parse Monerium state:', error_);
      }
    }

    return null;
  }

  if (!code || !state)
    return null;

  return { code, state };
}

function parseState(stateString: string) {
  return JSON.parse(atob(stateString)) as { mode: OAuthMode; storageKey: string };
}

async function exchangeCodeForToken(code: string, redirectUri: string, codeVerifier: string) {
  return await $fetch<{ access_token: string; refresh_token?: string; expires_in?: number; token_type?: string }>(
    '/api/oauth/monerium/token',
    {
      method: 'POST',
      body: {
        client_id: moneriumClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      },
    },
  );
}

function handleAppModeCompletion(tokenResponse: { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string }) {
  const callbackUrl = new URL('rotki://oauth/success');
  callbackUrl.searchParams.set('service', 'monerium');
  callbackUrl.searchParams.set('access_token', tokenResponse.access_token);
  callbackUrl.searchParams.set('token_type', tokenResponse.token_type ?? 'Bearer');

  if (tokenResponse.refresh_token)
    callbackUrl.searchParams.set('refresh_token', tokenResponse.refresh_token);

  if (typeof tokenResponse.expires_in === 'number')
    callbackUrl.searchParams.set('expires_in', String(tokenResponse.expires_in));

  if (moneriumClientId)
    callbackUrl.searchParams.set('client_id', moneriumClientId);

  set(completed, true);
  set(loading, false);

  setTimeout(() => {
    logger.info(`Redirecting to: ${callbackUrl}`);
    window.location.href = callbackUrl.toString();
  }, 2000);
}

function handleAppModeFailure(errorMessage?: string) {
  const callbackUrl = new URL('rotki://oauth/failure');
  callbackUrl.searchParams.set('service', 'monerium');

  if (errorMessage)
    callbackUrl.searchParams.set('error', errorMessage);

  setTimeout(() => {
    logger.info(`Redirecting to failure: ${callbackUrl}`);
    window.location.href = callbackUrl.toString();
  }, 2000);
}

function handleDockerModeCompletion(tokenResponse: { access_token: string; refresh_token?: string; expires_in?: number }) {
  set(accessToken, tokenResponse.access_token);
  set(refreshToken, tokenResponse.refresh_token ?? '');
  set(expiresIn, tokenResponse.expires_in);
  set(completed, true);
  set(loading, false);
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
      set(accessToken, tokenResponse.access_token);
      set(refreshToken, tokenResponse.refresh_token);

      if (originalMode === 'app') {
        handleAppModeCompletion(tokenResponse);
      }
      else {
        handleDockerModeCompletion(tokenResponse);
      }
    }
    else {
      throw new Error(t('oauth_monerium.errors.no_access_token'));
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

useHead({
  title: t('oauth_monerium.title'),
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
          {{ completed ? t('oauth.completion.title') : t('oauth_monerium.title') }}
        </h4>
        <p class="mt-2 text-sm text-rui-text-secondary">
          {{ completed ? t('oauth.completion.description') : t('oauth_monerium.description') }}
        </p>
      </div>

      <div class="mt-6 space-y-6">
        <RuiAlert
          v-if="error"
          type="error"
        >
          {{ error }}
        </RuiAlert>

        <RuiAlert
          v-if="completed && (mode === 'app' || currentMode === 'app')"
          type="success"
        >
          {{ t('oauth.completion.description') }}
        </RuiAlert>

        <div
          v-if="completed && (mode === 'docker' || currentMode === 'docker')"
          class="space-y-4"
        >
          <RuiAlert type="success">
            {{ t('oauth.completion.docker_description') }}
          </RuiAlert>

          <RuiTextArea
            v-model="accessToken"
            :label="t('oauth.access_token_label')"
            readonly
            variant="outlined"
            color="primary"
            rows="4"
            @click="($event.target as HTMLTextAreaElement).select()"
          >
            <template #append>
              <CopyButton :model-value="accessToken" />
            </template>
          </RuiTextArea>

          <RuiTextArea
            v-model="refreshToken"
            :label="t('oauth.refresh_token_label')"
            readonly
            variant="outlined"
            color="primary"
            rows="4"
            @click="($event.target as HTMLTextAreaElement).select()"
          >
            <template #append>
              <CopyButton :model-value="refreshToken" />
            </template>
          </RuiTextArea>

          <div
            v-if="expiresIn"
            class="text-sm text-rui-text-secondary"
          >
            {{ t('oauth_monerium.expires_in_label', { seconds: expiresIn }) }}
          </div>
        </div>

        <RuiButton
          v-if="!completed"
          color="primary"
          class="w-full"
          size="lg"
          :loading="loading"
          :disabled="!mode || !['app', 'docker'].includes(mode)"
          @click="handleMoneriumAuth()"
        >
          {{ t('oauth_monerium.button') }}
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

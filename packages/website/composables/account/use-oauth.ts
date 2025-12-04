import type { OAuthCallbackParams, OAuthMode, OAuthService, OAuthTokenResponse } from '~/types/oauth';
import { set } from '@vueuse/shared';
import { OAUTH_CALLBACK_FAILURE, OAUTH_CALLBACK_SUCCESS, OAUTH_DEFAULT_TOKEN_TYPE, OAUTH_REDIRECT_DELAY } from '~/constants/oauth';
import { useLogger } from '~/utils/use-logger';

interface UseOAuthReturn {
  loading: Ref<boolean>;
  error: Ref<string | undefined>;
  completed: Ref<boolean>;
  accessToken: Ref<string>;
  refreshToken: Ref<string>;
  expiresIn: Ref<number | undefined>;
  currentMode: Ref<OAuthMode | undefined>;
  mode: ComputedRef<OAuthMode>;
  extractAndValidateParams: () => (OAuthCallbackParams | undefined);
  handleAppModeCompletion: (tokenResponse: OAuthTokenResponse, clientId: (string | undefined)) => void;
  handleAppModeFailure: (errorMessage: (string | undefined)) => void;
  handleDockerModeCompletion: (tokenResponse: OAuthTokenResponse) => void;
  isValidMode: (mode: (OAuthMode | undefined)) => mode is OAuthMode;
}

/**
 * OAuth composable for handling common OAuth flow logic
 */
export function useOAuth(service: OAuthService): UseOAuthReturn {
  const { t } = useI18n({ useScope: 'global' });
  const logger = useLogger();
  const route = useRoute();

  // State managed by composable
  const loading = ref<boolean>(false);
  const error = ref<string>();
  const completed = ref<boolean>(false);
  const accessToken = ref<string>('');
  const refreshToken = ref<string>('');
  const expiresIn = ref<number>();
  const currentMode = ref<OAuthMode>();
  const mode = computed<OAuthMode>(() => route.query.mode as OAuthMode);

  /**
   * Extract and validate OAuth callback parameters from URL
   */
  function extractAndValidateParams(): OAuthCallbackParams | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      const errorMessage = t('oauth.errors.oauth_error', { error: errorParam });
      set(error, errorMessage);

      if (state) {
        try {
          const stateData = JSON.parse(atob(state));
          if (stateData.mode === 'app')
            handleAppModeFailure(errorMessage);
        }
        catch (error_) {
          logger.error(`Failed to parse ${service} state:`, error_);
        }
      }

      return undefined;
    }

    if (!code || !state)
      return undefined;

    return { code, state };
  }

  /**
   * Handle OAuth completion for app mode
   */
  function handleAppModeCompletion(
    tokenResponse: OAuthTokenResponse,
    clientId: string | undefined,
  ): void {
    const callbackUrl = new URL(OAUTH_CALLBACK_SUCCESS);
    callbackUrl.searchParams.set('service', service);
    callbackUrl.searchParams.set('access_token', tokenResponse.access_token);
    callbackUrl.searchParams.set('token_type', tokenResponse.token_type ?? OAUTH_DEFAULT_TOKEN_TYPE);

    if (tokenResponse.refresh_token)
      callbackUrl.searchParams.set('refresh_token', tokenResponse.refresh_token);

    if (typeof tokenResponse.expires_in === 'number')
      callbackUrl.searchParams.set('expires_in', String(tokenResponse.expires_in));

    if (clientId)
      callbackUrl.searchParams.set('client_id', clientId);

    set(completed, true);
    set(loading, false);

    setTimeout(() => {
      logger.info(`Redirecting to: ${callbackUrl}`);
      window.location.href = callbackUrl.toString();
    }, OAUTH_REDIRECT_DELAY);
  }

  /**
   * Handle OAuth failure for app mode
   */
  function handleAppModeFailure(errorMessage: string | undefined): void {
    const callbackUrl = new URL(OAUTH_CALLBACK_FAILURE);
    callbackUrl.searchParams.set('service', service);

    if (errorMessage)
      callbackUrl.searchParams.set('error', errorMessage);

    setTimeout(() => {
      logger.info(`Redirecting to failure: ${callbackUrl}`);
      window.location.href = callbackUrl.toString();
    }, OAUTH_REDIRECT_DELAY);
  }

  /**
   * Handle OAuth completion for docker mode
   */
  function handleDockerModeCompletion(tokenResponse: OAuthTokenResponse): void {
    set(accessToken, tokenResponse.access_token);
    set(refreshToken, tokenResponse.refresh_token ?? '');
    set(expiresIn, tokenResponse.expires_in);
    set(completed, true);
    set(loading, false);
  }

  /**
   * Validate OAuth mode
   */
  function isValidMode(mode: OAuthMode | undefined): mode is OAuthMode {
    return !!mode && ['app', 'docker'].includes(mode);
  }

  return {
    // State
    loading,
    error,
    completed,
    accessToken,
    refreshToken,
    expiresIn,
    currentMode,
    mode,

    // Methods
    extractAndValidateParams,
    handleAppModeCompletion,
    handleAppModeFailure,
    handleDockerModeCompletion,
    isValidMode,
  };
}

export type OAuthMode = 'app' | 'docker';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface OAuthState {
  mode: OAuthMode;
  timestamp: number;
}

export interface OAuthStateWithStorage extends OAuthState {
  storageKey: string;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
}

export type OAuthService = 'google' | 'monerium';

import { z } from 'zod';

const OAuthModeSchema = z.enum(['app', 'docker']);

export type OAuthMode = z.infer<typeof OAuthModeSchema>;

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Shape of the OAuth `state` payload we round-trip through the provider. It is
 * attacker-controllable by the time it comes back, so it must be validated at
 * the boundary rather than cast — see `parseState` in the monerium page.
 */
export const OAuthStateWithStorageSchema = z.object({
  mode: OAuthModeSchema,
  timestamp: z.number(),
  storageKey: z.string(),
});

export type OAuthStateWithStorage = z.infer<typeof OAuthStateWithStorageSchema>;

export interface OAuthCallbackParams {
  code: string;
  state: string;
}

export type OAuthService = 'google' | 'monerium';

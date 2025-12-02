/**
 * PKCE (Proof Key for Code Exchange) composable
 * Implements OAuth 2.0 PKCE flow for secure authorization
 */
export function usePkce(storageKeyPrefix: string) {
  /**
   * Generates a cryptographically secure random string
   * using rejection sampling to avoid bias
   */
  function generateRandomString(length: number = 96): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const charsetLength = charset.length;
    const maxValid = 256 - (256 % charsetLength);
    let output = '';
    const randomValues = new Uint8Array(length * 2);
    crypto.getRandomValues(randomValues);

    let i = 0;
    while (output.length < length && i < randomValues.length) {
      const value = randomValues[i++];
      if (value !== undefined && value < maxValid)
        output += charset[value % charsetLength];
    }

    while (output.length < length) {
      const extraBytes = new Uint8Array(1);
      crypto.getRandomValues(extraBytes);
      const value = extraBytes[0];
      if (value !== undefined && value < maxValid)
        output += charset[value % charsetLength];
    }

    return output;
  }

  /**
   * Generates code challenge from code verifier using SHA-256
   * Returns base64url encoded string
   */
  async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(digest));
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Stores code verifier in session storage
   */
  function storeVerifier(storageKey: string, verifier: string): void {
    sessionStorage.setItem(storageKey, verifier);
  }

  /**
   * Retrieves and removes code verifier from session storage
   */
  function pullVerifier(storageKey: string): string | undefined {
    const verifier = sessionStorage.getItem(storageKey);
    if (verifier)
      sessionStorage.removeItem(storageKey);
    return verifier ?? undefined;
  }

  /**
   * Generates a unique storage key for the code verifier
   */
  function generateStorageKey(): string {
    return `${storageKeyPrefix}${crypto.randomUUID?.() ?? Date.now()}`;
  }

  return {
    generateCodeChallenge,
    generateRandomString,
    generateStorageKey,
    pullVerifier,
    storeVerifier,
  };
}

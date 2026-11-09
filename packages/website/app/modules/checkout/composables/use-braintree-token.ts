import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';

interface BraintreeClientTokenResponse {
  braintreeClientToken: string;
}

/** Reads a Braintree client token for the signed-in customer. */
export function useBraintreeToken(): { fetchClientToken: () => Promise<string> } {
  const { fetchWithCsrf } = useFetchWithCsrf();

  async function fetchClientToken(): Promise<string> {
    const { braintreeClientToken } = await fetchWithCsrf<BraintreeClientTokenResponse>('/webapi/2/braintree/customer', { method: 'GET' });
    return braintreeClientToken;
  }

  return { fetchClientToken };
}

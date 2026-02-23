import { FetchError } from 'ofetch';

/**
 * Creates a FetchError with the given status code and optional response data.
 * Useful for simulating API error responses in tests.
 */
export function createFetchError(status: number, data?: any): FetchError {
  const error = new FetchError(`Request failed with status ${status}`);
  error.status = status;
  error.statusCode = status;
  error.data = data;
  return error;
}

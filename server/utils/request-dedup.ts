/**
 * Request deduplication to prevent multiple concurrent requests for the same resource
 */

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate requests to prevent multiple concurrent fetches for the same resource
 * @param key Unique key for the request
 * @param fetcher Function that performs the actual fetch
 * @returns Promise that resolves to the fetched data
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Check if request is already in flight
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // Create new request promise
  const promise = fetcher()
    .finally(() => {
      // Clean up after completion
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
}

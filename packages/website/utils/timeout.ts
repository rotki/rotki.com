/**
 * Creates a promise with setTimeout that exposes resolve and reject to the caller
 * @param ms - Timeout duration in milliseconds
 * @param callback - Callback function that receives resolve and reject
 * @returns Promise that can be resolved or rejected by the callback
 */
export async function createTimeoutPromise<T = void>(
  ms: number,
  callback: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      callback(resolve, reject);
    }, ms);
  });
}

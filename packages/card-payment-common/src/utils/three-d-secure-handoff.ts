import { THREE_D_SECURE_SESSION_KEY, type ThreeDSecureParams, ThreeDSecureParamsSchema } from '../schemas/three-d-secure';

/** What the 3D Secure page found: the payment to verify, or why there is none. */
export type ThreeDSecureHandoff =
  | { params: ThreeDSecureParams; problem?: undefined }
  | { params?: undefined; problem: 'missing' }
  | { params?: undefined; problem: 'invalid'; cause: unknown };

/** Hands the payment from the card page to the website's 3D Secure page, a full page load away. */
export function saveThreeDSecureHandoff(params: ThreeDSecureParams): void {
  sessionStorage.setItem(THREE_D_SECURE_SESSION_KEY, JSON.stringify(params));
}

/** Drops the handoff once the payment is done, or the buyer leaves the 3D Secure page. */
export function clearThreeDSecureHandoff(): void {
  sessionStorage.removeItem(THREE_D_SECURE_SESSION_KEY);
}

/** Reads the handoff the card page left. One that does not parse is removed, so a reload starts clean. */
export function readThreeDSecureHandoff(): ThreeDSecureHandoff {
  const stored = sessionStorage.getItem(THREE_D_SECURE_SESSION_KEY);
  if (!stored)
    return { problem: 'missing' };
  try {
    const result = ThreeDSecureParamsSchema.safeParse(JSON.parse(stored));
    if (result.success)
      return { params: result.data };
    clearThreeDSecureHandoff();
    return { cause: result.error, problem: 'invalid' };
  }
  catch (error) {
    clearThreeDSecureHandoff();
    return { cause: error, problem: 'invalid' };
  }
}

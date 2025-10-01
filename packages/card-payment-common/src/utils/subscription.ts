import type { Subscription } from '../schemas/subscription';

export function isSubActive(sub: Subscription) {
  return sub.status === 'Active';
}

export function isSubPending(sub: Subscription) {
  return sub.status === 'Pending';
}

export function isSubRequestingUpgrade(sub: Subscription) {
  return sub.status === 'Upgrade Requested';
}

export function isCancelledButActive(sub: Subscription): boolean {
  return sub.status === 'Cancelled but still active';
}

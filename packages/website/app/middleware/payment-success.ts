import { set } from '@vueuse/shared';
import { type PaymentReceipt, takePaymentReceipt } from '~/modules/checkout/utils/payment-receipt';

/**
 * Client-only middleware to protect payment success pages
 * Only allows access when user has just completed a payment, and hands its receipt to the page
 */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return;
  }

  const receipt = takePaymentReceipt();
  if (!receipt) {
    return navigateTo('/home/subscription');
  }

  set(useState<PaymentReceipt | undefined>('payment-receipt'), receipt);
});

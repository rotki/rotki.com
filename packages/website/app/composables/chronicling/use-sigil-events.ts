import type { PaymentMethod } from '~/types/payment';
import { useUtmTracking } from './use-utm-tracking';

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export interface CheckoutErrorData {
  error_title: string;
  plan_id?: number;
}

export interface CheckoutMethodSelectedData {
  method?: PaymentMethod;
  plan_id?: number;
}

export interface CheckoutStartData {
  plan_id?: number;
  plan_name?: string;
  plan_duration: 'monthly' | 'yearly';
  amount?: string;
  is_upgrade: boolean;
  discount?: 'referral' | 'discount';
}

export interface PricingViewData {
  period: string;
}

export interface PurchaseSuccessData {
  payment_method: 'card' | 'paypal' | 'crypto';
  plan_id: number;
  plan_name?: string;
  plan_duration: 'monthly' | 'yearly';
  revenue?: number;
  currency: 'EUR';
  is_upgrade: boolean;
  discount?: 'referral' | 'discount';
}

export interface DownloadSeePlansClickData {
  source: 'download_page_nudge';
}

export interface SigilEventMap {
  checkout_error: CheckoutErrorData;
  checkout_method_selected: CheckoutMethodSelectedData;
  checkout_start: CheckoutStartData;
  download_see_plans_click: DownloadSeePlansClickData;
  pricing_view: PricingViewData;
  purchase_success: PurchaseSuccessData;
}

export type SigilEvent = keyof SigilEventMap;

export function useSigilEvents() {
  const { getTrackingData } = useUtmTracking();

  function chronicle<T extends SigilEvent>(event: T, data: SigilEventMap[T]): void {
    if (import.meta.server)
      return;

    const tracking = getTrackingData();
    const eventData: Record<string, unknown> = {
      ...data,
      session_id: tracking?.sessionId,
      utm_source: tracking?.utm?.utmSource,
      utm_medium: tracking?.utm?.utmMedium,
      utm_campaign: tracking?.utm?.utmCampaign,
      utm_content: tracking?.utm?.utmContent,
      utm_term: tracking?.utm?.utmTerm,
      referrer: tracking?.utm?.referrer,
      landing_path: tracking?.utm?.landingPath,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(eventData).filter(([_, v]) => v !== undefined),
    );

    window.umami?.track(event, cleanData);
  }

  return { chronicle };
}

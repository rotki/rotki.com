import { type Account, AccountResponseSchema } from '@rotki/card-payment-common/schemas/account';
import { type ActiveCampaign, ActiveCampaignSchema } from '@rotki/card-payment-common/schemas/campaign';
import {
  type AvailablePlansResponse,
  AvailablePlansResponseSchema,
  type PaymentBreakdownRequest,
  type PaymentBreakdownResponse,
  PaymentBreakdownResponseSchema,
  type SelectedPlan,
} from '@rotki/card-payment-common/schemas/plans';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { z } from 'zod';
import { paths } from '@/config/paths';

/** The CSRF token from the `csrftoken` cookie the rotki.com backend sets. */
function readCSRFCookie(): string | undefined {
  const cookie = document.cookie.split(';').find(entry => entry.trim().startsWith('csrftoken='));
  return cookie ? cookie.slice(cookie.indexOf('=') + 1) : undefined;
}

/** Shared by the requests that start together on load, so the token is asked for once. */
let pendingCSRFToken: Promise<string> | undefined;

async function requestCSRFToken(): Promise<string> {
  await fetch(`${paths.hostUrlBase}/webapi/csrf/`, {
    credentials: 'include',
  });
  const token = readCSRFCookie();
  if (!token)
    throw new Error('CSRF token not found in cookies');
  return token;
}

/**
 * The CSRF token, asking the backend only when the cookie is missing. A signed-in visitor
 * already has it from rotki.com, which saves a round trip before the first request.
 */
export async function fetchCSRFToken(): Promise<string> {
  const existing = readCSRFCookie();
  if (existing)
    return existing;

  pendingCSRFToken ??= requestCSRFToken().finally(() => {
    pendingCSRFToken = undefined;
  });
  try {
    return await pendingCSRFToken;
  }
  catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw error;
  }
}

export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await fetchCSRFToken();

  const headers = new Headers(options.headers);
  headers.set('X-CSRFToken', token);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}

export async function getAccount(): Promise<Account | undefined> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/account/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status !== 401) {
        console.error('Failed to fetch account:', response.status);
      }
      return undefined;
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = AccountResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse Account response:', {
        error: parsedResponse.error,
        originalData: data,
        transformedData,
      });
      return undefined;
    }
    return parsedResponse.data.result ?? undefined;
  }
  catch (error: any) {
    console.error('Failed to get account:', error);
    return undefined;
  }
}

const AppConfigSchema = z.object({
  activeCampaign: ActiveCampaignSchema.nullish(),
});

/** Fetches the running sitewide campaign; any failure counts as no campaign so checkout still works. */
export async function getActiveCampaign(): Promise<ActiveCampaign | undefined> {
  try {
    const response = await fetch(`${paths.hostUrlBase}/api/config`);
    if (!response.ok) {
      console.error('Failed to fetch app config:', response.status);
      return undefined;
    }

    const parsed = AppConfigSchema.safeParse(convertKeys(await response.json(), true, false));
    if (!parsed.success) {
      console.error('Failed to parse app config:', parsed.error);
      return undefined;
    }
    return parsed.data.activeCampaign ?? undefined;
  }
  catch (error: any) {
    console.error('Failed to fetch app config:', error);
    return undefined;
  }
}

export async function getPaymentBreakdown(params: PaymentBreakdownRequest): Promise<PaymentBreakdownResponse | null> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/payment/breakdown`, {
      method: 'POST',
      body: JSON.stringify(convertKeys(params, false, false)),
    });

    if (!response.ok) {
      console.error('Failed to fetch payment breakdown:', response.status);
      return null;
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = PaymentBreakdownResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse PaymentBreakdownResponse:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      return null;
    }
    return parsedResponse.data;
  }
  catch (error: any) {
    console.error('Failed to fetch payment breakdown:', error);
    return null;
  }
}

export async function checkout(planId: number): Promise<PaymentBreakdownResponse | null> {
  return getPaymentBreakdown({ newPlanId: planId, isCryptoPayment: false });
}

export async function getAvailablePlans(): Promise<AvailablePlansResponse | null> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/available-tiers`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to fetch available plans:', response.status);
      return null;
    }

    const data = await response.json();
    // Convert snake_case keys to camelCase for schema parsing
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = AvailablePlansResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse AvailablePlansResponse:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      return null;
    }
    return parsedResponse.data;
  }
  catch (error: any) {
    console.error('Failed to get available plans:', error);
    return null;
  }
}

export function findSelectedPlanById(availablePlans: AvailablePlansResponse, planId: number): SelectedPlan | undefined {
  const plans = availablePlans.tiers;

  for (const tier of plans) {
    // Check monthly plan
    if (tier.monthlyPlan?.planId === planId) {
      return {
        planId: tier.monthlyPlan.planId,
        name: tier.tierName,
        price: parseFloat(tier.monthlyPlan.price),
        durationInMonths: 1,
      };
    }

    // Check yearly plan
    if (tier.yearlyPlan?.planId === planId) {
      return {
        planId: tier.yearlyPlan.planId,
        name: tier.tierName,
        price: parseFloat(tier.yearlyPlan.price),
        durationInMonths: 12,
      };
    }
  }

  return undefined;
}

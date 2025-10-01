import {
  type AvailablePlansResponse,
  AvailablePlansResponseSchema,
  type CheckoutData,
  CheckoutResponseSchema,
  type PriceBreakdown,
  PriceBreakdownSchema,
  type SelectedPlan,
  type UpgradeData,
  UpgradeDataSchema,
} from '@rotki/card-payment-common';
import { type Account, AccountResponseSchema } from '@rotki/card-payment-common/schemas/account';
import {
  type AddCardPayload,
  type CreateCardNoncePayload,
  CreateCardNonceResponseSchema,
  type SavedCard,
  SavedCardResponseSchema,
  SavedCardSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { type UserSubscriptions, UserSubscriptionsResponseSchema } from '@rotki/card-payment-common/schemas/subscription';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { paths } from '@/config/paths';

// CSRF Token handling
let csrfToken: string | null = null;

async function fetchCSRFToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    // Get CSRF token from the parent rotki.com domain
    await fetch(`${paths.hostUrlBase}/webapi/csrf/`, {
      credentials: 'include',
    });

    // The CSRF token should now be set in the csrftoken cookie
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));

    if (csrfCookie) {
      csrfToken = csrfCookie.split('=')[1];
      return csrfToken;
    }

    throw new Error('CSRF token not found in cookies');
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

export async function addCard(payload: AddCardPayload): Promise<string> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedCard = SavedCardSchema.safeParse(transformedData);
    if (!parsedCard.success) {
      console.error('Failed to parse SavedCard response:', {
        data,
        error: parsedCard.error,
        transformedData,
      });
      throw new Error('Invalid response format from server');
    }
    return parsedCard.data.token;
  }
  catch (error: any) {
    console.error('Failed to add card:', error);
    throw new Error(error.message || 'Failed to add card');
  }
}

export async function createCardNonce(payload: CreateCardNoncePayload): Promise<string> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/nonce/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = CreateCardNonceResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse CreateCardNonce response:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      throw new Error('Invalid response format from server');
    }
    return parsedResponse.data.paymentNonce;
  }
  catch (error: any) {
    console.error('Failed to create card nonce:', error);
    throw new Error(error.message || 'Failed to create card nonce');
  }
}

export async function deleteCard(token: string): Promise<void> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify({ payment_token: token }),
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  }
  catch (error: any) {
    console.error('Failed to delete card:', error);
    throw new Error(error.message || 'Failed to delete card');
  }
}

export async function getSavedCard(): Promise<SavedCard[]> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = SavedCardResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse SavedCardResponse:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      return [];
    }
    return parsedResponse.data.cards;
  }
  catch (error: any) {
    console.error('Failed to get saved card:', error);
    // Return undefined for no saved card instead of throwing
    return [];
  }
}

// Account API functions
export async function getAccount(): Promise<Account | undefined> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/account/`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to fetch account:', response.status);
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
    return parsedResponse.data.result || undefined;
  }
  catch (error: any) {
    console.error('Failed to get account:', error);
    return undefined;
  }
}

// Checkout API functions
export async function getCardCheckoutData(planId: number): Promise<CheckoutData | null> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/braintree/payments`, {
      method: 'PUT',
      body: JSON.stringify({ plan_id: planId }),
    });

    if (!response.ok) {
      console.error('Failed to initialize checkout:', response.status);
      return null;
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = CheckoutResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse Checkout response:', {
        data,
        error: parsedResponse.error,
        originalData: data,
        transformedData,
      });
      return null;
    }
    return parsedResponse.data.result || null;
  }
  catch (error: any) {
    console.error('Failed to initialize checkout:', error);
    return null;
  }
}

export async function getUpdateCardCheckoutData(planId: number): Promise<UpgradeData | null> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/braintree/upgrade/quote`, {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });

    if (!response.ok) {
      console.error('Failed to initialize checkout:', response.status);
      return null;
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    return UpgradeDataSchema.parse(transformedData);
  }
  catch (error: any) {
    console.error('Failed to initialize checkout:', error);
    return null;
  }
}

export async function checkout(planId: number, upgradeSubId: string | null): Promise<UpgradeData | CheckoutData | null> {
  if (upgradeSubId) {
    return getUpdateCardCheckoutData(planId);
  }
  return getCardCheckoutData(planId);
}

// Plans API functions
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

export async function getPriceBreakdown(planId: number): Promise<PriceBreakdown | undefined> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/plans/${planId}/price-breakdown`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to fetch price breakdown:', response.status);
      return undefined;
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = PriceBreakdownSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse PriceBreakdown:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      return undefined;
    }
    return parsedResponse.data;
  }
  catch (error: any) {
    console.error('Failed to get price breakdown:', error);
    return undefined;
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

// Subscription API functions
export async function fetchUserSubscriptions(): Promise<UserSubscriptions> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/history/subscriptions`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to fetch user subscriptions:', response.status);
      return [];
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = UserSubscriptionsResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse UserSubscriptionsResponse:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      return [];
    }
    return parsedResponse.data.result || [];
  }
  catch (error: any) {
    console.error('Failed to fetch user subscriptions:', error);
    return [];
  }
}

import { paths } from '@/config/paths';
import {
  type Account,
  AccountResponse,
  type AddCardPayload,
  type CheckoutData,
  CheckoutResponse,
  type CreateCardNoncePayload,
  CreateCardNonceResponse,
  SavedCard,
  SavedCardResponse,
  type SavedCardType,
} from '@/types';
import { convertKeys } from './object';

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
    const parsedCard = SavedCard.safeParse(transformedData);
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
    const parsedResponse = CreateCardNonceResponse.safeParse(transformedData);
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

export async function getSavedCard(): Promise<SavedCardType | undefined> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = SavedCardResponse.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse SavedCardResponse:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      return undefined;
    }
    return parsedResponse.data.cardDetails;
  }
  catch (error: any) {
    console.error('Failed to get saved card:', error);
    // Return undefined for no saved card instead of throwing
    return undefined;
  }
}

// Account API functions
export async function getAccount(): Promise<Account | null> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/account/`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to fetch account:', response.status);
      return null;
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = AccountResponse.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse Account response:', {
        error: parsedResponse.error,
        originalData: data,
        transformedData,
      });
      return null;
    }
    return parsedResponse.data.result || null;
  }
  catch (error: any) {
    console.error('Failed to get account:', error);
    return null;
  }
}

// Checkout API functions
export async function checkout(planId: number): Promise<CheckoutData | null> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/checkout/card/${planId}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to initialize checkout:', response.status);
      return null;
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = CheckoutResponse.safeParse(transformedData);
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

// Subscription utility functions
export function canBuyNewSubscription(account: Account | null): boolean {
  if (!account)
    return true;

  const { hasActiveSubscription, subscriptions } = account;

  if (!hasActiveSubscription)
    return true;

  const renewableSubscriptions = subscriptions.filter(({ actions }) =>
    actions.includes('renew'),
  );

  return renewableSubscriptions.length > 0;
}

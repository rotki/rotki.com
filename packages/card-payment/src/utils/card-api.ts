import {
  type AddCardPayload,
  type CreateCardNoncePayload,
  CreateCardNonceResponseSchema,
  type SavedCard,
  SavedCardResponseSchema,
  SavedCardSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { paths } from '@/config/paths';
import { fetchWithCSRF } from './api';

function extractErrorMessage(errorText: string): string {
  try {
    const parsed = JSON.parse(errorText);
    if (parsed && typeof parsed.message === 'string')
      return parsed.message;
  }
  catch { /* JSON parse failed */ }
  return errorText;
}

export async function addCard(payload: AddCardPayload): Promise<string> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
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
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
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
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
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
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
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
    return [];
  }
}

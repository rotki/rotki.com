import type { ResultAsync } from 'plainfp/result-async';
import { type Account, AccountResponseSchema } from '@rotki/card-payment-common/schemas/account';
import { type ActiveCampaign, ActiveCampaignSchema } from '@rotki/card-payment-common/schemas/campaign';
import {
  type AvailablePlansResponse,
  AvailablePlansResponseSchema,
  type PaymentBreakdownRequest,
  type PaymentBreakdownResponse,
  PaymentBreakdownResponseSchema,
} from '@rotki/card-payment-common/schemas/plans';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { err, map, ok } from 'plainfp/result';
import { z } from 'zod';
import { paths } from '@/config/paths';
import { type ApiFailure, attempt, failed } from './api-failure';
import { readResponse } from './read-response';

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

/** {@link readResponse} for a response that may have an error status, which is a failure. */
async function readOkResponse<T>(response: Response, schema: z.ZodType<T>, label: string): ResultAsync<T, ApiFailure> {
  return response.ok ? readResponse(response, schema, label) : err(failed(`HTTP ${response.status}`));
}

/** The signed-in account. No account is an answer, for a visitor who is not signed in; only a failed check is a failure. */
export async function getAccount(): ResultAsync<Account | undefined, ApiFailure> {
  return attempt('Failed to get account', async () => {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/account/`, {
      method: 'GET',
    });

    if (response.status === 401)
      return ok(undefined);

    return map(await readOkResponse(response, AccountResponseSchema, 'Account response'), ({ result }) => result ?? undefined);
  });
}

const AppConfigSchema = z.object({
  activeCampaign: ActiveCampaignSchema.nullish(),
});

/** The running sitewide campaign, if any. */
export async function getActiveCampaign(): ResultAsync<ActiveCampaign | undefined, ApiFailure> {
  return attempt('Failed to fetch app config', async () => {
    const response = await fetch(`${paths.hostUrlBase}/api/config`);
    return map(await readOkResponse(response, AppConfigSchema, 'app config'), ({ activeCampaign }) => activeCampaign ?? undefined);
  });
}

export async function getPaymentBreakdown(params: PaymentBreakdownRequest): ResultAsync<PaymentBreakdownResponse, ApiFailure> {
  return attempt('Failed to fetch payment breakdown', async () => {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/payment/breakdown`, {
      method: 'POST',
      body: JSON.stringify(convertKeys(params, false, false)),
    });
    return readOkResponse(response, PaymentBreakdownResponseSchema, 'PaymentBreakdownResponse');
  });
}

export async function checkout(planId: number): ResultAsync<PaymentBreakdownResponse, ApiFailure> {
  return getPaymentBreakdown({ newPlanId: planId, isCryptoPayment: false });
}

export async function getAvailablePlans(): ResultAsync<AvailablePlansResponse, ApiFailure> {
  return attempt('Failed to get available plans', async () => {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/2/available-tiers`, {
      method: 'GET',
    });
    return readOkResponse(response, AvailablePlansResponseSchema, 'AvailablePlansResponse');
  });
}

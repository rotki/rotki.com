import type { CreateCardFields } from '@rotki/checkout-ui/utils/hosted-fields';
import type { Client } from 'braintree-web/client';
import { create } from 'braintree-web/hosted-fields';

/** Hosted fields for the shared card form, on this client. */
export function cardFieldsFor(client: Client): CreateCardFields {
  return async options => create({ client, ...options });
}

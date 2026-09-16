import { connect } from 'node:net';
import { addDevServerHandler, defineNuxtModule } from '@nuxt/kit';
import { createError, defineEventHandler } from 'h3';

/** Where `pnpm --filter @rotki/card-payment dev` serves the card payment app. */
const CARD_PAYMENT_DEV_SERVER = { host: 'localhost', port: 3002 };

const CARD_PAYMENT_ROUTE = '/checkout/pay/card';

/** How long to wait for the card app's dev server to accept a connection. */
const CONNECT_TIMEOUT_MS = 500;

/** Whether something accepts connections on the card app's dev server port. */
async function isCardPaymentDevServerUp(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect(CARD_PAYMENT_DEV_SERVER);
    const done = (up: boolean): void => {
      socket.destroy();
      resolve(up);
    };
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

/**
 * Serves the separately built card payment app under `/checkout/pay/card` in development, by proxying
 * to its own Vite dev server.
 *
 * @remarks
 * Nitro's dev proxy marks the request handled before it connects, so when the card app is not running
 * its "Dev server is unavailable" error is never sent and the request hangs with nothing logged. That
 * is the case whenever the website dev server runs on its own, as in the e2e stack. A dev handler,
 * which Nitro runs before the proxy, checks the port first and answers with a 503 that says what to
 * start instead.
 */
export default defineNuxtModule({
  meta: { name: 'card-payment-dev-proxy' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev)
      return;

    const { host, port } = CARD_PAYMENT_DEV_SERVER;
    nuxt.options.nitro.devProxy = {
      ...nuxt.options.nitro.devProxy,
      [CARD_PAYMENT_ROUTE]: {
        changeOrigin: true,
        target: `http://${host}:${port}${CARD_PAYMENT_ROUTE}`,
        ws: true,
      },
    };

    addDevServerHandler({
      handler: defineEventHandler(async () => {
        if (await isCardPaymentDevServerUp())
          return;
        throw createError({
          message: `The card payment app is not running on port ${port}. Start it with \`pnpm --filter @rotki/card-payment dev\`, or run \`pnpm dev\` from the repository root to start both apps.`,
          statusCode: 503,
        });
      }),
      route: CARD_PAYMENT_ROUTE,
    });
  },
});

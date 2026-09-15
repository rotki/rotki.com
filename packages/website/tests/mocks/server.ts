import { type SetupServer, setupServer } from 'msw/node';
import { handlers } from './handlers';

declare global {
  interface Window {
    rotkiMswServer?: SetupServer;
  }
}

// @nuxt/test-utils calls `vi.resetModules()` in its runtime entry (nuxt/test-utils#1795), so every
// spec evaluates this module again after `tests/setup.ts` started the server. The instance lives on
// `window`, which the reset does not touch, so `server.use()` in a spec reaches the listening server.
window.rotkiMswServer ??= setupServer(...handlers);

export const server: SetupServer = window.rotkiMswServer;

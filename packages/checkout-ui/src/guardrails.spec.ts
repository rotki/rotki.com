import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';

/* The card payment app bundles this package and card-payment-common into the payment page.
   Its runtime dependency tree must not grow without review (PCI DSS 6.4.3 script inventory),
   so the shared packages may only lean on what the card app already ships. */

interface PackageJson {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function readPackage(relativePath: string): PackageJson {
  const parsed: PackageJson = JSON.parse(readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8'));
  return parsed;
}

const checkoutUi = readPackage('../package.json');
const common = readPackage('../../card-payment-common/package.json');
const cardApp = readPackage('../../card-payment/package.json');

describe('shared checkout packages stay dependency-free', () => {
  it('checkout-ui has no runtime dependencies of its own', () => {
    expect(checkoutUi.dependencies ?? {}).toEqual({});
  });

  it('checkout-ui only peers on packages the card app already depends on', () => {
    const cardDependencies = Object.keys(cardApp.dependencies ?? {});
    for (const peer of Object.keys(checkoutUi.peerDependencies ?? {}))
      expect(cardDependencies, `card app does not ship ${peer}`).toContain(peer);
  });

  it('card-payment-common depends on zod only', () => {
    expect(Object.keys(common.dependencies ?? {})).toEqual(['zod']);
  });
});

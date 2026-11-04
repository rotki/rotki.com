import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BUNDLE_REPORT, collectBundlePackages, packageNameOf, writeBundleReport } from './bundle-packages';

describe('collectBundlePackages', () => {
  it('lists each package once, sorted, from every chunk and skips assets', () => {
    const packages = collectBundlePackages({
      'assets/index.css': { type: 'asset' },
      'braintree.js': {
        moduleIds: ['/repo/node_modules/braintree-web/client.js', '/repo/node_modules/braintree-web/hosted-fields.js'],
        type: 'chunk',
      },
      'index.js': {
        moduleIds: [
          '/repo/packages/card-payment/src/main.ts',
          '/repo/packages/card-payment-common/src/utils/money.ts',
          '\0vite/preload-helper.js',
          '/repo/node_modules/.pnpm/zod@4.1.0/node_modules/zod/index.js',
        ],
        type: 'chunk',
      },
    });

    expect(packages).toEqual(['@rotki/card-payment-common', 'braintree-web', 'zod']);
  });
});

describe('writeBundleReport', () => {
  let root: string | undefined;

  afterEach(() => {
    if (root)
      rmSync(root, { force: true, recursive: true });
    root = undefined;
  });

  it('creates the report directory and writes the list as JSON', () => {
    root = mkdtempSync(path.join(tmpdir(), 'bundle-report-'));

    writeBundleReport(root, ['vue', 'zod']);

    expect(JSON.parse(readFileSync(path.join(root, BUNDLE_REPORT), 'utf8'))).toEqual(['vue', 'zod']);
  });
});

describe('packageNameOf', () => {
  it('names plain and scoped packages from node_modules paths', () => {
    expect(packageNameOf('/repo/node_modules/.pnpm/zod@4.1.0/node_modules/zod/v4/core/core.js')).toBe('zod');
    expect(packageNameOf('/repo/node_modules/.pnpm/@vue+shared@3.5.42/node_modules/@vue/shared/dist/shared.esm-bundler.js')).toBe('@vue/shared');
  });

  it('names workspace packages from their packages/ directory', () => {
    expect(packageNameOf('/repo/packages/card-payment-common/src/schemas/plans.ts')).toBe('@rotki/card-payment-common');
    expect(packageNameOf('/repo/packages/checkout-ui/src/components/OrderSummary.vue?vue&type=script')).toBe('@rotki/checkout-ui');
  });

  it('skips the app itself and virtual modules', () => {
    expect(packageNameOf('/repo/packages/card-payment/src/main.ts')).toBeUndefined();
    expect(packageNameOf('\0vite/preload-helper.js')).toBeUndefined();
  });

  it('handles windows separators', () => {
    expect(packageNameOf('C:\\repo\\node_modules\\braintree-web\\client.js')).toBe('braintree-web');
  });
});

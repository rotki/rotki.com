#!/usr/bin/env node

/**
 * Guardrail for the card payment page's script inventory.
 *
 * Everything bundled into packages/card-payment runs on the payment page, and PCI DSS 6.4.3
 * asks for every such script to be accounted for. The card app's build writes the packages it
 * actually bundled (packages/card-payment/vite-plugins/bundle-packages.ts); this compares them with the
 * reviewed list in packages/card-payment/bundle-allowlist.json, so a new package on the payment
 * page shows up as a reviewed diff instead of slipping in with a shared-code change.
 *
 * Run after `pnpm build:card`. Update the allowlist in the same PR that adds a package, after
 * checking that the package is needed on the payment page.
 */

import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import consola from 'consola';

const REPORT = './packages/card-payment/node_modules/.tmp/bundle-packages.json';
const ALLOWLIST = './packages/card-payment/bundle-allowlist.json';

if (!existsSync(REPORT)) {
  consola.error(`${REPORT} is missing. Build the card app first: pnpm build:card`);
  process.exit(1);
}

const bundled = new Set(JSON.parse(readFileSync(REPORT, 'utf8')));
const allowed = new Set(JSON.parse(readFileSync(ALLOWLIST, 'utf8')));

const added = [...bundled].filter(name => !allowed.has(name)).sort();
const removed = [...allowed].filter(name => !bundled.has(name)).sort();

if (added.length > 0)
  consola.error(`Packages bundled into the card payment page but not in the allowlist:\n  ${added.join('\n  ')}`);

if (removed.length > 0)
  consola.error(`Allowlisted packages no longer bundled (remove them from the allowlist):\n  ${removed.join('\n  ')}`);

if (added.length > 0 || removed.length > 0) {
  consola.info(`Review the change, then update ${ALLOWLIST}.`);
  process.exit(1);
}

consola.success(`Card payment bundle matches the allowlist (${bundled.size} packages).`);

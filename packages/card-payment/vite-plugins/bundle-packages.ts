import type { Plugin } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/* Records which packages end up in the card payment page's client bundle. CI compares the list
   against bundle-allowlist.json (scripts/check-card-bundle.mjs): PCI DSS 6.4.3 wants every
   payment page script accounted for.
   The report goes to node_modules/.tmp instead of dist, so it is never served. */

const NODE_MODULES = '/node_modules/';
const WORKSPACE_PACKAGES = '/packages/';

export const BUNDLE_REPORT = path.join('node_modules', '.tmp', 'bundle-packages.json');

/** Returns the text before the first `separator`, or all of it when there is none. */
function before(text: string, separator: string): string {
  const index = text.indexOf(separator);
  return index === -1 ? text : text.slice(0, index);
}

/** Maps a bundled module id to its package name, or undefined for the app's own code. */
export function packageNameOf(id: string): string | undefined {
  const file = before(id.replaceAll('\\', '/'), '?');
  if (file.startsWith('\0'))
    return undefined;

  const lastNodeModules = file.lastIndexOf(NODE_MODULES);
  if (lastNodeModules !== -1) {
    const parts = file.slice(lastNodeModules + NODE_MODULES.length).split('/');
    const [first, second] = parts;
    if (!first)
      return undefined;
    return first.startsWith('@') && second ? `${first}/${second}` : first;
  }

  // Workspace packages are symlinked, so their modules resolve to packages/<dir>/.
  const workspace = file.lastIndexOf(WORKSPACE_PACKAGES);
  if (workspace !== -1) {
    const dir = before(file.slice(workspace + WORKSPACE_PACKAGES.length), '/');
    if (dir && dir !== 'card-payment')
      return `@rotki/${dir}`;
  }
  return undefined;
}

/** The part of a Rollup output bundle entry this plugin reads. */
export type BundleOutput = { type: 'chunk'; moduleIds: readonly string[] } | { type: 'asset' };

/** Returns the sorted, unique package names of every chunk in the bundle; assets are skipped. */
export function collectBundlePackages(bundle: Readonly<Record<string, BundleOutput>>): string[] {
  const packages = new Set<string>();
  for (const output of Object.values(bundle)) {
    if (output.type !== 'chunk')
      continue;
    for (const id of output.moduleIds) {
      const name = packageNameOf(id);
      if (name)
        packages.add(name);
    }
  }
  return [...packages].sort();
}

/** Writes the package list to `BUNDLE_REPORT` under `root`, creating the directory if needed. */
export function writeBundleReport(root: string, packages: readonly string[]): void {
  const report = path.join(root, BUNDLE_REPORT);
  mkdirSync(path.dirname(report), { recursive: true });
  writeFileSync(report, `${JSON.stringify(packages, null, 2)}\n`);
}

/**
 * Writes the package names of the client bundle to `BUNDLE_REPORT` under `root`.
 * vite-ssg also runs a server build for prerendering; that one is skipped, since only the
 * client bundle reaches users.
 */
export function bundlePackages(root: string): Plugin {
  let ssr = false;
  return {
    apply: 'build',
    configResolved(config): void {
      ssr = Boolean(config.build.ssr);
    },
    generateBundle(_options, bundle): void {
      if (!ssr)
        writeBundleReport(root, collectBundlePackages(bundle));
    },
    name: 'rotki:bundle-packages',
  };
}

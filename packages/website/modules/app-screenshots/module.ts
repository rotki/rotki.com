import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { addTypeTemplate, addVitePlugin, defineNuxtModule } from '@nuxt/kit';

const VIRTUAL_ID = 'virtual:app-screenshots';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const SCREENSHOT_DIR = 'public/img/screenshots';
/** Slides must be webp: their width variants and the slider's srcset are webp-only. */
const EXTENSION = '.webp';

/**
 * Enumerate the showcase screenshots at build time.
 *
 * These live under `public/`, which Vite deliberately keeps out of the module
 * graph, so `import.meta.glob` cannot see them in a build. It used to be used
 * here and looked fine, because the dev server resolves such patterns off the
 * filesystem — but the production build compiled the call down to
 * `Object.assign({})` and the homepage carousel silently rendered zero slides.
 * Reading the directory ourselves keeps the list auto-discovered without
 * depending on `public/` being part of the graph.
 *
 * The `responsive/` subfolder holds pre-generated width variants of each
 * slide, not slides of its own, so only files directly in the folder count.
 */
function readScreenshots(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(EXTENSION))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map(name => `/img/screenshots/${name}`);
}

/** Widths the slider's srcset asks for; each lives at `responsive/<name>-<width>w.webp`. */
const VARIANT_WIDTHS = [640, 960, 1440];

/**
 * Lists the width variants missing from `responsive/`. The slider's srcset
 * references all of them, so a missing one is a broken image on phones.
 */
function findMissingVariants(dir: string, screenshots: string[]): string[] {
  return screenshots.flatMap((src) => {
    const name = src.slice(src.lastIndexOf('/') + 1, -EXTENSION.length);
    return VARIANT_WIDTHS
      .map(width => `responsive/${name}-${width}w.webp`)
      .filter(variant => !existsSync(resolve(dir, variant)));
  });
}

export default defineNuxtModule({
  meta: { name: 'app-screenshots' },
  setup(_options, nuxt) {
    const dir = resolve(nuxt.options.rootDir, SCREENSHOT_DIR);

    addVitePlugin({
      name: 'app-screenshots',
      resolveId: (id: string) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
      load(id: string) {
        if (id !== RESOLVED_ID)
          return;

        const screenshots = readScreenshots(dir);
        if (screenshots.length === 0)
          this.warn(`no screenshots found in ${SCREENSHOT_DIR} — the showcase carousel will be empty`);

        const missing = findMissingVariants(dir, screenshots);
        if (missing.length > 0)
          this.error(`missing width variants in ${SCREENSHOT_DIR}: ${missing.join(', ')}`);

        return `export default ${JSON.stringify(screenshots)};`;
      },
      // Picking up an added or removed screenshot without restarting the dev server.
      configureServer(server: any) {
        server.watcher.add(dir);
        const invalidate = (path: string): void => {
          if (!path.startsWith(dir))
            return;

          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (!mod)
            return;

          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        };
        server.watcher.on('add', invalidate);
        server.watcher.on('unlink', invalidate);
      },
    });

    addTypeTemplate({
      filename: 'types/app-screenshots.d.ts',
      getContents: () => [
        `declare module '${VIRTUAL_ID}' {`,
        '  /** Public URLs of the showcase screenshots, in display order. */',
        '  const screenshots: string[];',
        '  export default screenshots;',
        '}',
        '',
      ].join('\n'),
    });
  },
});

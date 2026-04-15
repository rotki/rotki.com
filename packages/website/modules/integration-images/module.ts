import { Buffer } from 'node:buffer';
import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { defineNuxtModule } from '@nuxt/kit';

const CONCURRENCY = 20;
const MANIFEST_FILE = '.manifest.json';

interface ManifestEntry {
  etag: string;
  filename: string;
}

type Manifest = Record<string, ManifestEntry>;

interface DownloadTask {
  url: string;
  dest: string;
  etag?: string;
}

interface DownloadResult {
  url: string;
  filename: string;
  etag?: string;
  skipped: boolean;
}

async function readManifest(manifestPath: string): Promise<Manifest> {
  if (!existsSync(manifestPath))
    return {};

  const raw = await readFile(manifestPath, 'utf-8');
  return JSON.parse(raw) as Manifest;
}

async function writeManifest(manifestPath: string, manifest: Manifest): Promise<void> {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(manifestPath, `${JSON.stringify(sorted, undefined, 2)}\n`);
}

async function downloadBatch(tasks: DownloadTask[]): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];

  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async ({ url, dest, etag }): Promise<DownloadResult> => {
        const headers: Record<string, string> = {};
        if (etag)
          headers['if-none-match'] = etag;

        const res = await fetch(url, { headers });

        if (res.status === 304) {
          return {
            url,
            filename: basename(dest),
            etag,
            skipped: true,
          };
        }

        if (!res.ok)
          throw new Error(`HTTP ${res.status} for ${url}`);

        const buffer = Buffer.from(await res.arrayBuffer());
        await writeFile(dest, buffer);

        return {
          url,
          filename: basename(dest),
          etag: res.headers.get('etag') ?? undefined,
          skipped: false,
        };
      }),
    );

    for (const [idx, result] of settled.entries()) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
      else {
        console.warn(`[integration-images] Failed to download ${batch[idx]?.url}: ${result.reason}`);
      }
    }
  }

  return results;
}

export default defineNuxtModule({
  meta: { name: 'integration-images' },
  async setup(_options, nuxt) {
    if (nuxt.options.dev)
      return;

    const rootDir = nuxt.options.rootDir;
    const jsonPath = resolve(rootDir, 'public/integrations/all.json');
    const outputDir = resolve(rootDir, 'public/img/integrations');

    if (!existsSync(jsonPath)) {
      console.warn('[integration-images] public/integrations/all.json not found, skipping');
      return;
    }

    const raw = await readFile(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    const urls = new Set<string>();
    for (const category of ['blockchains', 'exchanges', 'protocols']) {
      for (const item of data[category] ?? []) {
        if (typeof item.image === 'string' && item.image.startsWith('http'))
          urls.add(item.image);
      }
    }

    if (urls.size === 0)
      return;

    await mkdir(outputDir, { recursive: true });

    const manifestPath = resolve(outputDir, MANIFEST_FILE);
    const manifest = await readManifest(manifestPath);

    const expectedFiles = new Set<string>();
    const tasks: DownloadTask[] = [...urls].map((url) => {
      const filename = basename(new URL(url).pathname);
      expectedFiles.add(filename);
      return {
        url,
        dest: resolve(outputDir, filename),
        etag: manifest[url]?.etag,
      };
    });

    console.warn(`[integration-images] Checking ${urls.size} images...`);

    const results = await downloadBatch(tasks);

    const newManifest: Manifest = {};
    let downloaded = 0;
    let cached = 0;

    for (const result of results) {
      newManifest[result.url] = {
        etag: result.etag ?? '',
        filename: result.filename,
      };

      if (result.skipped) {
        cached++;
      }
      else {
        downloaded++;
      }
    }

    await writeManifest(manifestPath, newManifest);

    // Remove orphan files that are no longer in the URL set
    const orphanManifestUrls = Object.keys(manifest).filter(url => !urls.has(url));
    let removed = 0;
    for (const url of orphanManifestUrls) {
      const entry = manifest[url];
      if (!entry)
        continue;

      const filePath = resolve(outputDir, entry.filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
        removed++;
      }
    }

    console.warn(`[integration-images] Done: ${downloaded} downloaded, ${cached} cached (304), ${removed} removed`);
  },
});

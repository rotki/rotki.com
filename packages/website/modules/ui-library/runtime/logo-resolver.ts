import type { LogoResolver } from '@rotki/ui-library';
import { z } from 'zod';

const DATA_REPO = 'https://raw.githubusercontent.com/rotki/data';
const SESSION_PREFIX = 'rotki-logo-mappings';

/** A plain image filename: the mapping cannot point outside `assets/icons/`. */
const IMAGE_FILE = /^[\w.-]+\.(?:png|svg|webp|gif|jpe?g)$/i;

const LogoMapping = z.record(z.string(), z.string());

const AssetMappings = z.object({ logo: LogoMapping });

type LogoMapping = z.infer<typeof LogoMapping>;

function readCachedMapping(branch: string): LogoMapping | undefined {
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}:${branch}`);
    if (!raw)
      return undefined;
    const parsed = LogoMapping.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  }
  catch {
    return undefined;
  }
}

function writeCachedMapping(branch: string, mapping: LogoMapping): void {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}:${branch}`, JSON.stringify(mapping));
  }
  catch {
    // sessionStorage may be full or unavailable
  }
}

async function fetchMapping(branch: string): Promise<LogoMapping | undefined> {
  try {
    const response = await fetch(`${DATA_REPO}/${branch}/constants/asset-mappings.json`);
    if (!response.ok)
      return undefined;

    const parsed = AssetMappings.safeParse(await response.json());
    if (!parsed.success)
      return undefined;

    writeCachedMapping(branch, parsed.data.logo);
    return parsed.data.logo;
  }
  catch {
    return undefined;
  }
}

/**
 * Resolves `RuiLogo` names to the seasonal logos rotki publishes in rotki/data,
 * which the ui-library no longer fetches itself. The mapping is fetched once per
 * branch and kept in sessionStorage, so a reload shows the logo without asking
 * GitHub again.
 *
 * @param getBranch - the rotki/data branch to read, awaited on every call so it can wait for the app config
 */
export function createRotkiDataLogoResolver(getBranch: () => Promise<string>): LogoResolver {
  const pending = new Map<string, Promise<LogoMapping | undefined>>();

  async function loadMapping(branch: string): Promise<LogoMapping | undefined> {
    const cached = readCachedMapping(branch);
    if (cached)
      return cached;

    let request = pending.get(branch);
    if (!request) {
      request = fetchMapping(branch);
      pending.set(branch, request);
    }
    return request;
  }

  return async (name: string): Promise<string | undefined> => {
    const branch = await getBranch();
    const file = (await loadMapping(branch))?.[name];
    if (!file || !IMAGE_FILE.test(file))
      return undefined;

    return `${DATA_REPO}/${branch}/assets/icons/${file}`;
  };
}

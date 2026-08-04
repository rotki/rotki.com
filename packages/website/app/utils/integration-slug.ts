export function integrationSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\da-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * rotki's catalog (`all.json`) splits a few products into granular counterparty entries
 * (e.g. "Makerdao DSR/SAI/vault/migration", "Yearn Staking/Governance", "Morpho Blue").
 * We cover each product with a single consolidated content page, so those granular slugs
 * fold into one canonical slug. This is an explicit whitelist - NOT a heuristic - so
 * unrelated entries that merely share a first word (Coinbase / Coinbase Pro, FTX / FTX US,
 * Gnosis Pay / Gnosis Chain, ...) are never accidentally merged.
 *
 * `label` is the display used for the consolidated card (the granular entries don't carry
 * the canonical name).
 */
export const INTEGRATION_CONSOLIDATIONS: Record<string, { label: string; members: string[] }> = {
  makerdao: { label: 'MakerDAO', members: ['makerdao-dsr', 'makerdao-migration', 'makerdao-sai', 'makerdao-vault'] },
  morpho: { label: 'Morpho', members: ['morpho-blue'] },
  yearn: { label: 'Yearn', members: ['yearn-staking', 'yearn-governance'] },
};

/**
 * Coverage qualifiers shown next to an integration's name (grid card + detail page).
 * Keyed by canonical slug. Kept here rather than in `all.json` because the catalog
 * is regenerated from the rotki backend and hand-added fields would be wiped, and
 * because the label itself must stay untouched - it drives `integrationSlug()`.
 */
export const INTEGRATION_QUALIFIERS: Record<string, string> = {
  aave: 'v1–v3',
  solana: 'early support',
  uniswap: 'v2/v3',
};

/**
 * Returns the coverage qualifier for an integration label, if one is defined.
 */
export function integrationQualifier(label: string): string | undefined {
  return INTEGRATION_QUALIFIERS[consolidateSlug(integrationSlug(label))];
}

/**
 * Maps a raw integration slug to its canonical (consolidated) slug. Returns the slug
 * unchanged when it is not part of a consolidation group.
 */
export function consolidateSlug(slug: string): string {
  for (const [canonical, { members }] of Object.entries(INTEGRATION_CONSOLIDATIONS)) {
    if (slug === canonical || members.includes(slug))
      return canonical;
  }
  return slug;
}

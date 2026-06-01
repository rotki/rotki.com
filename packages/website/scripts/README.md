# website scripts

## Integration content tooling

The `content/integrations/<slug>.md` files describe each integration rotki supports. There are three pieces that need to stay aligned:

| Piece                            | Source of truth                                                                              | How it's updated                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `public/integrations/all.json`   | rotki backend (`/blockchains/supported`, `/locations/all`, `/history/events/counterparties`) | Run `rotki/frontend/app/scripts/get-protocols.ts` against a tagged rotki release |
| `content/integrations/*.md`      | Hand-curated, but stubs are generated from `all.json`                                        | `pnpm gen:integration-stubs` (creates missing files; never overwrites)           |
| `scripts/integrations-meta.json` | Hand-curated map: slug → rotki source paths backing each integration                         | Edit directly when modules move/rename                                           |

### When a new rotki release drops

1. Add the new tag as a worktree of your local rotki clone:

   ```bash
   git -C ../rotki worktree add ../rotki-vNEXT vNEXT
   ```

2. Regenerate `all.json` from the released backend (needs Python `uv` + Node deps installed in the worktree, plus `CI=1` so `get-protocols.ts` is allowed to run):

   ```bash
   cd ../rotki-vNEXT && uv sync --frozen
   cd frontend && pnpm install --frozen-lockfile --ignore-scripts
   cd app && CI=1 pnpm tsx scripts/get-protocols.ts
   cp all.json ../../../rotki.com/packages/website/public/integrations/all.json
   ```

3. Generate stubs for any new integrations:

   ```bash
   pnpm --filter website gen:integration-stubs
   ```

4. Diff the rotki source between the previous verified tag and the new one to find which md files need re-verification:

   ```bash
   pnpm --filter website integrations:changed ../../rotki-vNEXT v1.43.1 vNEXT
   ```

5. Walk through the reported slugs. After verifying a slug against the new tag, add it to `reviewedSlugs` in `integrations-meta.json`.

6. When everything passes, bump `lastVerifiedRotkiTag` in `integrations-meta.json` to the new tag and reset `reviewedSlugs` to `[]` for the next cycle.

### What `integrations:changed` reports

1. **Modified slugs** - md files whose backing rotki paths changed. Slugs already in `reviewedSlugs` are marked `✓`.
2. **Added paths uncovered by any slug** - new files in rotki that no `integrations-meta.json` glob matches. Likely needs a new md file or a new glob on an existing entry.
3. **Stale globs** - entries in `integrations-meta.json` whose globs match zero files at the new tag. Module was renamed or removed; fix the meta.
4. **Premium gating changes** - `rotkehlchen/premium/premium.py` or `rotkehlchen/constants/limits.py` was touched. Re-check `ctaPlan` across affected files.
5. **Drift checks** - three-way consistency between meta, md files, and `all.json`:
   - meta entry without a matching md file (orphan - delete or restore)
   - md file without a meta entry (add globs)
   - `all.json` slug without a matching md file (run `gen:integration-stubs`; if it's a first-word collision with an existing slug, the dedupe in `generate-integration-stubs.ts` is correct and the script will say so)

Exit code is non-zero when any section has findings, so it can be wired into CI.

### `integrations-meta.json` schema

```text
{
  "lastVerifiedRotkiTag": "v1.43.1",
  "premiumPaths": [ "rotkehlchen/premium/premium.py", "rotkehlchen/constants/limits.py" ],
  "slugs": {
    "<slug>": ["<glob-relative-to-rotki-root>", ...]
  },
  "reviewedSlugs": ["<slug>", ...]
}
```

Globs use POSIX syntax: `*` (no slash), `**` (any path), `?` (one char). An empty array is legitimate - it means the integration page exists but no rotki source backs it (e.g. an exchange that was removed from the codebase but kept as a marketing page).

### Other scripts

- `generate-integration-stubs.ts` - generates missing md stubs from `all.json`. Run via `pnpm gen:integration-stubs`. Never overwrites existing files.
- `generate-og-mint.ts` - generates Open Graph image for sponsor mint page. Run via `pnpm og:mint`.

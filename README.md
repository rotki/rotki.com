# rotki.com

The [rotki.com](https://rotki.com) website: the public pages, the premium checkout, account
management and NFT sponsorship.

It is a pnpm workspace:

| Package                        | What it is                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `packages/website`             | The Nuxt site, generated as static files (SSG)                                                  |
| `packages/card-payment`        | The card checkout app, served under `/checkout/pay/card` with its own CSP                       |
| `packages/card-payment-common` | Schemas and helpers shared by the website and the card app                                      |
| `packages/checkout-ui`         | Vue components and composables shared by the website checkout and the card app                  |
| `packages/sigil`               | The analytics event catalog                                                                     |
| `backend/`                     | The Go server: serves the generated files and a few `/api` routes ([README](backend/README.md)) |

In production there is no Node.js: one Go binary serves the generated files, and Traefik routes
`/webapi` and `/media` to the Python backend (rotki-web).

To make a change and check it locally, including with a coding agent and a Chromium MCP, start
with [CONTRIBUTING.md](CONTRIBUTING.md).

## Requirements

- Node.js 24 (see `.nvmrc`) and pnpm 12
- Go 1.27+: the Go server runs in front of the site in `make dev` and in the e2e tests

## Quick start

```bash
# install dependencies
pnpm install

# Go backend on localhost:3000 + Nuxt dev server on localhost:3001 (recommended)
make dev

# build the static site and the card app into .output/public
pnpm run build
```

## Setting up the environment

Create a `.env` file in `packages/website`:

```bash
touch packages/website/.env
```

Set the public base URL. Do not set it to `/`: that causes an API call loop that freezes the app.

```dotenv
NUXT_PUBLIC_BASE_URL=http://localhost:3000
```

Add the reCAPTCHA public key. You can get a testing key
from [Google](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do).

```dotenv
NUXT_PUBLIC_RECAPTCHA_SITE_KEY=XXXX
```

If you run behind https with a self-signed certificate, also add:

```dotenv
NUXT_PUBLIC_BASE_URL=https://localhost
NODE_TLS_REJECT_UNAUTHORIZED=0
```

`packages/website/.env.example` and `packages/card-payment/.env.example` list the other variables.

### Plans and prices

The build reads the premium plans, prices and limits once, so prerendered pages carry them:
from `https://rotki.com` when `NUXT_PUBLIC_BASE_URL` is on rotki.com, from `https://staging.rotki.com`
otherwise (staging, local development, CI). Plan ids differ between the two, so a build never uses
the other environment's plans. A build fails when the API does not answer.

The dev server reuses the last answer for a day (`packages/website/node_modules/.cache/tiers-snapshot/`),
keeps an older one when the API is unreachable, and fails only when it has none. Delete that folder to
refetch. To read the plans from somewhere else, such as the e2e mock API, set:

```dotenv
TIERS_SNAPSHOT_URL=http://localhost:9999
```

### Backend proxy

Without a local Python backend, the Go server in dev mode (`make dev` or `make dev-go`) can
proxy `/webapi` and `/media` to a remote one. This only works in dev mode; the server refuses to
start with these set otherwise (see [backend/README.md](backend/README.md#environment-variables)).

For the production system:

```dotenv
PROXY_DOMAIN=rotki.com
```

For staging:

```dotenv
PROXY_DOMAIN=staging.rotki.com
```

If that server does not use https, proxy to http instead:

```dotenv
PROXY_INSECURE=true
```

## Run

```bash
# Go backend + Nuxt dev server (recommended), open http://localhost:3000
make dev

# Nuxt dev server only, on localhost:3001 (accepts self-signed certs)
make dev-web

# Go backend only, in dev mode
make dev-go
```

`make help` lists every target.

## Testing the production build locally

The dev server renders differently from the generated site, so check SSR and hydration issues
against a real build served by the Go server, the same way the Docker image runs:

```bash
pnpm run build                 # static site + card app -> .output/public
make build-go                  # Go binary -> backend/server
cd backend
PORT=3000 STATIC_DIR=../.output/public BASE_URL=http://localhost:3000 ./server
```

This serves the pages and the `/api` routes only; `/webapi` calls (login, prices, checkout) need a
Python backend. To send them to staging, run the server in dev mode with the Nuxt proxy turned off:

```bash
DEV_MODE=true NUXT_DEV_URL= PROXY_DOMAIN=staging.rotki.com \
  PORT=3000 STATIC_DIR=../.output/public BASE_URL=http://localhost:3000 ./server
```

Build with a base URL that is not on rotki.com for this, so the built plans are staging's
(see [Plans and prices](#plans-and-prices)).

To run it behind the local Python backend stack instead, see the production-like setup in
[backend/README.md](backend/README.md#quick-start).

## Lint

```bash
pnpm lint          # frontend
pnpm lint:fix      # frontend, with fixes
make lint          # Go + frontend
```

## Tests

```bash
pnpm test          # unit tests (Vitest)
pnpm test:watch    # unit tests in watch mode
pnpm test:e2e      # end-to-end tests (Playwright)
pnpm typecheck     # TypeScript and Vue templates, including missing imports
make test-go       # Go tests
```

The e2e tests need Chromium once: `pnpm --filter @rotki/website exec playwright install chromium`.
[CONTRIBUTING.md](CONTRIBUTING.md#checks-before-a-pull-request) lists every check and when to run it.

## Performance budgets

The main public pages are where most visitors arrive, often on a phone. Before the first screen
can paint, the browser fetches the page's stylesheet and every script the page preloads, and on a
slow connection those share the same bandwidth. Each extra kilobyte up front delays the first
paint, even when the code is only needed further down the page.

`pnpm --filter @rotki/website check:initial-chunks` reads the generated site (run it after
`pnpm build`) and fails, in CI as well, when:

- a page loads wallet or payment code up front,
- a heavy ui-library widget (data table, autocomplete, menu select, text area) loads on most
  pages, or
- one of the pages below goes over its budget.

| Page                 | Initial JS budget (gzip) | Measured (2026-11) |
| -------------------- | ------------------------ | ------------------ |
| `/`                  | 245 KB                   | 237 KB             |
| `/products`          | 245 KB                   | 237 KB             |
| `/pricing`           | 255 KB                   | 251 KB             |
| `/download`          | 280 KB                   | 273 KB             |
| `/integrations`      | 255 KB                   | 246 KB             |
| `/integrations/aave` | 245 KB                   | 236 KB             |
| `/compare`           | 255 KB                   | 247 KB             |
| `/compare/koinly`    | 255 KB                   | 247 KB             |
| `/features`          | 255 KB                   | 247 KB             |

Those pages may also block their first paint on one stylesheet only (`entry.css`). A component
that imports its own CSS gets a second `<link rel="stylesheet">`, which costs another round trip
before anything shows. Import such CSS in `app/assets/css/tailwind.css` instead.

**Why these numbers.** Each budget is the page's size after the November 2026 trim plus 5 to 10 KB
of room. The trim took the home page from 303 to 237 KB and its Lighthouse mobile score from 64
to 76 on a local build (LCP 5.3 s to 4.4 s, total blocking time 255 ms to 109 ms). The budgets
exist to keep that gain, not as a target to fill.

**When a page goes over.** The usual cause is a section below the first screen imported
eagerly. Load it with `defineLazyHydrationComponent('visible', () => import('...'))` from
`#app/composables/lazy-hydration`, as `app/pages/index.vue` does: the section is still
prerendered for search engines, and its code loads when it scrolls into view. If the extra code
is really needed up front, raise the budget in `PAGE_BUDGETS_KB`
(`packages/website/scripts/check-initial-chunks.ts`) in the same pull request and say why in its
description.

## Links sent in emails

The Python backend (rotki-web) sends emails that link to these pages. Changing a path or a query
parameter breaks links in emails people already have, so sync any change with the backend first.

| Path                                                         | Email                                          |
| ------------------------------------------------------------ | ---------------------------------------------- |
| `/activate/[uid]/[token]/`                                   | Account activation                             |
| `/password/reset/[uid]/[token]`                              | Password reset                                 |
| `/checkout/pay?id=[subscription_id]`                         | Crypto renewal                                 |
| `/checkout/pay/method?planId=[plan_id]&id=[subscription_id]` | Crypto renewal                                 |
| `/home`                                                      | Invoice                                        |
| `/home/saved-cards`                                          | Payment failed, authorization failed, past due |

Saved cards now live on `/home/billing`. The Go server redirects `/home/saved-cards` and its older
name `/home/payment-methods`, which still appears in sent emails, to `/home/billing`; keep both
redirects.

## Maintenance

This section is for maintainers. To make a change and check it, start with
[CONTRIBUTING.md](CONTRIBUTING.md), which lists the checks, the branch names and the commit format.

The [maintainers](https://github.com/orgs/rotki/teams/maintainers) team owns every path (see
`CODEOWNERS`). Pull requests target `main` and are squash merged, so the PR title becomes the commit
on `main` and its subject becomes a line in the release notes.

### Commits written with an agent

Agent instructions live in [AGENTS.md](AGENTS.md). `CLAUDE.md` holds only `@AGENTS.md`, so Claude
Code reads the same file as Codex and other agents. Edit `AGENTS.md`, never `CLAUDE.md`, and update
it when a convention changes: the agent follows what it says, not what the code happens to do.

A commit written with an agent records the model and the harness as trailers, as rotki does. Do not
add `Co-Authored-By` for an AI tool, a session link or a "Generated with" line:

```text
fix(checkout): keep the plan when the card form reloads

<what changed and why>

LLM-Model: anthropic/claude-opus-5-5
Harness: Claude Code 2.1.318
```

Every non-trivial fix or feature gets a body that says what changed and why, with the root cause
for a bug. A dependency update says which breaking changes were checked and why they do not apply.

### Lessons from working with agents

- **Run the checks before saying they passed**, and say which ones did not run. The list per change
  is in [CONTRIBUTING.md](CONTRIBUTING.md#what-to-run-for-what-change).
- **Read the code before acting on a finding.** Agent reviews report missing error handling or
  validation that sits one call deeper. Trace the call first.
- **Fix what stricter checks find instead of silencing it.** Strict template type-checking and the
  sonarjs rules each found real bugs (an unimported component, an event that never fired, a dead
  branch). Prefer a fix over `eslint-disable` or an `as` cast.
- **Keep the lint-enforced writing rules.** The slop rules reject em dashes and long comments.
  Comments say why in a sentence or two; the commit body carries the rest.
- **Every override and exception says when to drop it.** Entries under `overrides` and
  `trustPolicyExclude` in `pnpm-workspace.yaml` carry a comment with the reason (an advisory ID
  where there is one). Remove them once the reason is gone.

### Dependency updates

Renovate lists updates on the dependency dashboard issue and opens a PR only once a maintainer
approves it there; maintainers also update by hand. Security alert PRs are the exception: Renovate
opens them right away, without approval or the release age wait.

- **A release must be 7 days old** (`minimumReleaseAge` in `pnpm-workspace.yaml` and Renovate).
  First-party `@rotki/*` packages are exempt. Apply the same wait to Go modules and pinned actions.
  To take a release early on purpose, add its exact versions (`nuxt@4.7.0`) to
  `minimumReleaseAgeExclude` with a comment, never a bare name.
- **Versions live in the catalog** in `pnpm-workspace.yaml`, pinned exactly (`saveExact`).
  Packages refer to them as `catalog:`.
- **Same-major updates go together** in one `chore(deps): update dependencies` commit. **Each
  major gets its own commit**, after reading its changelog, with a body saying what changed for us.
- `@types/node` stays on the Node major in `.nvmrc`; `tailwindcss` and `@tailwindcss/vite` move
  together.

A same-major update by hand:

```bash
pnpm outdated -r                  # what is behind
# bump the catalog entries whose newest same-major release is at least 7 days old
pnpm install
pnpm audit                        # transitive advisories left
cd backend && go list -m -u all   # Go modules: go get <module>@<version>, go mod tidy
```

Then run the checks for a `nuxt.config.ts` change from CONTRIBUTING.md, plus `make test-go`.

When `pnpm audit` still reports a transitive package whose parent's range allows the fixed
version, try `pnpm dedupe` first. pnpm often keeps the version it already resolved, so if the
advisory remains, add a narrow override (`pkg@^x: x.y.z`) with its advisory ID. When the fix
needs a range the parent does not allow, leave it and list it in the commit body, unless the
advisory is critical and the override is tested.

`trustPolicy: no-downgrade` fails the install when a new version lost the provenance an older one
had. Do not add a `trustPolicyExclude` entry without finding out why the provenance went away.

### GitHub Actions changes

Actions are pinned to a full commit SHA with the tag in a comment (`helpers:pinGitHubActionDigests`
in Renovate). Workflows start with `permissions: {}`, each job asks for what it needs, and checkouts
use `persist-credentials: false`. When updating an action, check that the SHA matches the tag and
that every input the workflow passes still exists at that SHA.

Run both linters on any workflow change before pushing:

```bash
zizmor .github/workflows
actionlint -ignore 'step must run script'
```

zizmor finds security problems (template injection, broad permissions, credential leaks) and must
report nothing. Its support for `parallel:` step groups is experimental, so read the steps inside
them yourself too. The actionlint ignore is there because actionlint (1.7.12) does not know the
`parallel:` step groups in `ci.yml`; any other report is real.

Codecov uploads authenticate with OIDC (`use_oidc`, which needs `id-token: write` on the job), so
no `CODECOV_TOKEN` secret is used. A pull request from a fork gets no OIDC token, so `use_oidc` is
off for it and it uploads tokenless, which Codecov accepts for fork branches of a public
repository.

### Releases

Versions follow the calendar: `YYYY.M.patch` (`v2026.10.0`, then `v2026.10.1` for a fix in the
same month). Release from an up-to-date `main` with CI green:

```bash
git switch main && git pull
pnpm release                      # bumpp: pick the version, bump every package, commit and tag
git push origin main --follow-tags
```

`pnpm release` writes the `chore: release vX` commit and an annotated `vX` tag without pushing. The
tag push runs the `Release` workflow, which builds the GitHub release notes from the conventional
commits with changelogithub, so the commit subjects are the changelog.

### Optional agent skills

Agent skills give an agent library documentation it would otherwise guess at. None are required,
and the repository ships none. These were useful here; install them for your own agent with the
[skills CLI](https://github.com/vercel-labs/skills): `npx skills add <source>`, or
`npx skills add <source> --skill <name>` for one skill.

| Source                     | Skills                                                                          | Use                                                    |
| -------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `antfu/skills`             | `nuxt`, `vue`, `pinia`, `vite`, `vitest`, `pnpm`, `nitro`, `antfu-simplify`     | Framework APIs; `antfu-simplify` trims a finished diff |
| `vuejs-ai/skills`          | `vue-best-practices`, `vue-router-best-practices`, `vue-testing-best-practices` | Vue 3 patterns, router guards, component tests         |
| `vueuse/skills`            | `vueuse-functions`                                                              | Picking the right VueUse composable                    |
| `rolldown/tsdown`          | `tsdown`                                                                        | Building the shared packages                           |
| `kelsos/plainfp`           | `plainfp`                                                                       | `Result` and `Option` code in the website and card app |
| `wshobson/agents`          | `e2e-testing-patterns`, `typescript-advanced-types`                             | Playwright tests, complex types                        |
| `vercel-labs/agent-skills` | `web-design-guidelines`                                                         | Accessibility and UI review                            |

Claude Code also has built-in commands that fit these checks: `/code-review` for a review of the
branch, `/simplify` for cleanup and `/security-review` for payment and auth changes. Treat their
findings like any review and verify each one in the code before changing anything.

## License

rotki.com is licensed under the [GNU Affero General Public License v3.0](LICENSE.md).

# Contributing

This guide is for people who make a change here without much frontend experience, often with a
coding agent that drives a Chromium browser through MCP (for example
[chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) or the Playwright
MCP). It covers setting up once, seeing a change in the browser, and the checks to run before a
pull request. Agents should also read [AGENTS.md](AGENTS.md) for the code conventions.

## One-time setup

1. Node.js from `.nvmrc` (`nvm install && nvm use`), then pnpm 12 (`corepack enable`).
2. Go 1.27 or newer. The Go server sits in front of the site in development and in the e2e
   tests, so it is needed even for frontend-only changes.
3. Install the dependencies and the test browser:

   ```bash
   pnpm install
   pnpm --filter @rotki/website exec playwright install chromium
   ```

4. Create `packages/website/.env`:

   ```dotenv
   NUXT_PUBLIC_BASE_URL=http://localhost:3000
   NUXT_PUBLIC_RECAPTCHA_SITE_KEY=<Google's reCAPTCHA test key>
   ```

   Google publishes a reCAPTCHA
   [test key](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do)
   that always passes. Keep `NUXT_PUBLIC_BASE_URL` on `http://localhost:3000`: `https://localhost`
   only works behind a local TLS proxy, and `/` makes the app loop on API calls.

Never commit `.env` files.

## Seeing a change in the browser

```bash
make dev
```

This starts the Go server on <http://localhost:3000> and the Nuxt dev server on port 3001. Always
open port **3000**: it adds the CSP headers, the `/api` routes and the `/webapi` proxy that the
site expects. Port 3001 alone shows pages that break in ways production never does.

The stack is ready when <http://localhost:3000/health> answers and a page loads. The first load of
each page compiles it and can take up to a minute; later loads are fast. Code changes reload in
the open page. Changes to `packages/website/i18n/locales/en.json` or new icons need a restart.

Only one `nuxi dev` can run per checkout (it locks `.nuxt`). For a second stack, use a second git
worktree.

### Which backend

The site talks to the Python backend (rotki-web) on `/webapi`. What you need depends on the page:

| Pages                                                            | Backend needed                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Public pages (home, pricing, features, integrations, docs, jobs) | None. Plans and prices come from a snapshot of staging, fetched at startup. |
| Sign in, account (`/home/*`), checkout, sponsorship              | A backend with an account to sign in with.                                  |

For pages that need a backend, point the Go server at one before `make dev`:

```bash
# a local rotki-web on port 8000
PROXY_DOMAIN=localhost:8000 PROXY_INSECURE=true make dev

# staging (needs a staging account; payments use the sandbox)
PROXY_DOMAIN=staging.rotki.com make dev
```

Only `/webapi` and `/media` go to that backend. Pages still come from your checkout.

### Checking a page with a Chromium MCP

For each page the change touches, the agent should:

1. Open `http://localhost:3000/<path>` and wait for the page to finish loading.
2. Read the console. Errors, Vue warnings (`[Vue warn]`) and hydration warnings
   (`Hydration ... mismatch`) all count as failures, including ones that seem unrelated.
3. Take screenshots at three widths: 375 px (phone), 768 px (tablet) and 1280 px (desktop). Many
   layout bugs only show between 768 and 1279 px.
4. Click through what the change affects: buttons, links, form errors, empty states.
5. Check the network panel for failed `/webapi` calls (4xx or 5xx) that the page does not explain
   to the user.

Do not type real passwords, card numbers or seed phrases. On staging, use a staging account and
the Braintree sandbox cards.

### The production build

The dev server renders pages differently from the generated site. Some bugs (hydration
mismatches, a page that fails to prerender, a missing route) only show in the build. When a
change touches page structure, data loading or routing, also check the build as described in
[README.md](README.md#testing-the-production-build-locally).

## SEO and Lighthouse on public pages

The public pages are prerendered: `pnpm build` writes each one as HTML with its title,
description, canonical link and social tags already in it, so search engines and link previews
see them without running JavaScript. Signed-in pages (`/home/*`, checkout steps, `/login`) are not
prerendered and are not indexed.

The pages that matter most:

| Page                                   | Source                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `/` (home)                             | `app/pages/index.vue`                                                    |
| `/pricing`                             | `app/pages/checkout/pay/index.vue` (`/pricing` is an alias of that page) |
| `/products`                            | `app/pages/products/index.vue`                                           |
| `/download`                            | `app/pages/download.vue`                                                 |
| `/integrations`, `/integrations/<app>` | `app/pages/integrations/`, text in `content/integrations/`               |
| `/compare`, `/compare/<tool>`          | `app/pages/compare/`, text in `content/comparisons/`                     |
| `/features`, `/features/<feature>`     | `app/pages/features/`, text in `content/features/`                       |

### Page metadata

Every public page calls `usePageSeo(title, description, path)` from
`~/composables/use-page-seo`. It sets the title, description, canonical URL and the Open Graph
and Twitter tags. Private pages call `usePageSeoNoIndex(title)` instead. Keep to these rules:

- Title of 60 characters or fewer, description of 160 or fewer (the audit checks both). Give
  each page its own title and description.
- Exactly one `<h1>` per page (checked).
- Links as real `<a href>` elements (`NuxtLink`), not click handlers, so crawlers can follow them
  (checked).
- No page path changes without a redirect: old URLs are already in search results.

### SEO audit (every page, seconds)

```bash
NUXT_PUBLIC_BASE_URL=https://rotki.com pnpm --filter @rotki/website generate
pnpm --filter @rotki/website seo:audit
```

The audit reads every generated page and reports missing or long titles and descriptions, wrong
canonicals, missing Open Graph tags, uncrawlable links and pages without exactly one `<h1>`.
A clean run ends with `No SEO issues found`. Build with the production base URL as shown: without
it every canonical is relative and the audit reports a false error on almost every page.

### Initial JavaScript per page

```bash
pnpm --filter @rotki/website check:initial-chunks
```

Run it after the same build. It lists how much JavaScript each page loads before it becomes
interactive, and fails when a public page loads wallet or payment code up front. Compare the
**JS (gzip KB)** column for the pages you touched against a build of `main`: a jump of more than
a few KB on `/` or `/pricing` needs a reason.

### Lighthouse (performance, accessibility, best practices, SEO)

```bash
pnpm lighthouse            # 4 pages, 3 runs each, about 3 minutes
pnpm lighthouse:summary    # prints the scores as a table
```

Run it after the same build. It serves the generated files itself, audits `/`, `/products`,
`/integrations/aave` and `/compare/koinly` (the list is in `lighthouserc.json`) with mobile
emulation, and saves the full reports in `.lighthouseci/`. Open a report's `.html` file in a
browser to see what each audit flags.

Read the numbers like this:

- **SEO** should be 100 and **Accessibility** 95 or higher. These do not depend on the machine.
- **Performance** depends on the machine and on the server. The local server speaks HTTP/1.1
  while production uses HTTP/2, and Lighthouse's simulated slow phone loads the ~80 script files
  much more slowly over HTTP/1.1. Local mobile scores come out about 10 points below production
  (late 2026: home 65 locally, 76 on rotki.com). Do not chase the 90 target locally; compare
  against a run on `main` on the same machine instead. A drop of more than 5 points, or a higher
  LCP (largest contentful paint) or TBT (total blocking time), points to the change.
- To measure production itself, run Lighthouse against it:
  `npx -y @lhci/cli@0.15.1 collect --url=https://rotki.com/ --numberOfRuns=3`.
- **CLS** (layout shift) should stay at 0. Anything above 0.1 means content jumps while loading,
  usually an image without a size or text that appears late.

CI runs the SEO audit, the initial chunk check and Lighthouse on every pull request and writes the
tables to the job summary. Only the chunk check can fail the job; the others report only, so read
the summary.

### With a Chromium MCP

To check a single page, including one Lighthouse CI does not cover:

1. Open the page from the production build served locally (see [The production build](#the-production-build)).
   The dev server is slower and unminified, so its scores mean nothing.
2. chrome-devtools-mcp's `lighthouse_audit` tool gives the accessibility, SEO and best practices
   scores with the failing elements. Run it for `mobile` and `desktop`.
3. For performance, record a trace (`performance_start_trace` with a reload) and read LCP, CLS and
   the long tasks it reports.
4. Compare with the same page on <https://rotki.com>, measured the same way.

## Checks before a pull request

Run these from the repository root. CI runs all of them except `pnpm typecheck` and
`pnpm i18n:check`, so those two only get checked here.

| Command                                   | What it checks                                                                                             | Time    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------- |
| `pnpm lint`                               | ESLint on every package (code style, Vue and TypeScript rules)                                             | ~1 min  |
| `pnpm --filter @rotki/website lint:style` | Stylelint on CSS and `<style>` blocks                                                                      | <1 min  |
| `pnpm typecheck`                          | TypeScript and Vue templates, including missing imports                                                    | ~2 min  |
| `pnpm test`                               | Unit tests (Vitest)                                                                                        | ~1 min  |
| `pnpm i18n:check`                         | Unused translation keys in `en.json`                                                                       | seconds |
| `pnpm build`                              | The static site and the card app, as deployed                                                              | ~2 min  |
| `pnpm check:routes`                       | Every route resolves in the build (run after `pnpm build`)                                                 | seconds |
| `pnpm check:card-bundle`                  | No unreviewed package in the card payment page (after `pnpm build`)                                        | seconds |
| `pnpm --filter @rotki/website seo:audit`  | Titles, descriptions, canonicals, `<h1>` on every public page (after a build with the production base URL) | seconds |
| `pnpm lighthouse`                         | Lighthouse scores of four public pages (after the same build)                                              | ~3 min  |
| `pnpm test:e2e`                           | End-to-end tests in Chromium (Playwright)                                                                  | ~4 min  |
| `make test-go`                            | Go server tests, when `backend/` changed                                                                   |         |

`pnpm lint:fix` fixes most lint errors by itself.

`pnpm test:e2e` starts its own mock API, Nuxt dev server and Go server on ports 48123 to 48125,
so it can run while `make dev` is up. It uses four workers by default. On a busy machine, pass
`--workers=2`. The first test can wait up to a minute while the dev server compiles. To run one
file:

```bash
pnpm --filter @rotki/website exec playwright test tests/e2e/specs/pages/signup.spec.ts
```

The HTML report lands in `packages/website/playwright-report/`.

### What to run for what change

| Change                                             | Minimum                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Text or translations only                          | `pnpm lint`, `pnpm i18n:check`, look at the page                                                                    |
| A component, page or style                         | lint, typecheck, unit tests, the page in the browser at the three widths                                            |
| A public page (layout, images, copy, metadata)     | the row above, plus the [SEO audit, chunk check and Lighthouse](#seo-and-lighthouse-on-public-pages) against `main` |
| Routing, page meta, data loading, `nuxt.config.ts` | all of the above, plus `pnpm build`, `pnpm check:routes` and `pnpm test:e2e`                                        |
| Checkout, card or payment code                     | everything in the table, plus a run on staging with sandbox payments                                                |
| Go server (`backend/`)                             | `make test-go`, `make lint-go`, plus the pages it serves                                                            |

## Things that break quietly

- **Links in e-mails.** The backend sends e-mails that link to fixed paths. Do not rename those
  pages or their query parameters (list in [README.md](README.md#links-sent-in-emails)).
- **Imports.** Nothing is auto-imported. Import `ref`, `computed` and the rest from `'vue'`, Nuxt
  composables from `'#app'`, and `Rui*` components from `'@rotki/ui-library/components'`. Never
  name a local variable `ref`, `computed` or another Vue API name: the bundler can miscompile it,
  and the page fails only in the build.
- **Translation keys.** Use full keys such as `t('home.title')`, never keys built with `${}`.
  `pnpm i18n:check` cannot see built keys.

## Pull requests

- Branch from `main`. Name it `type/short-description`, for example `fix/pricing-table-overflow`.
- Write commits as conventional commits: `fix(checkout): keep the plan when going back`. CI checks
  them with commitlint.
- In the description, say what you checked and how (which pages, which widths, which backend),
  and what you did not check.

# rotki.com

The [rotki.com](https://rotki.com) website: the public pages, the premium checkout, account
management and NFT sponsorship.

It is a pnpm workspace:

| Package                        | What it is                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `packages/website`             | The Nuxt site, generated as static files (SSG)                                                  |
| `packages/card-payment`        | The card checkout app, served under `/checkout/pay/card` with its own CSP                       |
| `packages/card-payment-common` | Schemas and helpers shared by the website and the card app                                      |
| `packages/sigil`               | The analytics event catalog                                                                     |
| `backend/`                     | The Go server: serves the generated files and a few `/api` routes ([README](backend/README.md)) |

In production there is no Node.js: one Go binary serves the generated files, and Traefik routes
`/webapi` and `/media` to the Python backend (rotki-web).

## Requirements

- Node.js 24 (see `.nvmrc`) and pnpm 12
- Go 1.27+ for the backend

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
pnpm typecheck
make test-go       # Go tests
```

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

`/home/payment-methods`, the old name of the saved cards page, still appears in sent emails. The
Go server redirects it to `/home/saved-cards`; keep that redirect.

## License

rotki.com is licensed under the [GNU Affero General Public License v3.0](LICENSE.md).

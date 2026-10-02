# rotki.com

## Build Setup

```bash
# install dependencies
$ pnpm install

# serve with hot reload at localhost:3000
$ make dev-web

# or start both Go backend + Nuxt dev server
$ make dev

# build for production and launch server
$ pnpm run build
$ pnpm start
```

## Setting up the environment

Make sure the environment file exists

```bash
$ touch .env
```

To avoid api call loop, which freezes the app, do not set the variable to `/`

```dotenv
NUXT_PUBLIC_BASE_URL=http://localhost:3000
```

And input the RECAPTCHA public key there.

```dotenv
NUXT_PUBLIC_RECAPTCHA_SITE_KEY=XXXX
```

You can get a testing key
from [developers google](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do).

if you are running behind https make sure to also add:

```dotenv
NUXT_PUBLIC_BASE_URL=https://localhost
NODE_TLS_REJECT_UNAUTHORIZED=0
```

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

You can configure the frontend to proxy the `/webapi` to a server running somewhere:

For the `production` system you could use:

```dotenv
PROXY_DOMAIN=rotki.com
```

or if `staging` is running you could set:

```dotenv
PROXY_DOMAIN=staging.rotki.com
```

If the server where you proxy doesn't run using `https` you can set so that the backend requests are proxied to `http`:

```dotenv
PROXY_INSECURE=true
```

## Run

Run with the development server with the following command:

```bash
# Both Go backend + Nuxt dev server (recommended)
$ make dev

# Nuxt dev server only (accepts self-signed certs)
$ make dev-web

# Go backend only (dev mode)
$ make dev-go
```

## Testing Production Build Locally

When testing locally, it's recommended to use the production build behind a proxy instead of the development server:

```bash
$ pnpm run build
$ pnpm run preview
```

This is important because SSR (Server-Side Rendering) behaves differently between development mode and production builds. Running `pnpm run build` creates the same code that runs in production, and `pnpm run preview` runs a single-threaded Node server serving the final Nuxt app—similar to how it runs in Docker.

## Lint

To fix any lint errors you have to run

```bash
pnpm lint:js --fix
```

## Tests

to run vitest

```bash
pnpm test

# run watch mode
pnpm test:watch
```

## Changes to activation, subscription and payment links

For to the following urls, any change requires backend sync to avoid broken email links.

/password/reset/[uid]/[token]
/activate/[uid]/[token]/
/checkout/pay/method?p=[number_of_months]&id=[subscription_id]
/home

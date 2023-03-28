# rotki.com

## Build Setup

```bash
# install dependencies
$ pnpm install

# serve with hot reload at localhost:3000
$ pnpm run dev

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
## Run
Run with the development server with the following command:

```bash
$ pnpm run dev
```

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

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

## Run

Make sure the environment file exists

```bash
$ touch .env
```

And input the RECAPTCHA public key there.

```
RECAPTCHA_SITE_KEY=XXXX
```

You can get a testing key from [developers google](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do).

if you are running behind https make sure to also add:
```
BASE_URL=https://localhost
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Run with

```bash
$ pnpm run dev
```


## Lint

To fix any lint errors you have to run

```bash
pnpm lint:js --fix
```

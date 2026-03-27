# rotki.com Go Backend

A lightweight Go server that serves the static Nuxt-generated site, handles API routes (OAuth, NFT sponsorship, ENS avatars, releases, CSP reports), and reverse-proxies `/webapi` + `/media` to the Python backend.

## Quick Start

```bash
# Development (two terminals)
# Terminal 1: Start Nuxt dev server on port 3001
pnpm dev:website

# Terminal 2: Start Go backend on port 3000, proxying to Nuxt
cd backend && make dev

# Open http://localhost:3000 — Go handles API routes, proxies pages/assets to Nuxt

# Production (Docker)
make build
STATIC_DIR=../dist ./server

# Local production-like setup (with rotkehlchen-web docker-compose)
cd .. && pnpm run build        # Nuxt SSG → .output/public/
cd backend && make build        # Go binary → ./server
PORT=3000 \
  STATIC_DIR=../.output/public \
  BASE_URL=https://localhost \
  LOG_LEVEL=debug \
  REDIS_HOST=localhost \
  REDIS_PASSWORD=<your-redis-password> \
  TLS_SKIP_VERIFY=true \
  ./server
```

## Requirements

- Go 1.26+
- golangci-lint v2 (for linting)
- Redis (optional — used for L2 cache; falls back to memory-only if unavailable)

## Environment Variables

| Variable                 | Default                    | Dev default             | Description                                                                |
| ------------------------ | -------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `PORT`                   | `4000`                     | `3000`                  | HTTP listen port                                                           |
| `STATIC_DIR`             | `./dist`                   | `./dist`                | Path to Nuxt-generated static files                                        |
| `BASE_URL`               | `http://localhost:{PORT}`  | `http://localhost:3000` | Public base URL                                                            |
| `GOOGLE_CLIENT_SECRET`   | _(empty)_                  |                         | Google OAuth client secret                                                 |
| `MONERIUM_CLIENT_SECRET` | _(empty)_                  |                         | Monerium OAuth client secret                                               |
| `MONERIUM_AUTH_BASE_URL` | `https://api.monerium.dev` |                         | Monerium auth API base URL                                                 |
| `REDIS_HOST`             | _(empty)_                  |                         | Redis address (e.g. `localhost:6379`)                                      |
| `REDIS_PASSWORD`         | _(empty)_                  |                         | Redis password                                                             |
| `IMAGE_CACHE_DIR`        | `./image-cache`            |                         | Directory for filesystem image cache                                       |
| `DEV_MODE`               | `false`                    |                         | Enable dev-only features (changes defaults below)                          |
| `NUXT_DEV_URL`           | _(empty)_                  | `http://localhost:3001` | Nuxt dev server URL — proxies pages/assets instead of serving static files |
| `PROXY_DOMAIN`           | _(empty)_                  |                         | Backend domain for `/webapi` + `/media` reverse proxy                      |
| `PROXY_INSECURE`         | `false`                    |                         | Use HTTP instead of HTTPS for proxy                                        |
| `TLS_SKIP_VERIFY`        | `false`                    |                         | Skip TLS certificate verification for backend API calls (NFT config)       |
| `LOG_LEVEL`              | `info`                     |                         | Log level: `debug`, `info`, `warn`, `error`                                |
| `GITHUB_WEBHOOK_SECRET`  | _(empty)_                  |                         | Shared secret for GitHub webhook signature verification                    |
| `SPONSORSHIP_ENABLED`    | `false`                    |                         | Expose sponsorship as enabled via `/api/config` (frontend feature flag)    |
| `MAINTENANCE`            | `false`                    |                         | Expose maintenance mode via `/api/config` (frontend feature flag)          |
| `TESTING`                | `false`                    |                         | Expose testing mode via `/api/config` (frontend feature flag)              |

## Architecture

```
cmd/server/main.go          Entry point, config loading, graceful shutdown
internal/
  config/                    Environment-based configuration
  server/                    HTTP server, middleware (security headers, recovery, access log)
    static.go                Static file serving with SPA fallback and cache control
    security.go              Default security headers
  api/
    routing/                 Route registration
    csp/                     CSP violation report endpoint
    ens/                     ENS avatar proxy (resolves ENS names to avatar images)
    nft/                     NFT tier-info, token metadata, image proxy
    oauth/                   OAuth token exchange (Google, Monerium)
    releases/                GitHub releases with multi-level caching
    webhooks/                GitHub webhook handler (release cache invalidation)
  cache/                     L1 (memory) + L2 (Redis) cache with distributed locking
  csp/                       CSP middleware (nonce injection into HTML responses)
  images/                    Image proxy with filesystem cache, dedup, conditional requests
  nft/                       NFT core service (blockchain interaction, metadata, ABI)
  proxy/                     Reverse proxy for /webapi and /media
  safedialer/                SSRF-safe dialer (blocks private/loopback IPs)
  scheduler/                 Background task scheduler (cache warming)
  validate/                  Input validation utilities
  version/                   Build version injection via ldflags
```

## API Routes

| Method | Path                        | Description                                       |
| ------ | --------------------------- | ------------------------------------------------- |
| `GET`  | `/health`                   | Health check (JSON)                               |
| `GET`  | `/api/config`               | Runtime app config (feature flags)                |
| `POST` | `/api/oauth/google/token`   | Google OAuth token exchange                       |
| `POST` | `/api/oauth/monerium/token` | Monerium OAuth token exchange (PKCE)              |
| `POST` | `/api/csp/violation`        | CSP violation report collector                    |
| `GET`  | `/api/releases/latest`      | GitHub releases (cached)                          |
| `GET`  | `/api/ens/avatar`           | ENS avatar image proxy                            |
| `GET`  | `/api/nft/tier-info`        | NFT tier information                              |
| `GET`  | `/api/nft/{id}`             | NFT token metadata                                |
| `GET`  | `/api/nft/image`            | NFT image proxy (IPFS)                            |
| `POST` | `/api/webhooks/github`      | GitHub webhook for release/NFT cache invalidation |
| `*`    | `/webapi/**`                | Reverse proxy to Python backend                   |
| `*`    | `/media/**`                 | Reverse proxy to Python backend                   |

## Development

```bash
make dev         # Run in dev mode (port 3000, proxies to Nuxt on 3001)
make run         # Run the server (requires static files)
make build       # Build production binary
make help        # Show all available targets
make check       # Run vet + lint + tests
make test        # Run tests
make test-race   # Run tests with race detector
make coverage    # Generate coverage report
make lint        # Run golangci-lint
make lint-fix    # Auto-fix lint issues
make fmt         # Format with gofumpt
make tidy        # Tidy go.mod
make clean       # Remove build artifacts
```

## Dev Mode

`make dev` sets `DEV_MODE=true` which changes defaults for local development:

- **Port 3000** instead of 4000 (matches the URL you use in the browser)
- **Nuxt proxy** enabled automatically (`NUXT_DEV_URL=http://localhost:3001`) — all non-API requests are forwarded to the Nuxt dev server, including WebSocket for HMR
- **`PROXY_DOMAIN`** / **`PROXY_INSECURE`**: Can optionally reverse-proxy `/webapi` and `/media` to the Python backend (in production, Traefik handles this)

All dev-only flags (`NUXT_DEV_URL`, `PROXY_DOMAIN`, `PROXY_INSECURE`) are rejected at startup if `DEV_MODE` is not set, preventing accidental use in production.

`NUXT_DEV_URL` and a custom `STATIC_DIR` are mutually exclusive — you either proxy to Nuxt or serve static files, not both. Set `NUXT_DEV_URL=""` to disable the proxy in dev mode if you want to serve static files instead.

## Caching Strategy

- **Memory (L1)**: In-process cache for hot data (releases, NFT config)
- **Redis (L2)**: Shared cache across instances (optional, degrades gracefully)
- **Filesystem**: Image cache stored on disk with SHA-256 hashed filenames, served via zero-copy `http.ServeContent`
- **Background warming**: Scheduler pre-warms NFT image and release caches on configurable intervals

## GitHub Webhook

The `POST /api/webhooks/github` endpoint receives GitHub release events and invalidates caches immediately instead of waiting for the 2-hour scheduler cycle.

### Cache invalidation by release type

| Release type    | Example   | Caches invalidated |
| --------------- | --------- | ------------------ |
| **Patch**       | `v1.35.1` | Release only       |
| **Minor/Major** | `v1.35.0` | Release + NFT      |

Classification is convention-based: patch segment > 0 means patch release. Unparseable tags default to minor/major (invalidate more, not less).

### Security

- HMAC-SHA256 signature verification (`X-Hub-Signature-256` header)
- Body size limit (64 KB)
- Rate limiting (1 invalidation per minute)
- Only `release` events with `action: published` trigger invalidation

### Testing locally

```bash
# 1. Start the server with a test secret
GITHUB_WEBHOOK_SECRET=mysecret DEV_MODE=true make dev

# 2. Compute the HMAC signature for a test payload
PAYLOAD='{"action":"published","release":{"tag_name":"v1.36.0"}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "mysecret" | awk '{print "sha256="$2}')

# 3. Send a test webhook
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $SIG" \
  -H "X-GitHub-Event: release" \
  -H "X-GitHub-Delivery: test-$(uuidgen)" \
  -d "$PAYLOAD"

# 4. Test a ping event
PING='{"zen":"Keep it logically awesome."}'
PING_SIG=$(echo -n "$PING" | openssl dgst -sha256 -hmac "mysecret" | awk '{print "sha256="$2}')
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $PING_SIG" \
  -H "X-GitHub-Event: ping" \
  -d "$PING"

# 5. Verify signature rejection (should return 403)
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -H "X-GitHub-Event: release" \
  -d "$PAYLOAD"
```

### Generating a secret

```bash
# Option 1: openssl (recommended)
openssl rand -hex 32

# Option 2: /dev/urandom
head -c 32 /dev/urandom | xxd -p -c 64
```

Use the same value for both the `GITHUB_WEBHOOK_SECRET` env var and the GitHub webhook configuration.

### GitHub setup

1. Repo Settings → Webhooks → Add webhook
2. Payload URL: `https://rotki.com/api/webhooks/github`
3. Content type: `application/json`
4. Secret: value of `GITHUB_WEBHOOK_SECRET`
5. Events: select only **Releases**

## Static File Serving

- Hashed assets (`/_nuxt/*`) get `Cache-Control: public, max-age=31536000, immutable`
- HTML files get `Cache-Control: no-cache, no-store, must-revalidate` (enables CSP nonce injection)
- SPA fallback serves `200.html` (Nuxt SSG SPA shell) for client-side-only routes
- Path traversal protection via `path.Clean` and `..` detection

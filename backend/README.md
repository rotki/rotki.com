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

# Production
make build
STATIC_DIR=../dist ./server
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
| `LOG_LEVEL`              | `info`                     |                         | Log level: `debug`, `info`, `warn`, `error`                                |
| `SPONSORSHIP_ENABLED`    | `false`                    |                         | Enable NFT sponsorship endpoints                                           |

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

| Method | Path                        | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| `GET`  | `/health`                   | Health check (JSON)                  |
| `POST` | `/api/oauth/google/token`   | Google OAuth token exchange          |
| `POST` | `/api/oauth/monerium/token` | Monerium OAuth token exchange (PKCE) |
| `POST` | `/api/csp-report`           | CSP violation report collector       |
| `GET`  | `/api/releases`             | GitHub releases (cached)             |
| `GET`  | `/api/ens/avatar`           | ENS avatar image proxy               |
| `GET`  | `/api/nft/tier-info`        | NFT tier information                 |
| `GET`  | `/api/nft/{id}`             | NFT token metadata                   |
| `GET`  | `/api/nft/image`            | NFT image proxy (IPFS)               |
| `*`    | `/webapi/**`                | Reverse proxy to Python backend      |
| `*`    | `/media/**`                 | Reverse proxy to Python backend      |

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

## Static File Serving

- Hashed assets (`/_nuxt/*`) get `Cache-Control: public, max-age=31536000, immutable`
- HTML files get `Cache-Control: no-cache, no-store, must-revalidate` (enables CSP nonce injection)
- SPA fallback walks up the directory tree to find the nearest `index.html`
- Path traversal protection via `path.Clean` and `..` detection

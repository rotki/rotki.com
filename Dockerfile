# Stage 1: Build static site (SSG)
FROM node:24-alpine AS frontend

COPY ./ /build/
WORKDIR /build

ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
ENV CYPRESS_INSTALL_BINARY=0

# Nuxt public runtime config (baked into static output at build time)
ARG NUXT_PUBLIC_BASE_URL
ARG NUXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NUXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ARG NUXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NUXT_PUBLIC_MONERIUM_AUTH_BASE_URL
ARG NUXT_PUBLIC_MONERIUM_AUTHORIZATION_CODE_FLOW_CLIENT_ID

ENV NUXT_PUBLIC_BASE_URL=${NUXT_PUBLIC_BASE_URL}
ENV NUXT_PUBLIC_RECAPTCHA_SITE_KEY=${NUXT_PUBLIC_RECAPTCHA_SITE_KEY}
ENV NUXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${NUXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}
ENV NUXT_PUBLIC_GOOGLE_CLIENT_ID=${NUXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NUXT_PUBLIC_MONERIUM_AUTH_BASE_URL=${NUXT_PUBLIC_MONERIUM_AUTH_BASE_URL}
ENV NUXT_PUBLIC_MONERIUM_AUTHORIZATION_CODE_FLOW_CLIENT_ID=${NUXT_PUBLIC_MONERIUM_AUTHORIZATION_CODE_FLOW_CLIENT_ID}

RUN --mount=type=cache,target=/root/.npm/_cacache/ \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    npm install -g corepack@latest && \
    corepack enable && \
    pnpm install --frozen-lockfile && \
    pnpm run build

# Stage 2: Build Go binary
FROM golang:1.26-alpine AS backend

ARG GIT_SHA
ARG VERSION

WORKDIR /build
COPY backend/ ./

RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 GOOS=linux go build \
    -ldflags "-s -w \
      -X github.com/rotki/rotki.com/backend/internal/version.Version=${VERSION} \
      -X github.com/rotki/rotki.com/backend/internal/version.GitSHA=${GIT_SHA}" \
    -o /server ./cmd/server

# Stage 3: Production — single binary + static files (no OS, no shell)
FROM scratch

ARG GIT_SHA
ARG VERSION
ARG BUILD_DATE

LABEL org.opencontainers.image.title="rotki.com"
LABEL org.opencontainers.image.description="rotki.com website"
LABEL org.opencontainers.image.source="https://github.com/rotki/rotki.com"
LABEL org.opencontainers.image.url="https://rotki.com"
LABEL org.opencontainers.image.vendor="Rotki Solutions GmbH"
LABEL org.opencontainers.image.licenses="AGPL-3.0"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.revision="${GIT_SHA}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

COPY --from=backend /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=backend /server /server
COPY --from=frontend /build/.output/public /dist

EXPOSE 4000

ENTRYPOINT ["/server"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["/server", "healthcheck"]

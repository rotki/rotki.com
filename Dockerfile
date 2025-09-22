FROM node:22-alpine AS builder

COPY ./ /build/

WORKDIR /build

ENV CYPRESS_INSTALL_BINARY=0

RUN --mount=type=cache,target=/root/.npm/_cacache/ \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    npm install -g corepack@latest && \
    corepack enable && \
    pnpm install --frozen-lockfile && \
    pnpm run build

FROM node:22-alpine AS production

WORKDIR /app
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=4000

RUN --mount=type=cache,target=/root/.npm/_cacache/ \
    npm install -g pm2@6.0.11

COPY --from=builder /build/.output/ ./
COPY --from=builder /build/docker/ecosystem.config.cjs ./
COPY --from=builder /build/packages/website/package.json ./
COPY --from=builder /build/docker/health.sh ./

RUN chmod +x health.sh

EXPOSE ${NITRO_PORT}

CMD ["pm2-runtime", "ecosystem.config.cjs"]
HEALTHCHECK --start-period=30s --retries=2 \
    CMD ["/app/health.sh"]

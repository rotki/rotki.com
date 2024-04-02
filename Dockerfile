FROM node:20 as builder

COPY ./ /build/

WORKDIR /build

RUN --mount=type=cache,target=/root/.npm/_cacache/ \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    npm install -g pnpm@8 && \
    pnpm install --frozen-lockfile --no-optional && \
    pnpm run build

FROM node:20-alpine as production

WORKDIR /app
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=4000

RUN --mount=type=cache,target=/root/.npm/_cacache/ \
    npm install -g pm2@5.3.1

COPY --from=builder /build/.output ./.output/
COPY --from=builder /build/ecosystem.config.cjs ./
COPY --from=builder /build/package.json ./

EXPOSE ${NITRO_PORT}

CMD ["pm2-runtime", "ecosystem.config.cjs"]
HEALTHCHECK --start-period=30s --retries=2 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${NITRO_PORT}/health || exit 1

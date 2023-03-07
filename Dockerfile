FROM node:18 as builder

COPY ./ /build/

WORKDIR /build

RUN npm install -g pnpm && \
    pnpm install && \
    pnpm run build

FROM node:18-alpine as production

WORKDIR /app
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=4000

RUN npm install -g pm2@5.2.2

COPY --from=builder /build/.output ./
COPY --from=builder /build/ecosystem.config.js ./

EXPOSE ${NITRO_PORT}

CMD ["pm2-runtime", "ecosystem.config.js"]
HEALTHCHECK --start-period=30s --retries=2 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${NITRO_PORT}/health || exit 1

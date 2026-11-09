# syntax=docker/dockerfile:1

FROM node:24-slim AS build
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/node-sim/package.json apps/node-sim/
RUN pnpm install --frozen-lockfile --filter api...
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter api build
RUN mkdir /native \
  && cd /native \
  && npm init -y >/dev/null \
  && npm install --omit=dev --no-audit --no-fund \
    "better-sqlite3@$(node -p 'require("/repo/apps/api/package.json").dependencies["better-sqlite3"]')"

FROM node:24-slim
ENV NODE_ENV=production DATABASE_PATH=/data/gota.db PORT=3000
WORKDIR /app
COPY --from=build /native/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/drizzle ./drizzle
RUN mkdir /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/settings').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist/main.js"]

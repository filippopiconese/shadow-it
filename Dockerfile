# Single-stage build for the single-server deploy (API serves the built SPA).
# We install pnpm directly via npm to avoid Nixpacks' old corepack, which
# crashes on Node 24 + pnpm 11 (ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING).
FROM node:24-slim

# pnpm pinned to the version used to generate pnpm-lock.yaml.
RUN npm install -g pnpm@11.5.1

WORKDIR /app

# Install deps first (better layer caching) — needs the workspace manifests.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
COPY tsconfig.base.json tsconfig.json ./

# Install with --ignore-scripts: pnpm 11 otherwise exits non-zero in a non-TTY
# shell over "ignored" dependency build scripts. None of our deps need their
# postinstall to build/run — esbuild/rollup/lightningcss ship prebuilt platform
# binaries, and the API bundle/start needs no native compilation.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build all packages (typecheck + SPA build + API esbuild bundle).
# verify-deps-before-run=false skips pnpm's pre-run reinstall check (deps are
# already fully installed above).
RUN pnpm --config.verify-deps-before-run=false run build

EXPOSE 8080

# Apply DB schema (retry until the DB is reachable), then start the API.
# On Railway the deploy.startCommand in railway.json overrides this CMD.
CMD ["sh", "-c", "for i in 1 2 3 4 5; do pnpm --filter @workspace/db run push-force && break || (echo \"db push attempt $i failed, retrying in 4s...\"; sleep 4); done; node artifacts/api-server/dist/index.mjs"]

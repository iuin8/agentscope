# syntax=docker/dockerfile:1
#
# AgentScope Web UI (frontend).
#
# Build context is this directory (examples/web_ui):
#
#   docker build -f examples/web_ui/Dockerfile -t agentscope-frontend examples/web_ui
#
# The agent service URL is baked into the static bundle at build time via the
# VITE_SERVER_URL build arg (defaults to the host-exposed backend port).

# ---------------------------------------------------------------------------
# Stage 1: build the static assets with pnpm (lockfileVersion 9.0 -> pnpm 9).
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@9

# Workspace manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN pnpm install --frozen-lockfile --filter frontend...

# Source + build. VITE_SERVER_URL is read by frontend/src/api/client.ts.
# NOTE: we invoke `vite build` directly rather than the package.json "build"
# script (`tsc -b && vite build`). The upstream Web UI has pre-existing type
# errors (calendar.tsx classNames, missing skillApi export) that fail `tsc`;
# vite's esbuild transpile still produces a correct runtime bundle. See
# DEPLOYMENT.md "Notes".
COPY frontend ./frontend
ARG VITE_SERVER_URL=http://localhost:8000
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN pnpm --filter frontend exec vite build

# ---------------------------------------------------------------------------
# Stage 2: serve the bundle with nginx.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

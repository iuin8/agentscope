# syntax=docker/dockerfile:1
#
# AgentScope agent service (backend).
#
# Build context MUST be the repository root, because the image installs the
# local ``agentscope`` package from source:
#
#   docker build -f examples/agent_service/Dockerfile -t agentscope-backend .
#
# docker-compose.yml at the repo root already wires this up.

FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# ---------------------------------------------------------------------------
# System dependencies + Node.js 22 (required by the npx-based
# ``@playwright/mcp`` browser-use tool that main.py launches).
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates gnupg git \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------------------------------------------------------------------------
# Install AgentScope (full extras) from source. Copy only the files pip needs
# first so this layer is cached unless the package itself changes.
# ---------------------------------------------------------------------------
COPY pyproject.toml README.md ./
COPY src ./src
# AgentScope depends on `ripgrep` (unpinned). The latest release (15.x) ships
# no linux/arm64 wheel, so on arm64 pip would fall back to building it from
# Rust source (needs a toolchain + crates.io). Pin to 14.1.0 first, which has
# prebuilt aarch64 AND x86_64 wheels — no Rust required — and agentscope[full]
# then accepts the already-installed version.
RUN pip install "ripgrep==14.1.0" \
    && pip install ".[full]"

# ---------------------------------------------------------------------------
# Pre-install the Playwright MCP server and the Chromium browser it drives.
# Both share the same globally-installed ``playwright`` dependency, so versions
# stay in sync. main.py invokes ``npx @playwright/mcp@latest`` at runtime.
# ---------------------------------------------------------------------------
RUN npm install -g @playwright/mcp@latest \
    && npx --yes playwright install --with-deps chromium \
    && npm cache clean --force

# ---------------------------------------------------------------------------
# Copy the agent service example and run it.
# ---------------------------------------------------------------------------
COPY examples/agent_service ./examples/agent_service
WORKDIR /app/examples/agent_service

# Container defaults (overridable via docker-compose / environment):
# - REDIS_HOST/REDIS_PORT point main.py at the redis service
# - UVICORN_RELOAD=false disables the dev autoreloader
ENV REDIS_HOST=redis \
    REDIS_PORT=6379 \
    UVICORN_RELOAD=false \
    PORT=8000

EXPOSE 8000

# Liveness probe against the OpenAPI schema endpoint (curl installed above).
# Shell form: curl -f exits non-zero on failure, driving the health status.
# docker-compose's frontend waits on this via `condition: service_healthy`.
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://localhost:8000/openapi.json || exit 1

CMD ["python", "main.py"]

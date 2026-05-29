# Docker Compose Deployment

Run the full AgentScope stack — **Redis + agent service (backend) + Web UI
(frontend)** — with a single command.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with the Compose plugin
  (`docker compose version` ≥ 2.x)
- ~3 GB free disk (the backend image bundles Node.js + Chromium for the
  Playwright browser-use tool)

## Quick start

From the repository root:

```bash
docker compose up --build
```

Then open **http://localhost:8080**. The Web UI is pre-configured to talk to
the backend at `http://localhost:8000`, so you can start chatting right away —
no manual server URL setup required.

Stop everything with `Ctrl+C`, or in another terminal:

```bash
docker compose down          # stop & remove containers
docker compose down -v       # also drop the redis + workspace volumes
```

## What gets started

| Service    | Image / build                         | Host port | Purpose                              |
| ---------- | ------------------------------------- | --------- | ------------------------------------ |
| `redis`    | `redis:7-alpine`                      | 6379*     | Storage backend for the agent service |
| `backend`  | `examples/agent_service/Dockerfile`   | 8000      | FastAPI agent service (multi-tenant) |
| `frontend` | `examples/web_ui/Dockerfile`          | 8080      | React Web UI served by nginx         |

\* Redis is bound to `127.0.0.1` only, for local debugging. Remove its `ports`
entry in `docker-compose.yml` if you don't need host access.

## Configuration

All configuration is optional. Copy the template and fill in what you need:

```bash
cp .env.example .env
```

- **Model credentials** — the recommended path is to add them in the Web UI
  per provider. You may also inject keys (`DASHSCOPE_API_KEY`,
  `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) via `.env`.
- **`AMAP_API_KEY`** — enables the Gaode/AMap MCP map tool in the backend.
- **`WEBUI_PORT`** — host port for the Web UI (default `8080`). Set it if
  `8080` is already taken, e.g. `WEBUI_PORT=8090 docker compose up`. Redis is
  not published to the host, so it won't clash with a local redis on `6379`.
- **`BACKEND_PORT`** — host port for the backend (default `8000`). Set it if
  `8000` is already taken, e.g. `BACKEND_PORT=9000 docker compose up --build`.
  The container still listens on 8000 internally, and `VITE_SERVER_URL` follows
  this automatically — so rebuild the frontend (`--build`) when you change it.
- **`VITE_SERVER_URL`** — where the *browser* reaches the backend. It is baked
  into the frontend bundle at build time and by default follows `BACKEND_PORT`
  (`http://localhost:8000`). Set it explicitly only for a remote/custom backend,
  then rebuild: `docker compose up --build frontend`.

## Notes

- **Data persistence** — Redis data and agent workspaces live in named volumes
  (`redis-data`, `backend-workspaces`) and survive restarts.
- **Backend image size** — it ships Chromium so the `browser-use` MCP works out
  of the box. To slim it down, drop the `browser-use` MCP block in
  `examples/agent_service/main.py` and remove the Playwright steps from
  `examples/agent_service/Dockerfile`.
- **Frontend build** — the image runs `vite build` directly (not the
  `tsc -b && vite build` npm script). The upstream Web UI has pre-existing
  TypeScript errors (`calendar.tsx` classNames, a missing `skillApi` export)
  that make `tsc` fail; vite's transpile still emits a correct runtime bundle.
  Fixing those type errors is out of scope for the deployment setup.
- **Rebuild after code changes** — `docker compose up --build`. The backend
  installs `agentscope` from source, so source edits require a rebuild.
- **Production** — Compose is fine for a single host. For real workloads put a
  TLS-terminating reverse proxy in front, run the backend as a non-root user,
  and use an orchestrator (Kubernetes / ECS / Swarm).

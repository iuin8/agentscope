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

Then open **http://localhost:8080** — or **http://&lt;server-ip&gt;:8080** if you
deployed to a remote host. The Web UI reaches the backend same-origin through
nginx's `/api` reverse proxy, so it works on any host/IP with **no CORS issues
and no server-URL setup**. You're only asked for a username on first visit.

Stop everything with `Ctrl+C`, or in another terminal:

```bash
docker compose down          # stop & remove containers
docker compose down -v       # also drop the redis + workspace volumes
```

## What gets started

| Service    | Image / build                         | Host port | Purpose                              |
| ---------- | ------------------------------------- | --------- | ------------------------------------ |
| `redis`    | `redis:7-alpine`                      | —         | Storage backend (internal only)      |
| `backend`  | `examples/agent_service/Dockerfile`   | 8000      | FastAPI agent service (direct/debug) |
| `frontend` | `examples/web_ui/Dockerfile`          | 8080      | React Web UI + `/api` proxy (nginx)  |

Redis is not published to the host (only the backend reaches it on the compose
network), so it never clashes with a local redis on 6379. The backend port is
published for direct API access / debugging — the Web UI itself goes through the
frontend's `/api` proxy and doesn't need it.

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
- **`BACKEND_PORT`** — host port for *direct* backend access (default `8000`).
  The Web UI doesn't need it (it uses the `/api` proxy); set it only if 8000 is
  taken on the host. The container always listens on 8000 internally.
- **`VITE_SERVER_URL`** — optional, empty by default. The frontend calls the
  backend same-origin via the `/api` proxy (recommended). Set it only to bake a
  direct URL to a remote/standalone backend into the bundle, then rebuild:
  `docker compose up --build frontend`.

## Notes

- **Same-origin API** — the frontend's nginx reverse-proxies `/api/*` to the
  backend, so the browser only ever talks to the Web UI's own origin. No CORS,
  and the deployment works unchanged on localhost, a LAN IP, or a domain. The
  frontend still supports an explicit backend URL (Setup page / `server_url` /
  `VITE_SERVER_URL`) for connecting to a separate backend.
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

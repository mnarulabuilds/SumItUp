# Docker — build, test, and run SumItUp

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2)
- Optional: copy `.env.docker.example` → `.env.docker` and set `JWT_SECRET`  
  Compose reads `JWT_SECRET` from your shell or a root `.env` file automatically.

## Full stack (MongoDB + API + web UI)

Build compiled images and start everything:

```bash
npm run docker:build && npm run docker:up
# same as: npm run docker:build && npm run docker:up
```

| Service   | URL |
|-----------|-----|
| Web app   | http://localhost:8080 |
| API       | http://localhost:3000 |
| API health| http://localhost:3000/ |
| MongoDB   | localhost:27017 |

The web container proxies `/api` to the backend, so the exported Expo web build uses `EXPO_PUBLIC_API_URL=/api`.

Stop and remove containers (data volumes kept):

```bash
npm run docker:down
```

Follow logs:

```bash
npm run docker:logs
```

## Build images only

```bash
npm run docker:build
```

Images: `sumitup-backend:latest`, `sumitup-frontend:latest`, plus `mongo:7`.

## Unit tests inside Docker

```bash
npm run docker:test
```

Runs backend pytest and frontend Jest in isolated test targets (`backend-test`, `frontend-test`).

## Hybrid local dev (common)

**MongoDB in Docker**, API + Expo on your machine (simulators, hot reload):

```bash
npm run dev
```

**MongoDB + API in Docker**, Expo on host:

```bash
npm run docker:dev
npm run start --prefix frontend
```

## How images are built

- **Backend:** multi-stage Dockerfile — `pip install`, FastAPI via Uvicorn on port 3000.
- **Frontend:** Expo web export → nginx serves static files and reverse-proxies `/api` to `backend:3000`.

## Volumes

- `sumitup_mongo_data` — database files  
- `backend_uploads` — uploaded media for summarization  

To wipe data: `docker compose down -v` (destructive).

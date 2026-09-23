# SumItUp API (Python)

FastAPI backend with MongoDB. All routes are mounted under `/api/*`; health check at `/`.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

## Commands

| Script | Description |
|--------|-------------|
| `npm run dev` | Uvicorn with reload (port 3000) |
| `npm run start` | Production-style Uvicorn |
| `npm run test:unit` | pytest unit suite |
| `npm run test:coverage` | pytest with coverage |

From the repo root, `npm run install:all` creates `backend/.venv` and installs dependencies.

## Stack

- **FastAPI** + **Uvicorn**
- **Motor** (MongoDB)
- **PyJWT**, **bcrypt**
- **pytest** for tests

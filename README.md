# EvalForge

EvalForge is a portfolio-grade AI response evaluation platform. Give it a task and two candidate responses; it scores each against a transparent five-part rubric, explains the decision, and saves every run for later analysis.

![EvalForge dashboard preview](https://placehold.co/1200x675/09090b/f8fafc?text=EvalForge+%E2%80%94+AI+Response+Evaluation)

## What it does

- Compares Response A and Response B side by side.
- Scores **correctness**, **code quality**, **efficiency**, **helpfulness**, and **safety** from 1–10.
- Selects A, B, or a tie with a human-readable rationale and confidence.
- Stores evaluation history in PostgreSQL and exposes it through a versioned REST API.
- Uses an OpenAI-compatible judge when configured; otherwise falls back to a deterministic, inspectable rubric so the product works locally with no API key.
- Includes backend unit/API tests, frontend component tests, Playwright end-to-end coverage, Docker Compose, and GitHub Actions.

## Architecture

```text
Next.js 14 + TypeScript + Tailwind  ──REST──>  FastAPI + SQLAlchemy  ──> PostgreSQL
        (port 3000)                            (port 8000)
                                                   │
                                           AI judge or local rubric
```

## Quick start

The simplest path is Docker Compose (Docker Desktop required):

```bash
cp .env.example .env
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

To enable the AI judge, add `OPENAI_API_KEY` to `.env`. Without a key EvalForge deliberately uses its local rubric engine, which makes demos, tests, and privacy-sensitive development dependable.

### Run without Docker

Requirements: Python 3.11+ and Node 20+ (PostgreSQL is optional for local testing; SQLite is used automatically when `DATABASE_URL` is not set).

```bash
# terminal 1
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# terminal 2
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` when the frontend is not run with Docker.

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/evaluations` | Run and persist an evaluation |
| `GET` | `/api/v1/evaluations` | List recent evaluations |
| `GET` | `/api/v1/evaluations/{id}` | Get a single evaluation |

Example request:

```bash
curl -X POST http://localhost:8000/api/v1/evaluations \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Write a safe Python function that parses an integer.",
    "response_a": "def parse(value): return int(value)",
    "response_b": "def parse(value):\\n    try: return int(value)\\n    except (TypeError, ValueError): return None"
  }'
```

## Testing

```bash
# Backend unit and REST API tests
cd backend && pytest

# Frontend component tests
cd frontend && npm test -- --run

# First time only: install Chromium for Playwright
cd frontend && npx playwright install --with-deps chromium
npm run test:e2e
```

`make test` runs backend and frontend test suites. In CI, the workflows run lint/type checks, the backend suite, frontend tests, and Playwright.

## Project layout

```text
backend/       FastAPI app, judge abstraction, SQLAlchemy model, pytest suite
frontend/      Next.js app, responsive dashboard, Vitest and Playwright suites
.github/       Continuous integration workflow
docker-compose.yml
```

## Design notes

The evaluation result is stored as JSON scorecards, which keeps the current rubric compact and supports adding criteria without a migration. The judge is intentionally provider-agnostic: the HTTP call targets an OpenAI-compatible `/chat/completions` endpoint, but a validated schema protects the API from malformed model output.

## License

MIT

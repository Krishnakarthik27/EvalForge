.PHONY: dev dev-api dev-web test test-api test-web test-e2e docker-up docker-down

dev:
	docker compose up --build

dev-api:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-web:
	cd frontend && npm run dev

test: test-api test-web

test-api:
	cd backend && pytest

test-web:
	cd frontend && npm test -- --run

test-e2e:
	cd frontend && npm run test:e2e

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

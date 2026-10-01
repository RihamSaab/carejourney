.PHONY: install dev test lint lint-fix format typecheck check clean \
        db-up db-down db-logs db-upgrade db-downgrade db-revision db-current db-history

PY := .venv/bin/python
PIP := .venv/bin/pip
ALEMBIC := .venv/bin/alembic
COMPOSE := docker compose -f ../../infrastructure/docker-compose.yml

install:
	python3 -m venv .venv
	$(PIP) install --upgrade pip
	$(PIP) install -e ".[dev]"

dev:
	$(PY) -m uvicorn hospital_api.app:app --reload --host 0.0.0.0 --port 8000

test:
	$(PY) -m pytest

lint:
	$(PY) -m ruff check .

lint-fix:
	$(PY) -m ruff check --fix .

format:
	$(PY) -m ruff format .

typecheck:
	$(PY) -m mypy

check: lint typecheck test

clean:
	rm -rf .venv .pytest_cache .mypy_cache .ruff_cache build dist *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +

db-up:
	$(COMPOSE) up -d postgres

db-down:
	$(COMPOSE) down

db-logs:
	$(COMPOSE) logs -f postgres

db-upgrade:
	$(ALEMBIC) upgrade head

db-downgrade:
	$(ALEMBIC) downgrade -1

db-revision:
	@if [ -z "$(m)" ]; then echo "Usage: make db-revision m=\"your message\""; exit 1; fi
	$(ALEMBIC) revision --autogenerate -m "$(m)"

db-current:
	$(ALEMBIC) current

db-history:
	$(ALEMBIC) history --verbose

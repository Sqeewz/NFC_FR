.PHONY: up down build seed test ps logs

up:
	sg docker -c "docker compose up -d"

down:
	sg docker -c "docker compose down"

build:
	sg docker -c "docker compose build"

rebuild:
	sg docker -c "docker compose up -d --build"

seed:
	curl http://localhost:4000/api/seed

test:
	sg docker -c "docker compose exec backend cargo test"

ps:
	sg docker -c "docker compose ps"

logs:
	sg docker -c "docker compose logs -f"

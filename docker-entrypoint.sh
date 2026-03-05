#!/bin/sh
# Roda migrations e seeders antes de iniciar a aplicação.
# Usa a config compilada (dist/) — não depende de ts-node em produção.
set -e

echo "[entrypoint] Running migrations..."
node_modules/.bin/mikro-orm migration:up --config ./dist/config/mikro-orm.config.js

echo "[entrypoint] Running seeders..."
node_modules/.bin/mikro-orm seeder:run --config ./dist/config/mikro-orm.config.js

echo "[entrypoint] Starting application..."
exec "$@"

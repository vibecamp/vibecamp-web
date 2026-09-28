#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?set DATABASE_URL to an EMPTY database; it will be migrated}"

node -e "
const { Client } = require('pg')
const c = new Client({ connectionString: process.env.DATABASE_URL })
c.connect().then(async () => {
    const t = await c.query(\"select count(*)::int as n from information_schema.tables where table_schema = 'public'\")
    if (t.rows[0].n !== 0) { console.error('Refusing: database is not empty'); process.exit(2) }
    await c.end()
})"

pnpm drizzle-kit migrate

tmp="$(mktemp -d)"
pnpm drizzle-kit pull --dialect postgresql --url "$DATABASE_URL" --out "$tmp" --introspect-casing preserve >/dev/null
if diff <(scripts/canonical-snapshot.py src/db/schema.snapshot.json) <(scripts/canonical-snapshot.py "$tmp"/meta/0000_snapshot.json); then
    echo "MIGRATE-CHECK OK: migrations reproduce the committed schema"
else
    echo "MIGRATE-CHECK FAILED: the migrated database does not match src/db/schema.snapshot.json (re-run scripts/pull-schema.sh if the migration is correct)" >&2
    exit 1
fi

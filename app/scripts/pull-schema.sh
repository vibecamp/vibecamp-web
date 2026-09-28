#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -z "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | cut -d= -f2-)"
fi
tmp="$(mktemp -d)"
pnpm drizzle-kit pull --dialect postgresql --url "$DATABASE_URL" --out "$tmp" --introspect-casing preserve >/dev/null
scripts/fix-pulled-schema.sh "$tmp/schema.ts"
{
    cat <<'HEADER'
// Generated from the migrated database; edit migrations instead.
HEADER
    cat "$tmp/schema.ts"
} > src/db/schema.ts
scripts/canonical-snapshot.py "$tmp"/meta/0000_snapshot.json > src/db/schema.snapshot.json
rm -rf "$tmp"
echo "src/db/schema.ts and src/db/schema.snapshot.json regenerated"

#!/usr/bin/env bash
set -euo pipefail

# Clone *schema only* from Postgres database A into empty database B.
#
# Usage:
#   ./clone_schema.sh "postgres://user:pass@host:5432/dbA" "postgres://user:pass@host:5432/dbB"
#
# Notes:
# - Database B should already exist and be empty (or at least not contain conflicting objects).
# - This copies tables, views, sequences, types, functions, triggers, indexes, constraints, etc.
# - For safer credential handling, prefer ~/.pgpass over embedding passwords in URLs.

SRC_URL="postgres://vibecamp_db_u5bt_user_readonly:9787823429399062@dpg-cjl6ggfv9s6c73bi6g2g-a.oregon-postgres.render.com/vibecamp_db_u5bt"
DST_URL="postgresql://vibecamp_db_test_user:xcbhZsCpem3G9dW5XW3vBnM2flWHr25o@dpg-d59ahrm3jp1c73busoi0-a.oregon-postgres.render.com/vibecamp_db_test"

if [[ -z "${SRC_URL}" || -z "${DST_URL}" ]]; then
  echo "Usage: $0 <SOURCE_DATABASE_URL> <DEST_DATABASE_URL>" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Error: pg_dump not found. Install PostgreSQL client tools." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql not found. Install PostgreSQL client tools." >&2
  exit 1
fi

echo "Cloning schema from:"
echo "  SOURCE: ${SRC_URL}"
echo "  DEST:   ${DST_URL}"
echo

# --no-owner/--no-privileges makes restores less picky across environments/roles.
# --if-exists is *not* used here because you said DEST is empty.
# You can add --verbose for more output.
pg_dump \
  --schema-only \
  --no-owner \
  --no-privileges \
  "${SRC_URL}" \
| psql \
  --set ON_ERROR_STOP=on \
  "${DST_URL}"

echo
echo "Done. Schema cloned successfully."

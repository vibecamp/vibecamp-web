#!/usr/bin/env bash
set -euo pipefail
f="$1"
sed -i \
    -e '/^[[:space:]]*\/\//d' \
    -e '1i import type { PgTableExtraConfigValue } from "drizzle-orm/pg-core"' \
    -e 's/}, (table) => \[/}, (table): PgTableExtraConfigValue[] => [/' \
    -e 's/^import { \(.*\) } from "drizzle-orm\/pg-core"$/import { \1, customType } from "drizzle-orm\/pg-core"/' \
    -e '/\/\/ TODO: failed to parse database type .bytea./d' \
    -e 's/unknown("image_data")/bytea("image_data")/' \
    -e 's/export const "purchase sorted" = pgView(/export const purchase_sorted = pgView(/' \
    -e '/^import { sql } from "drizzle-orm"$/a\
\
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType() { return "bytea" } })' \
    "$f"

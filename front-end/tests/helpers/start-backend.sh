#!/usr/bin/env bash
# Starts the back-end, optionally reading the Stripe webhook secret
# captured by start-stripe-listen.sh.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SECRET_FILE="$SCRIPT_DIR/../../.stripe-webhook-secret"

if [ -f "$SECRET_FILE" ]; then
    export STRIPE_SIGNING_SECRET="$(cat "$SECRET_FILE")"
fi

cd "$SCRIPT_DIR/../../../back-end"
exec deno run --allow-net --allow-env --allow-read index.ts

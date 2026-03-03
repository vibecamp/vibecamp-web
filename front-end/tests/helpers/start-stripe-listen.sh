#!/usr/bin/env bash
# Starts `stripe listen` for webhook forwarding during tests.
# First captures the signing secret to a file, then runs the listener.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SECRET_FILE="$SCRIPT_DIR/../../.stripe-webhook-secret"

# Get the signing secret
stripe listen --print-secret > "$SECRET_FILE" 2>/dev/null

# Run stripe listen in the foreground
exec stripe listen --forward-to localhost:10000/purchase/record

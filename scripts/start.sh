#!/bin/sh
set -e
PORT="${PORT:-8080}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"
exec npx next start -H "$HOSTNAME" -p "$PORT"

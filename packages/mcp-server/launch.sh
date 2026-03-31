#!/bin/bash
# HumanCheckMe MCP Server Launcher
# Ensures env vars are available to the MCP server process

DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env from project root if exists
ENV_FILE="$DIR/../../.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

exec npx tsx "$DIR/src/server.ts"

#!/usr/bin/env node

/**
 * HumanCheck MCP — CLI entry point
 *
 * Routes to either the init command or the MCP server.
 *
 * Usage:
 *   npx @humancheck/mcp-server init --key hcm_xxx
 *   npx @humancheck/mcp-server (starts MCP server)
 */

if (process.argv[2] === "init") {
  import("./init.js");
} else {
  import("./server.js");
}

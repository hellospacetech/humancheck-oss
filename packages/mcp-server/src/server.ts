#!/usr/bin/env node

/**
 * HumanCheckMe MCP Server — stdio transport
 *
 * For local usage via `npx @humancheck/mcp-server`.
 * Remote HTTP transport is served by the Express API server.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createApiClient } from "./api-client.js";
import { registerTools } from "./register-tools.js";
import { HUMANCHECK_INSTRUCTIONS } from "./instructions.js";

// --- Initialize API client ---
let apiClient;
try {
  apiClient = createApiClient();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[HumanCheckMe MCP] Error: ${message}\n`);
  process.exit(1);
}

// --- Create MCP server ---
const server = new McpServer(
  { name: "humancheckme", version: "0.1.0" },
  { capabilities: { tools: {} }, instructions: HUMANCHECK_INSTRUCTIONS }
);

registerTools(server, apiClient);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[HumanCheckMe MCP] Server started on stdio\n");
}

main().catch((error) => {
  process.stderr.write(
    `[HumanCheckMe MCP] Fatal error: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});

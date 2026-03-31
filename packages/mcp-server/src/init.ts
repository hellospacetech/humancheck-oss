#!/usr/bin/env node

/**
 * HumanCheck MCP Server — Init CLI
 *
 * Sets up .mcp.json in the current directory for Claude Code integration.
 *
 * Usage:
 *   npx humancheck-mcp init --key hcm_xxx
 *   npx humancheck-mcp init (interactive)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

const MCP_FILE = ".mcp.json";
const DEFAULT_API_URL = "https://api.humancheckme.com";

function parseArgs(args: string[]): { key?: string; url?: string } {
  const result: { key?: string; url?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--key" && args[i + 1]) {
      result.key = args[++i];
    } else if (args[i] === "--url" && args[i + 1]) {
      result.url = args[++i];
    }
  }
  return result;
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("\n  HumanCheck MCP Server Setup\n");

  // Get API key
  let apiKey = args.key;
  if (!apiKey) {
    apiKey = await prompt("  API Key: ");
  }

  if (!apiKey || !apiKey.startsWith("hcm_")) {
    console.error("  Error: Invalid API key. Must start with hcm_");
    console.error("  Get your key at https://app.humancheckme.com/settings\n");
    process.exit(1);
  }

  const apiUrl = args.url || DEFAULT_API_URL;

  // Verify key works
  try {
    const res = await fetch(`${apiUrl}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    console.error(`  Warning: Could not reach ${apiUrl}/api/health\n`);
  }

  // Read or create .mcp.json
  const mcpPath = join(process.cwd(), MCP_FILE);
  let config: any = { mcpServers: {} };

  if (existsSync(mcpPath)) {
    try {
      config = JSON.parse(readFileSync(mcpPath, "utf-8"));
      if (!config.mcpServers) config.mcpServers = {};
    } catch {
      console.error(`  Error: Could not parse existing ${MCP_FILE}`);
      process.exit(1);
    }
  }

  // Add/update humancheck config
  config.mcpServers.humancheck = {
    command: "npx",
    args: ["humancheck-mcp"],
    env: {
      HUMANCHECK_API_URL: apiUrl,
      HUMANCHECK_API_KEY: apiKey,
    },
  };

  writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n");

  console.log(`  ${existsSync(mcpPath) ? "Updated" : "Created"} ${MCP_FILE}`);
  console.log("");
  console.log("  Restart Claude Code to activate HumanCheck tools.");
  console.log("  Then try: \"Create a human test for my app\"\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

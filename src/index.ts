#!/usr/bin/env node
/**
 * Workadu MCP Server — Entry Point
 *
 * Model Context Protocol server that exposes Workadu API functionality
 * as tools for AI assistants (Claude, Gemini, Cursor, etc.).
 *
 * Usage:
 *   WORKADU_API_URL=https://your-app.workadu.com \
 *   WORKADU_API_KEY=your-api-key \
 *   node dist/index.js
 *
 * Or configure in Claude Desktop / Cursor MCP settings.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { WorkaduClient } from './client/workadu-client.js';
import { registerAllTools } from './tools/index.js';

async function main(): Promise<void> {
  // Load and validate configuration
  const config = loadConfig();

  // Create HTTP client for Workadu API
  const client = new WorkaduClient(config);

  // Create MCP server
  const server = new McpServer({
    name: 'workadu',
    version: '1.0.0',
  });

  // Register all tools
  registerAllTools(server, client);

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error starting Workadu MCP server:', error);
  process.exit(1);
});

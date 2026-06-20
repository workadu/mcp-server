#!/usr/bin/env node
/**
 * Workadu MCP Server — Entry Point
 *
 * Supports two transport modes:
 *   1. stdio  — for local use (Claude Desktop, Cursor)
 *   2. HTTP   — for remote/hosted use (Fly.io, cloud deployment)
 *
 * The mode is auto-detected:
 *   - If PORT env var is set → HTTP mode (StreamableHTTP transport)
 *   - Otherwise → stdio mode
 *
 * Usage (stdio):
 *   WORKADU_API_URL=https://your-app.workadu.com \
 *   WORKADU_API_KEY=your-api-key \
 *   node dist/index.js
 *
 * Usage (HTTP):
 *   PORT=3000 \
 *   WORKADU_API_URL=https://your-app.workadu.com \
 *   WORKADU_API_KEY=your-api-key \
 *   node dist/index.js
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { loadConfig } from './config.js';
import { WorkaduClient } from './client/workadu-client.js';
import { registerAllTools } from './tools/index.js';

function createServer(client: WorkaduClient): McpServer {
  const server = new McpServer({
    name: 'workadu',
    version: '1.0.0',
  });

  registerAllTools(server, client);
  return server;
}

async function startStdio(client: WorkaduClient): Promise<void> {
  const server = createServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttp(client: WorkaduClient, port: number): Promise<void> {
  const app = express();
  app.use(express.json());

  // Store transports by session ID for multi-session support
  const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>();

  // Health check endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'workadu-mcp-server',
      version: '1.0.0',
      status: 'running',
      transport: 'streamable-http',
      endpoint: '/mcp',
    });
  });

  // MCP endpoint — handles POST (requests) and GET (SSE stream)
  app.all('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // For GET requests (SSE stream), find existing session
    if (req.method === 'GET') {
      if (!sessionId || !sessions.has(sessionId)) {
        res.status(400).json({ error: 'No valid session. Send a POST request first to initialize.' });
        return;
      }
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
      return;
    }

    // For DELETE requests, close session
    if (req.method === 'DELETE') {
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res);
        await session.server.close();
        sessions.delete(sessionId);
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
      return;
    }

    // For POST requests
    if (req.method === 'POST') {
      // If session exists, route to it
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res);
        return;
      }

      // New session — create server + transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
      });

      const server = createServer(client);
      await server.connect(transport);

      // Store session after connection (transport generates session ID)
      const newSessionId = transport.sessionId;
      if (newSessionId) {
        sessions.set(newSessionId, { server, transport });
      }

      await transport.handleRequest(req, res);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Workadu MCP Server (HTTP) running on port ${port}`);
    console.log(`   Endpoint: http://0.0.0.0:${port}/mcp`);
    console.log(`   Health:   http://0.0.0.0:${port}/`);
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new WorkaduClient(config);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

  if (port) {
    console.log(`Starting in HTTP mode on port ${port}...`);
    await startHttp(client, port);
  } else {
    // stdio mode — no console output (would interfere with protocol)
    await startStdio(client);
  }
}

main().catch((error) => {
  console.error('Fatal error starting Workadu MCP server:', error);
  process.exit(1);
});

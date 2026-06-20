#!/usr/bin/env node
/**
 * Workadu MCP Server — Entry Point
 *
 * Supports two transport modes:
 *   1. stdio  — for local use (Claude Desktop, Cursor)
 *   2. HTTP   — for remote/hosted use (Fly.io, cloud deployment)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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

async function startStdio(): Promise<void> {
  const config = loadConfig();
  const client = new WorkaduClient(config);
  const server = createServer(client);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttp(port: number): Promise<void> {
  const app = express();
  app.use(express.json());

  // Keep track of active sessions
  const sessions = new Map<string, { server: McpServer; transport: SSEServerTransport }>();

  // Serve the presentation website
  app.use(express.static('website/dist'));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      name: 'workadu-mcp-server',
      version: '1.0.0',
      status: 'running',
      transport: 'sse',
      endpoints: {
        sse: '/sse',
        messages: '/messages'
      }
    });
  });

  // 1. Initialize SSE Connection
  app.get('/sse', async (req, res) => {
    try {
      // Extract credentials from headers
      const authHeader = req.header('authorization');
      const apiKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : req.header('x-workadu-api-key');
      const apiUrl = req.header('x-workadu-api-url');

      // This will throw if credentials are not found and not in environment variables
      const config = loadConfig({ apiKey, apiUrl });
      const client = new WorkaduClient(config);
      const server = createServer(client);

      // Create new SSE transport and connect it
      const transport = new SSEServerTransport('/messages', res);
      await server.connect(transport);

      // Store the session
      sessions.set(transport.sessionId, { server, transport });

      console.log(`[Session Created] ID: ${transport.sessionId} (URL: ${config.apiUrl})`);

      // Cleanup when connection closes
      res.on('close', () => {
        console.log(`[Session Closed] ID: ${transport.sessionId}`);
        sessions.delete(transport.sessionId);
      });
      
    } catch (error: any) {
      console.error('[Session Error]', error.message);
      res.status(401).json({ error: error.message });
    }
  });

  // 2. Handle incoming messages from the client
  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found or expired' });
      return;
    }

    try {
      await session.transport.handlePostMessage(req, res);
    } catch (error: any) {
      console.error('[Message Error]', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Workadu MCP Server (HTTP/SSE) running on port ${port}`);
    console.log(`   SSE Endpoint:     http://0.0.0.0:${port}/sse`);
    console.log(`   Message Endpoint: http://0.0.0.0:${port}/messages`);
  });
}

async function main(): Promise<void> {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

  if (port) {
    console.log(`Starting in HTTP mode on port ${port}...`);
    await startHttp(port);
  } else {
    // stdio mode — no console output
    await startStdio();
  }
}

main().catch((error) => {
  console.error('Fatal error starting Workadu MCP server:', error);
  process.exit(1);
});

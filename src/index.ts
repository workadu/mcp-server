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
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { type Request, type Response } from 'express';
import { loadConfig, type WorkaduConfig } from './config.js';
import { WorkaduClient } from './client/workadu-client.js';
import { registerAllTools } from './tools/index.js';
import {
  buildProtectedResourceMetadata,
  buildWwwAuthenticateHeader,
  createJwtVerifier,
  isJwt,
  loadOAuthConfig,
  resolveResourceUrl,
  type OAuthConfig,
  type VerifyJwtFn,
} from './auth/oauth.js';

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

function extractBearerToken(req: Request): string | undefined {
  const authHeader = req.header('authorization');
  if (!authHeader) return undefined;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : undefined;
}

async function authenticateRequest(
  req: Request,
  res: Response,
  oauthConfig: OAuthConfig,
  verifyBearerToken: VerifyJwtFn,
): Promise<WorkaduConfig | undefined> {
  const resourceUrl = resolveResourceUrl(req, oauthConfig.resourceUrl);

  try {
    const bearerToken = extractBearerToken(req);
    const apiKeyHeader = req.header('x-workadu-api-key');
    const apiUrl = req.header('x-workadu-api-url');

    let accessToken: string | undefined;
    let legacyApiKey = apiKeyHeader;

    if (bearerToken) {
      if (isJwt(bearerToken)) {
        try {
          const claims = await verifyBearerToken(bearerToken);
          accessToken = bearerToken;
          console.log(`[Auth] Verified JWT for sub=${claims.sub ?? 'unknown'}`);
        } catch (err: any) {
          console.warn('[Auth] JWT verification failed:', err.message);
          res.setHeader('WWW-Authenticate', buildWwwAuthenticateHeader(resourceUrl, 'invalid_token'));
          res.status(401).json({ error: 'Invalid or expired Bearer token' });
          return undefined;
        }
      } else {
        // Legacy production clients may pass their Workadu API key as Authorization: Bearer <api_key>
        legacyApiKey = legacyApiKey || bearerToken;
      }
    }

    return loadConfig({ accessToken, apiKey: legacyApiKey, apiUrl });
  } catch (error: any) {
    console.error('[Auth Error]', error.message);
    res.setHeader('WWW-Authenticate', buildWwwAuthenticateHeader(resourceUrl));
    res.status(401).json({ error: error.message });
    return undefined;
  }
}

async function startHttp(port: number): Promise<void> {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());

  const oauthConfig = loadOAuthConfig();
  const verifyBearerToken = createJwtVerifier(oauthConfig);

  // Keep track of active SSE sessions
  const sessions = new Map<string, { server: McpServer; transport: SSEServerTransport }>();

  // Serve the presentation website
  app.use(express.static('website/dist'));

  // RFC 9728 OAuth 2.0 Protected Resource Metadata
  const protectedResourceHandler = (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const resourceUrl = resolveResourceUrl(req, oauthConfig.resourceUrl);
    res.json(buildProtectedResourceMetadata(resourceUrl, oauthConfig));
  };
  app.get('/.well-known/oauth-protected-resource', protectedResourceHandler);
  app.get('/.well-known/oauth-protected-resource/mcp', protectedResourceHandler);
  app.get('/.well-known/oauth-protected-resource/sse', protectedResourceHandler);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      name: 'workadu-mcp-server',
      version: '1.0.0',
      status: 'running',
      transport: 'streamable-http,sse',
      endpoints: {
        mcp: '/mcp',
        sse: '/sse',
        messages: '/messages',
        protectedResourceMetadata: '/.well-known/oauth-protected-resource',
      },
      oauth: {
        authorizationServer: oauthConfig.oauthServerUrl,
        jwksUrl: oauthConfig.jwksUrl,
      },
    });
  });

  // Streamable HTTP endpoint (modern MCP transport, stateless per-request)
  app.all('/mcp', async (req, res) => {
    const config = await authenticateRequest(req, res, oauthConfig, verifyBearerToken);
    if (!config) return;

    const client = new WorkaduClient(config);
    const server = createServer(client);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error: any) {
      console.error('[MCP Error]', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // 1. Initialize SSE Connection (legacy MCP transport)
  app.get('/sse', async (req, res) => {
    const config = await authenticateRequest(req, res, oauthConfig, verifyBearerToken);
    if (!config) return;

    try {
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
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // 2. Handle incoming messages from the client
  app.post('/messages', async (req, res) => {
    const bearerToken = extractBearerToken(req);
    if (bearerToken && isJwt(bearerToken)) {
      try {
        await verifyBearerToken(bearerToken);
      } catch (err: any) {
        const resourceUrl = resolveResourceUrl(req, oauthConfig.resourceUrl);
        console.warn('[Auth] JWT verification failed on /messages:', err.message);
        res.setHeader('WWW-Authenticate', buildWwwAuthenticateHeader(resourceUrl, 'invalid_token'));
        res.status(401).json({ error: 'Invalid or expired Bearer token' });
        return;
      }
    }

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
      await session.transport.handlePostMessage(req, res, req.body);
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

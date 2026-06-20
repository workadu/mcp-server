/**
 * MCP Tools – Assets (DCL Module)
 *
 * Registers tools for managing assets via the Workadu Dingo API v2.
 * Part of the DCL (Digital Consignment Ledger) module.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkaduClient } from '../client/workadu-client.js';

export function registerAssetTools(server: McpServer, client: WorkaduClient): void {
  // ── list_assets ───────────────────────────────────────────────────────

  server.tool(
    'list_assets',
    'List all assets (DCL module).',
    {},
    async () => {
      try {
        const result = await client.get('/assets');
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing assets: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── get_asset ─────────────────────────────────────────────────────────

  server.tool(
    'get_asset',
    'Retrieve a specific asset by ID (DCL module).',
    {
      id: z.number().int().positive().describe('The asset ID to retrieve'),
    },
    async (params) => {
      try {
        const result = await client.get(`/assets/${params.id}`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting asset ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_asset ──────────────────────────────────────────────────────

  server.tool(
    'create_asset',
    'Create a new asset (DCL module). Requires name and code.',
    {
      name: z.string().describe('Name of the asset'),
      code: z.string().describe('Unique code for the asset'),
      description: z.string().optional().describe('Description of the asset'),
      category_id: z.number().int().positive().optional().describe('Category ID the asset belongs to'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          name: params.name,
          code: params.code,
        };
        if (params.description !== undefined) body.description = params.description;
        if (params.category_id !== undefined) body.category_id = params.category_id;

        const result = await client.post('/assets', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating asset: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── update_asset ──────────────────────────────────────────────────────

  server.tool(
    'update_asset',
    'Update an existing asset by ID (DCL module). Only provided fields will be changed.',
    {
      id: z.number().int().positive().describe('The asset ID to update'),
      name: z.string().optional().describe('Updated name of the asset'),
      code: z.string().optional().describe('Updated code for the asset'),
      description: z.string().optional().describe('Updated description'),
      category_id: z.number().int().positive().optional().describe('Updated category ID'),
    },
    async (params) => {
      try {
        const { id, ...fields } = params;
        const body: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) {
            body[key] = value;
          }
        }

        const result = await client.patch(`/assets/${id}`, body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error updating asset ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── delete_asset ──────────────────────────────────────────────────────

  server.tool(
    'delete_asset',
    'Delete an asset by ID (DCL module).',
    {
      id: z.number().int().positive().describe('The asset ID to delete'),
    },
    async (params) => {
      try {
        const result = await client.delete(`/assets/${params.id}`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error deleting asset ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}

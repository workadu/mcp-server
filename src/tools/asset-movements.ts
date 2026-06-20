/**
 * Workadu MCP Tools — Asset Movements (DCL Module)
 *
 * Tools for managing asset movements (dispatch notes, transfers)
 * through the Workadu Dingo API v2.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkaduClient } from '../client/workadu-client.js';

export function registerAssetMovementTools(server: McpServer, client: WorkaduClient): void {

  // ─── List Asset Movements ─────────────────────────────────────────

  server.tool(
    'list_asset_movements',
    'List asset movements (dispatch notes, transfers) from Workadu. Supports pagination.',
    {
      page: z.number().optional().describe('Page number for pagination'),
      per_page: z.number().optional().describe('Number of results per page'),
    },
    async (params) => {
      try {
        const result = await client.get('/asset-movements', {
          page: params.page,
          per_page: params.per_page,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing asset movements: ${error}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Get Asset Movement ───────────────────────────────────────────

  server.tool(
    'get_asset_movement',
    'Get details of a specific asset movement by ID from Workadu.',
    {
      id: z.number().describe('The asset movement ID'),
    },
    async (params) => {
      try {
        const result = await client.get(`/asset-movements/${params.id}`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting asset movement: ${error}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Create Asset Movement ────────────────────────────────────────

  server.tool(
    'create_asset_movement',
    'Create a new asset movement (dispatch note, transfer) in Workadu.',
    {
      asset_id: z.number().describe('The asset ID this movement is for'),
      type: z.string().describe('Movement type'),
      quantity: z.number().optional().describe('Quantity of assets moved'),
      source: z.string().optional().describe('Source location'),
      destination: z.string().optional().describe('Destination location'),
      notes: z.string().optional().describe('Notes about the movement'),
    },
    async (params) => {
      try {
        const result = await client.post('/asset-movements', params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating asset movement: ${error}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Close Asset Movement ─────────────────────────────────────────

  server.tool(
    'close_asset_movement',
    'Close/finalize an asset movement in Workadu.',
    {
      id: z.number().describe('The asset movement ID to close'),
    },
    async (params) => {
      try {
        const result = await client.post(`/asset-movements/${params.id}/close`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error closing asset movement: ${error}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Cancel Asset Movement ────────────────────────────────────────

  server.tool(
    'cancel_asset_movement',
    'Cancel an asset movement in Workadu.',
    {
      id: z.number().describe('The asset movement ID to cancel'),
    },
    async (params) => {
      try {
        const result = await client.post(`/asset-movements/${params.id}/cancel`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error cancelling asset movement: ${error}` }],
          isError: true,
        };
      }
    },
  );

  // ─── Resend Asset Movement ────────────────────────────────────────

  server.tool(
    'resend_asset_movement',
    'Resend an asset movement notification in Workadu.',
    {
      id: z.number().describe('The asset movement ID to resend'),
    },
    async (params) => {
      try {
        const result = await client.post(`/asset-movements/${params.id}/resend`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error resending asset movement: ${error}` }],
          isError: true,
        };
      }
    },
  );
}

/**
 * MCP Tools – Services
 *
 * Registers tools for managing Workadu services/products via the Dingo API v2.
 * Services use spatie/laravel-translatable — title and description are multilingual.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkaduClient } from '../client/workadu-client.js';

export function registerServiceTools(server: McpServer, client: WorkaduClient): void {
  // ── list_services ─────────────────────────────────────────────────────

  server.tool(
    'list_services',
    'List all services/products from Workadu. Supports pagination.',
    {
      page: z.number().int().positive().optional().describe('Page number for pagination'),
      per_page: z.number().int().positive().optional().describe('Number of results per page'),
    },
    async (params) => {
      try {
        const result = await client.get('/services', {
          page: params.page,
          per_page: params.per_page,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing services: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── get_service ───────────────────────────────────────────────────────

  server.tool(
    'get_service',
    'Get details of a specific service/product by ID, including rates, media, and attributes.',
    {
      id: z.number().int().positive().describe('The service ID'),
    },
    async (params) => {
      try {
        const result = await client.get(`/services/${params.id}`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting service ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_service ────────────────────────────────────────────────────

  server.tool(
    'create_service',
    'Create a new service/product in Workadu. Title is required; other fields are optional.',
    {
      title: z.string().describe('Title of the service (required)'),
      description: z.string().optional().describe('Description of the service'),
      brand: z.string().optional().describe('Brand name'),
      category_id: z.number().int().positive().optional().describe('Category ID'),
      type: z.string().optional().describe('Service type'),
      pax: z.number().int().positive().optional().describe('Maximum capacity/pax'),
      min_pax: z.number().int().positive().optional().describe('Minimum pax'),
      zone_id: z.number().int().positive().optional().describe('Zone ID'),
      color: z.string().optional().describe('Calendar color (e.g. "#FF5733")'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = { title: params.title };
        if (params.description !== undefined) body.description = params.description;
        if (params.brand !== undefined) body.brand = params.brand;
        if (params.category_id !== undefined) body.category_id = params.category_id;
        if (params.type !== undefined) body.type = params.type;
        if (params.pax !== undefined) body.pax = params.pax;
        if (params.min_pax !== undefined) body.min_pax = params.min_pax;
        if (params.zone_id !== undefined) body.zone_id = params.zone_id;
        if (params.color !== undefined) body.color = params.color;

        const result = await client.post('/services', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating service: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── update_service ────────────────────────────────────────────────────

  server.tool(
    'update_service',
    'Update an existing service/product. Only the provided fields will be changed.',
    {
      id: z.number().int().positive().describe('The service ID to update'),
      title: z.string().optional().describe('Updated title'),
      description: z.string().optional().describe('Updated description'),
      brand: z.string().optional().describe('Updated brand name'),
      category_id: z.number().int().positive().optional().describe('Updated category ID'),
      type: z.string().optional().describe('Updated service type'),
      pax: z.number().int().positive().optional().describe('Updated max capacity'),
      min_pax: z.number().int().positive().optional().describe('Updated min pax'),
      zone_id: z.number().int().positive().optional().describe('Updated zone ID'),
      color: z.string().optional().describe('Updated calendar color'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = { id: params.id };
        if (params.title !== undefined) body.title = params.title;
        if (params.description !== undefined) body.description = params.description;
        if (params.brand !== undefined) body.brand = params.brand;
        if (params.category_id !== undefined) body.category_id = params.category_id;
        if (params.type !== undefined) body.type = params.type;
        if (params.pax !== undefined) body.pax = params.pax;
        if (params.min_pax !== undefined) body.min_pax = params.min_pax;
        if (params.zone_id !== undefined) body.zone_id = params.zone_id;
        if (params.color !== undefined) body.color = params.color;

        const result = await client.put('/services', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error updating service ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── delete_service ────────────────────────────────────────────────────

  server.tool(
    'delete_service',
    'Delete a service/product from Workadu.',
    {
      id: z.number().int().positive().describe('The service ID to delete'),
    },
    async (params) => {
      try {
        const result = await client.delete('/services', { id: params.id });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error deleting service ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}

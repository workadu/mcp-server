/**
 * MCP Tools for Workadu Orders / Bookings
 *
 * In Workadu the API resource called "orders" actually represents Bookings –
 * a top-level entity that may contain one or more sub-orders/items.
 *
 * Endpoints (Dingo API v2):
 *   GET    /orders           – list bookings (with filters)
 *   GET    /orders/{id}      – get a single booking
 *   POST   /orders           – create a booking
 *   PATCH  /orders/{id}      – update a booking
 *   DELETE /orders/{id}      – delete / cancel a booking
 *   POST   /orders/email     – email a booking to a recipient
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkaduClient } from '../client/workadu-client.js';

/** Valid order / booking statuses exposed by the API */
const ORDER_STATUS_VALUES = [
  'CANCELLED',
  'PRE_ASSIGNED',
  'ASSIGNED_NOT_CONFIRMED',
  'NOT_PAID',
  'CHECKED_OUT',
  'CHECKED_IN',
  'CHECKED_IN_EARLIER',
  'ASSIGNED_AND_AGREED',
] as const;

export function registerOrderTools(server: McpServer, client: WorkaduClient): void {
  // ── list_orders ──────────────────────────────────────────────────────
  server.tool(
    'list_orders',
    'List orders/bookings with optional filters for status, customer, date range, and pagination. ' +
      'In Workadu, "orders" at the API level represent Bookings (top-level entities containing sub-orders/items).',
    {
      page: z.number().int().positive().optional().describe('Page number for pagination (default: 1)'),
      per_page: z.number().int().positive().max(100).optional().describe('Results per page (default set by API, max 100)'),
      status: z
        .enum(ORDER_STATUS_VALUES)
        .optional()
        .describe('Filter by order status'),
      customer_id: z.number().int().positive().optional().describe('Filter by customer ID'),
      from_date: z
        .string()
        .optional()
        .describe('Filter orders from this date (YYYY-MM-DD)'),
      to_date: z
        .string()
        .optional()
        .describe('Filter orders up to this date (YYYY-MM-DD)'),
    },
    async (params) => {
      try {
        const result = await client.get('/orders', {
          page: params.page,
          per_page: params.per_page,
          status: params.status,
          customer_id: params.customer_id,
          from_date: params.from_date,
          to_date: params.to_date,
        });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing orders: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── get_order ────────────────────────────────────────────────────────
  server.tool(
    'get_order',
    'Get a specific order/booking by its ID, including sub-orders, customer info, and related data.',
    {
      id: z.number().int().positive().describe('The order/booking ID'),
    },
    async (params) => {
      try {
        const result = await client.get(`/orders/${params.id}`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting order ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_order ─────────────────────────────────────────────────────
  server.tool(
    'create_order',
    'Create a new order/booking. Requires customer, service, and date range. ' +
      'Optionally specify pickup/return times, a comment, and a calendar color.',
    {
      customer_id: z.number().int().positive().describe('ID of the customer for this booking'),
      service_id: z.number().int().positive().describe('ID of the service/vehicle being booked'),
      pickup_date: z.string().describe('Pickup date in YYYY-MM-DD format'),
      return_date: z.string().describe('Return date in YYYY-MM-DD format'),
      pickup_time: z.string().optional().describe('Pickup time in HH:MM format (24h)'),
      return_time: z.string().optional().describe('Return time in HH:MM format (24h)'),
      comment: z.string().optional().describe('Optional comment / notes for the booking'),
      color: z.string().optional().describe('Calendar color for the booking (e.g. "#FF5733")'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          customer_id: params.customer_id,
          service_id: params.service_id,
          pickup_date: params.pickup_date,
          return_date: params.return_date,
        };
        if (params.pickup_time !== undefined) body.pickup_time = params.pickup_time;
        if (params.return_time !== undefined) body.return_time = params.return_time;
        if (params.comment !== undefined) body.comment = params.comment;
        if (params.color !== undefined) body.color = params.color;

        const result = await client.post('/orders', body);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating order: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── update_order ─────────────────────────────────────────────────────
  server.tool(
    'update_order',
    'Update an existing order/booking. Only the fields you provide will be changed.',
    {
      id: z.number().int().positive().describe('The order/booking ID to update'),
      customer_id: z.number().int().positive().optional().describe('New customer ID'),
      service_id: z.number().int().positive().optional().describe('New service/vehicle ID'),
      pickup_date: z.string().optional().describe('New pickup date (YYYY-MM-DD)'),
      return_date: z.string().optional().describe('New return date (YYYY-MM-DD)'),
      pickup_time: z.string().optional().describe('New pickup time (HH:MM, 24h)'),
      return_time: z.string().optional().describe('New return time (HH:MM, 24h)'),
      comment: z.string().optional().describe('Updated comment / notes'),
      color: z.string().optional().describe('Updated calendar color'),
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

        const result = await client.patch(`/orders/${id}`, body);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error updating order ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── delete_order ─────────────────────────────────────────────────────
  server.tool(
    'delete_order',
    'Delete (cancel) an order/booking by its ID.',
    {
      id: z.number().int().positive().describe('The order/booking ID to delete/cancel'),
    },
    async (params) => {
      try {
        const result = await client.delete(`/orders/${params.id}`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error deleting order ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── email_order ──────────────────────────────────────────────────────
  server.tool(
    'email_order',
    'Email an order/booking confirmation or details to a specified email address.',
    {
      order_id: z.number().int().positive().describe('The order/booking ID to email'),
      email: z.string().email().describe('Recipient email address'),
    },
    async (params) => {
      try {
        const result = await client.post('/orders/email', {
          order_id: params.order_id,
          email: params.email,
        });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error emailing order ${params.order_id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}

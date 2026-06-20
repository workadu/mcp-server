/**
 * MCP Tools – Payments
 *
 * Registers tools for listing and creating payments via the Workadu Dingo API v2.
 * Payment statuses: ACTIVE=1, DRAFT=2, FAILED=3, REFUNDED=4
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkaduClient } from '../client/workadu-client.js';

export function registerPaymentTools(server: McpServer, client: WorkaduClient): void {
  // ── list_payments ─────────────────────────────────────────────────────

  server.tool(
    'list_payments',
    'List payments or retrieve a specific payment by ID. Payment statuses: ACTIVE=1, DRAFT=2, FAILED=3, REFUNDED=4.',
    {
      id: z.number().int().positive().optional().describe('Optional payment ID to retrieve a specific payment'),
      page: z.number().int().positive().optional().describe('Page number for pagination'),
      per_page: z.number().int().positive().optional().describe('Number of results per page'),
    },
    async (params) => {
      try {
        const path = params.id ? `/payments/${params.id}` : '/payments';
        const result = await client.get(path, {
          page: params.page,
          per_page: params.per_page,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing payments: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_payment ────────────────────────────────────────────────────

  server.tool(
    'create_payment',
    'Create a new payment. Requires issue date, customer, series, amount, and currency.',
    {
      issue_date: z.string().describe('Issue date of the payment (YYYY-MM-DD)'),
      customer_id: z.number().int().positive().describe('ID of the customer'),
      series_id: z.number().int().positive().describe('ID of the payment series'),
      amount: z.number().positive().describe('Payment amount'),
      currency_iso: z.string().describe('ISO 4217 currency code (e.g. EUR, USD)'),
      currency_rate: z.number().optional().describe('Currency exchange rate (default: 1)'),
      comments: z.string().optional().describe('Comments for the payment'),
      order_id: z.number().int().positive().optional().describe('Associated order/booking ID'),
      notes: z.string().optional().describe('Internal notes for the payment'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          issue_date: params.issue_date,
          customer_id: params.customer_id,
          series_id: params.series_id,
          amount: params.amount,
          currency_iso: params.currency_iso,
        };
        if (params.currency_rate !== undefined) body.currency_rate = params.currency_rate;
        if (params.comments !== undefined) body.comments = params.comments;
        if (params.order_id !== undefined) body.order_id = params.order_id;
        if (params.notes !== undefined) body.notes = params.notes;

        const result = await client.post('/payments', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating payment: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}

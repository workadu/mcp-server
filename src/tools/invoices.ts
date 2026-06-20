/**
 * MCP Tools – Invoices
 *
 * Registers tools for managing Workadu invoices, series, and withholdings
 * via the Dingo API v2. Invoices are deeply integrated with AADE
 * (Greek tax authority). Series define document types (ΤΠΥ, ΑΠΥ, etc).
 *
 * Statuses: CANCELED=0, PUBLISHED=1, DRAFT=2, PREVIEW=99
 * Payment statuses: PAID, PARTIALLY_PAID, NOT_PAID
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkaduClient } from '../client/workadu-client.js';

export function registerInvoiceTools(server: McpServer, client: WorkaduClient): void {
  // ── list_invoices ─────────────────────────────────────────────────────

  server.tool(
    'list_invoices',
    'List invoices/documents with optional filters. Statuses: CANCELED=0, PUBLISHED=1, DRAFT=2, PREVIEW=99.',
    {
      page: z.number().int().positive().optional().describe('Page number for pagination'),
      per_page: z.number().int().positive().optional().describe('Results per page'),
      status: z.number().int().optional().describe('Filter by status (0=Canceled, 1=Published, 2=Draft, 99=Preview)'),
      customer_id: z.number().int().positive().optional().describe('Filter by customer ID'),
      from_date: z.string().optional().describe('Filter from date (YYYY-MM-DD)'),
      to_date: z.string().optional().describe('Filter to date (YYYY-MM-DD)'),
      series_id: z.number().int().positive().optional().describe('Filter by invoice series ID'),
    },
    async (params) => {
      try {
        const result = await client.get('/invoices', {
          page: params.page,
          per_page: params.per_page,
          status: params.status,
          customer_id: params.customer_id,
          from_date: params.from_date,
          to_date: params.to_date,
          series_id: params.series_id,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing invoices: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── get_invoice ───────────────────────────────────────────────────────

  server.tool(
    'get_invoice',
    'Get details of a specific invoice by ID, including lines, customer, and series info.',
    {
      id: z.number().int().positive().describe('The invoice ID'),
    },
    async (params) => {
      try {
        const result = await client.get(`/invoices/${params.id}`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting invoice ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_invoice ────────────────────────────────────────────────────

  server.tool(
    'create_invoice',
    'Create a new draft invoice (without lines). Use add_invoice_line to add lines, then publish_invoice to finalize.',
    {
      issue_date: z.string().describe('Issue date (YYYY-MM-DD)'),
      customer_id: z.number().int().positive().describe('Customer ID'),
      series_id: z.number().int().positive().describe('Invoice series ID (determines document type)'),
      includes_vat: z.boolean().optional().describe('Whether prices include VAT (default depends on series)'),
      currency_iso: z.string().optional().describe('ISO 4217 currency code (e.g. EUR, USD). Defaults to company currency.'),
      notes: z.string().optional().describe('Notes visible to customer'),
      admin_notes: z.string().optional().describe('Internal admin notes'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          issue_date: params.issue_date,
          customer_id: params.customer_id,
          series_id: params.series_id,
        };
        if (params.includes_vat !== undefined) body.includes_vat = params.includes_vat;
        if (params.currency_iso !== undefined) body.currency_iso = params.currency_iso;
        if (params.notes !== undefined) body.notes = params.notes;
        if (params.admin_notes !== undefined) body.admin_notes = params.admin_notes;

        const result = await client.post('/invoices', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating invoice: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_invoice_with_lines ─────────────────────────────────────────

  server.tool(
    'create_invoice_with_lines',
    'Create a new draft invoice with line items in a single call. Each line specifies a product/service, quantity, and pricing.',
    {
      issue_date: z.string().describe('Issue date (YYYY-MM-DD)'),
      customer_id: z.number().int().positive().describe('Customer ID'),
      series_id: z.number().int().positive().describe('Invoice series ID'),
      lines: z.array(z.object({
        description: z.string().describe('Line item description'),
        quantity: z.number().positive().describe('Quantity'),
        unit_price: z.number().describe('Unit price (net or gross depending on includes_vat)'),
        vat_percent: z.number().describe('VAT percentage (e.g. 24 for 24% Greek standard rate)'),
        discount_percent: z.number().optional().describe('Discount percentage (0-100)'),
        service_id: z.number().int().positive().optional().describe('Optional service/product ID to link'),
      })).min(1).describe('Array of invoice line items (at least one required)'),
      includes_vat: z.boolean().optional().describe('Whether prices include VAT'),
      currency_iso: z.string().optional().describe('ISO 4217 currency code'),
      notes: z.string().optional().describe('Notes visible to customer'),
      admin_notes: z.string().optional().describe('Internal admin notes'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          issue_date: params.issue_date,
          customer_id: params.customer_id,
          series_id: params.series_id,
          lines: params.lines,
        };
        if (params.includes_vat !== undefined) body.includes_vat = params.includes_vat;
        if (params.currency_iso !== undefined) body.currency_iso = params.currency_iso;
        if (params.notes !== undefined) body.notes = params.notes;
        if (params.admin_notes !== undefined) body.admin_notes = params.admin_notes;

        const result = await client.post('/invoices/create-with-lines', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating invoice with lines: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── add_invoice_line ──────────────────────────────────────────────────

  server.tool(
    'add_invoice_line',
    'Add a line item to an existing draft invoice.',
    {
      invoice_id: z.number().int().positive().describe('The invoice ID to add the line to'),
      description: z.string().describe('Line item description'),
      quantity: z.number().positive().describe('Quantity'),
      unit_price: z.number().describe('Unit price'),
      vat_percent: z.number().describe('VAT percentage (e.g. 24 for 24%)'),
      discount_percent: z.number().optional().describe('Discount percentage (0-100)'),
      service_id: z.number().int().positive().optional().describe('Optional service/product ID to link'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          invoice_id: params.invoice_id,
          description: params.description,
          quantity: params.quantity,
          unit_price: params.unit_price,
          vat_percent: params.vat_percent,
        };
        if (params.discount_percent !== undefined) body.discount_percent = params.discount_percent;
        if (params.service_id !== undefined) body.service_id = params.service_id;

        const result = await client.post('/invoiceline', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error adding invoice line: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── update_invoice ────────────────────────────────────────────────────

  server.tool(
    'update_invoice',
    'Update an existing draft invoice. Only the provided fields will be changed. Cannot update published invoices.',
    {
      id: z.number().int().positive().describe('The invoice ID to update'),
      issue_date: z.string().optional().describe('Updated issue date (YYYY-MM-DD)'),
      customer_id: z.number().int().positive().optional().describe('Updated customer ID'),
      series_id: z.number().int().positive().optional().describe('Updated series ID'),
      includes_vat: z.boolean().optional().describe('Whether prices include VAT'),
      currency_iso: z.string().optional().describe('Updated currency ISO code'),
      notes: z.string().optional().describe('Updated customer-facing notes'),
      admin_notes: z.string().optional().describe('Updated internal admin notes'),
      due_date: z.string().optional().describe('Payment due date (YYYY-MM-DD)'),
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

        const result = await client.put(`/invoices/${id}`, body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error updating invoice ${params.id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── publish_invoice ───────────────────────────────────────────────────

  server.tool(
    'publish_invoice',
    'Publish/finalize a draft invoice. WARNING: This is IRREVERSIBLE — once published, the invoice is submitted to AADE (Greek tax authority) and cannot be edited.',
    {
      invoice_id: z.number().int().positive().describe('The draft invoice ID to publish/finalize'),
    },
    async (params) => {
      try {
        const result = await client.post('/invoices/publish', {
          invoice_id: params.invoice_id,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error publishing invoice ${params.invoice_id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── list_series ───────────────────────────────────────────────────────

  server.tool(
    'list_series',
    'List invoice series (document types). Series define the numbering and type of document (e.g. Invoice, Receipt, Credit Note).',
    {
      id: z.number().int().positive().optional().describe('Optional series ID to get a specific series'),
    },
    async (params) => {
      try {
        const path = params.id ? `/series/${params.id}` : '/series';
        const result = await client.get(path);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing series: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── list_withholdings ─────────────────────────────────────────────────

  server.tool(
    'list_withholdings',
    'List withholding tax deductions for a specific invoice.',
    {
      invoice_id: z.number().int().positive().describe('The invoice ID'),
    },
    async (params) => {
      try {
        const result = await client.get(`/invoices/${params.invoice_id}/withholdings`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing withholdings: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_withholding ────────────────────────────────────────────────

  server.tool(
    'create_withholding',
    'Add a withholding tax deduction to an invoice.',
    {
      invoice_id: z.number().int().positive().describe('The invoice ID to add the withholding to'),
      type: z.string().describe('Withholding type (AADE tax type)'),
      category: z.string().describe('Withholding category (AADE tax category)'),
      amount: z.number().optional().describe('Withholding amount (calculated from percent if not provided)'),
      percent: z.number().optional().describe('Withholding percentage'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          type: params.type,
          category: params.category,
        };
        if (params.amount !== undefined) body.amount = params.amount;
        if (params.percent !== undefined) body.percent = params.percent;

        const result = await client.post(`/invoices/${params.invoice_id}/withholdings`, body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating withholding: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}

/**
 * MCP Tools – Customers
 *
 * Registers tools for listing, retrieving, creating, and updating
 * Workadu customers via the Dingo API.
 *
 * Note: Customer PII fields (fullname, email, mobile, etc.) are encrypted
 * at rest but the API returns them decrypted via Fractal transformers.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WorkaduClient } from '../client/workadu-client.js';

export function registerCustomerTools(server: McpServer, client: WorkaduClient): void {
  // ── list_customers ────────────────────────────────────────────────────

  server.tool(
    'list_customers',
    'List customers (paginated, 50 per page by default). Supports search by name/email/mobile.',
    {
      page: z.number().int().positive().optional().describe('Page number (1-based). Defaults to 1.'),
      per_page: z.number().int().positive().max(50).optional().describe('Results per page (max 50). Defaults to 50.'),
      search: z.string().optional().describe('Search term to filter customers by name, email, or mobile.'),
    },
    async ({ page, per_page, search }) => {
      try {
        const result = await client.get('/customers', { page, per_page, search });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing customers: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── get_customer ──────────────────────────────────────────────────────

  server.tool(
    'get_customer',
    'Get a specific customer by ID. Returns full customer details including decrypted PII fields.',
    {
      id: z.number().int().positive().describe('The customer ID.'),
    },
    async ({ id }) => {
      try {
        const result = await client.get(`/customers/${id}`);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting customer ${id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── create_customer ───────────────────────────────────────────────────

  server.tool(
    'create_customer',
    'Create a new customer. Only fullname is required; all other fields are optional.',
    {
      fullname: z.string().describe('Full name of the customer (required).'),
      email: z.string().email().optional().describe('Email address.'),
      mobile: z.string().optional().describe('Mobile phone number.'),
      country: z.string().optional().describe('Country name or ISO code.'),
      city: z.string().optional().describe('City name.'),
      address: z.string().optional().describe('Street address.'),
      vat_number: z.string().optional().describe('VAT registration number.'),
      tax_office: z.string().optional().describe('Tax office name.'),
      postal_code: z.string().optional().describe('Postal / ZIP code.'),
      comments: z.string().optional().describe('Free-text comments about the customer.'),
      tag_names: z.string().optional().describe('Comma-separated tag names to assign.'),
      is_company_customer: z.boolean().optional().describe('Whether this is a company (B2B) customer.'),
      gender: z.string().optional().describe('Gender of the customer.'),
      title: z.string().optional().describe('Title / salutation (e.g. Mr, Mrs, Dr).'),
      company_name: z.string().optional().describe('Company name (for B2B customers).'),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) {
            body[key] = value;
          }
        }

        const result = await client.post('/customers', body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creating customer: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // ── update_customer ───────────────────────────────────────────────────

  server.tool(
    'update_customer',
    'Update an existing customer by ID. Only the provided fields will be changed.',
    {
      id: z.number().int().positive().describe('The customer ID to update.'),
      fullname: z.string().optional().describe('Full name of the customer.'),
      email: z.string().email().optional().describe('Email address.'),
      mobile: z.string().optional().describe('Mobile phone number.'),
      country: z.string().optional().describe('Country name or ISO code.'),
      city: z.string().optional().describe('City name.'),
      address: z.string().optional().describe('Street address.'),
      vat_number: z.string().optional().describe('VAT registration number.'),
      tax_office: z.string().optional().describe('Tax office name.'),
      postal_code: z.string().optional().describe('Postal / ZIP code.'),
      comments: z.string().optional().describe('Free-text comments about the customer.'),
      tag_names: z.string().optional().describe('Comma-separated tag names to assign.'),
      is_company_customer: z.boolean().optional().describe('Whether this is a company (B2B) customer.'),
      gender: z.string().optional().describe('Gender of the customer.'),
      title: z.string().optional().describe('Title / salutation (e.g. Mr, Mrs, Dr).'),
      company_name: z.string().optional().describe('Company name (for B2B customers).'),
    },
    async ({ id, ...fields }) => {
      try {
        const body: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) {
            body[key] = value;
          }
        }

        const result = await client.patch(`/customers/${id}`, body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error updating customer ${id}: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}

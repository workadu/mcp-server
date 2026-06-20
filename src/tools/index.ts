/**
 * Workadu MCP Tools — Registry
 *
 * Central registry that imports and registers all tool modules
 * with the MCP server instance.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WorkaduClient } from '../client/workadu-client.js';

import { registerOrderTools } from './orders.js';
import { registerCustomerTools } from './customers.js';
import { registerServiceTools } from './services.js';
import { registerInvoiceTools } from './invoices.js';
import { registerPaymentTools } from './payments.js';
import { registerAssetTools } from './assets.js';
import { registerAssetMovementTools } from './asset-movements.js';

/**
 * Register all Workadu tools with the MCP server.
 */
export function registerAllTools(server: McpServer, client: WorkaduClient): void {
  registerOrderTools(server, client);
  registerCustomerTools(server, client);
  registerServiceTools(server, client);
  registerInvoiceTools(server, client);
  registerPaymentTools(server, client);
  registerAssetTools(server, client);
  registerAssetMovementTools(server, client);
}

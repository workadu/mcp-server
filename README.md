# Workadu MCP Server

MCP (Model Context Protocol) server for [Workadu](https://workadu.com) — enables AI assistants to interact with your Workadu data through natural language.

## What is this?

This server exposes Workadu's API as **MCP tools**, allowing AI assistants like Claude, Cursor, and others to:

- 📦 **Manage Orders/Bookings** — list, create, update, cancel orders
- 👥 **Manage Customers** — search, create, update customer records
- 🛎 **Manage Services** — CRUD operations on services/products
- 🧾 **Manage Invoices** — create, publish, add lines, manage withholdings
- 💰 **Manage Payments** — list and create payments
- 📦 **Manage Assets** — CRUD operations on assets (DCL module)
- 🚚 **Manage Asset Movements** — create, close, cancel dispatch notes

## Prerequisites

- **Node.js** >= 18.0.0
- A **Workadu account** with API access enabled
- Your **Workadu API key** (from CompanyUser settings)

## Installation

```bash
# Clone the repository
git clone https://github.com/workadu/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

The server requires two environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `WORKADU_API_URL` | Your Workadu instance URL | `https://your-app.workadu.com` |
| `WORKADU_API_KEY` | Your API key | `abc123...` |

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## Usage

### With Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "workadu": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "WORKADU_API_URL": "https://your-app.workadu.com",
        "WORKADU_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### With Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "workadu": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "WORKADU_API_URL": "https://your-app.workadu.com",
        "WORKADU_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Testing with MCP Inspector

```bash
npm run inspect
```

This opens the MCP Inspector UI where you can test all tools interactively.

### Direct execution

```bash
WORKADU_API_URL=https://your-app.workadu.com \
WORKADU_API_KEY=your-api-key \
npm start
```

## Available Tools

### Orders/Bookings
| Tool | Description |
|------|-------------|
| `list_orders` | List orders/bookings with filters (date, status, customer) |
| `get_order` | Get order details by ID |
| `create_order` | Create a new booking/order |
| `update_order` | Update an existing order |
| `delete_order` | Cancel/delete an order |
| `email_order` | Send order confirmation email |

### Customers
| Tool | Description |
|------|-------------|
| `list_customers` | List customers (paginated, searchable) |
| `get_customer` | Get customer details by ID |
| `create_customer` | Create a new customer |
| `update_customer` | Update an existing customer |

### Services
| Tool | Description |
|------|-------------|
| `list_services` | List services/products |
| `get_service` | Get service details by ID |
| `create_service` | Create a new service |
| `update_service` | Update an existing service |
| `delete_service` | Delete a service |

### Invoices
| Tool | Description |
|------|-------------|
| `list_invoices` | List invoices with filters |
| `get_invoice` | Get invoice details by ID |
| `create_invoice` | Create a new invoice |
| `create_invoice_with_lines` | Create invoice with line items |
| `add_invoice_line` | Add a line to existing invoice |
| `update_invoice` | Update an existing invoice |
| `publish_invoice` | Publish/finalize a draft invoice |
| `list_series` | List invoice series |
| `list_withholdings` | List withholdings for an invoice |
| `create_withholding` | Add withholding to an invoice |

### Payments
| Tool | Description |
|------|-------------|
| `list_payments` | List payments |
| `create_payment` | Create a new payment |

### Assets (DCL)
| Tool | Description |
|------|-------------|
| `list_assets` | List assets |
| `get_asset` | Get asset details by ID |
| `create_asset` | Create a new asset |
| `update_asset` | Update an existing asset |
| `delete_asset` | Delete an asset |

### Asset Movements (DCL)
| Tool | Description |
|------|-------------|
| `list_asset_movements` | List asset movements |
| `get_asset_movement` | Get movement details by ID |
| `create_asset_movement` | Create a new movement |
| `close_asset_movement` | Close/finalize a movement |
| `cancel_asset_movement` | Cancel a movement |
| `resend_asset_movement` | Resend movement notification |

## Development

```bash
# Watch mode (auto-recompile on changes)
npm run dev

# Type checking
npm run lint

# Build
npm run build
```

## Architecture

```
src/
├── index.ts              # Entry point — MCP Server init
├── config.ts             # Environment config
├── client/
│   └── workadu-client.ts # HTTP client for Workadu Dingo API
├── tools/
│   ├── index.ts          # Tool registry
│   ├── orders.ts         # Order/booking tools
│   ├── customers.ts      # Customer tools
│   ├── services.ts       # Service tools
│   ├── invoices.ts       # Invoice tools
│   ├── payments.ts       # Payment tools
│   ├── assets.ts         # Asset tools
│   └── asset-movements.ts # Asset movement tools
└── types/
    └── workadu.ts        # TypeScript type definitions
```

## Authentication

The server authenticates with Workadu using the existing **API key** mechanism:
- Sends `Authorization: Basic base64(api_key:)` header
- Sends Dingo version header: `Accept: application/vnd.rengine.v2+json`
- All API calls are automatically scoped to the company associated with the API key

## License

UNLICENSED — Proprietary Workadu software

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

Invoice creation and update accept optional `payment_type`: the Workadu payment
**series ID** returned by `list_series`, rather than an AADE payment method code.
`create_invoice_with_lines` also accepts these optional inputs:

- `related_invoice_id`: a string of comma-separated original invoice IDs, e.g. `"123"` or `"123,456"`.
- `tags`: an array of tag names or an array of existing tag IDs.
- `referrer_unique_id`: an external reference for the REST API's duplicate detection.

The tool sends `customer_id` as `customer.id` and nests invoice fields under
`invoice`, including `currency_iso` as REST `currency`. Line `unit_price` is
sent as `amount`, and optional `discount_percent` as `line_discount`.
This endpoint does not support `service_id` or `admin_notes`.

`update_invoice` accepts optional `tags` as comma-separated tag names. This
replaces the invoice's tags, so include existing tags that should be kept.
The REST endpoint does not support clearing all tags with an empty string.
Updating contact tags still requires a REST API change.

`update_invoice` also accepts `transporter_id`, `shipping_address`,
`dispatch_date` (YYYY-MM-DD), and `dispatch_time` (HH:mm:ss). Automatic payment
and editing/deleting invoice lines still require REST API support.

`publish_invoice` accepts optional `aade_send` and `send`.
Set `aade_send: true` to explicitly request myDATA
submission, including for an already VALID invoice. Omitted options remain
omitted from the REST request. Check the returned `meta.myData` or pending POS
response; HTTP success alone does not confirm AADE acceptance.

Invoice and payment listing map `from_date`/`to_date` to REST
`issue_date_from`/`issue_date_to`. Invoice date filtering requires both bounds.
Payments can also be filtered by `customer_id`. Both tools accept `sort`
(prefix the field with `-` for descending), but invoice sorting affects only
the current page. The invoice REST endpoint still fixes page size at 100.
Customer `search` is sent using the REST `filter[search_term]` parameter.
Customer balance and configurable invoice pagination/global sorting still
require REST API changes.

`create_payment` accepts optional `invoice_ids` as a comma-separated string.
For all payments, it sends `amount` as REST `deposit`, `series_id` as REST
`series`, and optional `comments` as REST `comment`. Choose the appropriate
payment or refund series; `invoice_ids` links the payment to those invoices.
The current REST endpoint assigns the creation date and the company's currency,
regardless of the supplied `issue_date` and `currency_iso`; backdated payments
require REST API support.

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

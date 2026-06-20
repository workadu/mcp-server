---
name: Workadu API Extensibility
description: Skill for interacting with the Workadu API to fetch data and execute commands via Claude, ChatGPT, and Gemini.
---

# Workadu API Extensibility Skill

This skill provides the instructions and tooling necessary for an AI agent (like Claude, ChatGPT, Gemini, or this IDE) to securely interact with the Workadu platform via its API.

## Slash Command Trigger
When the user types `/workadu` in the chat, you **MUST** automatically utilize this skill to understand and interact with the Workadu API on their behalf.

## Requirements

To interact with the Workadu API, you must have the following environment variables configured:
- `WORKADU_API_TOKEN`: Your API token for authentication (Bearer Token).
- `WORKADU_API_URL`: The base URL of the Workadu API (e.g., `https://your-app.workadu.com/api`).

*Note for Users: You can set these in your shell or pass them directly when running the scripts.*

## Available Tools

### 1. Python CLI Client (`scripts/workadu_client.py`)
A provided Python script that handles the HTTP requests and authentication headers.
Agents should use this script to execute API commands rather than writing raw `curl` commands.

**Usage:**
```bash
python .agents/skills/workadu-api/scripts/workadu_client.py GET /api/orders
python .agents/skills/workadu-api/scripts/workadu_client.py POST /api/orders '{"service_id": 123, "start_date": "2026-07-01", ...}'
```

### 2. OpenAPI Specification (`openapi.yaml`)
An OpenAPI 3.0 schema file is provided in this directory. 

**For Custom GPTs / Claude Projects / Gemini Gems:**
If you (the user) want to create a dedicated chatbot that talks to Workadu:
1. Go to your ChatGPT/Claude/Gemini custom assistant settings.
2. Under "Actions" or "Tools", upload or copy-paste the contents of `openapi.yaml`.
3. Set the Authentication type to API Key / Bearer Token.
4. Provide your Workadu API Token.
The chatbot will now be able to execute commands natively using the schema!

## API Structure

The Workadu API generally uses JSON for request and response payloads.
- **GET /api/orders**: Retrieve a list of orders/bookings.
- **POST /api/orders**: Create a new booking or order.
- **PATCH /api/orders/{id}**: Modify an existing order.
- **DELETE /api/orders/{id}**: Cancel an order.

When constructing JSON payloads for `POST` or `PATCH` requests, ensure you include all required fields as documented in the `openapi.yaml` file.

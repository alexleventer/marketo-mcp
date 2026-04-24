# Marketo MCP Server

> **A [Model Context Protocol](https://modelcontextprotocol.io) server for [Adobe Marketo Engage](https://business.adobe.com/products/marketo/adobe-marketo.html).** Give Claude Desktop, Cursor, and other MCP-compatible clients direct, authenticated access to the Marketo REST API — read and write forms, smart lists, channels, leads, activities, and lists with natural language.

[![smithery badge](https://smithery.ai/badge/@alexleventer/marketo-mcp)](https://smithery.ai/server/@alexleventer/marketo-mcp)
[![npm version](https://img.shields.io/npm/v/marketo-mcp.svg)](https://www.npmjs.com/package/marketo-mcp)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Why

Marketing ops, growth, and RevOps teams spend hours clicking through the Marketo UI to clone a form, approve assets, look up a lead, or audit a smart list. The **Marketo MCP Server** wires those same REST API operations into an LLM agent, so you can say:

- *"Clone form 1234 into the Q2 Webinars folder and approve it."*
- *"Show me recent activities for lead alex@example.com."*
- *"Create a new email channel called 'Lifecycle Nurture'."*

…and the model executes the actual Marketo API calls on your behalf.

## Table of Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Available tools](#available-tools)
- [Usage with Claude Desktop](#usage-with-claude-desktop)
- [Usage with Cursor / other MCP clients](#usage-with-cursor--other-mcp-clients)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)

## Features

- **Form management** — list, inspect, clone, and approve forms via the Marketo Asset API
- **Smart list operations** — list and inspect smart lists
- **Channel CRUD** — create, read, update, and delete channels
- **Lead database** — get leads by ID or email, create or update leads in bulk, delete leads
- **Activity & change logs** — fetch activities and field changes for any lead
- **List membership** — add or remove leads from static lists
- **Program management** — list, inspect, clone programs and retrieve program members
- **Email operations** — list, inspect, and send sample emails for QA
- **Automatic auth** — OAuth 2.0 client-credentials flow with token caching & refresh
- **Stdio transport** — works out of the box with Claude Desktop, Cursor, and any MCP client that speaks stdio

## Quick start

### Option A — Smithery (recommended)

```bash
npx -y @smithery/cli install @alexleventer/marketo-mcp --client claude
```

Follow the prompts to paste in your Marketo base URL, client ID, and client secret.

### Option B — npx (no install)

Add the following to your MCP client's config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "marketo": {
      "command": "npx",
      "args": ["-y", "marketo-mcp"],
      "env": {
        "MARKETO_BASE_URL": "https://123-ABC-456.mktorest.com/rest",
        "MARKETO_CLIENT_ID": "your-client-id",
        "MARKETO_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### Option C — from source

```bash
git clone https://github.com/alexleventer/marketo-mcp.git
cd marketo-mcp
npm install
npm run build
```

Copy the config block printed by the build into your MCP client.

## Prerequisites

- **Node.js 18 or higher**
- **Marketo API credentials** (client ID & client secret from a LaunchPoint service)
- **A Marketo instance** with REST API access enabled
- **An MCP-compatible client** — [Claude Desktop](https://claude.ai/download), [Cursor](https://cursor.com), [Cline](https://github.com/cline/cline), or any other

### Obtaining Marketo API credentials

1. Log into Marketo admin
2. **Admin → Integration → LaunchPoint**
3. **New → New Service**, set service type to **Custom** and pick a display name (e.g. `MCP Server`)
4. Assign an API-only user with the permissions you need (Read-Only Assets, Read-Write Lead, etc.)
5. Save the **Client ID** and **Client Secret**
6. Your **base URL** is under **Admin → Integration → Web Services** → REST API Endpoint (strip `/rest/v1/*` — keep just `https://<munchkin>.mktorest.com/rest`)

## Configuration

All configuration is via environment variables:

| Variable | Required | Description |
|---|---|---|
| `MARKETO_BASE_URL` | yes | Your REST endpoint, e.g. `https://123-ABC-456.mktorest.com/rest` |
| `MARKETO_CLIENT_ID` | yes | LaunchPoint service client ID |
| `MARKETO_CLIENT_SECRET` | yes | LaunchPoint service client secret |

Copy `.env.example` to `.env` for local development.

## Available tools

| Tool | Description |
|---|---|
| `marketo_get_forms` | List forms (filter by `status: draft|approved`, paginate with `maxReturn`/`offset`) |
| `marketo_get_form_by_id` | Get a single form by ID |
| `marketo_clone_form` | Clone a form into a destination folder |
| `marketo_approve_form` | Approve a draft form |
| `marketo_get_smart_lists` | List smart lists |
| `marketo_get_smart_list_by_id` | Get a smart list by ID |
| `marketo_get_channels` | List channels |
| `marketo_get_channel_by_id` | Get a channel by ID |
| `marketo_create_channel` | Create a new channel |
| `marketo_update_channel` | Update an existing channel |
| `marketo_delete_channel` | Delete a channel |
| `marketo_get_lead_by_id` | Get a lead by numeric ID |
| `marketo_get_lead_by_email` | Look up a lead by email address (filter API) |
| `marketo_create_or_update_lead` | Bulk create or update leads (max 300 per call) |
| `marketo_delete_lead` | Delete a lead |
| `marketo_get_lead_activities` | Fetch activities for a lead (paginated) |
| `marketo_get_lead_changes` | Fetch field-change history for a lead |
| `marketo_get_lead_lists` | Get lists that a lead belongs to |
| `marketo_add_lead_to_list` | Add leads to a static list |
| `marketo_remove_lead_from_list` | Remove leads from a static list |
| `marketo_get_programs` | List programs (filter by type, folder, tag, or date range) |
| `marketo_get_program_by_id` | Get a program by ID |
| `marketo_clone_program` | Clone a program and all its local assets into a folder |
| `marketo_get_program_members` | Get leads that are members of a program |
| `marketo_get_emails` | List emails (filter by status) |
| `marketo_get_email_by_id` | Get an email by ID |
| `marketo_send_sample_email` | Send a sample/preview email for QA |

Each tool accepts typed arguments validated with [zod](https://zod.dev/) and returns the raw Marketo JSON response. See the [Adobe Marketo REST API reference](https://developer.adobe.com/marketo-apis/api/) for field-level details.

## Usage with Claude Desktop

1. Install Claude Desktop
2. Open the config at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
3. Paste the `mcpServers` block from [Quick start](#quick-start)
4. Restart Claude Desktop

## Usage with Cursor / other MCP clients

Any MCP client that supports stdio servers will work. Point it at the built binary:

```json
{
  "mcpServers": {
    "marketo": {
      "command": "npx",
      "args": ["-y", "marketo-mcp"],
      "env": { "MARKETO_BASE_URL": "...", "MARKETO_CLIENT_ID": "...", "MARKETO_CLIENT_SECRET": "..." }
    }
  }
}
```

## Rate limits

Marketo enforces several API rate limits. Keep these in mind when running batch operations:

| Limit | Value |
|---|---|
| **Short-term** | 100 calls per 20 seconds per instance |
| **Daily** | 50,000 calls per day |
| **Concurrent** | 10 simultaneous connections |
| **Bulk import** | 10 MB per file, 10 concurrent jobs |
| **Bulk export** | 500 MB per day, 2 concurrent jobs |

If you hit `606 Max rate limit reached`, wait 20 seconds before retrying. The Marketo REST API returns a `Retry-After` header in some cases.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Failed to authenticate with Marketo` | Wrong client ID/secret, or REST API not enabled for the LaunchPoint user |
| `403 Access Denied` | The API-only user lacks the role for that endpoint (e.g. Asset API vs Lead Database API) |
| `606 Max rate limit reached` | Marketo caps at 100 calls / 20s / instance — batch calls and add delays |
| `610 Requested resource not found` | The folder/form/lead ID doesn't exist or is in a different workspace |
| Auth works, but requests hang | Double-check `MARKETO_BASE_URL` has no trailing slash and ends with `/rest` |

You can inspect tool calls locally with the MCP inspector:

```bash
npm run inspector
```

## Development

```
src/
├── index.ts       # MCP server + all tool registrations
├── auth.ts        # OAuth token manager (caches until expiry)
└── constants.ts   # Env var bindings
```

```bash
npm run dev          # Run with ts-node + .env
npm run typecheck    # Type-check without emit
npm run lint         # ESLint
npm run format       # Prettier
npm run build        # Compile to build/
```

## Contributing

Issues and pull requests welcome at [github.com/alexleventer/marketo-mcp](https://github.com/alexleventer/marketo-mcp).

1. Fork the repo
2. Create a feature branch
3. `npm run lint && npm run typecheck`
4. Open a PR

## License

ISC — see [LICENSE](LICENSE).

---

**Keywords:** marketo mcp server, marketo model context protocol, marketo claude, marketo ai, adobe marketo mcp, marketo api claude desktop, marketo automation llm, marketo engage mcp

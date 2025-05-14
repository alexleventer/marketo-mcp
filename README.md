# Marketo MCP Server

A Model Context Protocol server for interacting with the Marketo API.

## Setup

1. Create a `.env` file in the root directory with your Marketo credentials:

```env
MARKETO_BASE_URL=https://your-instance.mktorest.com/rest
MARKETO_CLIENT_ID=your-client-id
MARKETO_CLIENT_SECRET=your-client-secret
```

**Important:** Never commit the `.env` file to version control. It contains sensitive credentials.

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

## Environment Variables

- `MARKETO_BASE_URL`: Your Marketo instance REST API endpoint
- `MARKETO_CLIENT_ID`: Your Marketo API client ID
- `MARKETO_CLIENT_SECRET`: Your Marketo API client secret

You can obtain these credentials from your Marketo admin panel under:
Admin > Integration > LaunchPoint > Create New Service

## Available Tools

- `marketo_get_forms`: Get a list of forms
- `marketo_clone_form`: Clone an existing form
- `marketo_get_form_by_id`: Get a specific form by ID
- `marketo_approve_form`: Approve a form draft

## Security Notes

1. Never commit sensitive credentials to version control
2. Keep your `.env` file secure and private
3. Regularly rotate your API credentials
4. Use environment-specific `.env` files for different environments (dev, staging, prod) 
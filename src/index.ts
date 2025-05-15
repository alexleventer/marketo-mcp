import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MARKETO_CLIENT_ID, MARKETO_CLIENT_SECRET } from './constants.js';
import * as assetApi from './api/asset/index.js';
import 'dotenv/config';

if (!MARKETO_CLIENT_ID || !MARKETO_CLIENT_SECRET) {
  throw new Error('MARKETO_CLIENT_ID and MARKETO_CLIENT_SECRET environment variables are required');
}

// Create an MCP server
const server = new McpServer({
  name: 'MarketoAPI',
  version: '1.0.0',
});

// Register all asset API tools
Object.values(assetApi).forEach((tool) => {
  server.tool(tool.name, tool.schema, tool.handler);
});

const transport = new StdioServerTransport();
await server.connect(transport);

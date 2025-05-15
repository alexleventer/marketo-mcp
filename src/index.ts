import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';
import { MARKETO_BASE_URL, MARKETO_CLIENT_ID, MARKETO_CLIENT_SECRET } from './constants.js';
import { TokenManager } from './auth.js';
import 'dotenv/config';

if (!MARKETO_CLIENT_ID || !MARKETO_CLIENT_SECRET) {
  throw new Error('MARKETO_CLIENT_ID and MARKETO_CLIENT_SECRET environment variables are required');
}

const tokenManager = new TokenManager(MARKETO_CLIENT_ID, MARKETO_CLIENT_SECRET);

// Create an MCP server
const server = new McpServer({
  name: 'MarketoAPI',
  version: '1.0.0',
});

// Helper function to make API requests with authentication
async function makeApiRequest(
  endpoint: string,
  method: string,
  data?: any,
  contentType: string = 'application/json'
) {
  const token = await tokenManager.getToken();
  const headers: any = {
    Authorization: `Bearer ${token}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  try {
    const response = await axios({
      url: `${MARKETO_BASE_URL}${endpoint}`,
      method: method,
      data:
        contentType === 'application/x-www-form-urlencoded'
          ? new URLSearchParams(data).toString()
          : data,
      headers,
    });
    return response.data;
  } catch (error: any) {
    console.error('API request failed:', error.response?.data || error.message);
    throw error;
  }
}

// Tool: Get Forms
// https://developer.adobe.com/marketo-apis/api/asset/#operation/browseForms2UsingGET
server.tool(
  'marketo_get_forms',
  {
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
    status: z.enum(['approved', 'draft']).optional(),
  },
  async ({ maxReturn = 200, offset = 0, status }) => {
    try {
      const params = new URLSearchParams({
        maxReturn: maxReturn.toString(),
        offset: offset.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await makeApiRequest(`/asset/v1/forms.json?${params.toString()}`, 'GET');

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [
          { type: 'text', text: `Error: ${error.response?.data?.message || error.message}` },
        ],
      };
    }
  }
);

// Tool: Approve Form
// https://developer.adobe.com/marketo-apis/api/asset/#operation/approveFromUsingPOST
server.tool(
  'marketo_approve_form',
  {
    formId: z.number(),
    comment: z.string().optional(),
  },
  async ({ formId, comment }) => {
    try {
      const response = await makeApiRequest(
        `/asset/v1/form/${formId}/approve.json`,
        'POST',
        comment ? { comment } : undefined
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [
          { type: 'text', text: `Error: ${error.response?.data?.message || error.message}` },
        ],
      };
    }
  }
);

// Tool: Clone Form
// https://developer.adobe.com/marketo-apis/api/asset/#operation/cloneLpFormsUsingPOST
server.tool(
  'marketo_clone_form',
  {
    formId: z.number(),
    name: z.string(),
    description: z.string().optional(),
    folderId: z.number(),
  },
  async ({ formId, name, description, folderId }) => {
    try {
      const formData = {
        name,
        description,
        folder: JSON.stringify({ id: folderId, type: 'Folder' }),
      };

      const response = await makeApiRequest(
        `/asset/v1/form/${formId}/clone.json`,
        'POST',
        formData,
        'application/x-www-form-urlencoded'
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [
          { type: 'text', text: `Error: ${error.response?.data?.message || error.message}` },
        ],
      };
    }
  }
);

// Tool: Get Form by ID
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getLpFormByIdUsingGET
server.tool(
  'marketo_get_form_by_id',
  {
    formId: z.number(),
  },
  async ({ formId }) => {
    try {
      const response = await makeApiRequest(`/asset/v1/form/${formId}.json`, 'GET');

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [
          { type: 'text', text: `Error: ${error.response?.data?.message || error.message}` },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

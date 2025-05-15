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

// Tool: Get Smart Lists
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getSmartListsUsingGET
server.tool(
  'marketo_get_smart_lists',
  {
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
  },
  async ({ maxReturn = 200, offset = 0 }) => {
    try {
      const params = new URLSearchParams({
        maxReturn: maxReturn.toString(),
        offset: offset.toString(),
      });

      const response = await makeApiRequest(`/asset/v1/smartLists.json?${params.toString()}`, 'GET');

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

// Tool: Get Smart List by ID
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getSmartListByIdUsingGET
server.tool(
  'marketo_get_smart_list_by_id',
  {
    smartListId: z.number(),
  },
  async ({ smartListId }) => {
    try {
      const response = await makeApiRequest(`/asset/v1/smartList/${smartListId}.json`, 'GET');

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

// Tool: Get Channels
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getChannelsUsingGET
server.tool(
  'marketo_get_channels',
  {
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
  },
  async ({ maxReturn = 200, offset = 0 }) => {
    try {
      const params = new URLSearchParams({
        maxReturn: maxReturn.toString(),
        offset: offset.toString(),
      });

      const response = await makeApiRequest(`/asset/v1/channels.json?${params.toString()}`, 'GET');

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

// Tool: Get Channel by ID
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getChannelByIdUsingGET
server.tool(
  'marketo_get_channel_by_id',
  {
    channelId: z.number(),
  },
  async ({ channelId }) => {
    try {
      const response = await makeApiRequest(`/asset/v1/channel/${channelId}.json`, 'GET');

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

// Tool: Create Channel
// https://developer.adobe.com/marketo-apis/api/asset/#operation/createChannelUsingPOST
server.tool(
  'marketo_create_channel',
  {
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    applicationId: z.number().optional(),
  },
  async ({ name, description, type, applicationId }) => {
    try {
      const data = {
        name,
        description,
        type,
        applicationId,
      };

      const response = await makeApiRequest('/asset/v1/channels.json', 'POST', data);

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

// Tool: Update Channel
// https://developer.adobe.com/marketo-apis/api/asset/#operation/updateChannelUsingPOST
server.tool(
  'marketo_update_channel',
  {
    channelId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    applicationId: z.number().optional(),
  },
  async ({ channelId, name, description, type, applicationId }) => {
    try {
      const data = {
        name,
        description,
        type,
        applicationId,
      };

      const response = await makeApiRequest(`/asset/v1/channel/${channelId}.json`, 'POST', data);

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

// Tool: Delete Channel
// https://developer.adobe.com/marketo-apis/api/asset/#operation/deleteChannelUsingPOST
server.tool(
  'marketo_delete_channel',
  {
    channelId: z.number(),
  },
  async ({ channelId }) => {
    try {
      const response = await makeApiRequest(`/asset/v1/channel/${channelId}/delete.json`, 'POST');

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

// Tool: Get Lead by ID
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/getLeadByIdUsingGET
server.tool(
  'marketo_get_lead_by_id',
  {
    leadId: z.number(),
    fields: z.array(z.string()).optional(),
  },
  async ({ leadId, fields }) => {
    try {
      const params = new URLSearchParams();
      if (fields) {
        params.append('fields', fields.join(','));
      }

      const response = await makeApiRequest(
        `/rest/v1/lead/${leadId}.json${params.toString() ? `?${params.toString()}` : ''}`,
        'GET'
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

// Tool: Get Lead by Email
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/getLeadByEmailUsingGET
server.tool(
  'marketo_get_lead_by_email',
  {
    email: z.string().email(),
    fields: z.array(z.string()).optional(),
  },
  async ({ email, fields }) => {
    try {
      const params = new URLSearchParams();
      if (fields) {
        params.append('fields', fields.join(','));
      }

      const response = await makeApiRequest(
        `/rest/v1/lead/${email}.json${params.toString() ? `?${params.toString()}` : ''}`,
        'GET'
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

// Tool: Create/Update Lead
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/createOrUpdateLeadsUsingPOST
server.tool(
  'marketo_create_or_update_lead',
  {
    input: z.array(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        website: z.string().optional(),
        customFields: z.record(z.string(), z.any()).optional(),
      })
    ),
    lookupField: z.enum(['email', 'id', 'cookie']).optional(),
    partitionName: z.string().optional(),
  },
  async ({ input, lookupField = 'email', partitionName }) => {
    try {
      const data = {
        input,
        lookupField,
        partitionName,
      };

      const response = await makeApiRequest('/rest/v1/leads.json', 'POST', data);

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

// Tool: Delete Lead
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/deleteLeadUsingPOST
server.tool(
  'marketo_delete_lead',
  {
    leadId: z.number(),
  },
  async ({ leadId }) => {
    try {
      const response = await makeApiRequest(`/rest/v1/leads/${leadId}/delete.json`, 'POST');

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

// Tool: Get Lead Activities
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/getLeadActivitiesUsingGET
server.tool(
  'marketo_get_lead_activities',
  {
    leadId: z.number(),
    activityTypeIds: z.array(z.number()).optional(),
    nextPageToken: z.string().optional(),
    batchSize: z.number().optional(),
  },
  async ({ leadId, activityTypeIds, nextPageToken, batchSize = 100 }) => {
    try {
      const params = new URLSearchParams({
        batchSize: batchSize.toString(),
      });

      if (activityTypeIds) {
        params.append('activityTypeIds', activityTypeIds.join(','));
      }
      if (nextPageToken) {
        params.append('nextPageToken', nextPageToken);
      }

      const response = await makeApiRequest(
        `/rest/v1/activities/lead/${leadId}.json?${params.toString()}`,
        'GET'
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

// Tool: Get Lead Changes
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/getLeadChangesUsingGET
server.tool(
  'marketo_get_lead_changes',
  {
    leadId: z.number(),
    fields: z.array(z.string()).optional(),
    nextPageToken: z.string().optional(),
    batchSize: z.number().optional(),
  },
  async ({ leadId, fields, nextPageToken, batchSize = 100 }) => {
    try {
      const params = new URLSearchParams({
        batchSize: batchSize.toString(),
      });

      if (fields) {
        params.append('fields', fields.join(','));
      }
      if (nextPageToken) {
        params.append('nextPageToken', nextPageToken);
      }

      const response = await makeApiRequest(
        `/rest/v1/activities/lead/${leadId}/changes.json?${params.toString()}`,
        'GET'
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

// Tool: Get Lead Lists
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/getLeadListsUsingGET
server.tool(
  'marketo_get_lead_lists',
  {
    leadId: z.number(),
    batchSize: z.number().optional(),
    nextPageToken: z.string().optional(),
  },
  async ({ leadId, batchSize = 100, nextPageToken }) => {
    try {
      const params = new URLSearchParams({
        batchSize: batchSize.toString(),
      });

      if (nextPageToken) {
        params.append('nextPageToken', nextPageToken);
      }

      const response = await makeApiRequest(
        `/rest/v1/lists/${leadId}/leads.json?${params.toString()}`,
        'GET'
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

// Tool: Add Lead to List
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/addLeadsToListUsingPOST
server.tool(
  'marketo_add_lead_to_list',
  {
    listId: z.number(),
    leadIds: z.array(z.number()),
  },
  async ({ listId, leadIds }) => {
    try {
      const data = {
        input: leadIds.map(id => ({ id })),
      };

      const response = await makeApiRequest(`/rest/v1/lists/${listId}/leads.json`, 'POST', data);

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

// Tool: Remove Lead from List
// https://developer.adobe.com/marketo-apis/api/mapi/#operation/removeLeadsFromListUsingPOST
server.tool(
  'marketo_remove_lead_from_list',
  {
    listId: z.number(),
    leadIds: z.array(z.number()),
  },
  async ({ listId, leadIds }) => {
    try {
      const data = {
        input: leadIds.map(id => ({ id })),
      };

      const response = await makeApiRequest(
        `/rest/v1/lists/${listId}/leads/delete.json`,
        'POST',
        data
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

const transport = new StdioServerTransport();
await server.connect(transport);

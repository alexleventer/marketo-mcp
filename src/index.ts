#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';
import { MARKETO_BASE_URL, MARKETO_CLIENT_ID, MARKETO_CLIENT_SECRET } from './constants.js';
import { TokenManager } from './auth.js';
import 'dotenv/config';

if (!MARKETO_BASE_URL || !MARKETO_CLIENT_ID || !MARKETO_CLIENT_SECRET) {
  throw new Error(
    'MARKETO_BASE_URL, MARKETO_CLIENT_ID, and MARKETO_CLIENT_SECRET environment variables are required'
  );
}

const tokenManager = new TokenManager(MARKETO_CLIENT_ID, MARKETO_CLIENT_SECRET);

const server = new McpServer({
  name: 'MarketoAPI',
  version: '1.1.0',
});

async function makeApiRequest(
  endpoint: string,
  method: string,
  data?: any,
  contentType: string = 'application/json'
) {
  const token = await tokenManager.getToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  try {
    const response = await axios({
      url: `${MARKETO_BASE_URL}${endpoint}`,
      method,
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

function tool<T>(handler: (args: T) => Promise<unknown>) {
  return async (args: T) => {
    try {
      const response = await handler(args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error.response?.data?.message || error.message}`,
          },
        ],
        isError: true,
      };
    }
  };
}

// ============================================================================
// Marketo Asset API — Forms
// https://developer.adobe.com/marketo-apis/api/asset/
// ============================================================================

server.tool(
  'marketo_get_forms',
  {
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
    status: z.enum(['approved', 'draft']).optional(),
  },
  tool(async ({ maxReturn = 200, offset = 0, status }) => {
    const params = new URLSearchParams({
      maxReturn: maxReturn.toString(),
      offset: offset.toString(),
    });
    if (status) params.append('status', status);
    return makeApiRequest(`/asset/v1/forms.json?${params.toString()}`, 'GET');
  })
);

server.tool(
  'marketo_get_form_by_id',
  { formId: z.number() },
  tool(async ({ formId }) => makeApiRequest(`/asset/v1/form/${formId}.json`, 'GET'))
);

server.tool(
  'marketo_clone_form',
  {
    formId: z.number(),
    name: z.string(),
    description: z.string().optional(),
    folderId: z.number(),
  },
  tool(async ({ formId, name, description, folderId }) =>
    makeApiRequest(
      `/asset/v1/form/${formId}/clone.json`,
      'POST',
      {
        name,
        description,
        folder: JSON.stringify({ id: folderId, type: 'Folder' }),
      },
      'application/x-www-form-urlencoded'
    )
  )
);

server.tool(
  'marketo_approve_form',
  {
    formId: z.number(),
    comment: z.string().optional(),
  },
  tool(async ({ formId, comment }) =>
    makeApiRequest(
      `/asset/v1/form/${formId}/approve.json`,
      'POST',
      comment ? { comment } : undefined
    )
  )
);

// ============================================================================
// Marketo Asset API — Smart Lists
// ============================================================================

server.tool(
  'marketo_get_smart_lists',
  {
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
  },
  tool(async ({ maxReturn = 200, offset = 0 }) => {
    const params = new URLSearchParams({
      maxReturn: maxReturn.toString(),
      offset: offset.toString(),
    });
    return makeApiRequest(`/asset/v1/smartLists.json?${params.toString()}`, 'GET');
  })
);

server.tool(
  'marketo_get_smart_list_by_id',
  { smartListId: z.number() },
  tool(async ({ smartListId }) =>
    makeApiRequest(`/asset/v1/smartList/${smartListId}.json`, 'GET')
  )
);

// ============================================================================
// Marketo Asset API — Channels
// ============================================================================

server.tool(
  'marketo_get_channels',
  {
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
  },
  tool(async ({ maxReturn = 200, offset = 0 }) => {
    const params = new URLSearchParams({
      maxReturn: maxReturn.toString(),
      offset: offset.toString(),
    });
    return makeApiRequest(`/asset/v1/channels.json?${params.toString()}`, 'GET');
  })
);

server.tool(
  'marketo_get_channel_by_id',
  { channelId: z.number() },
  tool(async ({ channelId }) => makeApiRequest(`/asset/v1/channel/${channelId}.json`, 'GET'))
);

server.tool(
  'marketo_create_channel',
  {
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    applicationId: z.number().optional(),
  },
  tool(async ({ name, description, type, applicationId }) =>
    makeApiRequest('/asset/v1/channels.json', 'POST', {
      name,
      description,
      type,
      applicationId,
    })
  )
);

server.tool(
  'marketo_update_channel',
  {
    channelId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    applicationId: z.number().optional(),
  },
  tool(async ({ channelId, name, description, type, applicationId }) =>
    makeApiRequest(`/asset/v1/channel/${channelId}.json`, 'POST', {
      name,
      description,
      type,
      applicationId,
    })
  )
);

server.tool(
  'marketo_delete_channel',
  { channelId: z.number() },
  tool(async ({ channelId }) =>
    makeApiRequest(`/asset/v1/channel/${channelId}/delete.json`, 'POST')
  )
);

// ============================================================================
// Marketo Lead Database API — Leads
// https://developer.adobe.com/marketo-apis/api/mapi/
// ============================================================================

server.tool(
  'marketo_get_lead_by_id',
  {
    leadId: z.number(),
    fields: z.array(z.string()).optional(),
  },
  tool(async ({ leadId, fields }) => {
    const params = new URLSearchParams();
    if (fields) params.append('fields', fields.join(','));
    const query = params.toString() ? `?${params.toString()}` : '';
    return makeApiRequest(`/rest/v1/lead/${leadId}.json${query}`, 'GET');
  })
);

server.tool(
  'marketo_get_lead_by_email',
  {
    email: z.string().email(),
    fields: z.array(z.string()).optional(),
  },
  tool(async ({ email, fields }) => {
    const params = new URLSearchParams();
    if (fields) params.append('fields', fields.join(','));
    const query = params.toString() ? `?${params.toString()}` : '';
    return makeApiRequest(`/rest/v1/lead/${email}.json${query}`, 'GET');
  })
);

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
  tool(async ({ input, lookupField = 'email', partitionName }) =>
    makeApiRequest('/rest/v1/leads.json', 'POST', { input, lookupField, partitionName })
  )
);

server.tool(
  'marketo_delete_lead',
  { leadId: z.number() },
  tool(async ({ leadId }) => makeApiRequest(`/rest/v1/leads/${leadId}/delete.json`, 'POST'))
);

// ============================================================================
// Marketo Lead Database API — Activities
// ============================================================================

server.tool(
  'marketo_get_lead_activities',
  {
    leadId: z.number(),
    activityTypeIds: z.array(z.number()).optional(),
    nextPageToken: z.string().optional(),
    batchSize: z.number().optional(),
  },
  tool(async ({ leadId, activityTypeIds, nextPageToken, batchSize = 100 }) => {
    const params = new URLSearchParams({ batchSize: batchSize.toString() });
    if (activityTypeIds) params.append('activityTypeIds', activityTypeIds.join(','));
    if (nextPageToken) params.append('nextPageToken', nextPageToken);
    return makeApiRequest(
      `/rest/v1/activities/lead/${leadId}.json?${params.toString()}`,
      'GET'
    );
  })
);

server.tool(
  'marketo_get_lead_changes',
  {
    leadId: z.number(),
    fields: z.array(z.string()).optional(),
    nextPageToken: z.string().optional(),
    batchSize: z.number().optional(),
  },
  tool(async ({ leadId, fields, nextPageToken, batchSize = 100 }) => {
    const params = new URLSearchParams({ batchSize: batchSize.toString() });
    if (fields) params.append('fields', fields.join(','));
    if (nextPageToken) params.append('nextPageToken', nextPageToken);
    return makeApiRequest(
      `/rest/v1/activities/lead/${leadId}/changes.json?${params.toString()}`,
      'GET'
    );
  })
);

// ============================================================================
// Marketo Lead Database API — Lists
// ============================================================================

server.tool(
  'marketo_get_lead_lists',
  {
    leadId: z.number(),
    batchSize: z.number().optional(),
    nextPageToken: z.string().optional(),
  },
  tool(async ({ leadId, batchSize = 100, nextPageToken }) => {
    const params = new URLSearchParams({ batchSize: batchSize.toString() });
    if (nextPageToken) params.append('nextPageToken', nextPageToken);
    return makeApiRequest(
      `/rest/v1/lists/${leadId}/leads.json?${params.toString()}`,
      'GET'
    );
  })
);

server.tool(
  'marketo_add_lead_to_list',
  {
    listId: z.number(),
    leadIds: z.array(z.number()),
  },
  tool(async ({ listId, leadIds }) =>
    makeApiRequest(`/rest/v1/lists/${listId}/leads.json`, 'POST', {
      input: leadIds.map(id => ({ id })),
    })
  )
);

server.tool(
  'marketo_remove_lead_from_list',
  {
    listId: z.number(),
    leadIds: z.array(z.number()),
  },
  tool(async ({ listId, leadIds }) =>
    makeApiRequest(`/rest/v1/lists/${listId}/leads/delete.json`, 'POST', {
      input: leadIds.map(id => ({ id })),
    })
  )
);

const transport = new StdioServerTransport();
await server.connect(transport);

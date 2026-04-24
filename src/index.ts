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
  version: '1.2.0',
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
  'List forms in the Marketo instance. Filter by approval status (approved/draft) and paginate with maxReturn/offset. Returns form metadata including URL, status, and folder location.',
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
  'Retrieve a single form by its numeric ID. Returns full form metadata including fields, submit button, and thank-you page configuration.',
  { formId: z.number() },
  tool(async ({ formId }) => makeApiRequest(`/asset/v1/form/${formId}.json`, 'GET'))
);

server.tool(
  'marketo_clone_form',
  'Clone an existing form into a destination folder. The cloned form is created in draft status and must be approved before use.',
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
  'Approve a draft form, making it available for use in landing pages and embeds. Optionally include an approval comment.',
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
  'List smart lists in the Marketo instance. Paginate with maxReturn (default 200) and offset. Returns smart list metadata including filter rules and folder location.',
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
  'Retrieve a single smart list by its numeric ID. Returns the smart list definition including filter rules and membership criteria.',
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
  'List all program channels in the instance. Channels define the progression statuses available to programs (e.g., Webinar: Invited > Registered > Attended).',
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
  'Retrieve a single channel by its numeric ID. Returns the channel definition including progression statuses and their success mappings.',
  { channelId: z.number() },
  tool(async ({ channelId }) => makeApiRequest(`/asset/v1/channel/${channelId}.json`, 'GET'))
);

server.tool(
  'marketo_create_channel',
  'Create a new program channel. Channels must have a unique name and type. The type determines which program types can use this channel.',
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
  'Update an existing channel\'s properties (name, description, type). Cannot change progression statuses after creation.',
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
  'Delete a channel by ID. Fails if any programs are currently using this channel.',
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
  'Retrieve a lead by its numeric Marketo ID. Optionally specify which fields to return (defaults to standard fields). Returns lead record with all requested field values.',
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
  'Look up a lead by email address using the Marketo leads filter API. Optionally specify which fields to return. Returns matching lead records.',
  {
    email: z.string().email(),
    fields: z.array(z.string()).optional(),
  },
  tool(async ({ email, fields }) => {
    const params = new URLSearchParams({
      filterType: 'email',
      filterValues: email,
    });
    if (fields) params.append('fields', fields.join(','));
    return makeApiRequest(`/rest/v1/leads.json?${params.toString()}`, 'GET');
  })
);

server.tool(
  'marketo_create_or_update_lead',
  'Bulk create or update leads (upsert). Accepts an array of lead records with standard and custom fields. Deduplicates by lookupField (default: email). Max 300 leads per call.',
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
  'Permanently delete a lead by its numeric ID. This action cannot be undone.',
  { leadId: z.number() },
  tool(async ({ leadId }) => makeApiRequest(`/rest/v1/leads/${leadId}/delete.json`, 'POST'))
);

// ============================================================================
// Marketo Lead Database API — Activities
// ============================================================================

server.tool(
  'marketo_get_lead_activities',
  'Fetch activity records for a specific lead. Filter by activity type IDs (e.g., 1=Visit Webpage, 2=Fill Out Form, 6=Send Email). Supports cursor-based pagination via nextPageToken.',
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
  'Fetch field-change history for a specific lead. Optionally filter to specific field names. Useful for auditing data changes and tracking lead lifecycle progression.',
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
  'Get all static lists that a lead belongs to. Supports cursor-based pagination via nextPageToken. Returns list IDs and names.',
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
  'Add one or more leads to a static list by list ID. Accepts an array of lead IDs. Max 300 leads per call.',
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
  'Remove one or more leads from a static list. Accepts an array of lead IDs. Max 300 leads per call.',
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

// ============================================================================
// Marketo Asset API — Programs
// https://developer.adobe.com/marketo-apis/api/asset/#tag/Programs
// ============================================================================

server.tool(
  'marketo_get_programs',
  'List programs in Marketo. Filter by type (filterType: id, programType, folder, tag) with filterValues, or by date range (earliestUpdatedAt/latestUpdatedAt). Paginate with maxReturn/offset. Returns program metadata including channel, status, costs, and tags.',
  {
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
    filterType: z.enum(['id', 'programType', 'folder', 'tag']).optional(),
    filterValues: z.string().optional(),
    earliestUpdatedAt: z.string().optional(),
    latestUpdatedAt: z.string().optional(),
  },
  tool(async ({ maxReturn = 200, offset = 0, filterType, filterValues, earliestUpdatedAt, latestUpdatedAt }) => {
    const params = new URLSearchParams({
      maxReturn: maxReturn.toString(),
      offset: offset.toString(),
    });
    if (filterType) params.append('filterType', filterType);
    if (filterValues) params.append('filterValues', filterValues);
    if (earliestUpdatedAt) params.append('earliestUpdatedAt', earliestUpdatedAt);
    if (latestUpdatedAt) params.append('latestUpdatedAt', latestUpdatedAt);
    return makeApiRequest(`/asset/v1/programs.json?${params.toString()}`, 'GET');
  })
);

server.tool(
  'marketo_get_program_by_id',
  'Retrieve a single program by its numeric ID. Returns full program metadata including channel, status, costs, tags, and folder path.',
  { programId: z.number() },
  tool(async ({ programId }) => makeApiRequest(`/asset/v1/program/${programId}.json`, 'GET'))
);

server.tool(
  'marketo_clone_program',
  'Clone an existing program into a destination folder. Clones all local assets (emails, landing pages, smart campaigns) within the program. The cloned program is created with the same channel.',
  {
    programId: z.number(),
    name: z.string(),
    folderId: z.number(),
    description: z.string().optional(),
  },
  tool(async ({ programId, name, folderId, description }) =>
    makeApiRequest(
      `/asset/v1/program/${programId}/clone.json`,
      'POST',
      {
        name,
        folder: JSON.stringify({ id: folderId, type: 'Folder' }),
        description,
      },
      'application/x-www-form-urlencoded'
    )
  )
);

server.tool(
  'marketo_get_program_members',
  'Get leads that are members of a specific program. Optionally specify which fields to return. Supports cursor-based pagination via nextPageToken. Returns member status alongside lead data.',
  {
    programId: z.number(),
    fields: z.array(z.string()).optional(),
    batchSize: z.number().optional(),
    nextPageToken: z.string().optional(),
  },
  tool(async ({ programId, fields, batchSize = 200, nextPageToken }) => {
    const params = new URLSearchParams({ batchSize: batchSize.toString() });
    if (fields) params.append('fields', fields.join(','));
    if (nextPageToken) params.append('nextPageToken', nextPageToken);
    return makeApiRequest(
      `/rest/v1/leads/programs/${programId}.json?${params.toString()}`,
      'GET'
    );
  })
);

// ============================================================================
// Marketo Asset API — Emails
// https://developer.adobe.com/marketo-apis/api/asset/#tag/Emails
// ============================================================================

server.tool(
  'marketo_get_emails',
  'List email assets in Marketo. Filter by approval status (approved/draft) and paginate with maxReturn/offset. Returns email metadata including subject line, from address, and template ID.',
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
    return makeApiRequest(`/asset/v1/emails.json?${params.toString()}`, 'GET');
  })
);

server.tool(
  'marketo_get_email_by_id',
  'Retrieve a single email by its numeric ID. Returns full email metadata including subject, from address, reply-to, template, and folder location.',
  { emailId: z.number() },
  tool(async ({ emailId }) => makeApiRequest(`/asset/v1/email/${emailId}.json`, 'GET'))
);

server.tool(
  'marketo_send_sample_email',
  'Send a sample/preview of an email to a specified email address. Optionally render with a specific lead\'s data by passing leadId. Useful for QA before approving.',
  {
    emailId: z.number(),
    emailAddress: z.string().email(),
    textOnly: z.boolean().optional(),
    leadId: z.number().optional(),
  },
  tool(async ({ emailId, emailAddress, textOnly, leadId }) => {
    const data: Record<string, string> = { emailAddress };
    if (textOnly !== undefined) data.textOnly = textOnly.toString();
    if (leadId !== undefined) data.leadId = leadId.toString();
    return makeApiRequest(
      `/asset/v1/email/${emailId}/sendSample.json`,
      'POST',
      data,
      'application/x-www-form-urlencoded'
    );
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);

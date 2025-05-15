import { z } from 'zod';
import { makeApiRequest } from '../../utils/api.js';
import { MarketoTool } from '../../types.js';

// Tool: Get Channels
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getChannelsUsingGET
export const getChannels: MarketoTool = {
  name: 'marketo_get_channels',
  schema: z.object({
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
  }),
  handler: async ({ maxReturn = 200, offset = 0 }) => {
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
  },
};

// Tool: Get Channel by ID
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getChannelByIdUsingGET
export const getChannelById: MarketoTool = {
  name: 'marketo_get_channel_by_id',
  schema: z.object({
    channelId: z.number(),
  }),
  handler: async ({ channelId }) => {
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
  },
};

// Tool: Create Channel
// https://developer.adobe.com/marketo-apis/api/asset/#operation/createChannelUsingPOST
export const createChannel: MarketoTool = {
  name: 'marketo_create_channel',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    applicationId: z.number().optional(),
  }),
  handler: async ({ name, description, type, applicationId }) => {
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
  },
};

// Tool: Update Channel
// https://developer.adobe.com/marketo-apis/api/asset/#operation/updateChannelUsingPOST
export const updateChannel: MarketoTool = {
  name: 'marketo_update_channel',
  schema: z.object({
    channelId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    applicationId: z.number().optional(),
  }),
  handler: async ({ channelId, name, description, type, applicationId }) => {
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
  },
};

// Tool: Delete Channel
// https://developer.adobe.com/marketo-apis/api/asset/#operation/deleteChannelUsingPOST
export const deleteChannel: MarketoTool = {
  name: 'marketo_delete_channel',
  schema: z.object({
    channelId: z.number(),
  }),
  handler: async ({ channelId }) => {
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
  },
}; 
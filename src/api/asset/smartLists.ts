import { z } from 'zod';
import { makeApiRequest } from '../../utils/api.js';
import { MarketoTool } from '../../types.js';

// Tool: Get Smart Lists
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getSmartListsUsingGET
export const getSmartLists: MarketoTool = {
  name: 'marketo_get_smart_lists',
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
  },
};

// Tool: Get Smart List by ID
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getSmartListByIdUsingGET
export const getSmartListById: MarketoTool = {
  name: 'marketo_get_smart_list_by_id',
  schema: z.object({
    smartListId: z.number(),
  }),
  handler: async ({ smartListId }) => {
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
  },
}; 
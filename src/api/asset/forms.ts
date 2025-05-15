import { z } from 'zod';
import { makeApiRequest } from '../../utils/api.js';
import { MarketoTool } from '../../types.js';

// Tool: Get Forms
// https://developer.adobe.com/marketo-apis/api/asset/#operation/browseForms2UsingGET
export const getForms: MarketoTool = {
  name: 'marketo_get_forms',
  schema: z.object({
    maxReturn: z.number().optional(),
    offset: z.number().optional(),
    status: z.enum(['approved', 'draft']).optional(),
  }),
  handler: async ({ maxReturn = 200, offset = 0, status }) => {
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
  },
};

// Tool: Approve Form
// https://developer.adobe.com/marketo-apis/api/asset/#operation/approveFromUsingPOST
export const approveForm: MarketoTool = {
  name: 'marketo_approve_form',
  schema: z.object({
    formId: z.number(),
    comment: z.string().optional(),
  }),
  handler: async ({ formId, comment }) => {
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
  },
};

// Tool: Clone Form
// https://developer.adobe.com/marketo-apis/api/asset/#operation/cloneLpFormsUsingPOST
export const cloneForm: MarketoTool = {
  name: 'marketo_clone_form',
  schema: z.object({
    formId: z.number(),
    name: z.string(),
    description: z.string().optional(),
    folderId: z.number(),
  }),
  handler: async ({ formId, name, description, folderId }) => {
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
  },
};

// Tool: Get Form by ID
// https://developer.adobe.com/marketo-apis/api/asset/#operation/getLpFormByIdUsingGET
export const getFormById: MarketoTool = {
  name: 'marketo_get_form_by_id',
  schema: z.object({
    formId: z.number(),
  }),
  handler: async ({ formId }) => {
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
  },
}; 
import { z } from 'zod';
import { RequestHandlerExtra, ServerRequest, ServerNotification } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface MarketoTool {
  name: string;
  schema: z.ZodType<any>;
  handler: (
    args: any,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ) => Promise<{
    content: { type: string; text: string }[];
  }>;
} 
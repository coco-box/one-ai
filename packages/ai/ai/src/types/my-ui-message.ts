import { type UIMessage as BaseUIMessage } from '../ui/ui-messages';
import { z } from 'zod';

// Define your metadata schema
export const messageMetadataSchema = z.object({
  createdAt: z.number().optional(), // 创建时间
  name: z.string().optional(), // 智能体名称
  role: z.string().optional(), // 智能体角色
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Create a typed UIMessage
export type UIMessage = BaseUIMessage<MessageMetadata>;
import { z } from "zod";

// Outgoing message payload
export const messageSchema = z.object({
  recipient_id: z.number().int().positive(),
  content: z.string().min(1).max(5000),
});

// Incoming message response
export const messageResponseSchema = z.object({
  id: z.number().int(),
  conversation_id: z.number().int(),
  sender_id: z.number().int(),
  sender_username: z.string().nullable().optional(),
  content: z.string(),
  created_at: z.iso.datetime({ offset: true }),
});

// Conversation response
export const conversationResponseSchema = z.object({
  id: z.number().int(),
  user1_id: z.number().int(),
  user2_id: z.number().int(),
  peer_username: z.string().min(1),
  created_at: z.iso.datetime(),
});

// TypeScript types
export type MessageInput = z.infer<typeof messageSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type ConversationResponse = z.infer<typeof conversationResponseSchema>;

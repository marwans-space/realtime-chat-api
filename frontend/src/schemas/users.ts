import { z } from "zod";

export const userSearchResultSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1).max(50),
});

export const userSearchResultsSchema = z.array(userSearchResultSchema);

export type UserSearchResult = z.infer<typeof userSearchResultSchema>;

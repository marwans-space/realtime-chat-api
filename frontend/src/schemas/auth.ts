import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  username: z
    .string()
    .min(1, "Username is required")
    .max(50, "Username must not exceed 50 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

import { z } from "zod/v4";

const usernameSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]{2,19}$/,
    "3-20 characters: lowercase letters, numbers, and underscores, starting with a letter"
  );

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z
  .object({
    username: usernameSchema,
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email address").optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const forgotPasswordSchema = z.object({
  username: usernameSchema,
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

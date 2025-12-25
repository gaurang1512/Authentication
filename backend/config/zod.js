import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(4, "Name must be atleat 4 character long"),
  email: z.string().email("Invalid Email format"),
  password: z
    .string()
    .min(8, "Password must contain atleast 8 characters long")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
      "Password must contain atleast one special character"
    ),
  role: z.string().optional().default("user"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid Email format"),
  password: z
    .string()
    .min(8, "Password must contain atleast 8 characters long")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
      "Password must contain atleast one special character"
    ),
});

export default registerSchema;

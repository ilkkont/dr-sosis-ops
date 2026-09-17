import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "E-posta gerekli." })
    .email({ message: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(1, { message: "Şifre gerekli." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

import { z } from "zod";

export const UpdateCommonContentSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
});

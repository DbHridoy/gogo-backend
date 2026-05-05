import { z } from "zod";

export const CreateReportSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
});

export const GetReportsQuerySchema = z.object({
  status: z.enum(["Pending", "Resolved"]).optional(),
  reporterRole: z.enum(["User", "Rider"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const ResolveReportSchema = z.object({
  resolutionNote: z.string().trim().min(1).optional(),
});

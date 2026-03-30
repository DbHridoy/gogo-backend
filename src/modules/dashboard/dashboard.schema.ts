import { z } from "zod";

export const dashboardQuerySchema = z
  .object({
    groupBy: z.enum(["daily", "weekly", "monthly"]).optional().default("daily"),
    dateFrom: z.iso.datetime().optional(),
    dateTo: z.iso.datetime().optional(),
    status: z
      .enum([
        "Pending",
        "Accepted",
        "ArrivedPickup",
        "InProgress",
        "Completed",
        "Cancelled",
      ])
      .optional(),
    area: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
    recentLimit: z.coerce.number().int().min(1).max(50).optional().default(10),
    hotAreaLimit: z.coerce.number().int().min(1).max(20).optional().default(5),
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo) {
      const from = new Date(data.dateFrom);
      const to = new Date(data.dateTo);

      if (from > to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "dateFrom must be before or equal to dateTo",
          path: ["dateFrom"],
        });
      }
    }
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

import { z } from "zod";
import {
  CreateReportSchema,
  GetReportsQuerySchema,
  ResolveReportSchema,
} from "./report.schema";

export type CreateReportType = z.infer<typeof CreateReportSchema>;
export type GetReportsQueryType = z.infer<typeof GetReportsQuerySchema>;
export type ResolveReportType = z.infer<typeof ResolveReportSchema>;

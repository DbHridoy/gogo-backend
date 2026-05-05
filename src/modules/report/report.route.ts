import { Router } from "express";
import { authMiddleware, reportController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import {
  CreateReportSchema,
  ResolveReportSchema,
} from "./report.schema";

const reportRoute = Router();

reportRoute.use(authMiddleware.authenticate);

reportRoute.post(
  "/",
  authMiddleware.authorize(["User", "Rider"]),
  validate(CreateReportSchema),
  reportController.createReport
);

reportRoute.get("/", reportController.getReports);
reportRoute.get("/:id", reportController.getReportById);
reportRoute.patch(
  "/:id/resolve",
  authMiddleware.authorize(["Admin"]),
  validate(ResolveReportSchema),
  reportController.resolveReport
);

export default reportRoute;

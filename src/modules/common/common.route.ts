import { Router } from "express";
import { authMiddleware, commonController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import {
  UpdateCommonContentSchema,
  UpdateDeliverySettingsSchema,
} from "./common.schema";

const commonRoute = Router();

commonRoute.get("/", commonController.getContent);

commonRoute.patch(
  "/content",
  authMiddleware.authenticate,
  authMiddleware.authorize(["Admin"]),
  validate(UpdateCommonContentSchema),
  commonController.updateContent
);

commonRoute.patch(
  "/delivery-settings",
  authMiddleware.authenticate,
  authMiddleware.authorize(["Admin"]),
  validate(UpdateDeliverySettingsSchema),
  commonController.updateDeliverySettings
);

export default commonRoute;

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import {
  CreateUserSchema,
  SaveAddressSchema,
  UpdateRiderLocationSchema,
  UpdateSavedAddressSchema,
  UpdateUserSchemaForOtherRoles,
} from "./user.schema";
import { authMiddleware, userController } from "../../container";
import { uploadFile } from "../../middlewares/upload.middleware";

const userRoute = Router();

userRoute.use(authMiddleware.authenticate)

userRoute.post("/", authMiddleware.authorize(["Admin"]), validate(CreateUserSchema), userController.createUser);

userRoute.get("/", userController.getAllUsers);
userRoute.get(
  "/me",
  authMiddleware.authenticate,
  userController.getMyProfile
);
userRoute.get("/:id", userController.getUserById);

userRoute.patch(
  "/me",
  authMiddleware.authenticate,
  validate(UpdateUserSchemaForOtherRoles),
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }),
  userController.updateMyProfile
);
userRoute.patch(
  "/me/location",
  authMiddleware.authorize(["Rider"]),
  validate(UpdateRiderLocationSchema),
  userController.updateRiderLocation
);
userRoute.get("/me/addresses", userController.getSavedAddresses);
userRoute.post(
  "/me/addresses",
  validate(SaveAddressSchema),
  userController.addSavedAddress
);
userRoute.patch(
  "/me/addresses/:addressId",
  validate(UpdateSavedAddressSchema),
  userController.updateSavedAddress
);
userRoute.delete("/me/addresses/:addressId", userController.deleteSavedAddress);

userRoute.patch(
  "/:id",
  authMiddleware.authorize(["Admin"]),
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }),
  userController.updateUser
);

userRoute.delete("/:id", authMiddleware.authorize(["Admin"]), userController.deleteUser);

export default userRoute;

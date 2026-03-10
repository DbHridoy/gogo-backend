import z from "zod";
import {
  CreateUserSchema,
  SaveAddressSchema,
  UpdateSavedAddressSchema,
  UpdateUserSchemaForOtherRoles,
} from "./user.schema";

export type updateOtherRoleUserType = z.infer<typeof UpdateUserSchemaForOtherRoles>;
export type createUserType=z.infer<typeof CreateUserSchema>
export type saveAddressType = z.infer<typeof SaveAddressSchema>;
export type updateSavedAddressType = z.infer<typeof UpdateSavedAddressSchema>;

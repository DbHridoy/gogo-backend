import { z } from "zod";

// Base user schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["Admin", "User", "Rider"]),
  password: z.string(),
});

// Schema for updating user (other roles) — role and cluster omitted, all optional
export const UpdateUserSchemaForOtherRoles = UserSchema.omit({
  role: true,
}).partial();

// Schema for creating user — phoneNumber, address, profileImage omitted, cluster optional
export const CreateUserSchema = UserSchema;

export const SaveAddressSchema = z.object({
  label: z.string().trim().optional(),
  addressLine: z.string().trim().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isDefault: z.boolean().optional(),
});

export const UpdateSavedAddressSchema = SaveAddressSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required",
  }
);

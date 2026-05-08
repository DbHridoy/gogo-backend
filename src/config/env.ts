import z from "zod";
import dotenv from "dotenv";
dotenv.config();

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const normalizeMailSecret = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.replace(/\s+/g, "");
};

const normalizeTapSecret = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.replace(/\s+/g, "");
};

const envSchema = z.object({
  PORT: z.string().default("5000"),
  DB_URL: z
    .string()
    .default("mongodb+srv://hridoy:1234@practice0.qsptr89.mongodb.net"),
  NODE_ENV: z.string().default("development"),

  CLIENT_URLS: z.string().default("http://localhost:5173"),

  SALT_ROUNDS: z.coerce.number().default(10),

  JWT_ACCESS_SECRET: z.string().min(1, "Access token secret required"),
  JWT_REFRESH_SECRET: z.string().min(1, "Refresh token secret required"),

  JWT_ACCESS_EXPIRY: z.string().default("7d"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),

  GMAIL_USER: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "Gmail user required"),
  ),
  GMAIL_PASS: z.preprocess(
    normalizeMailSecret,
    z.string().min(1, "Gmail password required"),
  ),

  S3_BUCKET_REGION: z.string().min(1, "AWS region required"),
  AWS_ACCESS_KEY_ENV: z.string().min(1, "AWS access key required"),
  AWS_SECRET_KEY_ENV: z.string().min(1, "AWS secret key required"),
  S3_BUCKET_NAME: z.string().min(1, "AWS bucket name required"),
  ADMIN_EMAIL: z.string().email("Admin email must be valid"),
  ADMIN_PASSWORD: z.string().min(1, "Admin password required"),
  TAP_SECRET_KEY: z.preprocess(
    (value) => normalizeTapSecret(emptyToUndefined(value)),
    z.string().default(""),
  ),
  TAP_API_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().default("https://api.tap.company/v2"),
  ),
  TAP_POST_URL: z.preprocess(emptyToUndefined, z.string().default("")),
  TAP_REDIRECT_URL: z.preprocess(
    emptyToUndefined,
    z.string().default("http://localhost:5173/payment/callback"),
  ),
  FIREBASE_PROJECT_ID: z.string().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().default(""),
  FIREBASE_PRIVATE_KEY: z.string().default(""),
});

export const env = envSchema.parse(process.env);

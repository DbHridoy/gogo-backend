import app from "../src/app";
import connectDB from "../src/config/database";
import { env } from "../src/config/env";

// Ensure DB is connected
const connect = async () => {
  try {
    await connectDB(env.DB_URL);
  } catch (error) {
    console.error("Database connection failed", error);
  }
};

connect();

export default app;

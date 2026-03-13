import admin from "firebase-admin";
import { env } from "./env";

let firebaseApp: admin.app.App | null = null;

const hasFirebaseConfig = () =>
  Boolean(
    env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY
  );

export const getFirebaseAdmin = () => {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase Admin credentials are not configured");
  }

  if (!firebaseApp) {
    firebaseApp = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });
  }

  return admin;
};

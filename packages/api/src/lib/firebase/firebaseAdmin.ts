import { TRPCError } from "@trpc/server";
import * as admin from "firebase-admin";
import { Auth } from "firebase-admin/auth";

let initialized = false;

const initializeFirebaseAdmin = () => {
  if (!initialized && admin.apps.length === 0) {
    try {
      // TODO Update this to use service account file from S3 storage
      // Parse the JSON string from the environment variable
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not defined",
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON,
      );

      admin.initializeApp({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin Initialized");
      initialized = true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(
        "!!! Firebase Admin initialization error:",
        errorMessage,
        errorStack,
      );
      throw new Error(
        "Failed to initialize Firebase Admin SDK: " + errorMessage,
      );
    }
  }
  return admin;
};

export const getFirebaseAdminAuth = (): Auth => {
  const adminInstance = initializeFirebaseAdmin();

  if (!adminInstance || adminInstance.apps.length === 0) {
    throw new Error(
      "Firebase Admin SDK failed to initialize or is not available.",
    );
  }
  return adminInstance.auth();
};

const getSessionCookieValue = (cookieString: string | null) => {
  if (!cookieString) {
    return null;
  }

  const cookies = cookieString.split("; ");
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("session="));

  if (sessionCookie) {
    const separatorIndex = sessionCookie.indexOf("=");
    if (separatorIndex !== -1) {
      return sessionCookie.substring(separatorIndex + 1);
    }
  }
  return null;
};

export const getDecodedTokenFromCookie = async (headers: Headers) => {
  const session = getSessionCookieValue(headers.get("cookie"));
  if (!session) {
    return null;
  }
  try {
    const firebaseAdmin = getFirebaseAdminAuth();

    const decodedToken = await firebaseAdmin.verifySessionCookie(session);
    console.log("decodedToken", decodedToken);
    return decodedToken;
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not parse session cookie",
    });
  }
};

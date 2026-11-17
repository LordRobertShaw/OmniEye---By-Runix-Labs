import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore against the provisioned named database with Multi-Tab Offline Persistence
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

// Non-blocking boot connectivity check for Firestore
if (typeof window !== "undefined") {
  getDocFromServer(doc(db, "test", "connection")).catch((error) => {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Firestore initial probe: client appears offline or using local cache.");
    }
  });
}

// Configure Google OAuth Provider
export const googleAuthProvider = new GoogleAuthProvider();

// Scopes required for Google Contacts, Google Drive and Gmail
googleAuthProvider.addScope("https://www.googleapis.com/auth/contacts");
googleAuthProvider.addScope("https://www.googleapis.com/auth/contacts.other.readonly");
googleAuthProvider.addScope("https://www.googleapis.com/auth/user.phonenumbers.read");
googleAuthProvider.addScope("https://www.googleapis.com/auth/user.emails.read");
googleAuthProvider.addScope("https://www.googleapis.com/auth/drive");
googleAuthProvider.addScope("https://mail.google.com/");
googleAuthProvider.addScope("openid");
googleAuthProvider.addScope("profile");
googleAuthProvider.addScope("email");

// In-memory token cache backed by sessionStorage (isolated to current tab)
let cachedAccessToken: string | null =
  typeof window !== "undefined" ? sessionStorage.getItem("contacts_access_token") : null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== "undefined") {
        cachedAccessToken = sessionStorage.getItem("contacts_access_token");
      }

      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Still allow Firebase ID token sessions even if Workspace OAuth accessToken expired across reloads
        if (onAuthSuccess) onAuthSuccess(user, "");
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("contacts_access_token");
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Auth");
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("contacts_access_token", credential.accessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Authentication Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("contacts_access_token", token);
    } else {
      sessionStorage.removeItem("contacts_access_token");
    }
  }
};

export const getFirebaseIdToken = async (): Promise<string | null> => {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (err) {
    console.warn("Unable to get Firebase ID token:", err);
    return null;
  }
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("contacts_access_token");
  }
};

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

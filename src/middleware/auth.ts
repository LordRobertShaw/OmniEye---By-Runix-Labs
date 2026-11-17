import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../lib/firebase-admin.ts";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing authentication token." });
    return;
  }

  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    res.status(401).json({ error: "Unauthorized: Empty authentication token." });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
    };
    next();
  } catch (error) {
    console.warn("Firebase ID token verification failed:", error);
    res.status(401).json({ error: "Unauthorized: Invalid or expired session token." });
  }
}

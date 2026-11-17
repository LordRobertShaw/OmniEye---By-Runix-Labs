import { db } from "./index.ts";
import { users } from "./schema.ts";

export async function getOrCreateUser(uid: string, email?: string) {
  try {
    const [user] = await db
      .insert(users)
      .values({
        uid,
        email: email ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email ?? null,
        },
      })
      .returning();

    return user;
  } catch (error) {
    throw new Error("Failed to sync authenticated user record.", { cause: error });
  }
}

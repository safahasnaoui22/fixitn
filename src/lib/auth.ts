import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE } from "./constants";
import type { Role } from "./constants";
import type { SessionPayload, PendingSessionPayload } from "./types";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ??
    "dev-only-secret-change-this-before-deploying-to-production-please"
);

const PENDING_COOKIE = "fixitn_pending";

// --- Password ----------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// --- Full session ------------------------------------------------------

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

// --- Pending session ---------------------------------------------------

export async function createPendingSession(
  payload: PendingSessionPayload
): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);

  const jar = await cookies();
  jar.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function getPendingSession(): Promise<PendingSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as PendingSessionPayload;
  } catch {
    return null;
  }
}

export async function destroyPendingSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
}

// --- Guards ------------------------------------------------------------

/**
 * Requires a valid session AND verifies the sessionVersion matches the DB.
 * This is what enforces single-device login:
 * - User logs in on Phone B → sessionVersion incremented in DB
 * - Phone A's JWT has the old version → version mismatch → logged out
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");

  // Verify session version against DB — single device enforcement
  try {
    const { prisma } = await import("./db/client");
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { sessionVersion: true },
    });

    if (!user) {
      // User was deleted
      await destroySession();
      redirect("/login");
    }

    if (user.sessionVersion !== session.sessionVersion) {
      // Someone else logged in — invalidate this session
      await destroySession();
      redirect(
        `/login?error=${encodeURIComponent(
          "Your session was ended because you logged in from another device."
        )}`
      );
    }
  } catch (err: unknown) {
    // If it's a redirect, rethrow it — don't swallow navigation
    if (
      err instanceof Error &&
      err.message === "NEXT_REDIRECT"
    ) {
      throw err;
    }
    // For any other DB error, let the user through
    // (better than locking everyone out on a DB hiccup)
    console.error("[requireUser] Session version check failed:", err);
  }

  return session;
}

export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await requireUser(); // version check included
  if (session.role !== role) redirect("/");
  return session;
}
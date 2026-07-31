import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ??
    "dev-only-secret-change-this-before-deploying-to-production-please"
);

const SESSION_COOKIE = "fixitn_session";
const PENDING_COOKIE = "fixitn_pending";

// Always allow — static files, Next.js internals, public assets
const ALWAYS_ALLOW_PREFIXES = [
  "/_next",
  "/icons",
  "/models",     // face-api model weights
  "/api/push",   // push subscription (needs auth via its own check)
  "/api/face",   // face API routes handle their own auth
  "/sw.js",
  "/manifest.json",
  "/favicon.ico",
];

// Logged-out users can visit these freely
const PUBLIC_PREFIXES = [
  "/onboarding",
  "/login",
  "/register",
];

// Only reachable mid-flow (specific JWT required)
const FACE_SETUP_PATH = "/face-setup";
const FACE_VERIFY_PATH = "/face-verify";

async function parseJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Always allow static/system paths ────────────────────────────
  if (ALWAYS_ALLOW_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 2. Parse cookies ───────────────────────────────────────────────
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const pendingToken = req.cookies.get(PENDING_COOKIE)?.value;

  const session = sessionToken ? await parseJwt(sessionToken) : null;
  const pending = pendingToken ? await parseJwt(pendingToken) : null;

  const userId = session?.userId as string | undefined;
  const role = session?.role as string | undefined;
  const faceSetup = session?.faceSetup as boolean | undefined;
  const deviceVerified = session?.deviceVerified as boolean | undefined;
  const pendingUserId = pending?.pendingUserId as string | undefined;

  // ── 3. /face-verify — needs a valid pending session ────────────────
  if (pathname.startsWith(FACE_VERIFY_PATH)) {
    if (!pendingUserId) {
      // No pending session — not mid-login, go back to login
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // ── 4. /face-setup — needs a logged-in session ─────────────────────
  if (pathname.startsWith(FACE_SETUP_PATH)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // If face already set up, don't let them revisit setup
    if (faceSetup) {
      return NextResponse.redirect(new URL(homeFor(role), req.url));
    }
    return NextResponse.next();
  }

  // ── 5. Public routes ───────────────────────────────────────────────
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (userId) {
      // Already logged in — redirect to appropriate home
      if (!faceSetup) {
        return NextResponse.redirect(new URL(FACE_SETUP_PATH, req.url));
      }
      if (!deviceVerified) {
        return NextResponse.redirect(new URL(FACE_VERIFY_PATH, req.url));
      }
      return NextResponse.redirect(new URL(homeFor(role), req.url));
    }
    return NextResponse.next();
  }

  // ── 6. Protected routes — must be logged in ────────────────────────
  if (!userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 7. Face not set up yet — force /face-setup ─────────────────────
  if (!faceSetup) {
    return NextResponse.redirect(new URL(FACE_SETUP_PATH, req.url));
  }

  // ── 8. New/unknown device — force /face-verify ─────────────────────
  if (!deviceVerified) {
    return NextResponse.redirect(new URL(FACE_VERIFY_PATH, req.url));
  }

  // ── 9. Role-based route guards ─────────────────────────────────────

  // Technician-only routes
  if (pathname.startsWith("/t/") && role !== "TECHNICIAN") {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  // Client-only routes (bookings, requests, chats, profile, plans for clients)
  const CLIENT_ONLY = ["/requests", "/chats", "/profile", "/notifications"];
  if (
    CLIENT_ONLY.some((p) => pathname.startsWith(p)) &&
    role === "TECHNICIAN"
  ) {
    return NextResponse.redirect(new URL("/t/dashboard", req.url));
  }

  // ── 10. All good ───────────────────────────────────────────────────
  return NextResponse.next();
}

function homeFor(role: string | undefined): string {
  if (role === "TECHNICIAN") return "/t/dashboard";
  if (role === "ADMIN") return "/admin";
  return "/";
}

// Run on all routes except Next.js internals and public assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|models/|sw\\.js|manifest\\.json).*)",
  ],
};
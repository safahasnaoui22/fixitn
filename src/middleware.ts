import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ??
    "dev-only-secret-change-this-before-deploying-to-production-please"
);

const SESSION_COOKIE = "fixitn_session";
const PENDING_COOKIE = "fixitn_pending";

const ALWAYS_ALLOW = [
  "/_next",
  "/icons",
  "/models",
  "/api/push",
  "/api/face",
  "/api/technician/status",
  "/sw.js",
  "/manifest.json",
  "/favicon.ico",
];

const PUBLIC_PREFIXES = [
  "/onboarding",
  "/login",
  "/register",
  "/terms",
];

const FACE_SETUP_PATH = "/face-setup";
const FACE_VERIFY_PATH = "/face-verify";
const PENDING_PATH = "/t/pending";

async function parseJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function homeFor(role: string | undefined): string {
  if (role === "TECHNICIAN") return "/t/dashboard";
  if (role === "ADMIN") return "/admin";
  if (role === "SOUS_ADMIN") return "/sous-admin";
  return "/";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Always allow static/system paths ────────────────────────────
  if (ALWAYS_ALLOW.some((p) => pathname.startsWith(p))) {
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
  const accountApproved = session?.accountApproved as boolean | undefined;
  const pendingUserId = pending?.pendingUserId as string | undefined;

  // ── 3. /face-verify — needs a valid pending session ────────────────
  if (pathname.startsWith(FACE_VERIFY_PATH)) {
    if (!pendingUserId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // ── 4. /face-setup — needs a logged-in session ─────────────────────
  if (pathname.startsWith(FACE_SETUP_PATH)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (faceSetup) {
      return NextResponse.redirect(new URL(homeFor(role), req.url));
    }
    return NextResponse.next();
  }

  // ── 5. /t/pending — account awaiting approval ─────────────────────
  if (pathname.startsWith(PENDING_PATH)) {
    if (!userId || role !== "TECHNICIAN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // ── 6. Public routes ───────────────────────────────────────────────
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (userId) {
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

  // ── 7. Protected — must be logged in ───────────────────────────────
  if (!userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 8. Face setup gate ─────────────────────────────────────────────
  if (!faceSetup) {
    return NextResponse.redirect(new URL(FACE_SETUP_PATH, req.url));
  }

  // ── 9. Device verification gate ────────────────────────────────────
  if (!deviceVerified) {
    return NextResponse.redirect(new URL(FACE_VERIFY_PATH, req.url));
  }

  // ── 10. PENDING technician gate ────────────────────────────────────
  // Block PENDING/DECLINED/ARCHIVED techs from accessing /t/* routes
  if (
    role === "TECHNICIAN" &&
    pathname.startsWith("/t/") &&
    !pathname.startsWith(PENDING_PATH) &&
    accountApproved === false
  ) {
    return NextResponse.redirect(new URL(PENDING_PATH, req.url));
  }

  // ── 11. Role-based route guards ────────────────────────────────────

  // Technician-only routes
  if (pathname.startsWith("/t/") && role !== "TECHNICIAN") {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  // Sous-admin-only routes
  if (pathname.startsWith("/sous-admin") && role !== "SOUS_ADMIN") {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  // Client-only routes (techs have their own dashboard)
  const CLIENT_ONLY = ["/requests", "/chats", "/profile"];
  if (
    CLIENT_ONLY.some((p) => pathname.startsWith(p)) &&
    role === "TECHNICIAN"
  ) {
    return NextResponse.redirect(new URL("/t/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|models/|sw\\.js|manifest\\.json).*)",
  ],
};
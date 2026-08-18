import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets & image routes that are always public
  const isPublicStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/icon") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico");

  // Public shared views and uploads
  const isPublicPage =
    pathname.startsWith("/share") ||
    pathname.startsWith("/api/share") ||
    pathname.startsWith("/uploads");

  // Auth pages (accessible without authentication)
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  const isApiAuthRoute = pathname.startsWith("/api/auth");

  if (isPublicStatic || isApiAuthRoute || isPublicPage) {
    return NextResponse.next();
  }

  // Retrieve user session token with auto-detected secureCookie for HTTPS domains
  const isHttps = req.url.startsWith("https://") || req.headers.get("x-forwarded-proto") === "https";
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "dev-super-secret-key-change-this-in-production-123456789",
    secureCookie: isHttps,
  });

  const isAuthenticated = Boolean(token);

  // If user is authenticated and tries to access login or signup, redirect to dashboard / home
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is unauthenticated and tries to access protected page, redirect to login
  if (!isAuthPage && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

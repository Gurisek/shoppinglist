import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/auth/login", "/auth/register"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API and static assets
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const token = req.cookies.get("token")?.value;

  // If authenticated and on public page, redirect to /lists
  if (token && PUBLIC_PATHS.has(pathname)) {
    const url = new URL("/lists", req.url);
    return NextResponse.redirect(url);
  }

  // Allow public routes when unauthenticated
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};

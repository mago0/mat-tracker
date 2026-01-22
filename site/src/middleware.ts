import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "mat-tracker-session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // Allow login page and API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Check for session cookie
  const session = request.cookies.get(SESSION_COOKIE);

  // If no session and ADMIN_PASSWORD is set, redirect to login
  if (!session?.value && process.env.ADMIN_PASSWORD) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    // Log auth redirect (Edge runtime doesn't support Pino, use structured console.log)
    console.log(
      JSON.stringify({
        level: "info",
        time: new Date().toISOString(),
        app: "mat-tracker",
        context: "request",
        requestId,
        method: request.method,
        path: pathname,
        event: "auth_redirect",
        msg: "Redirecting to login",
      })
    );

    const response = NextResponse.redirect(loginUrl);
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};

// next-intl locale routing plus an optimistic cookie-based auth redirect for
// /dashboard (the authoritative check happens server-side on the page itself).
import createMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERN = /^\/(en|ka)\/dashboard(\/|$)/;

export default function proxy(request: NextRequest) {
  if (PROTECTED_PATTERN.test(request.nextUrl.pathname) && !getSessionCookie(request)) {
    const locale = request.nextUrl.pathname.startsWith("/ka") ? "ka" : "en";
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

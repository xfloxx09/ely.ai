import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user as { onboardingStep?: string; role?: string } | undefined;

  const protectedPaths = ["/app", "/dashboard", "/settings", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (
    isLoggedIn &&
    isProtected &&
    user?.role !== "ADMIN" &&
    user?.onboardingStep &&
    user.onboardingStep !== "COMPLETE" &&
    !pathname.startsWith("/onboarding")
  ) {
    return NextResponse.redirect(
      new URL("/onboarding/personality", req.nextUrl.origin)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};

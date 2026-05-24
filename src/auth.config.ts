import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma). Used by middleware.
 * Database access lives in auth.ts credentials provider only.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        const u = user as {
          onboardingStep?: string;
          role?: string;
        };
        token.onboardingStep = u.onboardingStep;
        token.role = u.role;
      }
      if (trigger === "update" && session?.user) {
        const u = session.user as {
          onboardingStep?: string;
          role?: string;
        };
        if (u.onboardingStep) token.onboardingStep = u.onboardingStep;
        if (u.role) token.role = u.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.onboardingStep = token.onboardingStep as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

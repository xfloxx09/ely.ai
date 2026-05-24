import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const user = await db.user.findUnique({ where: { email } });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { onboardingStep: true, role: true },
        });
        token.onboardingStep = dbUser?.onboardingStep;
        token.role = dbUser?.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingStep: true, role: true },
        });
        session.user.onboardingStep = dbUser?.onboardingStep;
        session.user.role = dbUser?.role;
      }
      return session;
    },
  },
});

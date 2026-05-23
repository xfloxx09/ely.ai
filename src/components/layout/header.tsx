import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";

export async function Header() {
  const session = await auth();
  const me = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    : null;
  const isAdmin = isAdminRole(me?.role);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold">
            E
          </span>
          Ely
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link href="/features" className="hover:text-white">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          {session?.user ? (
            <>
              <Link href="/app" className="hover:text-white">
                Assistant
              </Link>
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              <Link href="/settings" className="hover:text-white">
                Settings
              </Link>
              {isAdmin ? (
                <Link href="/admin" className="text-amber-300 hover:text-amber-200">
                  Admin
                </Link>
              ) : null}
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/auth");
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

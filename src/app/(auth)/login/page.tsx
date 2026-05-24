import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-white">Welcome back</h1>
      <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{" "}
        <Link href="/register" className="text-violet-400 hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}

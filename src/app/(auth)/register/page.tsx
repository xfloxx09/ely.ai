import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-white">Create your Ely account</h1>
      <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
        <RegisterForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-400 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      referralCode: ref || undefined,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email: body.email,
      password: body.password,
      redirect: false,
    });

    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {ref ? (
        <p className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
          Referred by sponsor code: <strong>{ref}</strong>
        </p>
      ) : null}
      <div>
        <label className="mb-1 block text-sm text-slate-300">Name</label>
        <Input name="name" required placeholder="Your name" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-300">Email</label>
        <Input name="email" type="email" required placeholder="you@example.com" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-300">Password</label>
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

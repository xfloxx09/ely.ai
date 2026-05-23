import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-white">Ely</p>
          <p className="mt-1 text-sm text-slate-400">
            Your personal AI life assistant — ely.ai
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/legal/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/legal/income-disclosure" className="hover:text-white">
            Income Disclosure
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Ely. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

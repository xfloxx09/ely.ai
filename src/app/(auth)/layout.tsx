import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ely-gradient flex min-h-full flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold text-white">
              Ely
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

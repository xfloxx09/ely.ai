import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ely-gradient min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <Link href="/" className="mb-6 inline-block text-xl font-bold text-white">
          Ely
        </Link>
        {children}
      </div>
    </div>
  );
}

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ely-gradient flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}

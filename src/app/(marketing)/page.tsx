import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Cpu } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-sm text-violet-200">
          <Sparkles className="h-4 w-4" />
          The first AI with a face and a soul
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
          Meet{" "}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            ELY
          </span>
          . It doesn&apos;t just do things for you—it knows you.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          After a 5-minute personality snapshot, ELY becomes a living companion
          that mirrors your tone, remembers your story, and grows with you. Plus
          Model Nexus connects the world&apos;s best AI models—still feeling like
          your ELY.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">Start free</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View plans
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Heart,
              title: "Personality foundation",
              desc: "BFI-2 inspired snapshot calibrates tone, empathy, and pacing to you.",
            },
            {
              icon: Sparkles,
              title: "Visual companion",
              desc: "ELY's avatar reflects your traits—full Ready Player Me face on Pro (Phase 2).",
            },
            {
              icon: Cpu,
              title: "Model Nexus",
              desc: "Summon GPT-4o, Claude, or Gemini mid-chat—personality context travels with you.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <Icon className="mb-4 h-8 w-8 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 bg-slate-950/50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white">
            A product people want—not just a business opportunity
          </h2>
          <p className="mt-4 text-slate-400">
            Ely Pro unlocks affiliate tools. Commissions come only from real
            subscriptions and product sales—never from recruitment alone.
          </p>
          <Link href="/features" className="mt-6 inline-block text-violet-400 hover:text-violet-300">
            Explore the Life OS modules →
          </Link>
        </div>
      </section>
    </div>
  );
}

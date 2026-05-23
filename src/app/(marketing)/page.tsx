import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-sm text-violet-200">
          <Sparkles className="h-4 w-4" />
          Meet Ely — your AI for everyday life
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
          The personal assistant that actually{" "}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            gets things done
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Schedule meetings, craft content, plan meals, and build habits — all
          through one conversational AI. Start free at ely.ai.
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
              icon: Zap,
              title: "Smart Concierge",
              desc: "Schedules, reminders, and calendar-aware planning.",
            },
            {
              icon: Sparkles,
              title: "Content Crafter",
              desc: "Emails, posts, and summaries in your voice.",
            },
            {
              icon: Users,
              title: "Builder's Arena",
              desc: "Share Ely and grow with our affiliate community.",
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
            Product-first. Community-powered.
          </h2>
          <p className="mt-4 text-slate-400">
            Ely Pro unlocks affiliate tools — commissions are earned only on real
            subscription sales, never on recruitment alone.
          </p>
          <Link href="/features" className="mt-6 inline-block text-violet-400 hover:text-violet-300">
            Explore all modules →
          </Link>
        </div>
      </section>
    </div>
  );
}

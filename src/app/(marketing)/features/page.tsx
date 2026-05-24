import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Features" };

const modules = [
  {
    name: "Concierge",
    status: "live",
    description:
      "Schedules your day around your energy—buffer time for sensitive profiles, bold pacing for outgoing types.",
  },
  {
    name: "Scribe",
    status: "live",
    description:
      "Drafts that sound like you, not a robot. Personal touch slider for warmth vs. directness.",
  },
  {
    name: "Kitchen Brain",
    status: "soon",
    description: "Meal plans and shopping lists matched to your planning style.",
  },
  {
    name: "Habit Coach",
    status: "soon",
    description: "Cheerleader or steady accountability partner—based on your profile.",
  },
  {
    name: "Researcher",
    status: "soon",
    description: "Learn and summarize at the depth your openness craves.",
  },
  {
    name: "Money Scout",
    status: "soon",
    description: "Budget guidance without judgment—savings challenges when you want them.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold text-white">Your chat-based Life OS</h1>
      <p className="mt-4 max-w-2xl text-slate-400">
        Every module is supercharged by ELY&apos;s personality layer—adaptive
        tone on Plus, deep memory and avatar on Pro.
      </p>

      <div className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
        <h2 className="text-lg font-semibold text-white">Personality foundation</h2>
        <p className="mt-2 text-sm text-slate-400">
          Short BFI-2 inspired assessment at signup. We store only your five trait
          scores—never raw answers. Opt out anytime in Settings.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {modules.map((m) => (
          <Card key={m.name}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{m.name}</CardTitle>
              <span
                className={
                  m.status === "live"
                    ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                    : "rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-400"
                }
              >
                {m.status === "live" ? "Available" : "Coming soon"}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">{m.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

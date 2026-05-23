import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Features" };

const modules = [
  {
    name: "Smart Concierge",
    status: "live",
    description:
      "Schedules meetings, books appointments, and manages reminders across your calendars.",
  },
  {
    name: "Content Crafter",
    status: "live",
    description:
      "Drafts emails, social posts, summaries, and creative text in your tone.",
  },
  {
    name: "Home Manager",
    status: "soon",
    description:
      "Meal plans, shopping lists, recipes, and grocery delivery integrations.",
  },
  {
    name: "Habit Architect",
    status: "soon",
    description:
      "Adaptive habit coaching, streaks, and personalized nudges.",
  },
  {
    name: "Knowledge Companion",
    status: "soon",
    description:
      "Summarize articles, answer questions, and micro-lessons for new skills.",
  },
  {
    name: "Finance Scout",
    status: "soon",
    description:
      "Spending insights, budget alerts, and savings opportunities (read-only).",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold text-white">Ely modules</h1>
      <p className="mt-4 max-w-2xl text-slate-400">
        One assistant, specialized capabilities. MVP ships with Concierge and
        Content Crafter; more modules roll out based on demand.
      </p>

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

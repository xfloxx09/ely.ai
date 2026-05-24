"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ElyAvatar } from "@/components/app/ely-avatar";
import { cn } from "@/lib/utils";

type ModuleKey =
  | "CONCIERGE"
  | "SCRIBE"
  | "KITCHEN"
  | "HABIT"
  | "RESEARCHER"
  | "MONEY";

const MODULES: {
  key: ModuleKey;
  label: string;
  live: boolean;
}[] = [
  { key: "CONCIERGE", label: "Concierge", live: true },
  { key: "SCRIBE", label: "Scribe", live: true },
  { key: "KITCHEN", label: "Kitchen Brain", live: false },
  { key: "HABIT", label: "Habit Coach", live: false },
  { key: "RESEARCHER", label: "Researcher", live: false },
  { key: "MONEY", label: "Money Scout", live: false },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface({
  initialPlan,
  initialRemaining,
  knowsYou,
  scores,
  rpmUrl,
  companionName,
  evolutionStage = 0,
  voiceEnabled = false,
}: {
  initialPlan: string;
  initialRemaining: number | null;
  knowsYou: boolean;
  scores?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  } | null;
  rpmUrl?: string | null;
  companionName?: string | null;
  evolutionStage?: number;
  voiceEnabled?: boolean;
}) {
  const [module, setModule] = useState<ModuleKey>("CONCIERGE");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const displayName = companionName ?? "ELY";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: userMsg },
    ];
    setMessages(nextMessages);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, messages: nextMessages }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: err.error ?? "ELY could not respond. Check limits or API key.",
        },
      ]);
      if (typeof err.remaining === "number") setRemaining(err.remaining);
      setLoading(false);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    setMessages([...nextMessages, { role: "assistant", content: "" }]);

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value);
        setMessages([
          ...nextMessages,
          { role: "assistant", content: assistantText },
        ]);
      }
    }

    const r = res.headers.get("X-Ely-Remaining");
    setRemaining(r === "unlimited" ? null : r ? parseInt(r, 10) : remaining);

    setLoading(false);
  }

  async function speakMessage(text: string) {
    if (!voiceEnabled || !text.trim() || speaking) return;
    setSpeaking(true);
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      URL.revokeObjectURL(url);
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-start gap-4">
        <ElyAvatar
          scores={scores}
          plan={initialPlan}
          rpmUrl={rpmUrl}
          companionName={companionName}
          evolutionStage={evolutionStage}
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{displayName}</h1>
          <p className="text-sm text-slate-400">
            Your personal AI · Plan {initialPlan}
            {knowsYou ? (
              <span className="text-violet-300"> · ELY knows you</span>
            ) : null}
            {remaining !== null ? (
              <> · {remaining} messages left today</>
            ) : (
              <> · Unlimited</>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Model Nexus: <code className="text-violet-300">/model gpt-4o</code>,{" "}
            <code className="text-violet-300">/model claude</code>,{" "}
            <code className="text-violet-300">/model gemini</code>
            {voiceEnabled ? " · 🔊 on assistant messages" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODULES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setModule(m.key)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-medium transition",
              module === m.key
                ? "bg-violet-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10",
              !m.live && "opacity-80"
            )}
          >
            {m.label}
            {!m.live ? " · soon" : ""}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-slate-500">
            ELY adapts to your personality on Plus and Pro. Ask anything—or try
            &quot;Help me write a heartfelt message.&quot;
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-violet-600 text-white"
                    : "bg-white/5 text-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex-1">
                    {m.content || (loading ? "…" : "")}
                  </span>
                  {m.role === "assistant" &&
                  m.content &&
                  voiceEnabled ? (
                    <button
                      type="button"
                      title="Listen"
                      className="shrink-0 text-violet-400 hover:text-violet-200"
                      onClick={() => speakMessage(m.content)}
                      disabled={speaking}
                    >
                      🔊
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Message ELY…"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

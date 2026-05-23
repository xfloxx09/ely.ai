"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Module = "CONCIERGE" | "CONTENT";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface({
  initialPlan,
  initialRemaining,
}: {
  initialPlan: string;
  initialRemaining: number | null;
}) {
  const [module, setModule] = useState<Module>("CONCIERGE");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const bottomRef = useRef<HTMLDivElement>(null);

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
          content:
            err.error ??
            "Unable to reach Ely right now. Check your API key or usage limits.",
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

    if (typeof res.headers.get("X-Ely-Remaining") === "string") {
      const r = res.headers.get("X-Ely-Remaining");
      setRemaining(r === "unlimited" ? null : parseInt(r!, 10));
    }

    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(
            [
              ["CONCIERGE", "Smart Concierge"],
              ["CONTENT", "Content Crafter"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setModule(key)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                module === key
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          Plan: <span className="text-violet-300">{initialPlan}</span>
          {remaining !== null ? (
            <> · {remaining} messages left today</>
          ) : (
            <> · Unlimited</>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-slate-500">
            Ask Ely to schedule something, draft an email, or plan your day.
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-violet-600 text-white"
                    : "bg-white/5 text-slate-200"
                )}
              >
                {m.content || (loading ? "…" : "")}
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
          placeholder="Message Ely…"
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

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function RpmCreator({
  creatorUrl,
  initialAvatarId,
}: {
  creatorUrl: string;
  initialAvatarId?: string | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [savedId, setSavedId] = useState(initialAvatarId);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const json = event.data;
      if (json?.source !== "readyplayerme") return;
      if (json.eventName === "v1.avatar.exported") {
        const id = json.data?.id as string | undefined;
        if (id) void persist(id);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function persist(rpmAvatarId: string) {
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/avatar/rpm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rpmAvatarId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setStatus(data.error ?? "Could not save avatar");
      return;
    }
    setSavedId(rpmAvatarId);
    setStatus("Avatar saved — visible in chat.");
  }

  return (
    <div className="space-y-4">
      {savedId ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://models.readyplayer.me/${savedId}.png?size=128`}
            alt="Your ELY"
            className="h-24 w-24 rounded-2xl object-cover ring-2 ring-violet-500/40"
          />
          <p className="text-sm text-slate-400">
            Current avatar · evolution updates as you chat.
          </p>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <iframe
          ref={iframeRef}
          src={creatorUrl}
          className="h-[520px] w-full"
          allow="camera *; microphone *"
          title="Ready Player Me Avatar Creator"
        />
      </div>
      {status ? <p className="text-sm text-violet-300">{status}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">Saving avatar…</p>
      ) : (
        <p className="text-xs text-slate-500">
          When you finish in the creator, your avatar syncs automatically.
        </p>
      )}
      {savedId ? (
        <Button variant="outline" onClick={() => persist(savedId)}>
          Re-sync avatar
        </Button>
      ) : null}
    </div>
  );
}

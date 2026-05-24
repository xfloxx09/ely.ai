import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import type { BigFiveScores } from "@/lib/personality/scoring";

function deriveKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return scryptSync(raw, "ely-personality-v1", 32);
}

/** Optional at-rest encryption when ENCRYPTION_KEY is set in production. */
export function encryptScores(scores: BigFiveScores): string | null {
  const key = deriveKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.concat([
    cipher.update(JSON.stringify(scores), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, payload]).toString("base64");
}

export function decryptScores(blob: string): BigFiveScores | null {
  const key = deriveKey();
  if (!key) return null;
  try {
    const buf = Buffer.from(blob, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    );
    return JSON.parse(json) as BigFiveScores;
  } catch {
    return null;
  }
}

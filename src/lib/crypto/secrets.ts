import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

function deriveKey(salt: string): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return scryptSync(raw, salt, 32);
}

export function encryptSecret(plaintext: string): string {
  const key = deriveKey("ely-secrets-v1");
  if (!key) {
    throw new Error("ENCRYPTION_KEY is required to store API keys");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, payload]).toString("base64");
}

export function decryptSecret(blob: string): string | null {
  const key = deriveKey("ely-secrets-v1");
  if (!key) return null;
  try {
    const buf = Buffer.from(blob, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    return null;
  }
}

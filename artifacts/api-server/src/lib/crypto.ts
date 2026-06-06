import crypto from "node:crypto";
import { logger } from "./logger";

// AES-256-GCM encryption for secrets at rest (Google OAuth tokens).
// Key comes from TOKEN_ENCRYPTION_KEY (32 bytes, base64 or hex).
//
// Format of an encrypted value: "enc:v1:<iv>:<tag>:<ciphertext>" (each base64).
// Values without the prefix are returned as-is on decrypt, which keeps legacy
// plaintext rows and non-secret markers (e.g. the demo "mock-token") working
// and makes adopting encryption a no-op migration.

const PREFIX = "enc:v1:";
let warned = false;

function getKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    if (!warned) {
      warned = true;
      const msg = "TOKEN_ENCRYPTION_KEY is not set — OAuth tokens are stored unencrypted.";
      if (process.env.NODE_ENV === "production") logger.error(msg);
      else logger.warn(msg);
    }
    return null;
  }
  const buf = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    logger.error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes (use: openssl rand -base64 32).");
    return null;
  }
  return buf;
}

/** Encrypts a secret for storage. Without a key, returns the plaintext (dev). */
export function encryptSecret(plain: string | null | undefined): string | null {
  if (plain == null) return null;
  const key = getKey();
  if (!key) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, enc].map((b) => b.toString("base64")).join(":");
}

/** Decrypts a stored secret. Non-encrypted values pass through unchanged. */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  if (!stored.startsWith(PREFIX)) return stored;
  const key = getKey();
  if (!key) {
    logger.error("Encrypted token found but TOKEN_ENCRYPTION_KEY is missing/invalid.");
    return null;
  }
  try {
    const [ivB, tagB, dataB] = stored.slice(PREFIX.length).split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB!, "base64"));
    decipher.setAuthTag(Buffer.from(tagB!, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB!, "base64")), decipher.final()]).toString("utf8");
  } catch (err) {
    logger.error({ err }, "Failed to decrypt token");
    return null;
  }
}

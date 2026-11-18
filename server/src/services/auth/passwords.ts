import {
  scrypt as scryptCallback,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
/**
 * Hashes a password with a random salt and scrypt; never stores the plaintext password.
 *
 * @param password - Plaintext password used only for hashing or verification.
 * @returns A scrypt:saltHex:derivedKeyHex string suitable for storage; never the plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return "scrypt:" + salt + ":" + key.toString("hex");
}
/**
 * Checks a plaintext password against a stored scrypt hash using a timing-safe comparison.
 *
 * @param password - Plaintext password used only for hashing or verification.
 * @param stored - Stored scrypt hash to compare against the supplied password.
 * @returns True when the stored hash format is supported and the derived keys match; otherwise false.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
/**
 * Hashes an opaque session token before lookup or persistence.
 *
 * @param token - Opaque session secret received from the HttpOnly cookie.
 * @returns The lowercase hexadecimal SHA-256 token hash used for storage and lookup.
 */
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

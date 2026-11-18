import { randomBytes } from "node:crypto";
import type { AuthStore } from "../../store/authStore.js";
import type { AuthUser } from "../../types/entities.js";
import { ensure } from "../errors.js";
import { hashPassword, verifyPassword, hashToken } from "./passwords.js";
import { loginSchema, registerSchema } from "../validation.js";
/**
 * Internal authentication result containing a cookie-only secret and a sanitized account.
 */
export interface AuthSessionResult {
  /** Secret token to place in an HttpOnly cookie; never include in public account JSON. */
  token: string;
  /** Sanitized account and its current permissions. */
  user: AuthUser;
}
/**
 * Validates account credentials and manages hashed, expiring sessions through AuthStore.
 */
export class AuthService {
  /**
   * Creates the AuthService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   */
  constructor(private readonly store: AuthStore) {}
  /**
   * Validates registration, hashes the password, and creates the account and session atomically.
   *
   * @param input - Request fields to validate before applying the operation.
   * @returns The new session's cookie-only secret and sanitized signed-in account.
   * @throws {HttpError} If the username or email is already registered.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  async register(input: unknown): Promise<AuthSessionResult> {
    const value = registerSchema.parse(input);
    const passwordHash = await hashPassword(value.password);
    return this.store.transaction(async (store) => {
      const [byUsername, byEmail] = await Promise.all([
        store.findByUsername(value.username),
        store.findByEmail(value.email),
      ]);
      ensure(
        !byUsername && !byEmail,
        409,
        "That username or email is already registered.",
      );
      const user = await store.createUser(
        value.username,
        value.displayName,
        value.email,
        passwordHash,
      );
      return this.createSession(store, user.userID);
    });
  }
  /**
   * Verifies credentials and creates a session only if the stored credential remains unchanged.
   *
   * @param input - Request fields to validate before applying the operation.
   * @returns The new session's cookie-only secret and sanitized signed-in account.
   * @throws {HttpError} If credentials are incorrect or change before the session is created.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  async login(input: unknown): Promise<AuthSessionResult> {
    const value = loginSchema.parse(input);
    const user = await this.store.findByLogin(value.username);
    const valid = await verifyPassword(
      value.password,
      user?.passwordHash ||
        "scrypt:00000000000000000000000000000000:" + "00".repeat(64),
    );
    ensure(user && valid, 401, "Username or password is incorrect.");
    return this.store.transaction(async (store) => {
      const current = await store.getUser(user.userID);
      ensure(
        current && current.passwordHash === user.passwordHash,
        401,
        "Username or password is incorrect.",
      );
      return this.createSession(store, current.userID);
    });
  }
  /**
   * Creates an expiring hashed-token session and returns the cookie secret with the sanitized account.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   * @param userID - Primary key of the user.
   * @returns The cookie-only raw token and sanitized account; only its hash is persisted.
   */
  private async createSession(
    store: AuthStore,
    userID: number,
  ): Promise<AuthSessionResult> {
    const token = randomBytes(32).toString("hex");
    await store.removeExpiredSessions(new Date().toISOString());
    await store.createSession(
      hashToken(token),
      userID,
      new Date(Date.now() + 7 * 86400000).toISOString(),
    );
    const user = await store.getAccount(userID);
    ensure(user, 404, "User not found.");
    return { token, user };
  }
  /**
   * Resolves a valid session token to an account; invalid or expired sessions return null.
   *
   * @param token - Opaque session secret received from the HttpOnly cookie.
   * @returns The sanitized account, or null if the session is absent, invalid, or expired.
   */
  currentUser(token?: string): Promise<AuthUser | null> {
    if (!token || token.length !== 64) return Promise.resolve(null);
    return this.store.getCurrentAccount(
      hashToken(token),
      new Date().toISOString(),
    );
  }
  /**
   * Invalidates the supplied session token without changing the user's account.
   *
   * @param token - Opaque session secret received from the HttpOnly cookie.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  async logout(token?: string): Promise<void> {
    if (token) await this.store.removeSession(hashToken(token));
  }
}

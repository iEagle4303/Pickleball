import type { AuthUser, User } from "../types/entities.js";
import type { TransactionScope } from "./types.js";
import { JsonScopedStore, JsonStoreSession } from "./json/JsonStoreSession.js";
import { nextID } from "./json/identity.js";
import { accountView } from "./json/views.js";
/**
 * Data-access contract for AuthService, independent of JSON or SQL storage.
 */
export interface AuthStore extends TransactionScope<AuthStore> {
  /**
   * Looks up an internal user record, including its password hash; never expose it as an account response.
   *
   * @param userID - Primary key of the user.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  getUser(userID: number): Promise<User | null>;
  /**
   * Looks up an internal user record by username or email for password verification.
   *
   * @param identifier - Username or email supplied at login.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  findByLogin(identifier: string): Promise<User | null>;
  /**
   * Looks up an internal user record by case-insensitive username.
   *
   * @param username - Normalized unique account username.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  findByUsername(username: string): Promise<User | null>;
  /**
   * Looks up an internal user record by case-insensitive email.
   *
   * @param email - Normalized unique account email address.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  findByEmail(email: string): Promise<User | null>;
  /**
   * Loads an account and its current permissions without exposing its password hash.
   *
   * @param userID - Primary key of the user.
   * @returns Sanitized account with email and current permission names. Returns null when no matching record exists.
   */
  getAccount(userID: number): Promise<AuthUser | null>;
  /**
   * Loads the sanitized account for a matching unexpired session-token hash.
   *
   * @param tokenHash - Hash of the opaque session secret.
   * @param now - Current time as an ISO timestamp for expiry comparison.
   * @returns The sanitized account, or null if the session is absent, invalid, or expired.
   */
  getCurrentAccount(tokenHash: string, now: string): Promise<AuthUser | null>;
  /**
   * Inserts a normalized account using an already hashed password and a generated primary key.
   *
   * @param username - Normalized unique account username.
   * @param displayName - Member name displayed in the club interface.
   * @param email - Normalized unique account email address.
   * @param passwordHash - Previously computed salted password hash; never a plaintext password.
   * @returns Internal account record, including its stored password hash.
   */
  createUser(
    username: string,
    displayName: string,
    email: string,
    passwordHash: string,
  ): Promise<User>;
  /**
   * Stores a hashed session token, account ID, and expiry; never persists the raw token.
   *
   * @param tokenHash - Hash of the opaque session secret.
   * @param userID - Primary key of the user.
   * @param expiresAt - Session expiry as an ISO timestamp.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  createSession(
    tokenHash: string,
    userID: number,
    expiresAt: string,
  ): Promise<void>;
  /**
   * Removes the session matching the supplied token hash.
   *
   * @param tokenHash - Hash of the opaque session secret.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeSession(tokenHash: string): Promise<void>;
  /**
   * Removes sessions whose expiry is not later than the supplied time.
   *
   * @param now - Current time as an ISO timestamp for expiry comparison.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeExpiredSessions(now: string): Promise<void>;
}
/**
 * JSON implementation of AuthStore; SQL implementations can provide the same public contract.
 */
export class JsonAuthStore
  extends JsonScopedStore<AuthStore>
  implements AuthStore
{
  /**
   * Creates the same feature-store implementation bound to a supplied JSON scope.
   *
   * @param session - JSON scope to bind to this feature store.
   * @returns The feature-store instance bound to the supplied scope.
   */
  protected bind(session: JsonStoreSession): AuthStore {
    return new JsonAuthStore(session);
  }
  /**
   * Looks up an internal user record, including its password hash; never expose it as an account response.
   *
   * @param userID - Primary key of the user.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  getUser(userID: number): Promise<User | null> {
    return this.session.read(
      (data) => data.users.find((user) => user.userID === userID) ?? null,
    );
  }
  /**
   * Looks up an internal user record by username or email for password verification.
   *
   * @param identifier - Username or email supplied at login.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  findByLogin(identifier: string): Promise<User | null> {
    return this.session.read(
      (data) =>
        data.users.find(
          (user) =>
            user.username.toLowerCase() === identifier.toLowerCase() ||
            user.email.toLowerCase() === identifier.toLowerCase(),
        ) ?? null,
    );
  }
  /**
   * Looks up an internal user record by case-insensitive username.
   *
   * @param username - Normalized unique account username.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  findByUsername(username: string): Promise<User | null> {
    return this.session.read(
      (data) =>
        data.users.find(
          (user) => user.username.toLowerCase() === username.toLowerCase(),
        ) ?? null,
    );
  }
  /**
   * Looks up an internal user record by case-insensitive email.
   *
   * @param email - Normalized unique account email address.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.session.read(
      (data) =>
        data.users.find(
          (user) => user.email.toLowerCase() === email.toLowerCase(),
        ) ?? null,
    );
  }
  /**
   * Loads an account and its current permissions without exposing its password hash.
   *
   * @param userID - Primary key of the user.
   * @returns Sanitized account with email and current permission names. Returns null when no matching record exists.
   */
  getAccount(userID: number): Promise<AuthUser | null> {
    return this.session.read((data) => accountView(data, userID));
  }
  /**
   * Loads the sanitized account for a matching unexpired session-token hash.
   *
   * @param tokenHash - Hash of the opaque session secret.
   * @param now - Current time as an ISO timestamp for expiry comparison.
   * @returns The sanitized account, or null if the session is absent, invalid, or expired.
   */
  getCurrentAccount(tokenHash: string, now: string): Promise<AuthUser | null> {
    return this.session.read((data) => {
      const session = data.sessions.find(
        (session) =>
          session.tokenHash === tokenHash &&
          new Date(session.expiresAt).getTime() > new Date(now).getTime(),
      );
      return session ? accountView(data, session.userID) : null;
    });
  }
  /**
   * Inserts a normalized account using an already hashed password and a generated primary key.
   *
   * @param username - Normalized unique account username.
   * @param displayName - Member name displayed in the club interface.
   * @param email - Normalized unique account email address.
   * @param passwordHash - Previously computed salted password hash; never a plaintext password.
   * @returns Internal account record, including its stored password hash.
   */
  createUser(
    username: string,
    displayName: string,
    email: string,
    passwordHash: string,
  ): Promise<User> {
    return this.session.write((data) => {
      const user = {
        userID: nextID(data.users, "userID"),
        username,
        displayName,
        email,
        passwordHash,
      };
      data.users.push(user);
      return user;
    });
  }
  /**
   * Stores a hashed session token, account ID, and expiry; never persists the raw token.
   *
   * @param tokenHash - Hash of the opaque session secret.
   * @param userID - Primary key of the user.
   * @param expiresAt - Session expiry as an ISO timestamp.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  createSession(
    tokenHash: string,
    userID: number,
    expiresAt: string,
  ): Promise<void> {
    return this.session.write((data) => {
      data.sessions.push({ tokenHash, userID, expiresAt });
    });
  }
  /**
   * Removes the session matching the supplied token hash.
   *
   * @param tokenHash - Hash of the opaque session secret.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeSession(tokenHash: string): Promise<void> {
    return this.session.write((data) => {
      data.sessions = data.sessions.filter(
        (session) => session.tokenHash !== tokenHash,
      );
    });
  }
  /**
   * Removes sessions whose expiry is not later than the supplied time.
   *
   * @param now - Current time as an ISO timestamp for expiry comparison.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeExpiredSessions(now: string): Promise<void> {
    return this.session.write((data) => {
      data.sessions = data.sessions.filter(
        (session) =>
          new Date(session.expiresAt).getTime() > new Date(now).getTime(),
      );
    });
  }
}

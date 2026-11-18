import { http, jsonBody } from "@/lib/httpClient";
import type { AuthUser, Permission, PublicUser } from "@shared/types";
/**
 * Feature-owned API operations; transport and cookie handling are delegated to the shared HTTP client.
 */
export const authApi = {
  /**
   * Fetches the current sanitized account, or null when signed out.
   *
   * @returns The typed API result, or null when the endpoint has no record or result body.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  me: (): Promise<AuthUser | null> => http<AuthUser | null>("/auth/me"),
  /**
   * Submits login credentials and receives the sanitized account; the browser stores the HttpOnly cookie.
   *
   * @param value - Username/email and password submitted to the login API.
   * @returns Sanitized account with email and current permission names.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  login: (value: unknown): Promise<AuthUser> =>
    http<AuthUser>("/auth/login", { method: "POST", body: jsonBody(value) }),
  /**
   * Registers a member account and receives the sanitized signed-in account.
   *
   * @param value - New account identity fields and password submitted to registration.
   * @returns Sanitized account with email and current permission names.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  register: (value: unknown): Promise<AuthUser> =>
    http<AuthUser>("/auth/register", { method: "POST", body: jsonBody(value) }),
  /**
   * Ends the current backend session and clears its cookie.
   *
   * @returns The typed API result, or null when the endpoint has no record or result body.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  logout: (): Promise<null> => http<null>("/auth/logout", { method: "POST" }),
  /**
   * Saves the current member's editable display name and email.
   *
   * @param value - Complete account request fields to submit.
   * @returns Sanitized account with email and current permission names.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  profile: (value: unknown): Promise<AuthUser> =>
    http<AuthUser>("/users/me", { method: "PUT", body: jsonBody(value) }),
  /**
   * Fetches club members for roster or authorized permission management.
   *
   * @returns An array of sanitized account with email and current permission names.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  users: (): Promise<AuthUser[]> => http<AuthUser[]>("/users"),
  /**
   * Fetches the permission catalog for an authorized administrator.
   *
   * @returns An array of permission catalog record.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  permissions: (): Promise<Permission[]> => http<Permission[]>("/permissions"),
  /**
   * Replaces a member's permission assignments through the protected API.
   *
   * @param id - Primary key of the account; omit only when creating a new record.
   * @param permissionIDs - Permission IDs to assign to the selected member.
   * @returns Sanitized account with email and current permission names.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  setPermissions: (id: number, permissionIDs: number[]): Promise<AuthUser> =>
    http<AuthUser>("/users/" + id + "/permissions", {
      method: "PUT",
      body: jsonBody({ permissionIDs }),
    }),
};

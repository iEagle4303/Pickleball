import { http, jsonBody } from "@/lib/httpClient";
import type { AuthUser, Permission, PublicUser } from "@shared/types";
export const authApi = {
  me: () => http<AuthUser | null>("/auth/me"),
  login: (value: unknown) =>
    http<AuthUser>("/auth/login", { method: "POST", body: jsonBody(value) }),
  register: (value: unknown) =>
    http<AuthUser>("/auth/register", { method: "POST", body: jsonBody(value) }),
  logout: () => http<null>("/auth/logout", { method: "POST" }),
  profile: (value: unknown) =>
    http<AuthUser>("/users/me", { method: "PUT", body: jsonBody(value) }),
  users: () => http<AuthUser[]>("/users"),
  permissions: () => http<Permission[]>("/permissions"),
  setPermissions: (id: number, permissionIDs: number[]) =>
    http<AuthUser>("/users/" + id + "/permissions", {
      method: "PUT",
      body: jsonBody({ permissionIDs }),
    }),
};

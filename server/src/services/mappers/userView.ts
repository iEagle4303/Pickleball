import type { User, AuthUser, PublicUser } from "../../types/entities.js";
import type { PermissionQueries } from "../../repositories/interfaces/PermissionRepository.js";
export function publicUser(user: User): PublicUser {
  return {
    userID: user.userID,
    username: user.username,
    displayName: user.displayName,
  };
}
export async function authUser(
  permissions: PermissionQueries,
  user: User,
): Promise<AuthUser> {
  const assigned = await permissions.listForUser(user.userID);
  return {
    ...publicUser(user),
    email: user.email,
    permissions: assigned.map((permission) => permission.description),
  };
}

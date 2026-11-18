import type { Permission } from "../../types/entities.js";
export interface PermissionQueries {
  list(): Promise<Permission[]>;
  listForUser(userID: number): Promise<Permission[]>;
  hasOtherUser(permissionID: number, excludedUserID: number): Promise<boolean>;
}
export interface PermissionRepository extends PermissionQueries {
  replaceForUser(
    userID: number,
    permissionIDs: readonly number[],
  ): Promise<void>;
}

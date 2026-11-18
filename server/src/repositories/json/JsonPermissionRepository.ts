import type { PermissionRepository } from "../interfaces/PermissionRepository.js";
import type { JsonDatabase } from "./JsonDatabase.js";
export class JsonPermissionRepository implements PermissionRepository {
  constructor(private readonly data: JsonDatabase) {}
  async list() {
    return [...this.data.permissions];
  }
  async listForUser(userID: number) {
    const ids = new Set(
      this.data.userPermissions
        .filter((link) => link.userID === userID)
        .map((link) => link.permissionID),
    );
    return this.data.permissions.filter((permission) =>
      ids.has(permission.permissionID),
    );
  }
  async hasOtherUser(permissionID: number, excludedUserID: number) {
    return this.data.userPermissions.some(
      (link) =>
        link.permissionID === permissionID && link.userID !== excludedUserID,
    );
  }
  async replaceForUser(userID: number, permissionIDs: readonly number[]) {
    this.data.userPermissions = this.data.userPermissions.filter(
      (link) => link.userID !== userID,
    );
    this.data.userPermissions.push(
      ...permissionIDs.map((permissionID) => ({ userID, permissionID })),
    );
  }
}

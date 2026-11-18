import type { Permission } from "../../types/entities.js";
import type { PermissionStore } from "../../store/permissionStore.js";
/**
 * Provides the permission catalog through PermissionStore.
 */
export class PermissionService {
  /**
   * Creates the PermissionService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   */
  constructor(private readonly store: PermissionStore) {}
  /**
   * Returns the permission catalog available to authorized coordinators.
   *
   * @returns An array of permission catalog record.
   */
  list(): Promise<Permission[]> {
    return this.store.list();
  }
}

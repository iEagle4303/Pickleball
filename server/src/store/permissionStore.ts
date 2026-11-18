import type { Permission } from "../types/entities.js";
import type { JsonStoreSession } from "./json/JsonStoreSession.js";
/**
 * Data-access contract for PermissionService, independent of JSON or SQL storage.
 */
export interface PermissionStore {
  /**
   * Lists the authorization permission catalog.
   *
   * @returns An array of permission catalog record.
   */
  list(): Promise<Permission[]>;
}
/**
 * JSON implementation of PermissionStore; SQL implementations can provide the same public contract.
 */
export class JsonPermissionStore implements PermissionStore {
  /**
   * Creates the JSON-backed JsonPermissionStore with its required dependencies.
   *
   * @param session - JSON scope to bind to this feature store.
   */
  constructor(private readonly session: JsonStoreSession) {}
  /**
   * Lists the authorization permission catalog.
   *
   * @returns An array of permission catalog record.
   */
  list(): Promise<Permission[]> {
    return this.session.read((data) => [...data.permissions]);
  }
}

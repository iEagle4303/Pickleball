import type {
  AuthUser,
  Permission,
  PublicUser,
  User,
} from "../types/entities.js";
import type { TransactionScope } from "./types.js";
import { JsonScopedStore, JsonStoreSession } from "./json/JsonStoreSession.js";
import { accountView, publicUser } from "./json/views.js";
/**
 * Data-access contract for UserService, independent of JSON or SQL storage.
 */
export interface UserStore extends TransactionScope<UserStore> {
  /**
   * Lists public member identities, or sanitized account views when the caller is authorized for private fields.
   *
   * @param includePrivateFields - Whether authorized callers may receive email and permission fields.
   * @returns Public member identities or authorized account views, with no password hashes.
   */
  list(includePrivateFields: boolean): Promise<(AuthUser | PublicUser)[]>;
  /**
   * Looks up an internal user record, including its password hash; never expose it as an account response.
   *
   * @param userID - Primary key of the user.
   * @returns Internal account record, including its stored password hash. Returns null when no matching record exists.
   */
  getUser(userID: number): Promise<User | null>;
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
   * Updates only a user's display name and email address.
   *
   * @param userID - Primary key of the user.
   * @param displayName - Member name displayed in the club interface.
   * @param email - Normalized unique account email address.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  updateProfile(
    userID: number,
    displayName: string,
    email: string,
  ): Promise<void>;
  /**
   * Lists the permission catalog used to validate permission assignments.
   *
   * @returns An array of permission catalog record.
   */
  listPermissions(): Promise<Permission[]>;
  /**
   * Checks for another assignee so the final permission administrator cannot be removed.
   *
   * @param permissionID - Primary key of the permission.
   * @param excludedUserID - User ID excluded when checking for another assignee.
   * @returns True when the described check succeeds; otherwise false.
   */
  hasOtherPermissionUser(
    permissionID: number,
    excludedUserID: number,
  ): Promise<boolean>;
  /**
   * Replaces only the selected user's permission-assignment relationships.
   *
   * @param userID - Primary key of the user.
   * @param permissionIDs - Permission IDs to assign to the selected user.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  replacePermissions(
    userID: number,
    permissionIDs: readonly number[],
  ): Promise<void>;
}
/**
 * JSON implementation of UserStore; SQL implementations can provide the same public contract.
 */
export class JsonUserStore
  extends JsonScopedStore<UserStore>
  implements UserStore
{
  /**
   * Creates the same feature-store implementation bound to a supplied JSON scope.
   *
   * @param session - JSON scope to bind to this feature store.
   * @returns The feature-store instance bound to the supplied scope.
   */
  protected bind(session: JsonStoreSession): UserStore {
    return new JsonUserStore(session);
  }
  /**
   * Lists public member identities, or sanitized account views when the caller is authorized for private fields.
   *
   * @param includePrivateFields - Whether authorized callers may receive email and permission fields.
   * @returns Public member identities or authorized account views, with no password hashes.
   */
  list(includePrivateFields: boolean): Promise<(AuthUser | PublicUser)[]> {
    return this.session.read((data) =>
      data.users.map((user) =>
        includePrivateFields
          ? accountView(data, user.userID)!
          : publicUser(user),
      ),
    );
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
   * Updates only a user's display name and email address.
   *
   * @param userID - Primary key of the user.
   * @param displayName - Member name displayed in the club interface.
   * @param email - Normalized unique account email address.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  updateProfile(
    userID: number,
    displayName: string,
    email: string,
  ): Promise<void> {
    return this.session.write((data) => {
      const user = data.users.find((user) => user.userID === userID);
      if (!user) throw new Error("Cannot update a missing user.");
      user.displayName = displayName;
      user.email = email;
    });
  }
  /**
   * Lists the permission catalog used to validate permission assignments.
   *
   * @returns An array of permission catalog record.
   */
  listPermissions(): Promise<Permission[]> {
    return this.session.read((data) => [...data.permissions]);
  }
  /**
   * Checks for another assignee so the final permission administrator cannot be removed.
   *
   * @param permissionID - Primary key of the permission.
   * @param excludedUserID - User ID excluded when checking for another assignee.
   * @returns True when the described check succeeds; otherwise false.
   */
  hasOtherPermissionUser(
    permissionID: number,
    excludedUserID: number,
  ): Promise<boolean> {
    return this.session.read((data) =>
      data.userPermissions.some(
        (link) =>
          link.permissionID === permissionID && link.userID !== excludedUserID,
      ),
    );
  }
  /**
   * Replaces only the selected user's permission-assignment relationships.
   *
   * @param userID - Primary key of the user.
   * @param permissionIDs - Permission IDs to assign to the selected user.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  replacePermissions(
    userID: number,
    permissionIDs: readonly number[],
  ): Promise<void> {
    return this.session.write((data) => {
      data.userPermissions = data.userPermissions.filter(
        (link) => link.userID !== userID,
      );
      data.userPermissions.push(
        ...permissionIDs.map((permissionID) => ({ userID, permissionID })),
      );
    });
  }
}

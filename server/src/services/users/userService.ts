import type { AuthUser, PublicUser } from "../../types/entities.js";
import type { UserStore } from "../../store/userStore.js";
import { ensure } from "../errors.js";
import { profileSchema, permissionsSchema } from "../validation.js";
/**
 * Manages member profiles, account visibility, and permission assignments through UserStore.
 */
export class UserService {
  /**
   * Creates the UserService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   */
  constructor(private readonly store: UserStore) {}
  /**
   * Returns public member identities or authorized private account views.
   *
   * @param includePrivateFields - Whether authorized callers may receive email and permission fields.
   * @returns Public member identities or authorized account views, with no password hashes.
   */
  list(includePrivateFields = false): Promise<(AuthUser | PublicUser)[]> {
    return this.store.list(includePrivateFields);
  }
  /**
   * Validates editable profile fields and email uniqueness before saving.
   *
   * @param userID - Primary key of the user.
   * @param input - Request fields to validate before applying the operation.
   * @returns Sanitized account with email and current permission names.
   * @throws {HttpError} If the user is missing or the email is already registered.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  updateProfile(userID: number, input: unknown): Promise<AuthUser> {
    const value = profileSchema.parse(input);
    return this.store.transaction(async (store) => {
      ensure(await store.getUser(userID), 404, "User not found.");
      const existing = await store.findByEmail(value.email);
      ensure(
        !existing || existing.userID === userID,
        409,
        "This email is already registered.",
      );
      await store.updateProfile(userID, value.displayName, value.email);
      const user = await store.getAccount(userID);
      ensure(user, 404, "User not found.");
      return user;
    });
  }
  /**
   * Replaces valid permission IDs while preserving at least one permission administrator.
   *
   * @param userID - Primary key of the user.
   * @param permissionIDs - Permission IDs to assign to the selected user.
   * @returns Sanitized account with email and current permission names.
   * @throws {HttpError} If the user/permission is missing or the change would remove the final permission administrator.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  setPermissions(userID: number, permissionIDs: unknown): Promise<AuthUser> {
    const selectedIDs =
      permissionsSchema.shape.permissionIDs.parse(permissionIDs);
    return this.store.transaction(async (store) => {
      ensure(await store.getUser(userID), 404, "User not found.");
      const permissions = await store.listPermissions();
      const validIDs = new Set(
        permissions.map((permission) => permission.permissionID),
      );
      ensure(
        selectedIDs.every((id) => validIDs.has(id)),
        400,
        "Unknown permission.",
      );
      const manager = permissions.find(
        (permission) => permission.description === "MANAGE_PERMISSIONS",
      );
      ensure(
        manager,
        500,
        "Permission administrator configuration is missing.",
      );
      ensure(
        selectedIDs.includes(manager.permissionID) ||
          (await store.hasOtherPermissionUser(manager.permissionID, userID)),
        409,
        "Keep at least one permission administrator.",
      );
      await store.replacePermissions(userID, selectedIDs);
      const user = await store.getAccount(userID);
      ensure(user, 404, "User not found.");
      return user;
    });
  }
}

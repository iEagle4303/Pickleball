import type { UnitOfWork } from "../../repositories/interfaces/UnitOfWork.js";
import { authUser, publicUser } from "../mappers/userView.js";
import { ensure } from "../errors.js";
import { profileSchema, permissionsSchema } from "../validation.js";
import { requireUser } from "../shared/records.js";
export class UserService {
  constructor(private readonly work: UnitOfWork) {}
  list(includePrivateFields = false) {
    return this.work.query(async (repositories) => {
      const users = await repositories.users.list();
      return Promise.all(
        users.map((user) =>
          includePrivateFields
            ? authUser(repositories.permissions, user)
            : publicUser(user),
        ),
      );
    });
  }
  updateProfile(userID: number, input: unknown) {
    const value = profileSchema.parse(input);
    return this.work.transaction(async (repositories) => {
      await requireUser(repositories.users, userID);
      const existing = await repositories.users.findByEmail(value.email);
      ensure(
        !existing || existing.userID === userID,
        409,
        "This email is already registered.",
      );
      const user = await repositories.users.updateProfile(userID, value);
      return authUser(repositories.permissions, user);
    });
  }
  setPermissions(userID: number, input: unknown) {
    const { permissionIDs } = permissionsSchema.parse(input);
    return this.work.transaction(async (repositories) => {
      const user = await requireUser(repositories.users, userID);
      const permissions = await repositories.permissions.list();
      const validIDs = new Set(
        permissions.map((permission) => permission.permissionID),
      );
      ensure(
        permissionIDs.every((id) => validIDs.has(id)),
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
        permissionIDs.includes(manager.permissionID) ||
          (await repositories.permissions.hasOtherUser(
            manager.permissionID,
            userID,
          )),
        409,
        "Keep at least one permission administrator.",
      );
      await repositories.permissions.replaceForUser(userID, permissionIDs);
      return authUser(repositories.permissions, user);
    });
  }
}

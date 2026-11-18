import { Router } from "express";
import type { UserService } from "../services/users/userService.js";
import {
  requireUser,
  requirePermission as permit,
} from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
import { parseID } from "../services/validation.js";
/**
 * Creates the user router and applies its authentication and permission requirements.
 *
 * @param users - Service dependency handling this resource.
 * @returns An Express router containing the resource's supported endpoints.
 */
export function createUserRoutes(users: UserService): Router {
  const router = Router();
  router.get(
    "/",
    requireUser,
    endpoint((req) =>
      users.list(req.user!.permissions.includes("MANAGE_PERMISSIONS")),
    ),
  );
  router.put(
    "/me",
    requireUser,
    endpoint((req) => users.updateProfile(req.user!.userID, req.body)),
  );
  router.put(
    "/:id/permissions",
    permit("MANAGE_PERMISSIONS"),
    endpoint((req) =>
      users.setPermissions(parseID(req.params.id), req.body?.permissionIDs),
    ),
  );
  return router;
}

import { Router } from "express";
import type { UserService } from "../services/users/userService.js";
import {
  requireUser,
  requirePermission as permit,
} from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
import { parseID } from "../services/validation.js";
export function createUserRoutes(users: UserService) {
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
    endpoint((req) => users.setPermissions(parseID(req.params.id), req.body)),
  );
  return router;
}

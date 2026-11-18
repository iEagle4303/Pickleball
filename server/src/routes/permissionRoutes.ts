import { Router } from "express";
import type { PermissionService } from "../services/permissions/permissionService.js";
import { requirePermission } from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
/**
 * Creates the permission router and applies its authentication and permission requirements.
 *
 * @param permissions - Service dependency handling this resource.
 * @returns An Express router containing the resource's supported endpoints.
 */
export function createPermissionRoutes(permissions: PermissionService): Router {
  const router = Router();
  router.get(
    "/",
    requirePermission("MANAGE_PERMISSIONS"),
    endpoint(() => permissions.list()),
  );
  return router;
}

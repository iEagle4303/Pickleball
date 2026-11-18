import { Router } from "express";
import type { PermissionService } from "../services/permissions/permissionService.js";
import { requirePermission } from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
export function createPermissionRoutes(permissions: PermissionService) {
  const router = Router();
  router.get(
    "/",
    requirePermission("MANAGE_PERMISSIONS"),
    endpoint(() => permissions.list()),
  );
  return router;
}

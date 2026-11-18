import { Router } from "express";
import type { Services } from "../services/createServices.js";
import { identify } from "../middleware/auth.js";
import { createAuthRoutes } from "./authRoutes.js";
import { createHomeRoutes } from "./homeRoutes.js";
import { createTournamentRoutes } from "./tournamentRoutes.js";
import { createTeamRoutes } from "./teamRoutes.js";
import { createGameRoutes } from "./gameRoutes.js";
import { createUserRoutes } from "./userRoutes.js";
import { createPermissionRoutes } from "./permissionRoutes.js";
/**
 * Mounts authenticated resource routers without performing business rules or data access.
 *
 * @param services - Configured resource services injected into this router.
 * @param production - Whether session cookies must require HTTPS.
 * @returns An Express router containing the resource's supported endpoints.
 */
export function createApi(services: Services, production = false): Router {
  const router = Router();
  router.use(identify(services.auth));
  router.get("/health", (_req, res) => res.json({ data: { status: "ok" } }));
  router.use("/auth", createAuthRoutes(services.auth, production));
  router.use("/home", createHomeRoutes(services.home));
  router.use("/tournaments", createTournamentRoutes(services));
  router.use("/teams", createTeamRoutes(services.teams));
  router.use("/games", createGameRoutes(services.games));
  router.use("/users", createUserRoutes(services.users));
  router.use("/permissions", createPermissionRoutes(services.permissions));
  return router;
}

import { Router } from "express";
import type { HomeService } from "../services/home/homeService.js";
import { endpoint } from "../controllers/leagueController.js";
/**
 * Creates the home router and applies its authentication and permission requirements.
 *
 * @param home - Service dependency handling this resource.
 * @returns An Express router containing the resource's supported endpoints.
 */
export function createHomeRoutes(home: HomeService): Router {
  const router = Router();
  router.get(
    "/",
    endpoint(() => home.get()),
  );
  return router;
}

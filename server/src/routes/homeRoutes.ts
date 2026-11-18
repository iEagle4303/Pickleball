import { Router } from "express";
import type { HomeService } from "../services/home/homeService.js";
import { endpoint } from "../controllers/leagueController.js";
export function createHomeRoutes(home: HomeService) {
  const router = Router();
  router.get(
    "/",
    endpoint(() => home.get()),
  );
  return router;
}

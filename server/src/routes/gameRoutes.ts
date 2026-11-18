import { Router } from "express";
import type { GameService } from "../services/games/gameService.js";
import { requirePermission as permit } from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
import { parseID } from "../services/validation.js";
/**
 * Creates the game router and applies its authentication and permission requirements.
 *
 * @param games - Completed results scoped to the tournament.
 * @returns An Express router containing the resource's supported endpoints.
 */
export function createGameRoutes(games: GameService): Router {
  const router = Router();
  router.get(
    "/",
    endpoint((req) =>
      games.list(
        req.query.tournamentID ? parseID(req.query.tournamentID) : undefined,
        req.query.teamID ? parseID(req.query.teamID) : undefined,
      ),
    ),
  );
  router.post(
    "/",
    permit("ADD_GAME_RESULT"),
    endpoint((req) => games.create(req.body), 201),
  );
  router.put(
    "/:id",
    permit("EDIT_GAME_RESULT"),
    endpoint((req) => games.update(parseID(req.params.id), req.body)),
  );
  router.delete(
    "/:id",
    permit("DELETE_GAME_RESULT"),
    endpoint((req) => games.remove(parseID(req.params.id))),
  );
  return router;
}

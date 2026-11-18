import { Router } from "express";
import type { GameService } from "../services/games/gameService.js";
import { requirePermission as permit } from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
import { parseID } from "../services/validation.js";
export function createGameRoutes(games: GameService) {
  const router = Router();
  router.get(
    "/",
    endpoint((req) =>
      games.list({
        tournamentID: req.query.tournamentID
          ? parseID(req.query.tournamentID)
          : undefined,
        teamID: req.query.teamID ? parseID(req.query.teamID) : undefined,
      }),
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

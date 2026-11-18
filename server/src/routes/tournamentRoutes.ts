import { Router } from "express";
import type { Services } from "../services/createServices.js";
import { requirePermission as permit } from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
import { parseID, roundSchema } from "../services/validation.js";
/**
 * Creates the tournament router and applies its authentication and permission requirements.
 *
 * @param services - Configured resource services injected into this router.
 * @returns An Express router containing the resource's supported endpoints.
 */
export function createTournamentRoutes(
  services: Pick<Services, "tournaments" | "games" | "rankings" | "matchups">,
): Router {
  const { tournaments, games, rankings, matchups } = services;
  const router = Router();
  router.get(
    "/",
    endpoint(() => tournaments.list()),
  );
  router.get(
    "/:id",
    endpoint((req) => tournaments.get(parseID(req.params.id))),
  );
  router.post(
    "/",
    permit("CREATE_TOURNAMENT"),
    endpoint((req) => tournaments.create(req.body), 201),
  );
  router.put(
    "/:id",
    permit("EDIT_TOURNAMENT"),
    endpoint((req) => tournaments.update(parseID(req.params.id), req.body)),
  );
  router.delete(
    "/:id",
    permit("EDIT_TOURNAMENT"),
    endpoint((req) => tournaments.remove(parseID(req.params.id))),
  );
  router.put(
    "/:id/teams",
    permit("EDIT_TOURNAMENT"),
    endpoint((req) =>
      tournaments.setParticipants(parseID(req.params.id), req.body?.teamIDs),
    ),
  );
  router.get(
    "/:id/games",
    endpoint((req) => games.list(parseID(req.params.id))),
  );
  router.get(
    "/:id/rankings",
    endpoint((req) => rankings.list(parseID(req.params.id))),
  );
  router.get(
    "/:id/matchups",
    endpoint((req) => matchups.get(parseID(req.params.id))),
  );
  router.post(
    "/:id/matchups",
    permit("EDIT_TOURNAMENT"),
    endpoint((req) =>
      matchups.get(parseID(req.params.id), roundSchema.parse(req.body?.round)),
    ),
  );
  return router;
}

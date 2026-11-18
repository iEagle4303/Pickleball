import { Router } from "express";
import type { TeamService } from "../services/teams/teamService.js";
import { requireUser } from "../middleware/auth.js";
import { endpoint } from "../controllers/leagueController.js";
import { parseID } from "../services/validation.js";
export function createTeamRoutes(teams: TeamService) {
  const router = Router();
  router.get(
    "/",
    endpoint(() => teams.list()),
  );
  router.get(
    "/:id",
    endpoint((req) => teams.get(parseID(req.params.id))),
  );
  router.post(
    "/",
    requireUser,
    endpoint((req) => teams.create(req.body, req.user!), 201),
  );
  router.put(
    "/:id",
    requireUser,
    endpoint((req) =>
      teams.update(parseID(req.params.id), req.body, req.user!),
    ),
  );
  router.post(
    "/:id/members",
    requireUser,
    endpoint(
      (req) => teams.addMember(parseID(req.params.id), req.body, req.user!),
      201,
    ),
  );
  router.delete(
    "/:id/members/:userID",
    requireUser,
    endpoint((req) =>
      teams.removeMember(
        parseID(req.params.id),
        parseID(req.params.userID),
        req.user!,
      ),
    ),
  );
  return router;
}

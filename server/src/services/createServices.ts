import type { UnitOfWork } from "../repositories/interfaces/UnitOfWork.js";
import { AuthService } from "./auth/authService.js";
import { HomeService } from "./home/homeService.js";
import { TournamentService } from "./tournaments/tournamentService.js";
import { TeamService } from "./teams/teamService.js";
import { GameService } from "./games/gameService.js";
import { UserService } from "./users/userService.js";
import { PermissionService } from "./permissions/permissionService.js";
import { RankingService } from "./rankings/rankingService.js";
import { MatchupService } from "./matchups/matchupService.js";
/** Composition only: route services share the storage-neutral transaction boundary. */
export function createServices(work: UnitOfWork) {
  return {
    auth: new AuthService(work),
    home: new HomeService(work),
    tournaments: new TournamentService(work),
    teams: new TeamService(work),
    games: new GameService(work),
    users: new UserService(work),
    permissions: new PermissionService(work),
    rankings: new RankingService(work),
    matchups: new MatchupService(work),
  };
}
export type Services = ReturnType<typeof createServices>;

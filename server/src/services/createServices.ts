import type { Stores } from "../store/createStores.js";
import { AuthService } from "./auth/authService.js";
import { HomeService } from "./home/homeService.js";
import { TournamentService } from "./tournaments/tournamentService.js";
import { TeamService } from "./teams/teamService.js";
import { GameService } from "./games/gameService.js";
import { UserService } from "./users/userService.js";
import { PermissionService } from "./permissions/permissionService.js";
import { RankingService } from "./rankings/rankingService.js";
import { MatchupService } from "./matchups/matchupService.js";
/**
 * Creates the service collection from per-service stores and shared ranking/matchup dependencies.
 *
 * @param stores - Per-service store dependencies selected at startup.
 * @returns The nine configured services used by the API routers.
 */
export function createServices(stores: Stores): Services {
  const rankings = new RankingService(stores.rankings);
  const matchups = new MatchupService(stores.matchups, rankings);
  return {
    auth: new AuthService(stores.auth),
    home: new HomeService(stores.home, rankings, matchups),
    tournaments: new TournamentService(stores.tournaments),
    teams: new TeamService(stores.teams),
    games: new GameService(stores.games),
    users: new UserService(stores.users),
    permissions: new PermissionService(stores.permissions),
    rankings,
    matchups,
  };
}
/**
 * Service instances injected into API routers; each service uses its own store contract.
 */
export interface Services {
  /** Account and session dependency. */
  auth: AuthService;
  /** Clubhouse aggregation dependency. */
  home: HomeService;
  /** Tournament and participation dependency. */
  tournaments: TournamentService;
  /** Team and roster dependency. */
  teams: TeamService;
  /** Game-result and history dependency. */
  games: GameService;
  /** Member profile and permission-assignment dependency. */
  users: UserService;
  /** Permission-catalog dependency. */
  permissions: PermissionService;
  /** Leaderboard input or calculation dependency. */
  rankings: RankingService;
  /** Matchup input or generation dependency. */
  matchups: MatchupService;
}

import type { JsonDatabase } from "./JsonDatabase.js";
import type {
  AuthUser,
  Game,
  GameView,
  PublicUser,
  Team,
  TeamView,
  Tournament,
  TournamentView,
  User,
} from "../../types/entities.js";
import type { CompetitionData } from "../types.js";
/**
 * Projects a user to public identity fields, excluding email, permissions, and password hashes.
 *
 * @param user - Internal user record to project without leaking sensitive fields.
 * @returns Public identity without private account fields.
 */
export function publicUser(user: User): PublicUser {
  return {
    userID: user.userID,
    username: user.username,
    displayName: user.displayName,
  };
}
/**
 * Joins a user and permission assignments into a sanitized authenticated-account view.
 *
 * @param data - Consistent JSON snapshot used only inside the JSON adapter.
 * @param userID - Primary key of the user.
 * @returns Sanitized account with email and current permission names. Returns null when no matching record exists.
 */
export function accountView(
  data: JsonDatabase,
  userID: number,
): AuthUser | null {
  const user = data.users.find((user) => user.userID === userID);
  if (!user) return null;
  const ids = new Set(
    data.userPermissions
      .filter((link) => link.userID === userID)
      .map((link) => link.permissionID),
  );
  return {
    ...publicUser(user),
    email: user.email,
    permissions: data.permissions
      .filter((permission) => ids.has(permission.permissionID))
      .map((permission) => permission.description),
  };
}
/**
 * Joins team memberships to public player identities.
 *
 * @param data - Consistent JSON snapshot used only inside the JSON adapter.
 * @param teamID - Primary key of the team.
 * @returns An array of public identity without private account fields.
 * @throws {Error} If JSON persistence or referenced-record integrity checks fail.
 */
export function membersView(data: JsonDatabase, teamID: number): PublicUser[] {
  return data.userTeams
    .filter((link) => link.teamID === teamID)
    .map((link) => {
      const user = data.users.find((user) => user.userID === link.userID);
      if (!user) throw new Error("Team membership references a missing user.");
      return publicUser(user);
    });
}
/**
 * Builds the current roster and aggregate game statistics for a team.
 *
 * @param data - Consistent JSON snapshot used only inside the JSON adapter.
 * @param team - Team entity whose related fields are being projected.
 * @param tournamentID - Primary key of the tournament.
 * @returns Team identity, public roster, and aggregate game statistics.
 */
export function teamView(
  data: JsonDatabase,
  team: Team,
  tournamentID?: number,
): TeamView {
  const games = listGames(data, tournamentID, team.teamID);
  const wins = games.filter((game) => game.winnerTeamID === team.teamID).length;
  const losses = games.filter(
    (game) => game.loserTeamID === team.teamID,
  ).length;
  const gamesPlayed = wins + losses;
  return {
    ...team,
    members: membersView(data, team.teamID),
    wins,
    losses,
    gamesPlayed,
    winPercentage: gamesPlayed ? (wins / gamesPlayed) * 100 : 0,
  };
}
/**
 * Builds a tournament summary with participating-team and completed-game counts.
 *
 * @param data - Consistent JSON snapshot used only inside the JSON adapter.
 * @param tournament - Tournament entity whose summary is being projected.
 * @returns Tournament summary with participant and completed-game counts.
 */
export function tournamentView(
  data: JsonDatabase,
  tournament: Tournament,
): TournamentView {
  return {
    ...tournament,
    teamCount: data.teamTournaments.filter(
      (link) => link.tournamentID === tournament.tournamentID,
    ).length,
    gameCount: data.games.filter(
      (game) => game.tournamentID === tournament.tournamentID,
    ).length,
  };
}
/**
 * Joins a completed result to its winning team, losing team, and tournament.
 *
 * @param data - Consistent JSON snapshot used only inside the JSON adapter.
 * @param game - Completed result whose related entities are being projected.
 * @returns Completed result joined to the winner, loser, and tournament.
 * @throws {Error} If JSON persistence or referenced-record integrity checks fail.
 */
export function gameView(data: JsonDatabase, game: Game): GameView {
  const winner = data.teams.find((team) => team.teamID === game.winnerTeamID);
  const loser = data.teams.find((team) => team.teamID === game.loserTeamID);
  const tournament = data.tournaments.find(
    (tournament) => tournament.tournamentID === game.tournamentID,
  );
  if (!winner || !loser || !tournament)
    throw new Error("Game references missing teams or a missing tournament.");
  return { ...game, winner, loser, tournament };
}
/**
 * Selects completed games by explicit tournament/team IDs and orders them newest first.
 *
 * @param data - Consistent JSON snapshot used only inside the JSON adapter.
 * @param tournamentID - Primary key of the tournament.
 * @param teamID - Primary key of the team.
 * @param limit - Optional maximum number of results after filtering and sorting.
 * @returns Completed games ordered by playedAt descending, then gameID descending.
 */
export function listGames(
  data: JsonDatabase,
  tournamentID?: number,
  teamID?: number,
  limit?: number,
): Game[] {
  const games = data.games
    .filter(
      (game) =>
        (tournamentID === undefined || game.tournamentID === tournamentID) &&
        (teamID === undefined ||
          game.winnerTeamID === teamID ||
          game.loserTeamID === teamID),
    )
    .sort(
      (a, b) => b.playedAt.localeCompare(a.playedAt) || b.gameID - a.gameID,
    );
  return limit === undefined ? games : games.slice(0, limit);
}
/**
 * Loads one consistent set of tournament, team, result, and roster inputs for calculations.
 *
 * @param data - Consistent JSON snapshot used only inside the JSON adapter.
 * @param tournamentID - Primary key of the tournament.
 * @returns Tournament, teams, completed results, and rosters used by ranking and matchup calculations. Returns null when no matching record exists.
 */
export function competitionData(
  data: JsonDatabase,
  tournamentID: number,
): CompetitionData | null {
  const tournament = data.tournaments.find(
    (tournament) => tournament.tournamentID === tournamentID,
  );
  if (!tournament) return null;
  const ids = new Set(
    data.teamTournaments
      .filter((link) => link.tournamentID === tournamentID)
      .map((link) => link.teamID),
  );
  const teams = data.teams.filter((team) => ids.has(team.teamID));
  return {
    tournament,
    teams,
    games: listGames(data, tournamentID),
    members: teams.map((team) => ({
      teamID: team.teamID,
      players: membersView(data, team.teamID),
    })),
  };
}

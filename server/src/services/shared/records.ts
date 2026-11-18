import type { UserQueries } from "../../repositories/interfaces/UserRepository.js";
import type { TeamQueries } from "../../repositories/interfaces/TeamRepository.js";
import type { TournamentQueries } from "../../repositories/interfaces/TournamentRepository.js";
import type { GameQueries } from "../../repositories/interfaces/GameRepository.js";
import { ensure } from "../errors.js";
export async function requireUser(users: UserQueries, userID: number) {
  const user = await users.findById(userID);
  ensure(user, 404, "User not found.");
  return user;
}
export async function requireTeam(teams: TeamQueries, teamID: number) {
  const team = await teams.findById(teamID);
  ensure(team, 404, "Team not found.");
  return team;
}
export async function requireTournament(
  tournaments: TournamentQueries,
  tournamentID: number,
) {
  const tournament = await tournaments.findById(tournamentID);
  ensure(tournament, 404, "Tournament not found.");
  return tournament;
}
export async function requireGame(games: GameQueries, gameID: number) {
  const game = await games.findById(gameID);
  ensure(game, 404, "Game not found.");
  return game;
}

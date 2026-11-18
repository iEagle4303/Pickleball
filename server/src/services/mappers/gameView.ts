import type { ReadRepositories } from "../../repositories/interfaces/UnitOfWork.js";
import type { Game, GameView } from "../../types/entities.js";
import { requireTeam, requireTournament } from "../shared/records.js";
export async function gameView(
  repositories: Pick<ReadRepositories, "teams" | "tournaments">,
  game: Game,
): Promise<GameView> {
  const [winner, loser, tournament] = await Promise.all([
    requireTeam(repositories.teams, game.winnerTeamID),
    requireTeam(repositories.teams, game.loserTeamID),
    requireTournament(repositories.tournaments, game.tournamentID),
  ]);
  return { ...game, winner, loser, tournament };
}

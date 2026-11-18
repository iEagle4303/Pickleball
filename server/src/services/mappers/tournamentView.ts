import type { ReadRepositories } from "../../repositories/interfaces/UnitOfWork.js";
import type { Tournament, TournamentView } from "../../types/entities.js";
export async function tournamentView(
  repositories: Pick<ReadRepositories, "tournaments" | "games">,
  tournament: Tournament,
): Promise<TournamentView> {
  const [teamCount, gameCount] = await Promise.all([
    repositories.tournaments.countTeams(tournament.tournamentID),
    repositories.games.count({ tournamentID: tournament.tournamentID }),
  ]);
  return { ...tournament, teamCount, gameCount };
}

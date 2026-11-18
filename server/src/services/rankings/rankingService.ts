import type {
  UnitOfWork,
  ReadRepositories,
} from "../../repositories/interfaces/UnitOfWork.js";
import type { RankedTeam } from "../../types/entities.js";
import { defaultRanking } from "./algorithms/defaultRanking.js";
import { requireTournament } from "../shared/records.js";
// Change only this selection to replace the ranking algorithm.
const algorithm = defaultRanking;
/** May share a read context with home/matchups to keep the response consistent. */
export async function getRankings(
  repositories: ReadRepositories,
  tournamentID: number,
): Promise<RankedTeam[]> {
  await requireTournament(repositories.tournaments, tournamentID);
  const [teams, games] = await Promise.all([
    repositories.teams.listForTournament(tournamentID),
    repositories.games.list({ tournamentID }),
  ]);
  const ranked = algorithm.rank(teams, games);
  return Promise.all(
    ranked.map(async (row) => ({
      ...row,
      players: await repositories.teams.listMembers(row.team.teamID),
    })),
  );
}
export class RankingService {
  constructor(private readonly work: UnitOfWork) {}
  list(tournamentID: number) {
    return this.work.query((repositories) =>
      getRankings(repositories, tournamentID),
    );
  }
}

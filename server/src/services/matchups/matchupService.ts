import type {
  UnitOfWork,
  ReadRepositories,
} from "../../repositories/interfaces/UnitOfWork.js";
import { getRankings } from "../rankings/rankingService.js";
import { nearbyMatchups } from "./algorithms/nearbyMatchups.js";
const algorithm = nearbyMatchups;
export async function getMatchups(
  repositories: ReadRepositories,
  tournamentID: number,
  round = 0,
) {
  const [rankings, games] = await Promise.all([
    getRankings(repositories, tournamentID),
    repositories.games.list({ tournamentID }),
  ]);
  return algorithm.generate(rankings, games, round);
}
export class MatchupService {
  constructor(private readonly work: UnitOfWork) {}
  get(tournamentID: number, round = 0) {
    return this.work.query((repositories) =>
      getMatchups(repositories, tournamentID, round),
    );
  }
}

import type { MatchupResult } from "../../types/entities.js";
import type { MatchupStore } from "../../store/matchupStore.js";
import type { Game, RankedTeam } from "../../types/entities.js";
import type { RankingService } from "../rankings/rankingService.js";
import { nearbyMatchups } from "./algorithms/nearbyMatchups.js";
import { ensure } from "../errors.js";
const algorithm = nearbyMatchups;
/**
 * Loads tournament inputs and generates pairings using the selected matchup algorithm.
 */
export class MatchupService {
  /**
   * Creates the MatchupService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   * @param rankings - Ordered teams returned by the ranking service.
   */
  constructor(
    private readonly store: MatchupStore,
    private readonly rankings: RankingService,
  ) {}
  /**
   * Loads a tournament's inputs and returns recommended pairings for the requested round.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param round - Nonnegative pairing round used to rotate opponents and byes.
   * @returns Suggested pairings and the optional bye for an odd-sized field.
   * @throws {HttpError} If the tournament does not exist.
   */
  async get(tournamentID: number, round = 0): Promise<MatchupResult> {
    const data = await this.store.getCompetition(tournamentID);
    ensure(data, 404, "Tournament not found.");
    const rankings = this.rankings.calculate(
      data.teams,
      data.games,
      data.members,
    );
    return this.generate(rankings, data.games, round);
  }
  /**
   * Applies the selected pairing algorithm to already calculated rankings and completed games.
   *
   * @param rankings - Ordered teams returned by the ranking service.
   * @param games - Completed results scoped to the tournament.
   * @param round - Nonnegative pairing round used to rotate opponents and byes.
   * @returns Suggested pairings and the optional bye for an odd-sized field.
   */
  generate(
    rankings: readonly RankedTeam[],
    games: readonly Game[],
    round = 0,
  ): MatchupResult {
    return algorithm.generate(rankings, games, round);
  }
}

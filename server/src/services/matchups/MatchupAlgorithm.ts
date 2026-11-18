import type { RankedTeam, Game, MatchupResult } from "../../types/entities.js";
/**
 * Replaceable contract that generates pairings and an optional bye from ranked teams.
 */
export interface MatchupAlgorithm {
  /**
   * Generates recommended pairings and an optional bye without scheduling, persisting, or mutating inputs.
   *
   * @param rankings - Ordered teams returned by the ranking service.
   * @param games - Completed results scoped to the tournament.
   * @param round - Nonnegative pairing round used to rotate opponents and byes.
   * @returns Recommended pairings and an optional bye; each team is used at most once.
   */
  generate(
    rankings: readonly RankedTeam[],
    games: readonly Game[],
    round: number,
  ): MatchupResult;
}

import type { Team, Game, RankedTeam } from "../../types/entities.js";
/**
 * Replaceable contract that orders tournament teams independently of persistence.
 */
export interface RankingAlgorithm {
  /**
   * Orders tournament teams according to the selected algorithm without accessing storage or mutating inputs.
   *
   * @param teams - Tournament teams to rank without mutating the input collection.
   * @param games - Completed results scoped to the tournament.
   * @returns Every supplied team once, in algorithm-defined rank order with one-based rank values.
   */
  rank(teams: readonly Team[], games: readonly Game[]): RankedTeam[];
}

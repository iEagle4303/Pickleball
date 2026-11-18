import type { RankedTeam, Game, MatchupResult } from "../../types/entities.js";
export interface MatchupAlgorithm {
  generate(
    rankings: readonly RankedTeam[],
    games: readonly Game[],
    round: number,
  ): MatchupResult;
}

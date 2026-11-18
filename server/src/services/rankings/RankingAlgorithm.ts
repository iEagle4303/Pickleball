import type { Team, Game, RankedTeam } from "../../types/entities.js";
export interface RankingAlgorithm {
  rank(teams: readonly Team[], games: readonly Game[]): RankedTeam[];
}

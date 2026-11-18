import type { HomeStore } from "../../store/homeStore.js";
import type { HomeData } from "../../types/entities.js";
import type { RankingService } from "../rankings/rankingService.js";
import type { MatchupService } from "../matchups/matchupService.js";
/**
 * Combines a consistent clubhouse snapshot with calculated rankings and suggested pairings.
 */
export class HomeService {
  /**
   * Creates the HomeService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   * @param rankings - Ordered teams returned by the ranking service.
   * @param matchups - Pairing service used to generate recommendations from calculated rankings.
   */
  constructor(
    private readonly store: HomeStore,
    private readonly rankings: RankingService,
    private readonly matchups: MatchupService,
  ) {}
  /**
   * Builds the clubhouse response and calculates rankings/pairings from the same stored snapshot.
   *
   * @returns Public clubhouse summaries, recent results, leaderboard, pairings, and totals.
   */
  async get(): Promise<HomeData> {
    const { competition, ...view } = await this.store.get();
    const rankings = competition
      ? this.rankings.calculate(
          competition.teams,
          competition.games,
          competition.members,
        )
      : [];
    return {
      ...view,
      rankings: rankings.slice(0, 5),
      matchups: competition
        ? this.matchups.generate(rankings, competition.games)
        : { matchups: [], bye: null },
    };
  }
}

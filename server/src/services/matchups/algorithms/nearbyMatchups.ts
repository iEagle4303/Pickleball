import type {
  RankedTeam,
  Game,
  MatchupResult,
} from "../../../types/entities.js";
import type { MatchupAlgorithm } from "../MatchupAlgorithm.js";
/** Greedy nearby pairing; recent opponents receive a penalty. Round rotates the starting order and bye. */
export const nearbyMatchups: MatchupAlgorithm = {
  /**
   * Pairs nearby ranked teams, penalizes recent opponents, and rotates an odd-team bye.
   *
   * @param rankings - Ordered teams returned by the ranking service.
   * @param games - Completed results scoped to the tournament.
   * @param round - Nonnegative pairing round used to rotate opponents and byes.
   * @returns Suggested pairings and the optional bye for an odd-sized field.
   */
  generate(
    rankings: readonly RankedTeam[],
    games: readonly Game[],
    round: number,
  ): MatchupResult {
    if (!rankings.length) return { matchups: [], bye: null };
    const pool = [...rankings];
    const recent = [...games]
      .sort(
        (a, b) => b.playedAt.localeCompare(a.playedAt) || b.gameID - a.gameID,
      )
      .slice(0, Math.max(4, Math.ceil(pool.length / 2) * 2));
    /**
     * Checks whether two teams played each other in the recent-game window.
     *
     * @param a - First team's primary key.
     * @param b - Second team's primary key.
     * @returns True when the described check succeeds; otherwise false.
     */
    const repeated = (a: number, b: number): boolean =>
      recent.some(
        (game) =>
          (game.winnerTeamID === a && game.loserTeamID === b) ||
          (game.winnerTeamID === b && game.loserTeamID === a),
      );
    const bye =
      pool.length % 2
        ? pool.splice(
            (pool.length - 1 - (round % pool.length) + pool.length) %
              pool.length,
            1,
          )[0]
        : null;
    const offset = pool.length ? round % pool.length : 0;
    pool.push(...pool.splice(0, offset));
    const matchups = [];
    while (pool.length > 1) {
      const teamA = pool.shift()!;
      /**
       * Scores a potential opponent by rank distance, penalizing a recently repeated matchup.
       *
       * @param team - Team entity whose related fields are being projected.
       * @returns Nonnegative rank distance plus a penalty if the opponent was recently faced.
       */
      const score = (team: typeof teamA): number =>
        Math.abs(teamA.rank - team.rank) +
        (repeated(teamA.team.teamID, team.team.teamID) ? 1000 : 0);
      pool.sort((a, b) => score(a) - score(b) || a.rank - b.rank);
      const teamB = pool.shift()!;
      matchups.push({
        court: matchups.length + 1,
        teamA,
        teamB,
        recentlyPlayed: repeated(teamA.team.teamID, teamB.team.teamID),
      });
    }
    return { matchups, bye };
  },
};

import type { MatchupAlgorithm } from "../MatchupAlgorithm.js";
/** Greedy nearby pairing; recent opponents receive a penalty. Round rotates the starting order and bye. */
export const nearbyMatchups: MatchupAlgorithm = {
  generate(rankings, games, round) {
    if (!rankings.length) return { matchups: [], bye: null };
    const pool = [...rankings];
    const recent = [...games]
      .sort(
        (a, b) => b.playedAt.localeCompare(a.playedAt) || b.gameID - a.gameID,
      )
      .slice(0, Math.max(4, Math.ceil(pool.length / 2) * 2));
    const repeated = (a: number, b: number) =>
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
      const score = (team: typeof teamA) =>
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

import type { RankingAlgorithm } from "../RankingAlgorithm.js";
/** Placeholder: wins descending, then win percentage descending, then stable numeric team ID. */
export const defaultRanking: RankingAlgorithm = {
  rank(teams, games) {
    const validIDs = new Set(teams.map((team) => team.teamID));
    const validGames = games.filter(
      (game) =>
        validIDs.has(game.winnerTeamID) &&
        validIDs.has(game.loserTeamID) &&
        game.winnerTeamID !== game.loserTeamID,
    );
    return teams
      .map((team) => {
        const wins = validGames.filter(
          (game) => game.winnerTeamID === team.teamID,
        ).length;
        const losses = validGames.filter(
          (game) => game.loserTeamID === team.teamID,
        ).length;
        return {
          rank: 0,
          team,
          players: [],
          wins,
          losses,
          gamesPlayed: wins + losses,
          winPercentage: wins + losses ? (wins / (wins + losses)) * 100 : 0,
        };
      })
      .sort(
        (a, b) =>
          b.wins - a.wins ||
          b.winPercentage - a.winPercentage ||
          a.team.teamID - b.team.teamID,
      )
      .map((row, index) => ({ ...row, rank: index + 1 }));
  },
};

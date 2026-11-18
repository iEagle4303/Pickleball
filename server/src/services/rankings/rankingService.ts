import type { RankingStore } from "../../store/rankingStore.js";
import type { TeamMembers } from "../../store/types.js";
import type { Team, Game, RankedTeam } from "../../types/entities.js";
import { defaultRanking } from "./algorithms/defaultRanking.js";
import { ensure } from "../errors.js";
// Change only this selection to replace the ranking algorithm.
const algorithm = defaultRanking;
/**
 * Loads tournament inputs and applies the selected storage-independent ranking algorithm.
 */
export class RankingService {
  /**
   * Creates the RankingService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   */
  constructor(private readonly store: RankingStore) {}
  /**
   * Loads a tournament's inputs and returns its calculated leaderboard.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns An array of calculated leaderboard row with current public players and statistics.
   * @throws {HttpError} If the tournament does not exist.
   */
  async list(tournamentID: number): Promise<RankedTeam[]> {
    const data = await this.store.getCompetition(tournamentID);
    ensure(data, 404, "Tournament not found.");
    return this.calculate(data.teams, data.games, data.members);
  }
  /**
   * Applies the selected ranking algorithm and attaches current public rosters without accessing storage.
   *
   * @param teams - Tournament teams to rank without mutating the input collection.
   * @param games - Completed results scoped to the tournament.
   * @param members - Public rosters indexed by their associated team IDs.
   * @returns An array of calculated leaderboard row with current public players and statistics.
   */
  calculate(
    teams: readonly Team[],
    games: readonly Game[],
    members: readonly TeamMembers[],
  ): RankedTeam[] {
    const players = new Map(
      members.map((member) => [member.teamID, member.players]),
    );
    return algorithm
      .rank(teams, games)
      .map((row) => ({ ...row, players: players.get(row.team.teamID) ?? [] }));
  }
}

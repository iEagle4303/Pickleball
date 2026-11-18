import { http } from "@/lib/httpClient";
import type { RankedTeam, TournamentView } from "@shared/types";
/**
 * Feature-owned API operations; transport and cookie handling are delegated to the shared HTTP client.
 */
export const rankingApi = {
  /**
   * Fetches leaderboard records from the backend.
   *
   * @param id - Primary key of the leaderboard; omit only when creating a new record.
   * @returns An array of calculated leaderboard row with current public players and statistics.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  list: (id: number): Promise<RankedTeam[]> =>
    http<RankedTeam[]>("/tournaments/" + id + "/rankings"),
  /**
   * Fetches tournament summaries used to populate the feature's selector.
   *
   * @returns An array of tournament summary with participant and completed-game counts.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  tournaments: (): Promise<TournamentView[]> =>
    http<TournamentView[]>("/tournaments"),
};

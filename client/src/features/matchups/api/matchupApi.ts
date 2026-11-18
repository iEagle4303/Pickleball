import { http, jsonBody } from "@/lib/httpClient";
import type { MatchupResult, TournamentView } from "@shared/types";
/**
 * Feature-owned API operations; transport and cookie handling are delegated to the shared HTTP client.
 */
export const matchupApi = {
  /**
   * Fetches the selected matchup details from the backend.
   *
   * @param id - Primary key of the matchup; omit only when creating a new record.
   * @returns Suggested pairings and the optional bye for an odd-sized field.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  get: (id: number): Promise<MatchupResult> =>
    http<MatchupResult>("/tournaments/" + id + "/matchups"),
  /**
   * Requests fresh recommended pairings for a selected tournament and round.
   *
   * @param id - Primary key of the matchup; omit only when creating a new record.
   * @param round - Nonnegative round used to rotate recommended pairings.
   * @returns Suggested pairings and the optional bye for an odd-sized field.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  regenerate: (id: number, round: number): Promise<MatchupResult> =>
    http<MatchupResult>("/tournaments/" + id + "/matchups", {
      method: "POST",
      body: jsonBody({ round }),
    }),
  /**
   * Fetches tournament summaries used to populate the feature's selector.
   *
   * @returns An array of tournament summary with participant and completed-game counts.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  tournaments: (): Promise<TournamentView[]> =>
    http<TournamentView[]>("/tournaments"),
};

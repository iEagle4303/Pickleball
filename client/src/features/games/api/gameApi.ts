import { http, jsonBody } from "@/lib/httpClient";
import type {
  GameView,
  TournamentView,
  TeamView,
  TournamentDetails,
} from "@shared/types";
/**
 * Feature-owned API operations; transport and cookie handling are delegated to the shared HTTP client.
 */
export const gameApi = {
  /**
   * Fetches game result records from the backend.
   *
   * @param tournamentID - Primary key used to filter results or identify a tournament.
   * @param teamID - Primary key used to filter results or identify a team.
   * @returns An array of completed result joined to the winner, loser, and tournament.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  list: (tournamentID?: number, teamID?: number): Promise<GameView[]> =>
    http<GameView[]>(
      "/games?" +
        new URLSearchParams({
          ...(tournamentID ? { tournamentID: String(tournamentID) } : {}),
          ...(teamID ? { teamID: String(teamID) } : {}),
        }),
    ),
  /**
   * Fetches tournament summaries used to populate the feature's selector.
   *
   * @returns An array of tournament summary with participant and completed-game counts.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  tournaments: (): Promise<TournamentView[]> =>
    http<TournamentView[]>("/tournaments"),
  /**
   * Fetches team summaries used for filtering or participation management.
   *
   * @returns An array of team identity, public roster, and aggregate game statistics.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  teams: (): Promise<TeamView[]> => http<TeamView[]>("/teams"),
  /**
   * Fetches tournament details and its participating teams.
   *
   * @param id - Primary key of the game result; omit only when creating a new record.
   * @returns Tournament details with scoped teams, games, parent, and child stages.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  tournament: (id: number): Promise<TournamentDetails> =>
    http<TournamentDetails>("/tournaments/" + id),
  /**
   * Creates a record, or updates the existing record when an ID is supplied.
   *
   * @param value - Complete game result request fields to submit.
   * @param id - Primary key of the game result; omit only when creating a new record.
   * @returns Completed result joined to the winner, loser, and tournament.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  save: (value: unknown, id?: number): Promise<GameView> =>
    http<GameView>("/games" + (id ? "/" + id : ""), {
      method: id ? "PUT" : "POST",
      body: jsonBody(value),
    }),
  /**
   * Deletes the selected record after the caller has obtained confirmation.
   *
   * @param id - Primary key of the game result; omit only when creating a new record.
   * @returns The typed API result, or null when the endpoint has no record or result body.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  remove: (id: number): Promise<null> =>
    http<null>("/games/" + id, { method: "DELETE" }),
};

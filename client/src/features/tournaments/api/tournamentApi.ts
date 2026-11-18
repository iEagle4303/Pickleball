import { http, jsonBody } from "@/lib/httpClient";
import type {
  TournamentView,
  TournamentDetails,
  TeamView,
} from "@shared/types";
/**
 * Feature-owned API operations; transport and cookie handling are delegated to the shared HTTP client.
 */
export const tournamentApi = {
  /**
   * Fetches tournament records from the backend.
   *
   * @returns An array of tournament summary with participant and completed-game counts.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  list: (): Promise<TournamentView[]> => http<TournamentView[]>("/tournaments"),
  /**
   * Fetches the selected tournament details from the backend.
   *
   * @param id - Primary key of the tournament; omit only when creating a new record.
   * @returns Tournament details with scoped teams, games, parent, and child stages.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  get: (id: number): Promise<TournamentDetails> =>
    http<TournamentDetails>("/tournaments/" + id),
  /**
   * Creates a record, or updates the existing record when an ID is supplied.
   *
   * @param value - Complete tournament request fields to submit.
   * @param id - Primary key of the tournament; omit only when creating a new record.
   * @returns Tournament summary with participant and completed-game counts.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  save: (value: unknown, id?: number): Promise<TournamentView> =>
    http<TournamentView>("/tournaments" + (id ? "/" + id : ""), {
      method: id ? "PUT" : "POST",
      body: jsonBody(value),
    }),
  /**
   * Deletes the selected record after the caller has obtained confirmation.
   *
   * @param id - Primary key of the tournament; omit only when creating a new record.
   * @returns The typed API result, or null when the endpoint has no record or result body.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  remove: (id: number): Promise<null> =>
    http<null>("/tournaments/" + id, { method: "DELETE" }),
  /**
   * Fetches team summaries used for filtering or participation management.
   *
   * @returns An array of team identity, public roster, and aggregate game statistics.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  teams: (): Promise<TeamView[]> => http<TeamView[]>("/teams"),
  /**
   * Replaces participating teams through the protected tournament endpoint.
   *
   * @param id - Primary key of the tournament; omit only when creating a new record.
   * @param teamIDs - Participating team IDs to assign to the tournament.
   * @returns Validated primary-key IDs saved for the selected relationship.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  participants: (id: number, teamIDs: number[]): Promise<number[]> =>
    http<number[]>("/tournaments/" + id + "/teams", {
      method: "PUT",
      body: jsonBody({ teamIDs }),
    }),
};

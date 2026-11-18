import { http, jsonBody } from "@/lib/httpClient";
import type { TeamView, TeamDetails, PublicUser } from "@shared/types";
/**
 * Feature-owned API operations; transport and cookie handling are delegated to the shared HTTP client.
 */
export const teamApi = {
  /**
   * Fetches team records from the backend.
   *
   * @returns An array of team identity, public roster, and aggregate game statistics.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  list: (): Promise<TeamView[]> => http<TeamView[]>("/teams"),
  /**
   * Fetches the selected team details from the backend.
   *
   * @param id - Primary key of the team; omit only when creating a new record.
   * @returns Team profile, roster, tournament appearances, and completed-game history.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  get: (id: number): Promise<TeamDetails> => http<TeamDetails>("/teams/" + id),
  /**
   * Creates a record, or updates the existing record when an ID is supplied.
   *
   * @param value - Complete team request fields to submit.
   * @param id - Primary key of the team; omit only when creating a new record.
   * @returns Team identity, public roster, and aggregate game statistics.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  save: (value: unknown, id?: number): Promise<TeamView> =>
    http<TeamView>("/teams" + (id ? "/" + id : ""), {
      method: id ? "PUT" : "POST",
      body: jsonBody(value),
    }),
  /**
   * Fetches club members for roster or authorized permission management.
   *
   * @returns An array of public identity without private account fields.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  users: (): Promise<PublicUser[]> => http<PublicUser[]>("/users"),
  /**
   * Adds the selected member to a team through the protected membership endpoint.
   *
   * @param id - Primary key of the team; omit only when creating a new record.
   * @param userID - Primary key of the member to add, remove, or update.
   * @returns Team identity, public roster, and aggregate game statistics.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  join: (id: number, userID: number): Promise<TeamView> =>
    http<TeamView>("/teams/" + id + "/members", {
      method: "POST",
      body: jsonBody({ userID }),
    }),
  /**
   * Removes the selected team/member relationship.
   *
   * @param id - Primary key of the team; omit only when creating a new record.
   * @param userID - Primary key of the member to add, remove, or update.
   * @returns Team identity, public roster, and aggregate game statistics.
   * @throws {ApiError} If the API response is unsuccessful or cannot be read.
   */
  leave: (id: number, userID: number): Promise<TeamView> =>
    http<TeamView>("/teams/" + id + "/members/" + userID, { method: "DELETE" }),
};

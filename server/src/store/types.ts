import type { Game, PublicUser, Team, Tournament } from "../types/entities.js";
/**
 * Current public roster attached to one team for ranking calculations.
 */
export interface TeamMembers {
  /** Team ID associated with this public roster. */
  teamID: number;
  /** Public identities of the team's current players. */
  players: PublicUser[];
}
/**
 * Consistent tournament, participating teams, results, and rosters used by ranking and matchup services.
 */
export interface CompetitionData {
  /** Tournament associated with the result or competition inputs. */
  tournament: Tournament;
  /** Participating teams or team summaries within the current response's scope. */
  teams: Team[];
  /** Completed results within the current response's scope. */
  games: Game[];
  /** Public roster entries for the participating teams. */
  members: TeamMembers[];
}
/**
 * Runs related store reads against one consistent snapshot or SQL connection.
 *
 * @typeParam TStore - Feature-store contract bound to the scope.
 */
export interface ReadScope<TStore> {
  /**
   * Run related reads against the same snapshot/connection.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  read<T>(operation: (store: TStore) => Promise<T>): Promise<T>;
}
/**
 * Commits related feature-store operations atomically and rolls back if the callback fails.
 *
 * @typeParam TStore - Feature-store contract bound to the scope.
 */
export interface TransactionScope<TStore> extends ReadScope<TStore> {
  /**
   * Commit all changes together, or roll back if the operation fails.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  transaction<T>(operation: (store: TStore) => Promise<T>): Promise<T>;
}
/**
 * Complete game fields for creation or update; the store allocates the primary key separately.
 */
export type GameInput = Omit<Game, "gameID">;
/**
 * Complete tournament fields for creation or update; excludes its generated primary key.
 */
export type TournamentInput = Omit<Tournament, "tournamentID">;

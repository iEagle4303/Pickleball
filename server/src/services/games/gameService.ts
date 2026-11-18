import type { GameView } from "../../types/entities.js";
import type { GameStore } from "../../store/gameStore.js";
import { ensure } from "../errors.js";
import { gameSchema } from "../validation.js";
/**
 * Validates completed game results and coordinates result persistence through GameStore.
 */
export class GameService {
  /**
   * Creates the GameService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   */
  constructor(private readonly store: GameStore) {}
  /**
   * Lists completed results, optionally scoped by tournament ID and team ID.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamID - Primary key of the team.
   * @returns Joined game views ordered by playedAt descending, then gameID descending.
   * @throws {HttpError} If a supplied tournament or team ID does not exist.
   */
  list(tournamentID?: number, teamID?: number): Promise<GameView[]> {
    return this.store.read(async (store) => {
      if (tournamentID !== undefined)
        ensure(
          await store.getTournament(tournamentID),
          404,
          "Tournament not found.",
        );
      if (teamID !== undefined)
        ensure(await store.teamExists(teamID), 404, "Team not found.");
      return store.list(tournamentID, teamID);
    });
  }
  /**
   * Creates a completed result after validating scores and tournament participation.
   *
   * @param input - Request fields to validate before applying the operation.
   * @returns Completed result joined to the winner, loser, and tournament.
   * @throws {HttpError} If teams or the tournament are missing, either team is not participating, or the result is future-dated/upcoming.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  create(input: unknown): Promise<GameView> {
    return this.save(input);
  }
  /**
   * Updates an existing result after applying the same rules as result creation.
   *
   * @param gameID - Primary key of the completed game.
   * @param input - Request fields to validate before applying the operation.
   * @returns Completed result joined to the winner, loser, and tournament.
   * @throws {HttpError} If the game is missing or the result's teams, tournament, participation, or time are invalid.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  update(gameID: number, input: unknown): Promise<GameView> {
    return this.save(input, gameID);
  }
  /**
   * Validates result fields, completion time, teams, and tournament membership before persistence.
   *
   * @param input - Request fields to validate before applying the operation.
   * @param gameID - Primary key of the completed game.
   * @returns Completed result joined to the winner, loser, and tournament.
   * @throws {HttpError} If required records, tournament participation, status, or completion time are invalid.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  private save(input: unknown, gameID?: number): Promise<GameView> {
    const value = gameSchema.parse(input);
    ensure(
      new Date(value.playedAt).getTime() <= Date.now() + 60000,
      400,
      "A completed game cannot be dated in the future.",
    );
    return this.store.transaction(async (store) => {
      if (gameID !== undefined)
        ensure(await store.getGame(gameID), 404, "Game not found.");
      const tournament = await store.getTournament(value.tournamentID);
      ensure(tournament, 404, "Tournament not found.");
      ensure(
        tournament.status !== "upcoming",
        400,
        "Start the tournament before entering results.",
      );
      for (const teamID of [value.winnerTeamID, value.loserTeamID]) {
        ensure(await store.teamExists(teamID), 404, "Team not found.");
        ensure(
          await store.tournamentHasTeam(value.tournamentID, teamID),
          400,
          "Both teams must belong to this tournament.",
        );
      }
      return gameID === undefined
        ? store.createGame(value)
        : store.updateGame(gameID, value);
    });
  }
  /**
   * Removes an existing result so subsequent rankings use the remaining games.
   *
   * @param gameID - Primary key of the completed game.
   * @returns Null acknowledging successful deletion; a missing record throws rather than returning null.
   * @throws {HttpError} If the game does not exist.
   */
  remove(gameID: number): Promise<null> {
    return this.store.transaction(async (store) => {
      ensure(await store.getGame(gameID), 404, "Game not found.");
      await store.removeGame(gameID);
      return null;
    });
  }
}

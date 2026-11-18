import type {
  TournamentView,
  TournamentDetails,
} from "../../types/entities.js";
import type { TournamentStore } from "../../store/tournamentStore.js";
import { ensure } from "../errors.js";
import { tournamentSchema, participationSchema } from "../validation.js";
/**
 * Validates tournament hierarchy, participation, and lifecycle changes through TournamentStore.
 */
export class TournamentService {
  /**
   * Creates the TournamentService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   */
  constructor(private readonly store: TournamentStore) {}
  /**
   * Lists tournament summaries across all semesters.
   *
   * @returns An array of tournament summary with participant and completed-game counts.
   */
  list(): Promise<TournamentView[]> {
    return this.store.list();
  }
  /**
   * Loads a tournament's overview, participants, results, parent, and child stages.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament details with scoped teams, games, parent, and child stages.
   * @throws {HttpError} If the tournament does not exist.
   */
  async get(tournamentID: number): Promise<TournamentDetails> {
    const tournament = await this.store.getDetails(tournamentID);
    ensure(tournament, 404, "Tournament not found.");
    return tournament;
  }
  /**
   * Creates a validated tournament after checking its hierarchy.
   *
   * @param input - Request fields to validate before applying the operation.
   * @returns Tournament summary with participant and completed-game counts.
   * @throws {HttpError} If a parent is missing or the hierarchy/semester relationship is invalid.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  create(input: unknown): Promise<TournamentView> {
    return this.save(input);
  }
  /**
   * Updates a tournament while preserving valid parent/child and semester relationships.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param input - Request fields to validate before applying the operation.
   * @returns Tournament summary with participant and completed-game counts.
   * @throws {HttpError} If the tournament is missing or the requested hierarchy/semester relationship is invalid.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  update(tournamentID: number, input: unknown): Promise<TournamentView> {
    return this.save(input, tournamentID);
  }
  /**
   * Applies shared create/update validation and persists a tournament in one transaction.
   *
   * @param input - Request fields to validate before applying the operation.
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament summary with participant and completed-game counts.
   * @throws {HttpError} If a required tournament is missing or parent/child relationships are inconsistent.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  private save(input: unknown, tournamentID?: number): Promise<TournamentView> {
    const value = tournamentSchema.parse(input);
    return this.store.transaction(async (store) => {
      if (tournamentID !== undefined)
        ensure(
          await store.getTournament(tournamentID),
          404,
          "Tournament not found.",
        );
      if (value.parentTournamentID !== null) {
        const parent = await store.getTournament(value.parentTournamentID);
        ensure(parent, 404, "Tournament not found.");
        ensure(
          parent.semester === value.semester,
          400,
          "Parent and child must use the same semester.",
        );
        const visited = new Set<number>();
        let ancestor: typeof parent | null = parent;
        while (ancestor) {
          ensure(
            ancestor.tournamentID !== tournamentID &&
              !visited.has(ancestor.tournamentID),
            400,
            "Parent relationship would create a cycle.",
          );
          visited.add(ancestor.tournamentID);
          if (ancestor.parentTournamentID === null) break;
          ancestor = await store.getTournament(ancestor.parentTournamentID);
          ensure(ancestor, 404, "Tournament not found.");
        }
      }
      if (tournamentID !== undefined) {
        const children = await store.getChildren(tournamentID);
        ensure(
          children.every((child) => child.semester === value.semester),
          400,
          "Update child semesters before changing this parent semester.",
        );
        await store.updateTournament(tournamentID, value);
        return store.getView(tournamentID);
      }
      const tournament = await store.createTournament(value);
      return store.getView(tournament.tournamentID);
    });
  }
  /**
   * Deletes a tournament only after its results and child stages have been removed.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Null acknowledging successful deletion; a missing record throws rather than returning null.
   * @throws {HttpError} If the tournament is missing or still has results or child stages.
   */
  remove(tournamentID: number): Promise<null> {
    return this.store.transaction(async (store) => {
      ensure(
        await store.getTournament(tournamentID),
        404,
        "Tournament not found.",
      );
      ensure(
        (await store.countGames(tournamentID)) === 0,
        409,
        "Remove this tournament's results before deleting it.",
      );
      ensure(
        (await store.getChildren(tournamentID)).length === 0,
        409,
        "Remove child tournaments first.",
      );
      await store.removeTournament(tournamentID);
      return null;
    });
  }
  /**
   * Replaces participation after checking team existence and preserving teams with recorded results.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamIDs - Team IDs to include in the tournament.
   * @returns The validated participant team IDs that were saved.
   * @throws {HttpError} If the tournament/team is missing or removal would orphan recorded results.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  setParticipants(tournamentID: number, teamIDs: unknown): Promise<number[]> {
    const selectedIDs = participationSchema.shape.teamIDs.parse(teamIDs);
    return this.store.transaction(async (store) => {
      ensure(
        await store.getTournament(tournamentID),
        404,
        "Tournament not found.",
      );
      for (const teamID of selectedIDs)
        ensure(await store.teamExists(teamID), 404, "Team not found.");
      const games = await store.getGames(tournamentID);
      const selected = new Set(selectedIDs);
      ensure(
        games.every(
          (game) =>
            selected.has(game.winnerTeamID) && selected.has(game.loserTeamID),
        ),
        409,
        "Teams with recorded results must remain in the tournament.",
      );
      await store.replaceTeams(tournamentID, selectedIDs);
      return selectedIDs;
    });
  }
}
